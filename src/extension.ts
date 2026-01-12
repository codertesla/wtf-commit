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

export function activate(context: vscode.ExtensionContext) {
  console.log('WTF Commit extension is now active!');

  const disposable = vscode.commands.registerCommand('wtf-commit.generate', async () => {
    try {
      // Get configuration
      const config = vscode.workspace.getConfiguration('wtfCommit');
      const baseUrl = config.get<string>('baseUrl') || 'https://api.openai.com/v1';
      const apiKey = config.get<string>('apiKey');
      const model = config.get<string>('model') || 'gpt-4o-mini';
      const systemPrompt = config.get<string>('prompt') || 'Generate a concise git commit message based on the following diff. Only output the message.';

      // Validate API Key
      if (!apiKey) {
        const action = await vscode.window.showErrorMessage(
          'API Key is not configured. Please set it in settings.',
          'Open Settings'
        );
        if (action === 'Open Settings') {
          vscode.commands.executeCommand('workbench.action.openSettings', 'wtfCommit.apiKey');
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
            vscode.window.showInformationMessage('Commit message generated!');
          }
        }
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error occurred';
      vscode.window.showErrorMessage(`Failed to generate commit message: ${message}`);
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
