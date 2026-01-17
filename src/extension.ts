import * as vscode from 'vscode';

// Git Extension API types
interface GitExtension {
  getAPI(version: number): API;
}

interface API {
  repositories: Repository[];
  getRepository(uri: vscode.Uri): Repository | null;
}

interface Repository {
  rootUri: vscode.Uri;
  state: RepositoryState;
  inputBox: InputBox;
  diff(cached?: boolean): Promise<string>;
  add(paths: string[]): Promise<void>;
  commit(message: string, opts?: CommitOptions): Promise<void>;
  push(): Promise<void>;
}

interface CommitOptions {
  all?: boolean | 'tracked';
  amend?: boolean;
  signoff?: boolean;
  signCommit?: boolean;
  empty?: boolean;
  noVerify?: boolean;
}

interface RepositoryState {
  indexChanges: Change[];
  workingTreeChanges: Change[];
}

interface Change {
  uri: vscode.Uri;
}

interface InputBox {
  value: string;
}

interface ProviderConfig {
  baseUrl: string;
  model: string;
}

const PROVIDERS: Record<string, ProviderConfig> = {
  OpenAI: { baseUrl: 'https://api.openai.com/v1', model: 'gpt-4o-mini' },
  DeepSeek: { baseUrl: 'https://api.deepseek.com', model: 'deepseek-chat' },
  Moonshot: { baseUrl: 'https://api.moonshot.cn/v1', model: 'kimi-k2-turbo-preview' },
  GLM: { baseUrl: 'https://open.bigmodel.cn/api/paas/v4', model: 'glm-4.7' },
  Gemini: { baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai', model: 'gemini-2.5-flash-lite' },
  OpenRouter: { baseUrl: 'https://openrouter.ai/api/v1', model: 'mistralai/devstral-2512:free' },
};

export function activate(context: vscode.ExtensionContext) {
  console.log('WTF Commit extension is now active!');

  // Check for updates and show changelog
  checkChangelog(context);

  // Command to set API Key safely
  const setApiKeyDisposable = vscode.commands.registerCommand('wtf-commit.setApiKey', async () => {
    const provider = await vscode.window.showQuickPick(
      [...Object.keys(PROVIDERS), 'Custom'],
      { placeHolder: 'Select Provider to set API Key for' }
    );

    if (!provider) { return; }

    const apiKey = await vscode.window.showInputBox({
      title: `Set API Key for ${provider}`,
      prompt: 'Enter your API Key',
      password: true,
      ignoreFocusOut: true,
    });

    if (apiKey) {
      await context.secrets.store(`wtfCommit.key.${provider}`, apiKey);
      // Auto-switch provider to match the newly set API Key
      await vscode.workspace.getConfiguration('wtfCommit').update('provider', provider, vscode.ConfigurationTarget.Global);
      vscode.window.showInformationMessage(`API Key for ${provider} saved. Provider switched to ${provider}.`);
    }
  });

  const generateDisposable = vscode.commands.registerCommand('wtf-commit.generate', async () => {
    try {
      // Get configuration
      const config = vscode.workspace.getConfiguration('wtfCommit');
      const provider = config.get<string>('provider') || 'OpenAI';
      const languageSetting = config.get<string>('language') || 'English';
      const customLanguage = config.get<string>('customLanguage') || 'English';
      const autoCommit = config.get<boolean>('autoCommit') || false;
      const autoPush = config.get<boolean>('autoPush') || false;
      const smartStage = config.get<boolean>('smartStage') ?? true;
      const confirmBeforeCommit = config.get<boolean>('confirmBeforeCommit') ?? true;
      let systemPrompt = config.get<string>('prompt') || 'You are an expert software developer. Generate a clear and concise Git commit message based on the provided diff.';

      // Determine final language: use customLanguage if 'Custom' is selected
      const language = languageSetting === 'Custom' ? customLanguage : languageSetting;

      // Dynamically append language instruction
      systemPrompt += `\n\nIMPORTANT: Please write the commit message in ${language}.`;

      // Resolve Base URL and Model
      let baseUrl = config.get<string>('baseUrl');
      let model = config.get<string>('model');

      if (!baseUrl && provider !== 'Custom') {
        baseUrl = PROVIDERS[provider]?.baseUrl;
      }
      if (!model && provider !== 'Custom') {
        model = PROVIDERS[provider]?.model;
      }

      if (!baseUrl) {
        vscode.window.showErrorMessage(`Base URL is missing for ${provider}. Please check your settings.`);
        return;
      }
      if (!model) {
        vscode.window.showErrorMessage(`Model is missing for ${provider}. Please check your settings.`);
        return;
      }

      // Get API Key from Secrets
      const apiKey = await context.secrets.get(`wtfCommit.key.${provider}`);
      if (!apiKey) {
        const action = await vscode.window.showErrorMessage(
          `API Key for ${provider} is not set.`,
          'Set API Key'
        );
        if (action === 'Set API Key') {
          vscode.commands.executeCommand('wtf-commit.setApiKey');
        }
        return;
      }

      // Get Git extension
      const gitExtension = vscode.extensions.getExtension<GitExtension>('vscode.git');
      if (!gitExtension) {
        vscode.window.showErrorMessage('Git extension is not available.');
        return;
      }

      const git = gitExtension.isActive ? gitExtension.exports.getAPI(1) : (await gitExtension.activate()).getAPI(1);

      // Get repository with multi-root workspace support
      if (git.repositories.length === 0) {
        vscode.window.showErrorMessage('No Git repository found.');
        return;
      }

      let repository: Repository | null = null;

      // 1. Try to get repository from active text editor
      const activeEditor = vscode.window.activeTextEditor;
      if (activeEditor) {
        repository = git.getRepository(activeEditor.document.uri);
      }

      // 2. Fallback: if only one repository, use it
      if (!repository && git.repositories.length === 1) {
        repository = git.repositories[0];
      }

      // 3. Fallback: prompt user to select a repository
      if (!repository) {
        const repoItems = git.repositories.map(repo => ({
          label: repo.rootUri.fsPath,
          repository: repo,
        }));

        const selected = await vscode.window.showQuickPick(repoItems, {
          placeHolder: 'Select a Git repository',
        });

        if (!selected) {
          return; // User cancelled
        }
        repository = selected.repository;
      }

      // Get diff: prioritize staged changes, fallback to working tree changes
      let diff: string;
      const hasStagedChanges = repository.state.indexChanges.length > 0;
      const hasWorkingTreeChanges = repository.state.workingTreeChanges.length > 0;

      if (hasStagedChanges) {
        diff = await repository.diff(true); // cached = true for staged changes
      } else if (hasWorkingTreeChanges) {
        if (smartStage) {
          diff = await repository.diff(false); // cached = false for working tree changes
        } else {
          vscode.window.showErrorMessage('No staged changes found. Please stage your changes first.');
          return;
        }
      } else {
        vscode.window.showInformationMessage('No changes to commit.');
        return;
      }

      if (!diff || diff.trim() === '') {
        vscode.window.showInformationMessage('No diff content found.');
        return;
      }

      // Call AI API - only wrap the LLM call in progress notification
      const commitMessage = await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: `Generating commit message (${provider})...`,
          cancellable: false,
        },
        async () => {
          return await callLLM(baseUrl!, apiKey, model!, systemPrompt, diff, provider);
        }
      );

      if (!commitMessage) {
        return;
      }

      repository.inputBox.value = commitMessage;

      if (!autoCommit) {
        vscode.window.showInformationMessage(`[${provider}] Commit message generated!`);
        return;
      }

      // Auto-commit flow
      let shouldCommit = true;
      if (confirmBeforeCommit) {
        const response = await vscode.window.showInformationMessage(
          `[${provider}] Confirm Commit: ${commitMessage}?`,
          'Yes',
          'No'
        );
        shouldCommit = response === 'Yes';
      }

      if (!shouldCommit) {
        vscode.window.showInformationMessage('Commit cancelled.');
        return;
      }

      // Perform commit
      // If there are no staged changes, stage all working tree changes first
      if (!hasStagedChanges && hasWorkingTreeChanges) {
        const paths = repository.state.workingTreeChanges.map(c => c.uri.fsPath);
        await repository.add(paths);
      }
      await repository.commit(commitMessage);
      vscode.window.showInformationMessage('Commit successful.');

      // Auto-push if enabled
      if (autoPush) {
        await repository.push();
        vscode.window.showInformationMessage('Push successful.');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error occurred';
      
      // Check if it's an authentication error
      if (message.includes('401') || message.toLowerCase().includes('auth') || message.toLowerCase().includes('key')) {
        const action = await vscode.window.showErrorMessage(
          `Authentication failed: ${message}`,
          'Set API Key'
        );
        if (action === 'Set API Key') {
          vscode.commands.executeCommand('wtf-commit.setApiKey');
        }
      } else {
        vscode.window.showErrorMessage(`Failed to generate commit message: ${message}`);
      }
    }
  });

  context.subscriptions.push(setApiKeyDisposable);
  context.subscriptions.push(generateDisposable);
}

