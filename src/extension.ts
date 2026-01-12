import * as vscode from 'vscode';

// Git Extension API types
interface GitExtension {
  getAPI(version: number): API;
}

interface API {
  repositories: Repository[];
}

interface Repository {
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

// Provider URL mapping
const PROVIDER_URLS: Record<string, string> = {
  OpenAI: 'https://api.openai.com/v1',
  DeepSeek: 'https://api.deepseek.com',
  Moonshot: 'https://api.moonshot.cn/v1',
  GLM: 'https://open.bigmodel.cn/api/paas/v4',
};

export function activate(context: vscode.ExtensionContext) {
  console.log('WTF Commit extension is now active!');

  const disposable = vscode.commands.registerCommand('wtf-commit.generate', async () => {
    try {
      // Get configuration
      const config = vscode.workspace.getConfiguration('wtfCommit');
      const provider = config.get<string>('provider') || 'OpenAI';
      const customBaseUrl = config.get<string>('baseUrl') || 'https://api.openai.com/v1';
      const apiKey = config.get<string>('apiKey');
      const model = config.get<string>('model') || 'gpt-4o-mini';
      const language = config.get<string>('language') || 'English';
      const autoCommit = config.get<boolean>('autoCommit') || false;
      const autoPush = config.get<boolean>('autoPush') || false;
      const confirmBeforeCommit = config.get<boolean>('confirmBeforeCommit') ?? true;
      let systemPrompt = config.get<string>('prompt') || 'You are an expert software developer. Generate a clear and concise Git commit message based on the provided diff.';

      // Append language instruction if Chinese is selected
      if (language === '中文') {
        systemPrompt += '\n\nIMPORTANT: Please write the commit message in Chinese (中文).';
      }

      // Determine the actual base URL: use provider preset or custom URL
      const baseUrl = provider === 'Custom' ? customBaseUrl : (PROVIDER_URLS[provider] || customBaseUrl);

      // Validate API Key
      if (!apiKey) {
        const action = await vscode.window.showErrorMessage(
          'API Key is not configured. Please set it in settings.',
          'Open Settings'
        );
        if (action === 'Open Settings') {
          vscode.commands.executeCommand('workbench.action.openSettings', 'wtfCommit');
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

      // Get repository
      if (git.repositories.length === 0) {
        vscode.window.showErrorMessage('No Git repository found.');
        return;
      }

      const repository = git.repositories[0];

      // Get diff: prioritize staged changes, fallback to working tree changes
      let diff: string;
      const hasStagedChanges = repository.state.indexChanges.length > 0;
      const hasWorkingTreeChanges = repository.state.workingTreeChanges.length > 0;

      if (hasStagedChanges) {
        diff = await repository.diff(true); // cached = true for staged changes
      } else if (hasWorkingTreeChanges) {
        diff = await repository.diff(false); // cached = false for working tree changes
      } else {
        vscode.window.showInformationMessage('No changes to commit.');
        return;
      }

      if (!diff || diff.trim() === '') {
        vscode.window.showInformationMessage('No diff content found.');
        return;
      }

      // Call AI API
      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: 'Generating commit message...',
          cancellable: false,
        },
        async () => {
          const commitMessage = await callLLM(baseUrl, apiKey, model, systemPrompt, diff);
          if (commitMessage) {
            repository.inputBox.value = commitMessage;

            if (!autoCommit) {
              vscode.window.showInformationMessage('Commit message generated!');
              return;
            }

            // Auto-commit flow
            let shouldCommit = true;
            if (confirmBeforeCommit) {
              const response = await vscode.window.showInformationMessage(
                `Confirm Commit: ${commitMessage}?`,
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
          }
        }
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error occurred';
      
      // Check if it's an authentication error
      if (message.includes('401') || message.toLowerCase().includes('auth') || message.toLowerCase().includes('key')) {
        const action = await vscode.window.showErrorMessage(
          `Authentication failed: ${message}`,
          'Open Settings'
        );
        if (action === 'Open Settings') {
          vscode.commands.executeCommand('workbench.action.openSettings', 'wtfCommit');
        }
      } else {
        vscode.window.showErrorMessage(`Failed to generate commit message: ${message}`);
      }
    }
  });

  context.subscriptions.push(disposable);
}

async function callLLM(
  baseUrl: string,
  apiKey: string,
  model: string,
  systemPrompt: string,
  diff: string
): Promise<string | null> {
  const url = `${baseUrl.replace(/\/$/, '')}/chat/completions`;

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

export function deactivate() {}
