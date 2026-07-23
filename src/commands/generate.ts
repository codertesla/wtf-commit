import * as vscode from 'vscode';
import {
  type ProviderName,
  RequestFailure,
  DEFAULT_TIMEOUT_MS,
  type Repository,
} from '../types';
import { readExtensionConfig, getSecretKeyName } from '../config';
import { resolveRepository } from '../git';
import { IncompleteProviderConfigError } from '../provider-config';
import { buildProviderEndpoint, callLLM } from '../llm/provider';
import { runAutoPush } from './auto-push';
import { createStreamingSink, restoreIntent, restoreIntentOnAbort } from '../ui';
import { setUiLanguage, t } from '../i18n';
import { generateLock } from '../generate-lock';
import { readStagedSnapshot } from '../git-staged-snapshot';
import { executeGenerationWorkflow } from '../flow/generation-workflow';
import { prepareGeneration } from './prepare-generation';
import {
  LONG_STATUS_MESSAGE_TIMEOUT_MS,
  STATUS_MESSAGE_TIMEOUT_MS,
  showStatusMessage,
} from '../status';
import {
  normalizeCommitMessage,
  findConventionalCommitIssues,
  type ConventionalCommitIssue,
  getErrorMessage,
  logInfo,
  logError,
} from '../prompt';

export async function runGenerate(context: vscode.ExtensionContext): Promise<void> {
  if (!generateLock.tryAcquire()) {
    showStatusMessage(`$(sync~spin) ${t('generateInProgress')}`, STATUS_MESSAGE_TIMEOUT_MS);
    return;
  }

  let repositoryForRestore: Repository | null = null;
  let intentForRestore = '';
  try {
    const config = readExtensionConfig();
    setUiLanguage(config.uiLanguage);
    const apiKey = await context.secrets.get(getSecretKeyName(config.provider));

    if (!apiKey) {
      const action = await vscode.window.showErrorMessage(
        t('apiKeyNotSet', { provider: config.provider }),
        t('setApiKey')
      );
      if (action === t('setApiKey')) {
        void vscode.commands.executeCommand('wtf-commit.setApiKey');
      }
      return;
    }

    const endpoint = buildProviderEndpoint(config.baseUrl, config.provider);
    const repository = await resolveRepository(context);
    if (!repository) {
      return;
    }
    repositoryForRestore = repository;

    const prepared = await prepareGeneration(context, config, repository);
    if (!prepared) {
      return;
    }
    const { diff, intent, stagedSnapshot } = prepared;
    intentForRestore = intent;

    // Clear the input box so the streaming preview starts from a clean slate.
    repository.inputBox.value = '';

    const workflowResult = await executeGenerationWorkflow(
      { diff, intent, autoCommit: config.autoCommit, expectedSnapshot: stagedSnapshot },
      {
        generate: () => generateCommitMessage(
          {
            provider: config.provider,
            endpoint,
            apiKey,
            model: config.model,
            systemPrompt: config.systemPrompt,
            diff,
            intent,
          },
          repository.inputBox
        ),
        resolveIssues: (message, issues) => resolveCommitIssues(
          { message, issues, provider: config.provider, endpoint, apiKey, model: config.model,
            systemPrompt: config.systemPrompt, diff, intent },
          repository.inputBox
        ),
        setMessage: (message) => { repository.inputBox.value = message; },
        confirmCommit: async () => true,
        readSnapshot: () => readStagedSnapshot(repository.rootUri.fsPath),
        commit: (message) => repository.commit(message),
        onLocalRepair: () => logInfo('Applied local Conventional Commits repair.'),
      }
    );

    if (workflowResult.status === 'empty') {
      vscode.window.showErrorMessage(t('generatedEmpty'));
      restoreIntentOnAbort(repository.inputBox, intent);
      return;
    }
    if (workflowResult.status === 'cancelled') {
      return;
    }
    if (workflowResult.status === 'message_ready') {
      await vscode.commands.executeCommand('workbench.view.scm');
      if (config.autoPush) {
        const fixAction = await vscode.window.showWarningMessage(
          t('autoPushRequiresAutoCommit'),
          t('openSettings')
        );
        if (fixAction === t('openSettings')) {
          void vscode.commands.executeCommand('workbench.action.openSettings', 'wtfCommit');
        }
        return;
      }

      showStatusMessage(
        `$(sparkle) [${config.provider}] ${t('messageReadyInScm')}`,
        LONG_STATUS_MESSAGE_TIMEOUT_MS
      );
      return;
    }
    if (workflowResult.status === 'snapshot_changed') {
      await vscode.commands.executeCommand('workbench.view.scm');
      vscode.window.showWarningMessage(t('stagedSnapshotChanged'));
      return;
    }
    const normalizedCommitMessage = workflowResult.message;
    showStatusMessage(`$(check) ${t('commitSuccessful')}`, STATUS_MESSAGE_TIMEOUT_MS);

    if (config.autoPush) {
      await runAutoPush(repository, normalizedCommitMessage, config.confirmAutoPush);
    }
  } catch (error) {
    if (error instanceof IncompleteProviderConfigError) {
      const messageKey =
        error.field === 'baseUrl' ? 'providerBaseUrlMissing' : 'providerModelMissing';
      const action = await vscode.window.showErrorMessage(
        t(messageKey, { provider: error.provider }),
        t('openSettings')
      );
      if (action === t('openSettings')) {
        void vscode.commands.executeCommand('workbench.action.openSettings', 'wtfCommit');
      }
      return;
    }

    if (error instanceof RequestFailure) {
      if (error.code === 'cancelled') {
        restoreIntentOnAbort(repositoryForRestore?.inputBox, intentForRestore);
      } else {
        restoreIntent(repositoryForRestore?.inputBox, intentForRestore);
      }
      await handleRequestFailure(error);
      return;
    }

    logError('Generate flow failed', error);
    vscode.window.showErrorMessage(t('generateFailed', { message: getErrorMessage(error) }));
    restoreIntent(repositoryForRestore?.inputBox, intentForRestore);
  } finally {
    generateLock.release();
  }
}

