import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import * as vscode from 'vscode';
import { 
  PROVIDER_NAMES, 
  type ProviderName, 
  RequestFailure, 
  DEFAULT_TIMEOUT_MS,
  type Repository,
} from './types';
import { readExtensionConfig, getSecretKeyName } from './config';
import { resolveRepository, collectStageablePaths } from './git';
import { getOptimizedDiff } from './diff';
import { buildProviderEndpoint, callLLM } from './llm/provider';
import { classifyPushFailure, formatPushFailureMessage } from './push-failure';
import { createStreamingSink, maskApiKey, restoreIntent } from './ui';
import { setUiLanguage, t, asUiLanguage, type UiLanguage } from './i18n';
import {
  normalizeCommitMessage,
  findConventionalCommitIssues,
  getGitCommandError,
  getErrorMessage,
  logInfo,
  logError,
  setOutputChannel
} from './prompt';

const execFileAsync = promisify(execFile);
const STATUS_MESSAGE_TIMEOUT_MS = 5_000;
const LONG_STATUS_MESSAGE_TIMEOUT_MS = 8_000;

export function activate(context: vscode.ExtensionContext) {
  const outputChannel = vscode.window.createOutputChannel('WTF Commit');
  setOutputChannel(outputChannel);
  context.subscriptions.push(outputChannel);

  logInfo('Extension activated');

  // Status bar button for quick access
  const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
  statusBarItem.command = 'wtf-commit.generate';
  statusBarItem.text = '$(sparkle) WTF';
  statusBarItem.tooltip = t('statusBarButtonTooltip');
  context.subscriptions.push(statusBarItem);

  const syncUiLanguage = (): UiLanguage => {
    const language = asUiLanguageFromConfig();
    setUiLanguage(language);
    statusBarItem.tooltip = t('statusBarButtonTooltip');
    return language;
  };
  syncUiLanguage();

  const updateStatusBarVisibility = (): void => {
    const show = vscode.workspace
      .getConfiguration('wtfCommit')
      .get<boolean>('showStatusBarItem', true);
    if (show) {
      statusBarItem.show();
    } else {
      statusBarItem.hide();
    }
  };
  updateStatusBarVisibility();
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration('wtfCommit.showStatusBarItem')) {
        updateStatusBarVisibility();
      }
      if (event.affectsConfiguration('wtfCommit.uiLanguage')) {
        syncUiLanguage();
      }
    })
  );

  if (vscode.workspace.getConfiguration('wtfCommit').get<boolean>('changelogPopup', true)) {
    checkChangelog(context).catch((error) => {
      logError('Failed to check changelog', error);
    });
  }

  // First-use guidance: prompt to set API key if none configured
  checkFirstUseGuidance(context).catch((error) => {
    logError('Failed to check first-use guidance', error);
  });

  const setApiKeyDisposable = vscode.commands.registerCommand('wtf-commit.setApiKey', async () => {
    await runSetApiKey(context);
  });

  const generateDisposable = vscode.commands.registerCommand('wtf-commit.generate', async () => {
    await runGenerate(context);
  });

  const showOutputDisposable = vscode.commands.registerCommand('wtf-commit.showOutput', () => {
    outputChannel.show();
  });

  context.subscriptions.push(setApiKeyDisposable, generateDisposable, showOutputDisposable);
}

function asUiLanguageFromConfig(): UiLanguage {
  const raw = vscode.workspace.getConfiguration('wtfCommit').get<string>('uiLanguage');
  return asUiLanguage(raw);
}

export function deactivate() {}

