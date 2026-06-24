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
import { 
  normalizeCommitMessage, 
  looksLikeConventionalCommit, 
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
  statusBarItem.tooltip = 'WTF Commit: Generate commit message';
  statusBarItem.show();
  context.subscriptions.push(statusBarItem);

  checkChangelog(context).catch((error) => {
    logError('Failed to check changelog', error);
  });

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

  context.subscriptions.push(setApiKeyDisposable, generateDisposable);
}

export function deactivate() {}

async function runSetApiKey(context: vscode.ExtensionContext): Promise<void> {
  try {
    const config = vscode.workspace.getConfiguration('wtfCommit');
    const currentProvider = config.get<string>('provider');

    const items: vscode.QuickPickItem[] = await Promise.all(
      PROVIDER_NAMES.map(async (name) => {
        const apiKey = await context.secrets.get(getSecretKeyName(name));
        const isCurrent = name === currentProvider;
        const hasKey = !!apiKey;

        return {
          label: name,
          description: isCurrent ? 'current' : '',
          detail: hasKey ? '$(key) API Key set' : '$(circle-slash) API Key not set',
          picked: isCurrent,
        };
      })
    );

    const selectedItem = await vscode.window.showQuickPick(items, {
      placeHolder: 'Select Provider to set API Key for',
      title: 'WTF Commit: Provider Status',
    });

    if (!selectedItem) {
      return;
    }

    const provider = selectedItem.label as ProviderName;

    const apiKey = await vscode.window.showInputBox({
      title: `Set API Key for ${provider}`,
      prompt: 'Enter your API Key',
      password: true,
      ignoreFocusOut: true,
    });

    const trimmedApiKey = apiKey?.trim();
    if (!trimmedApiKey) {
      return;
    }

    await context.secrets.store(getSecretKeyName(provider), trimmedApiKey);
    await vscode.workspace
      .getConfiguration('wtfCommit')
      .update('provider', provider, vscode.ConfigurationTarget.Global);

    showStatusMessage(`$(key) API key saved for ${provider}.`, STATUS_MESSAGE_TIMEOUT_MS);
    vscode.window.showInformationMessage(`API Key for ${provider} saved. Provider switched to ${provider}.`);
  } catch (error) {
    logError('Failed to set API key', error);
    vscode.window.showErrorMessage(`Failed to save API key: ${getErrorMessage(error)}`);
  }
}