async function resolveCommitIssues(
  input: {
    message: string;
    issues: ConventionalCommitIssue[];
    provider: ProviderName;
    endpoint: string;
    apiKey: string;
    model: string;
    systemPrompt: string;
    diff: string;
    intent: string;
  },
  inputBox?: { value: string }
): Promise<string | undefined> {
  const issueSummary = input.issues.map((issue) => issue.message).join(' ');
  const action = await vscode.window.showWarningMessage(
    t('needsAdjustment', { detail: issueSummary }),
    t('aiRepair'),
    t('keepOriginal')
  );
  if (action !== t('aiRepair')) {
    return input.message;
  }

  try {
    const repaired = await repairCommitMessage(
      {
        provider: input.provider,
        endpoint: input.endpoint,
        apiKey: input.apiKey,
        model: input.model,
        systemPrompt: input.systemPrompt,
        diff: input.diff,
        intent: input.intent,
        repairMessage: input.message,
        repairReason: input.issues.map((issue) => issue.repairReason).join('\n'),
      },
      inputBox
    );
    if (!repaired || !normalizeCommitMessage(repaired)) {
      if (inputBox) {
        inputBox.value = input.message;
      }
      vscode.window.showErrorMessage(t('repairEmpty'));
      return undefined;
    }
    const remainingIssues = findConventionalCommitIssues(normalizeCommitMessage(repaired));
    if (remainingIssues.length > 0) {
      vscode.window.showWarningMessage(t('repairRemainingIssues', {
        count: remainingIssues.length,
        detail: remainingIssues.map((issue) => issue.message).join(' '),
      }));
    }
    return repaired;
  } catch (error) {
    if (!(error instanceof RequestFailure)) {
      throw error;
    }
    if (inputBox) {
      inputBox.value = input.message;
    }
    await handleRequestFailure(error);
    await vscode.commands.executeCommand('workbench.view.scm');
    showStatusMessage(`$(warning) ${t('repairFailedOriginalKept')}`, LONG_STATUS_MESSAGE_TIMEOUT_MS);
    return undefined;
  }
}

async function generateCommitMessage(
  input: {
    provider: ProviderName;
    endpoint: string;
    apiKey: string;
    model: string;
    systemPrompt: string;
    diff: string;
    intent?: string;
  },
  inputBox?: { value: string }
): Promise<string | undefined> {
  return vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: t('generatingProgress'),
      cancellable: true,
    },
    async (progress, token) => {
      const sink = createStreamingSink(progress, inputBox);
      return callLLM({
        ...input,
        token,
        timeoutMs: DEFAULT_TIMEOUT_MS,
        onStream: (chunk) => sink.push(chunk),
      }).finally(() => sink.flush());
    }
  );
}

async function repairCommitMessage(
  input: {
    provider: ProviderName;
    endpoint: string;
    apiKey: string;
    model: string;
    systemPrompt: string;
    diff: string;
    intent?: string;
    repairMessage: string;
    repairReason?: string;
  },
  inputBox?: { value: string }
): Promise<string | undefined> {
  return vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: t('repairingProgress'),
      cancellable: true,
    },
    async (progress, token) => {
      const sink = createStreamingSink(progress, inputBox);
      return callLLM({
        ...input,
        token,
        timeoutMs: DEFAULT_TIMEOUT_MS,
        onStream: (chunk) => sink.push(chunk),
      }).finally(() => sink.flush());
    }
  );
}

async function handleRequestFailure(error: RequestFailure): Promise<void> {
  logError('LLM request failed', error);

  if (error.code === 'cancelled') {
    showStatusMessage(`$(debug-pause) ${t('cancelled')}`, STATUS_MESSAGE_TIMEOUT_MS);
    return;
  }

  if (error.code === 'auth') {
    const action = await vscode.window.showErrorMessage(error.message, t('setApiKey'));
    if (action === t('setApiKey')) {
      void vscode.commands.executeCommand('wtf-commit.setApiKey');
    }
    return;
  }

  if (error.code === 'rate_limit' || error.code === 'timeout') {
    vscode.window.showErrorMessage(error.message);
    return;
  }

  if (error.code === 'invalid_response') {
    vscode.window.showErrorMessage(t('invalidApiResponse', { message: error.message }));
    return;
  }

  vscode.window.showErrorMessage(error.message);
}