async function runSetApiKey(context: vscode.ExtensionContext): Promise<void> {
  try {
    setUiLanguage(asUiLanguageFromConfig());
    const config = vscode.workspace.getConfiguration('wtfCommit');
    const currentProvider = config.get<string>('provider');

    const items: vscode.QuickPickItem[] = await Promise.all(
      PROVIDER_NAMES.map(async (name) => {
        const apiKey = await context.secrets.get(getSecretKeyName(name));
        const isCurrent = name === currentProvider;
        const hasKey = !!apiKey;

        return {
          label: name,
          description: isCurrent ? t('current') : '',
          detail: hasKey
            ? `$(key) ${t('apiKeySet')}${apiKey ? ` (${maskApiKey(apiKey)})` : ''}`
            : `$(circle-slash) ${t('apiKeyNotSetLabel')}`,
          picked: isCurrent,
        };
      })
    );

    const selectedItem = await vscode.window.showQuickPick(items, {
      placeHolder: t('selectProviderPlaceholder'),
      title: t('providerStatusTitle'),
    });

    if (!selectedItem) {
      return;
    }

    const provider = selectedItem.label as ProviderName;

    const apiKey = await vscode.window.showInputBox({
      title: t('setApiKeyTitle', { provider }),
      prompt: t('enterApiKeyPrompt'),
      password: true,
      ignoreFocusOut: true,
    });

    const trimmedApiKey = apiKey?.trim();
    if (!trimmedApiKey) {
      return;
    }

    await context.secrets.store(getSecretKeyName(provider), trimmedApiKey);

    const isCurrentProvider = provider === currentProvider;
    let switchedProvider = isCurrentProvider;
    if (!isCurrentProvider) {
      const switchAction = await vscode.window.showInformationMessage(
        t('apiKeySavedSwitched', { provider }),
        t('switchProvider'),
        t('keepCurrent')
      );
      if (switchAction === t('switchProvider')) {
        await vscode.workspace
          .getConfiguration('wtfCommit')
          .update('provider', provider, vscode.ConfigurationTarget.Global);
        switchedProvider = true;
      }
    }

    showStatusMessage(`$(key) ${t('apiKeySaved', { provider })}`, STATUS_MESSAGE_TIMEOUT_MS);
    vscode.window.showInformationMessage(
      switchedProvider
        ? t('apiKeySwitchedTo', { provider })
        : t('apiKeySavedUnchanged', { provider, current: String(currentProvider) })
    );
  } catch (error) {
    logError('Failed to set API key', error);
    vscode.window.showErrorMessage(t('failedToSaveKey', { message: getErrorMessage(error) }));
  }
}

