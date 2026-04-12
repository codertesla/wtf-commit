import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import * as vscode from 'vscode';
import { 
  PROVIDER_NAMES, 
  ProviderName, 
  RequestFailure, 
  DEFAULT_TIMEOUT_MS,
  type Repository,
} from './types';
import { readExtensionConfig, getSecretKeyName } from './config';
import { resolveRepository, collectStageablePaths } from './git';
import { getOptimizedDiff } from './diff';
import { buildChatCompletionsEndpoint, callLLM } from './llm/provider';
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

export function activate(context: vscode.ExtensionContext) {
  const outputChannel = vscode.window.createOutputChannel('WTF Commit');
  setOutputChannel(outputChannel);
  context.subscriptions.push(outputChannel);

  logInfo('Extension activated');

  checkChangelog(context).catch((error) => {
    logError('Failed to check changelog', error);
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
      title: 'Wtf Commit: Provider Status',
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

    const endpoint = buildChatCompletionsEndpoint(config.baseUrl, config.provider);
    const repository = await resolveRepository();
    if (!repository) {
      return;
    }

    const hasStagedChanges = repository.state.indexChanges.length > 0;
    const hasWorkingTreeChanges =
      repository.state.workingTreeChanges.length > 0 || repository.state.untrackedChanges.length > 0;

    if (!hasStagedChanges && !hasWorkingTreeChanges) {
      vscode.window.showInformationMessage('No changes detected in working tree or staging area.');
      return;
    }

    const diff = await getOptimizedDiff(repository, hasStagedChanges, config.smartStage);
    if (!diff.trim()) {
      vscode.window.showInformationMessage('No diff content found.');
      return;
    }

    const intent = repository.inputBox.value.trim();

    const commitMessage = await generateCommitMessage({
      endpoint,
      apiKey,
      model: config.model,
      systemPrompt: config.systemPrompt,
      diff,
      intent,
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
        const repairedMessage = await repairCommitMessage({
          endpoint,
          apiKey,
          model: config.model,
          systemPrompt: config.systemPrompt,
          diff,
          intent,
          repairMessage: normalizedCommitMessage,
          repairReason: 'The first line must match Conventional Commits: <type>(<scope>): <description>.',
        });

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
      vscode.window.showInformationMessage(`[${config.provider}] Commit message generated.`);
      return;
    }

    let shouldCommit = true;
    if (config.confirmBeforeCommit) {
      const response = await vscode.window.showInformationMessage(
        `[${config.provider}] Generated Commit Message:\n\n${normalizedCommitMessage}\n\nAuto-commit?`,
        { modal: false },
        'Commit',
        'Edit in Input Box',
        'Cancel'
      );

      if (response === 'Edit in Input Box') {
        // Focus the Source Control view so user can edit instantly
        await vscode.commands.executeCommand('workbench.view.scm');
        return;
      }

      shouldCommit = response === 'Commit';
    }

    if (!shouldCommit) {
        return;
    }

    if (!hasStagedChanges && hasWorkingTreeChanges) {
      const stagePaths = collectStageablePaths(repository.state);
      if (stagePaths.length > 0) {
        await repository.add(stagePaths);
      }
    }

    await repository.commit(normalizedCommitMessage);
    vscode.window.showInformationMessage('Commit successful.');

    if (config.autoPush) {
      try {
        await repository.push();
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

async function generateCommitMessage(input: {
  endpoint: string;
  apiKey: string;
  model: string;
  systemPrompt: string;
  diff: string;
  intent?: string;
}): Promise<string | undefined> {
  return vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: 'Generating commit message...',
        cancellable: true,
      },
      async (_progress, token) => {
        return callLLM({
          ...input,
          token,
          timeoutMs: DEFAULT_TIMEOUT_MS,
        });
      }
    );
}

async function repairCommitMessage(input: {
  endpoint: string;
  apiKey: string;
  model: string;
  systemPrompt: string;
  diff: string;
  intent?: string;
  repairMessage: string;
  repairReason?: string;
}): Promise<string | undefined> {
  return vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: 'Repairing commit message...',
      cancellable: true,
    },
    async (_progress, token) => {
      return callLLM({
        ...input,
        token,
        timeoutMs: DEFAULT_TIMEOUT_MS,
      });
    }
  );
}

async function handleRequestFailure(error: RequestFailure): Promise<void> {
  logError('LLM request failed', error);

  if (error.code === 'cancelled') {
    vscode.window.showInformationMessage(error.message);
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