async function runGenerate(context: vscode.ExtensionContext): Promise<void> {
  try {
    const config = readExtensionConfig();
    const apiKey = await context.secrets.get(getSecretKeyName(config.provider));

    if (!apiKey) {
      const action = await vscode.window.showErrorMessage(
        `API Key for ${config.provider} is not set.`,
        'Set API Key'
      );
      if (action === 'Set API Key') {
        void vscode.commands.executeCommand('wtf-commit.setApiKey');
      }
      return;
    }

    const endpoint = buildProviderEndpoint(config.baseUrl, config.provider);
    const repository = await resolveRepository();
    if (!repository) {
      return;
    }

    let hasStagedChanges = repository.state.indexChanges.length > 0;
    const hasWorkingTreeChanges =
      repository.state.workingTreeChanges.length > 0 || repository.state.untrackedChanges.length > 0;

    if (!hasStagedChanges && !hasWorkingTreeChanges) {
      showStatusMessage('$(circle-slash) No changes detected in working tree or staging area.', LONG_STATUS_MESSAGE_TIMEOUT_MS);
      return;
    }

    if (hasStagedChanges && hasWorkingTreeChanges) {
      const shouldContinue = await confirmStagedOnlyGeneration();
      if (!shouldContinue) {
        return;
      }
    }

    if (!hasStagedChanges && hasWorkingTreeChanges && config.autoCommit && config.smartStage) {
      const stagePaths = collectStageablePaths(repository.state);
      if (stagePaths.length === 0) {
        throw new Error('No stageable changes found. Please refresh Source Control and try again.');
      }
      await repository.add(stagePaths);
      hasStagedChanges = true;
    }

    const stagedSnapshot = config.autoCommit && hasStagedChanges
      ? await repository.diff(true)
      : undefined;

    const diff = await getOptimizedDiff(repository, hasStagedChanges, config.smartStage);
    if (!diff.trim()) {
      showStatusMessage('$(circle-slash) No diff content found.', LONG_STATUS_MESSAGE_TIMEOUT_MS);
      return;
    }

    const intent = repository.inputBox.value.trim();

    const commitMessage = await generateCommitMessage({
      provider: config.provider,
      endpoint,
      apiKey,
      model: config.model,
      systemPrompt: config.systemPrompt,
      diff,
      intent,
      temperature: config.temperature,
    });

    if (!commitMessage) {
      return;
    }

    let normalizedCommitMessage = normalizeCommitMessage(commitMessage);
    if (!normalizedCommitMessage) {
      vscode.window.showErrorMessage('Generated commit message is empty. Please try again.');
      return;
    }

    // Always populate the input box with generated result
    repository.inputBox.value = normalizedCommitMessage;

    if (!looksLikeConventionalCommit(normalizedCommitMessage)) {
      const action = await vscode.window.showWarningMessage(
        'Generated message may not follow Conventional Commits format.',
        'AI Repair',
        'Keep Original'
      );

      if (action === 'AI Repair') {
        let repairedMessage: string | undefined;
        try {
          repairedMessage = await repairCommitMessage({
            provider: config.provider,
            endpoint,
            apiKey,
            model: config.model,
            systemPrompt: config.systemPrompt,
            diff,
            intent,
            repairMessage: normalizedCommitMessage,
            repairReason: 'The first line must match Conventional Commits: <type>(<scope>): <description>.',
            temperature: config.temperature,
          });
        } catch (error) {
          if (error instanceof RequestFailure) {
            await handleRequestFailure(error);
            await vscode.commands.executeCommand('workbench.view.scm');
            showStatusMessage('$(warning) AI repair failed. Original message kept in Source Control.', LONG_STATUS_MESSAGE_TIMEOUT_MS);
            return;
          }

          throw error;
        }

        if (!repairedMessage) {
          return;
        }

        const normalizedRepairedMessage = normalizeCommitMessage(repairedMessage);
        if (!normalizedRepairedMessage) {
          vscode.window.showErrorMessage('AI repair returned an empty commit message. Please try again.');
          return;
        }

        normalizedCommitMessage = normalizedRepairedMessage;
        repository.inputBox.value = normalizedCommitMessage;

        if (!looksLikeConventionalCommit(normalizedCommitMessage)) {
          vscode.window.showWarningMessage('AI repair completed, but the message may still need manual adjustment.');
        }
      }
    }

    if (!config.autoCommit) {
      await vscode.commands.executeCommand('workbench.view.scm');
      if (config.autoPush) {
        showStatusMessage('$(warning) Auto Push requires Auto Commit. Message ready in Source Control.', LONG_STATUS_MESSAGE_TIMEOUT_MS);
        return;
      }

      showStatusMessage(`$(sparkle) [${config.provider}] Commit message ready in Source Control.`, LONG_STATUS_MESSAGE_TIMEOUT_MS);
      return;
    }

    let shouldCommit = true;
    if (config.confirmBeforeCommit) {
      const response = await vscode.window.showInformationMessage(
        `[${config.provider}] Ready to commit`,
        {
          modal: true,
          detail: normalizedCommitMessage,
        },
        'Commit',
        'Edit in Source Control',
        'Cancel'
      );

      if (response === 'Edit in Source Control') {
        // Focus the Source Control view so user can edit instantly
        await vscode.commands.executeCommand('workbench.view.scm');
        return;
      }

      shouldCommit = response === 'Commit';
    }

    if (!shouldCommit) {
      return;
    }

    if (!stagedSnapshot) {
      throw new Error('No staged snapshot is available for Auto Commit.');
    }

    const currentStagedDiff = await repository.diff(true);
    if (currentStagedDiff !== stagedSnapshot) {
      await vscode.commands.executeCommand('workbench.view.scm');
      vscode.window.showWarningMessage(
        'Staged changes changed while the commit message was being generated. Review the changes and generate again.'
      );
      return;
    }

    await repository.commit(normalizedCommitMessage);
    showStatusMessage('$(check) Commit successful.', STATUS_MESSAGE_TIMEOUT_MS);

    if (config.autoPush) {
      try {
        await vscode.window.withProgress(
          {
            location: vscode.ProgressLocation.Notification,
            title: 'Pushing changes...',
          },
          async () => {
            await repository.push();
          }
        );
        showStatusMessage('$(cloud-upload) Commit and push completed.', LONG_STATUS_MESSAGE_TIMEOUT_MS);
        vscode.window.showInformationMessage('Push successful.');
      } catch (error) {
        await handlePushFailure(repository, error);
      }
    }
  } catch (error) {
    if (error instanceof RequestFailure) {
      await handleRequestFailure(error);
      return;
    }

    logError('Generate flow failed', error);
    vscode.window.showErrorMessage(`Failed: ${getErrorMessage(error)}`);
  }
}