async function runGenerate(context: vscode.ExtensionContext): Promise<void> {
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

    if (!hasStagedChanges && !hasWorkingTreeChanges) {
      showStatusMessage(`$(circle-slash) ${t('noChangesDetected')}`, LONG_STATUS_MESSAGE_TIMEOUT_MS);
      return;
    }

    if (hasStagedChanges && hasWorkingTreeChanges) {
      const shouldContinue = await confirmStagedOnlyGeneration(context);
      if (!shouldContinue) {
        return;
      }
    }

    if (!hasStagedChanges && hasWorkingTreeChanges && config.autoCommit && config.smartStage) {
      const stagePaths = collectStageablePaths(repository.state);
      if (stagePaths.length === 0) {
        throw new Error(t('noStageableChanges'));
      }
      await repository.add(stagePaths);
      hasStagedChanges = true;
    }

    const stagedSnapshot = config.autoCommit && hasStagedChanges
      ? await repository.diff(true)
      : undefined;

    const diffResult = await getOptimizedDiff(
      repository,
      hasStagedChanges,
      config.smartStage,
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
        t('untrackedOmittedWarning', { count: diffResult.untrackedFilesOmitted, cap: diffResult.untrackedFileCap })
      );
    }

    const diff = diffResult.diff;
    const intent = repository.inputBox.value.trim();
    intentForRestore = intent;

    // Clear the input box so the streaming preview starts from a clean slate.
    // The intent was already captured above, so clearing it is safe.
    repository.inputBox.value = '';

    const commitMessage = await generateCommitMessage(
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

    if (!commitMessage) {
      restoreIntent(repository.inputBox, intent);
      return;
    }

    let normalizedCommitMessage = normalizeCommitMessage(commitMessage);
    if (!normalizedCommitMessage) {
      vscode.window.showErrorMessage(t('generatedEmpty'));
      restoreIntent(repository.inputBox, intent);
      return;
    }

    // Always populate the input box with generated result
    repository.inputBox.value = normalizedCommitMessage;

    const issues = findConventionalCommitIssues(normalizedCommitMessage);
    if (issues.length > 0) {
      const issueSummary = issues.map((issue) => issue.message).join(' ');
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
            await handleRequestFailure(error);
            await vscode.commands.executeCommand('workbench.view.scm');
            showStatusMessage(`$(warning) ${t('repairFailedOriginalKept')}`, LONG_STATUS_MESSAGE_TIMEOUT_MS);
            return;
          }

          throw error;
        }

        if (!repairedMessage) {
          return;
        }

        const normalizedRepairedMessage = normalizeCommitMessage(repairedMessage);
        if (!normalizedRepairedMessage) {
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
        // autoPush without autoCommit is a no-op combo. Surface it once per
        // generate with an actionable button instead of just a status blip.
        const fixAction = await vscode.window.showWarningMessage(
          t('autoPushRequiresAutoCommit'),
          t('openSettings')
        );
        if (fixAction === t('openSettings')) {
          void vscode.commands.executeCommand('workbench.action.openSettings', 'wtfCommit');
        }
        return;
      }

      showStatusMessage(`$(sparkle) [${config.provider}] ${t('messageReadyInScm')}`, LONG_STATUS_MESSAGE_TIMEOUT_MS);
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
        // Focus the Source Control view so user can edit instantly
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
    if (currentStagedDiff !== stagedSnapshot) {
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
        showStatusMessage('$(cloud-upload) Commit and push completed.', LONG_STATUS_MESSAGE_TIMEOUT_MS);
        vscode.window.showInformationMessage(
          upstream
            ? `${t('pushSuccessful')} (${upstream.remote}/${upstream.name})`
            : t('pushSuccessful')
        );
      } catch (error) {
        await handlePushFailure(repository, error);
      }
    }
  } catch (error) {
    if (error instanceof RequestFailure) {
      await handleRequestFailure(error);
      restoreIntent(repositoryForRestore?.inputBox, intentForRestore);
      return;
    }

    logError('Generate flow failed', error);
    vscode.window.showErrorMessage(t('generateFailed', { message: getErrorMessage(error) }));
    restoreIntent(repositoryForRestore?.inputBox, intentForRestore);
  }
}
async function confirmStagedOnlyGeneration(context: vscode.ExtensionContext): Promise<boolean> {
  if (context.globalState.get<boolean>('wtfCommit.mixedStageReminderDismissed')) {
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
    await context.globalState.update('wtfCommit.mixedStageReminderDismissed', true);
    return true;
  }

  if (action === openScmLabel) {
    await vscode.commands.executeCommand('workbench.view.scm');
    return false;
  }

  return action === useStagedLabel;
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

function showStatusMessage(text: string, hideAfterMs = STATUS_MESSAGE_TIMEOUT_MS): void {
  vscode.window.setStatusBarMessage(text, hideAfterMs);
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

async function checkChangelog(context: vscode.ExtensionContext): Promise<void> {
  const currentVersion = String(context.extension.packageJSON.version);
  const lastVersion = context.globalState.get<string>('wtfCommit.lastVersion');

  if (currentVersion === lastVersion) {
    return;
  }

  const viewChangelogLabel = t('viewChangelog');
  const action = await vscode.window.showInformationMessage(
    t('updatedToVersion', { version: currentVersion }),
    viewChangelogLabel
  );

  if (action === viewChangelogLabel) {
    const changelogUri = vscode.Uri.joinPath(context.extensionUri, 'CHANGELOG.md');
    // Using simple command to open markdown preview
    void vscode.commands.executeCommand('markdown.showPreview', changelogUri);
  }

  await context.globalState.update('wtfCommit.lastVersion', currentVersion);
}

async function checkFirstUseGuidance(context: vscode.ExtensionContext): Promise<void> {
  const dismissed = context.globalState.get<boolean>('wtfCommit.guidanceDismissed');
  if (dismissed) {
    return;
  }

  // Check if any provider has an API key configured
  const hasAnyKey = await Promise.all(
    PROVIDER_NAMES.map((name) => context.secrets.get(getSecretKeyName(name)))
  ).then((keys) => keys.some(Boolean));

  if (hasAnyKey) {
    // User already has at least one key — no guidance needed
    await context.globalState.update('wtfCommit.guidanceDismissed', true);
    return;
  }

  const setKeyLabel = t('setApiKey');
  const action = await vscode.window.showInformationMessage(
    t('welcomeTitle'),
    setKeyLabel,
    t('remindMeLater'),
    t('dontShowAgain')
  );

  if (action === setKeyLabel) {
    void vscode.commands.executeCommand('wtf-commit.setApiKey');
    // Don't permanently dismiss on Set API Key — give the user another chance
    // if they cancel the key setup. Only an explicit "Don't Show Again" dismisses.
    return;
  }

  if (action === t('dontShowAgain')) {
    await context.globalState.update('wtfCommit.guidanceDismissed', true);
  }

  // "Remind Me Later" and closing the notification both leave the flag unset.
}