async function callLLM(
  baseUrl: string,
  apiKey: string,
  model: string,
  systemPrompt: string,
  diff: string,
  provider: string
): Promise<string | null> {
  // Avoid duplicate path if Custom provider already includes /chat/completions
  let url: string;
  if (provider === 'Custom' && baseUrl.replace(/\/$/, '').endsWith('/chat/completions')) {
    url = baseUrl.replace(/\/$/, '');
  } else {
    url = `${baseUrl.replace(/\/$/, '')}/chat/completions`;
  }

  const requestBody = {
    model: model,
    messages: [
      {
        role: 'system',
        content: systemPrompt,
      },
      {
        role: 'user',
        content: `Here is the git diff:\n\n${diff}`,
      },
    ],
    temperature: 0.7,
    max_tokens: 256,
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API request failed (${response.status}): ${errorText}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{
      message?: {
        content?: string;
      };
    }>;
  };

  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('No content in API response');
  }

  return content.trim();
}

async function checkChangelog(context: vscode.ExtensionContext) {
  const extension = vscode.extensions.getExtension('codertesla.wtf-commit');
  if (!extension) { return; }

  const currentVersion = extension.packageJSON.version;
  const lastVersion = context.globalState.get<string>('wtfCommit.lastVersion');

  if (currentVersion !== lastVersion) {
    const action = await vscode.window.showInformationMessage(
      `WTF Commit has been updated to v${currentVersion}!`,
      'View Changelog'
    );

    if (action === 'View Changelog') {
      const changelogPath = vscode.Uri.file(
        vscode.Uri.joinPath(context.extensionUri, 'CHANGELOG.md').fsPath
      );
      vscode.commands.executeCommand('markdown.showPreview', changelogPath);
    }

    await context.globalState.update('wtfCommit.lastVersion', currentVersion);
  }
}

export function deactivate() {}
