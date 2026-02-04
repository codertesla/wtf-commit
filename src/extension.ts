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
  untrackedChanges: Change[];
}

interface Change {
  uri: vscode.Uri;
  status: number;
}

// Git Status enum values (from vscode.git extension)
const GitStatus = {
  UNTRACKED: 7,
};

interface InputBox {
  value: string;
}

interface ProviderConfig {
  baseUrl: string;
  model: string;
}

const PROVIDERS: Record<string, ProviderConfig> = {
  OpenAI: { baseUrl: 'https://api.openai.com/v1', model: 'gpt-5-nano' },
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
      const hasStagedChanges = repository.state.indexChanges.length > 0;
      const hasWorkingTreeChanges = repository.state.workingTreeChanges.length > 0;

      const diff = await getOptimizedDiff(repository, hasStagedChanges, smartStage);

      if (!diff || diff.trim() === '') {
        vscode.window.showInformationMessage('No diff content found.');
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
        try {
          await repository.add(paths);
        } catch (addError) {
          const addMessage = addError instanceof Error ? addError.message : 'Unknown error';
          vscode.window.showErrorMessage(`Failed to stage changes: ${addMessage}`);
          return;
        }
      }
      
      try {
        await repository.commit(commitMessage);
        vscode.window.showInformationMessage('Commit successful.');
      } catch (commitError) {
        const commitMessage = commitError instanceof Error ? commitError.message : 'Unknown error';
        vscode.window.showErrorMessage(`Failed to commit: ${commitMessage}`);
        return;
      }

      // Auto-push if enabled
      if (autoPush) {
        try {
          await repository.push();
          vscode.window.showInformationMessage('Push successful.');
        } catch (pushError) {
          const pushMessage = pushError instanceof Error ? pushError.message : 'Unknown error';
          vscode.window.showErrorMessage(`Commit successful, but push failed: ${pushMessage}`);
        }
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
        vscode.window.showErrorMessage(`Failed: ${message}`);
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

  // Filter out <think>...</think> tags from models that include CoT reasoning (e.g., DeepSeek-R1, MiniMax-M2.1)
  let result = content.trim();
  result = result.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

  return result;
}

async function getOptimizedDiff(repository: Repository, hasStagedChanges: boolean, smartStage: boolean): Promise<string> {
  let diff: string;
  if (hasStagedChanges) {
    diff = await repository.diff(true);
  } else {
    if (smartStage) {
      diff = await repository.diff(false);
    } else {
      throw new Error('No staged changes found. Please stage your changes first.');
    }
  }

  // Handle untracked files - git diff doesn't include them
  const untrackedFiles = repository.state.workingTreeChanges.filter(
    (change) => change.status === GitStatus.UNTRACKED
  );

  if (untrackedFiles.length > 0) {
    let untrackedDiff = '';
    for (const file of untrackedFiles) {
      try {
        const document = await vscode.workspace.openTextDocument(file.uri);
        const content = document.getText();
        const fileName = vscode.workspace.asRelativePath(file.uri);
        
        // Format as a pseudo-diff for new files
        untrackedDiff += `\ndiff --git a/${fileName} b/${fileName}\n`;
        untrackedDiff += `new file\n`;
        untrackedDiff += `--- /dev/null\n`;
        untrackedDiff += `+++ b/${fileName}\n`;
        
        // Add line numbers and + prefix for each line
        const lines = content.split('\n');
        untrackedDiff += `@@ -0,0 +1,${lines.length} @@\n`;
        lines.forEach(line => {
          untrackedDiff += `+${line}\n`;
        });
      } catch (error) {
        // Skip files that can't be read (e.g., binary files)
        console.warn(`Could not read untracked file: ${file.uri.fsPath}`);
      }
    }
    diff = diff + untrackedDiff;
  }

  // If diff is empty after all processing, return empty
  if (!diff || diff.trim() === '') {
    return '';
  }

  // If diff is small enough, return it directly
  // 20000 characters is roughly 30k-40k tokens depending on content, well within 128k limits
  if (diff.length < 20000) {
    return diff;
  }

  // If diff is too large, generate a summary
  const changes = hasStagedChanges ? repository.state.indexChanges : repository.state.workingTreeChanges;
  
  if (changes.length === 0) {
    return diff;
  }

  let summary = `The diff is too large (${diff.length} characters). Here is a summary of the changes:\n\n`;
  summary += `Total changed files: ${changes.length}\n\n`;

  // Group changes by directory to detect moves/refactors
  const dirCounts: Record<string, number> = {};
  changes.forEach(change => {
    const parts = change.uri.fsPath.split(/[\\/]/);
    if (parts.length > 1) {
      const dir = parts.slice(0, -1).join('/');
      dirCounts[dir] = (dirCounts[dir] || 0) + 1;
    }
  });

  summary += 'Changes by directory:\n';
  Object.entries(dirCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .forEach(([dir, count]) => {
      summary += `- ${dir}: ${count} files\n`;
    });

  summary += '\nPartial diff (first 5000 characters):\n';
  summary += diff.substring(0, 5000) + '\n... (truncated)';

  return summary;
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