async function confirmStagedOnlyGeneration(): Promise<boolean> {
  const action = await vscode.window.showWarningMessage(
    'Staged and unstaged changes were both detected. WTF Commit will generate from staged changes only.',
    'Use Staged Changes',
    'Open Source Control',
    'Cancel'
  );

  if (action === 'Open Source Control') {
    await vscode.commands.executeCommand('workbench.view.scm');
    return false;
  }

  return action === 'Use Staged Changes';
}

async function generateCommitMessage(input: {
  provider: ProviderName;
  endpoint: string;
  apiKey: string;
  model: string;
  systemPrompt: string;
  diff: string;
  intent?: string;
  temperature: number;
}): Promise<string | undefined> {
  return vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: 'Generating commit message...',
        cancellable: true,
      },
      async (progress, token) => {
        return callLLM({
          ...input,
          token,
          timeoutMs: DEFAULT_TIMEOUT_MS,
          onStream: (chunk) => {
            progress.report({ message: chunk.slice(0, 60) });
          },
        });
      }
    );
}

async function repairCommitMessage(input: {
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
}): Promise<string | undefined> {
  return vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: 'Repairing commit message...',
      cancellable: true,
    },
    async (progress, token) => {
      return callLLM({
        ...input,
        token,
        timeoutMs: DEFAULT_TIMEOUT_MS,
        onStream: (chunk) => {
          progress.report({ message: chunk.slice(0, 60) });
        },
      });
    }
  );
}

async function handleRequestFailure(error: RequestFailure): Promise<void> {
  logError('LLM request failed', error);

  if (error.code === 'cancelled') {
    showStatusMessage('$(debug-pause) Commit generation cancelled.', STATUS_MESSAGE_TIMEOUT_MS);
    return;
  }

  if (error.code === 'auth') {
    const action = await vscode.window.showErrorMessage(error.message, 'Set API Key');
    if (action === 'Set API Key') {
      void vscode.commands.executeCommand('wtf-commit.setApiKey');
    }
    return;
  }

  if (error.code === 'rate_limit' || error.code === 'timeout') {
    vscode.window.showErrorMessage(error.message);
    return;
  }

  if (error.code === 'invalid_response') {
    vscode.window.showErrorMessage(`Invalid API response: ${error.message}`);
    return;
  }

  vscode.window.showErrorMessage(error.message);
}

async function handlePushFailure(repository: Repository, error: unknown): Promise<void> {
  logError('Push failed after commit', error);

  const gitError = getGitCommandError(error);
  const command = gitError?.gitCommand;
  const commandLabel = command ? `git ${command}` : 'Git repository refresh';
  const detail = gitError?.stderr?.trim() || getErrorMessage(error);

  if (command && command !== 'push') {
    const pushVerified = await verifyUpstreamMatchesHead(repository.rootUri.fsPath);

    if (pushVerified) {
      logInfo(`Push verified after ${commandLabel} failed; HEAD matches upstream.`);
      showStatusMessage('$(cloud-upload) Push completed with a follow-up refresh warning.', LONG_STATUS_MESSAGE_TIMEOUT_MS);
      vscode.window.showWarningMessage(
        `Push succeeded, but ${commandLabel} failed afterward: ${detail}`
      );
      return;
    }

    vscode.window.showWarningMessage(
      `Push may have succeeded, but ${commandLabel} failed afterward: ${detail}`
    );
    return;
  }

  const action = await vscode.window.showErrorMessage(
    `Commit successful, but push failed: ${detail}`,
    'Undo Commit'
  );
  if (action === 'Undo Commit') {
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

  const action = await vscode.window.showInformationMessage(
    `WTF Commit has been updated to v${currentVersion}!`,
    'View Changelog'
  );

  if (action === 'View Changelog') {
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

  const action = await vscode.window.showInformationMessage(
    'Welcome to WTF Commit! Set up an API key to start generating commit messages with AI.',
    'Set API Key',
    'Dismiss'
  );

  if (action === 'Set API Key') {
    void vscode.commands.executeCommand('wtf-commit.setApiKey');
  }

  // Don't show again regardless of choice
  await context.globalState.update('wtfCommit.guidanceDismissed', true);
}
