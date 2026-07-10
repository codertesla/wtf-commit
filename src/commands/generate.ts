import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import * as vscode from 'vscode';
import {
  type ProviderName,
  RequestFailure,
  DEFAULT_TIMEOUT_MS,
  type Repository,
} from '../types';
import { readExtensionConfig, getSecretKeyName } from '../config';
import { resolveRepository, collectStageablePaths } from '../git';
import { DiffPreparationError, getOptimizedDiff } from '../diff';
import { buildProviderEndpoint, callLLM } from '../llm/provider';
import { classifyPushFailure, formatPushFailureMessage } from '../push-failure';
import { createStreamingSink, restoreIntent, restoreIntentOnAbort } from '../ui';
import { setUiLanguage, t } from '../i18n';
import { generateLock } from '../generate-lock';
import { planDiffSource } from '../flow/diff-source';
import { createStagedSnapshot, stagedSnapshotsEqual, type StagedSnapshot } from '../staged-snapshot';
import {
  LONG_STATUS_MESSAGE_TIMEOUT_MS,
  STATUS_MESSAGE_TIMEOUT_MS,
  showStatusMessage,
} from '../status';
import {
  normalizeCommitMessage,
  findConventionalCommitIssues,
  tryLocalConventionalRepair,
  getGitCommandError,
  getErrorMessage,
  logInfo,
  logError,
} from '../prompt';

const execFileAsync = promisify(execFile);

const MIXED_STAGE_DISMISSED_KEY = 'wtfCommit.mixedStageReminderDismissed';
const WORKING_TREE_DISMISSED_KEY = 'wtfCommit.workingTreeReminderDismissed';

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

    let hasStagedChanges = repository.state.indexChanges.length > 0;
    const hasWorkingTreeChanges =
      repository.state.workingTreeChanges.length > 0 || repository.state.untrackedChanges.length > 0;

    const plan = planDiffSource({
      hasStaged: hasStagedChanges,
      hasWorkingTree: hasWorkingTreeChanges,
      autoCommit: config.autoCommit,
      smartStage: config.smartStage,
      mixedStageReminderDismissed: Boolean(context.globalState.get(MIXED_STAGE_DISMISSED_KEY)),
      workingTreeReminderDismissed: Boolean(context.globalState.get(WORKING_TREE_DISMISSED_KEY)),
    });

    let useWorkingTreeDiff = false;

    switch (plan.action) {
      case 'abort_no_changes':
        showStatusMessage(`$(circle-slash) ${t('noChangesDetected')}`, LONG_STATUS_MESSAGE_TIMEOUT_MS);
        return;

      case 'abort_no_staged':
        vscode.window.showErrorMessage(t('noStagedChangesSmartStageOff'));
        return;

      case 'confirm_mixed_then_staged': {
        const shouldContinue = await confirmStagedOnlyGeneration(context);
        if (!shouldContinue) {
          return;
        }
        break;
      }

      case 'use_staged':
        break;

      case 'auto_stage_working_tree': {
        const stagePaths = collectStageablePaths(repository.state);
        if (stagePaths.length === 0) {
          throw new Error(t('noStageableChanges'));
        }
        await repository.add(stagePaths);
        hasStagedChanges = true;
        break;
      }

      case 'confirm_working_tree': {
        const allowed = await confirmWorkingTreeGeneration(context);
        if (!allowed) {
          return;
        }
        useWorkingTreeDiff = true;
        break;
      }

      case 'use_working_tree':
        useWorkingTreeDiff = true;
        break;
    }

    // Diff inputs for getOptimizedDiff:
    // - staged path: hasStagedChanges=true
    // - working tree path: hasStaged=false and smartStage=true (includes untracked)
    const diffUsesStaged = hasStagedChanges && !useWorkingTreeDiff;
    const smartStageForDiff = useWorkingTreeDiff ? true : config.smartStage;

    let stagedSnapshot: StagedSnapshot | undefined;
    if (config.autoCommit && diffUsesStaged) {
      const stagedDiff = await repository.diff(true);
      stagedSnapshot = createStagedSnapshot(
        repository.state.indexChanges.map((change) => ({
          path: change.uri.fsPath,
          status: change.status,
        })),
        stagedDiff
      );
    }

    const diffResult = await getOptimizedDiff(
      repository,
      diffUsesStaged,
      smartStageForDiff,
      config.ignorePaths,
      { maxDiffChars: config.maxDiffChars, maxUntrackedFiles: config.maxUntrackedFiles }
    );
    if (!diffResult.diff.trim()) {
      showStatusMessage(`$(circle-slash) ${t('noDiffContent')}`, LONG_STATUS_MESSAGE_TIMEOUT_MS);
      return;
    }

    if (diffResult.truncated && config.warnOnTruncatedDiff) {
      logInfo(`Diff truncated before sending to AI (length exceeded ${config.maxDiffChars} chars).`);
      vscode.window.showWarningMessage(t('diffTruncatedWarning'));
    }
    if (diffResult.untrackedFilesOmitted > 0 && config.warnOnTruncatedDiff) {
      vscode.window.showWarningMessage(
        t('untrackedOmittedWarning', {
          count: diffResult.untrackedFilesOmitted,
          cap: diffResult.untrackedFileCap,
        })
      );
    }

    const diff = diffResult.diff;
    const intent = repository.inputBox.value.trim();
    intentForRestore = intent;

    // Clear the input box so the streaming preview starts from a clean slate.
    repository.inputBox.value = '';

    let commitMessage: string | undefined;
    try {
      commitMessage = await generateCommitMessage(
        {
          provider: config.provider,
          endpoint,
          apiKey,
          model: config.model,
          systemPrompt: config.systemPrompt,
          diff,
          intent,
          temperature: config.temperature,
        },
        repository.inputBox
      );
    } catch (error) {
      if (error instanceof RequestFailure && error.code === 'cancelled') {
        restoreIntentOnAbort(repository.inputBox, intent);
        await handleRequestFailure(error);
        return;
      }
      throw error;
    }

    if (!commitMessage) {
      restoreIntentOnAbort(repository.inputBox, intent);
      return;
    }

    let normalizedCommitMessage = normalizeCommitMessage(commitMessage);
    if (!normalizedCommitMessage) {
      vscode.window.showErrorMessage(t('generatedEmpty'));
      restoreIntentOnAbort(repository.inputBox, intent);
      return;
    }

    repository.inputBox.value = normalizedCommitMessage;

    let issues = findConventionalCommitIssues(normalizedCommitMessage);
    if (issues.length > 0) {
      const localRepaired = tryLocalConventionalRepair(normalizedCommitMessage);
      if (localRepaired) {
        normalizedCommitMessage = localRepaired;
        repository.inputBox.value = normalizedCommitMessage;
        issues = findConventionalCommitIssues(normalizedCommitMessage);
        logInfo('Applied local Conventional Commits repair.');
      }
    }

    if (issues.length > 0) {
      const issueSummary = issues.map((issue) => issue.message).join(' ');
      const preRepairMessage = normalizedCommitMessage;
      const action = await vscode.window.showWarningMessage(
        t('needsAdjustment', { detail: issueSummary }),
        t('aiRepair'),
        t('keepOriginal')
      );

      if (action === t('aiRepair')) {
        const repairReason = issues.map((issue) => issue.repairReason).join('\n');
        let repairedMessage: string | undefined;
        try {
          repairedMessage = await repairCommitMessage(
            {
              provider: config.provider,
              endpoint,
              apiKey,
              model: config.model,
              systemPrompt: config.systemPrompt,
              diff,
              intent,
              repairMessage: normalizedCommitMessage,
              repairReason,
              temperature: config.temperature,
            },
            repository.inputBox
          );
        } catch (error) {
          if (error instanceof RequestFailure) {
            repository.inputBox.value = preRepairMessage;
            await handleRequestFailure(error);
            await vscode.commands.executeCommand('workbench.view.scm');
            showStatusMessage(`$(warning) ${t('repairFailedOriginalKept')}`, LONG_STATUS_MESSAGE_TIMEOUT_MS);
            return;
          }

          throw error;
        }

        if (!repairedMessage) {
          repository.inputBox.value = preRepairMessage;
          return;
        }

        const normalizedRepairedMessage = normalizeCommitMessage(repairedMessage);
        if (!normalizedRepairedMessage) {
          repository.inputBox.value = preRepairMessage;
          vscode.window.showErrorMessage(t('repairEmpty'));
          return;
        }

        normalizedCommitMessage = normalizedRepairedMessage;
        repository.inputBox.value = normalizedCommitMessage;

        const remainingIssues = findConventionalCommitIssues(normalizedCommitMessage);
        if (remainingIssues.length > 0) {
          vscode.window.showWarningMessage(
            t('repairRemainingIssues', {
              count: remainingIssues.length,
              detail: remainingIssues.map((issue) => issue.message).join(' '),
            })
          );
        }
      }
    }

    if (!config.autoCommit) {
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

    let shouldCommit = true;
    if (config.confirmBeforeCommit) {
      const response = await vscode.window.showInformationMessage(
        `[${config.provider}] ${t('readyToCommit')}`,
        {
          modal: true,
          detail: normalizedCommitMessage,
        },
        t('commit'),
        t('editInSourceControl'),
        t('cancel')
      );

      if (response === t('editInSourceControl')) {
        await vscode.commands.executeCommand('workbench.view.scm');
        return;
      }

      shouldCommit = response === t('commit');
    }

    if (!shouldCommit) {
      return;
    }

    if (!stagedSnapshot) {
      throw new Error(t('noStagedSnapshot'));
    }

    const currentStagedDiff = await repository.diff(true);
    const currentSnapshot = createStagedSnapshot(
      repository.state.indexChanges.map((change) => ({
        path: change.uri.fsPath,
        status: change.status,
      })),
      currentStagedDiff
    );
    if (!stagedSnapshotsEqual(stagedSnapshot, currentSnapshot)) {
      await vscode.commands.executeCommand('workbench.view.scm');
      vscode.window.showWarningMessage(t('stagedSnapshotChanged'));
      return;
    }

    await repository.commit(normalizedCommitMessage);
    showStatusMessage(`$(check) ${t('commitSuccessful')}`, STATUS_MESSAGE_TIMEOUT_MS);

    if (config.autoPush) {
      let proceedWithPush = true;
      if (config.confirmAutoPush) {
        const pushResponse = await vscode.window.showWarningMessage(
          t('pushNowConfirm'),
          { modal: true, detail: normalizedCommitMessage },
          t('push'),
          t('cancel')
        );
        proceedWithPush = pushResponse === t('push');
      }

      if (!proceedWithPush) {
        showStatusMessage(`$(debug-pause) ${t('autoPushSkipped')}`, LONG_STATUS_MESSAGE_TIMEOUT_MS);
        return;
      }

      try {
        const upstream = repository.state.upstream;
        const pushTitle = upstream
          ? `${t('pushingProgress')} (${upstream.remote}/${upstream.name})`
          : t('pushingProgress');
        await vscode.window.withProgress(
          {
            location: vscode.ProgressLocation.Notification,
            title: pushTitle,
          },
          async () => {
            await repository.push();
          }
        );
        showStatusMessage(
          upstream
            ? `$(cloud-upload) ${t('pushSuccessful')} (${upstream.remote}/${upstream.name})`
            : `$(cloud-upload) ${t('pushSuccessful')}`,
          LONG_STATUS_MESSAGE_TIMEOUT_MS
        );
      } catch (error) {
        await handlePushFailure(repository, error);
      }
    }
  } catch (error) {
    if (error instanceof DiffPreparationError && error.code === 'NO_STAGED_CHANGES') {
      vscode.window.showErrorMessage(t('noStagedChangesSmartStageOff'));
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

async function confirmStagedOnlyGeneration(context: vscode.ExtensionContext): Promise<boolean> {
  if (context.globalState.get<boolean>(MIXED_STAGE_DISMISSED_KEY)) {
    return true;
  }

  const useStagedLabel = t('useStagedChanges');
  const dontRemindLabel = t('dontRemindMe');
  const openScmLabel = t('openSourceControl');

  const action = await vscode.window.showWarningMessage(
    t('mixedStageWarning'),
    useStagedLabel,
    dontRemindLabel,
    openScmLabel,
    t('cancel')
  );

  if (action === dontRemindLabel) {
    await context.globalState.update(MIXED_STAGE_DISMISSED_KEY, true);
    return true;
  }

  if (action === openScmLabel) {
    await vscode.commands.executeCommand('workbench.view.scm');
    return false;
  }

  return action === useStagedLabel;
}

/**
 * Non-autoCommit + working tree only: make the user acknowledge that generation
 * is from the working tree and they still need to stage before commit.
 */
async function confirmWorkingTreeGeneration(context: vscode.ExtensionContext): Promise<boolean> {
  if (context.globalState.get<boolean>(WORKING_TREE_DISMISSED_KEY)) {
    return true;
  }

  const useWorkingTreeLabel = t('useWorkingTreeChanges');
  const dontRemindLabel = t('dontRemindMe');
  const openScmLabel = t('openSourceControl');

  const action = await vscode.window.showWarningMessage(
    t('workingTreeOnlyWarning'),
    useWorkingTreeLabel,
    dontRemindLabel,
    openScmLabel,
    t('cancel')
  );

  if (action === dontRemindLabel) {
    await context.globalState.update(WORKING_TREE_DISMISSED_KEY, true);
    return true;
  }

  if (action === openScmLabel) {
    await vscode.commands.executeCommand('workbench.view.scm');
    return false;
  }

  return action === useWorkingTreeLabel;
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
    temperature: number;
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
    temperature: number;
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

async function handlePushFailure(repository: Repository, error: unknown): Promise<void> {
  logError('Push failed after commit', error);

  const gitError = getGitCommandError(error);
  const command = gitError?.gitCommand;
  let pushVerified = false;
  if (command && command !== 'push') {
    pushVerified = await verifyUpstreamMatchesHead(repository.rootUri.fsPath);
  }

  const classification = classifyPushFailure(error, pushVerified);
  const message = formatPushFailureMessage(classification);

  if (classification.kind === 'push_succeeded_with_followup_warning') {
    logInfo(`Push verified after ${classification.commandLabel} failed; HEAD matches upstream.`);
    showStatusMessage(`$(cloud-upload) ${t('pushCompletedWithRefreshWarning')}`, LONG_STATUS_MESSAGE_TIMEOUT_MS);
    vscode.window.showWarningMessage(message);
    return;
  }

  if (classification.kind === 'push_may_have_succeeded') {
    vscode.window.showWarningMessage(message);
    return;
  }

  const undoLabel = t('undoCommit');
  const action = await vscode.window.showErrorMessage(message, undoLabel);
  if (action === undoLabel) {
    await vscode.commands.executeCommand('git.undoCommit');
  }
}

async function verifyUpstreamMatchesHead(repositoryPath: string): Promise<boolean> {
  const head = await runGitCommand(repositoryPath, ['rev-parse', 'HEAD']);
  if (!head) {
    return false;
  }

  const upstream = await runGitCommand(repositoryPath, ['rev-parse', '@{upstream}']);
  if (!upstream) {
    return false;
  }

  return head === upstream;
}

async function runGitCommand(repositoryPath: string, args: string[]): Promise<string | undefined> {
  try {
    const { stdout } = await execFileAsync('git', args, {
      cwd: repositoryPath,
      encoding: 'utf8',
      windowsHide: true,
    });
    return stdout.trim();
  } catch (error) {
    logError(`Failed to run git ${args.join(' ')} during push verification`, error);
    return undefined;
  }
}
