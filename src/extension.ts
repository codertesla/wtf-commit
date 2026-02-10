import * as path from 'path';
import * as vscode from 'vscode';

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

interface InputBox {
  value: string;
}

interface ProviderConfig {
  baseUrl: string;
  model: string;
}

interface ExtensionConfig {
  provider: ProviderName;
  language: string;
  autoCommit: boolean;
  autoPush: boolean;
  smartStage: boolean;
  confirmBeforeCommit: boolean;
  systemPrompt: string;
  baseUrl: string;
  model: string;
}

interface LlmCallInput {
  endpoint: string;
  apiKey: string;
  model: string;
  systemPrompt: string;
  diff: string;
  token: vscode.CancellationToken;
  timeoutMs: number;
}

interface LlmResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
}

type ProviderName = keyof typeof PROVIDERS | 'Custom';
type RequestFailureCode = 'auth' | 'rate_limit' | 'timeout' | 'network' | 'cancelled' | 'invalid_response' | 'api';

const SECRET_KEY_PREFIX = 'wtfCommit.key.';
const DEFAULT_SYSTEM_PROMPT = 'You are an expert software developer. Generate a clear and concise Git commit message based on the provided diff.';
const DEFAULT_PROVIDER: ProviderName = 'OpenAI';
const DEFAULT_TIMEOUT_MS = 45_000;
const MAX_DIFF_CHARS = 20_000;
const MAX_PARTIAL_DIFF_CHARS = 5_000;
const MAX_UNTRACKED_FILE_BYTES = 120 * 1024;
const MAX_UNTRACKED_FILE_LINES = 400;
const MAX_UNTRACKED_FILES = 30;
const MAX_SUMMARY_DIRS = 10;

const GitStatus = {
  UNTRACKED: 7,
};

const PROVIDERS: Record<string, ProviderConfig> = {
  OpenAI: { baseUrl: 'https://api.openai.com/v1', model: 'gpt-5-nano' },
  DeepSeek: { baseUrl: 'https://api.deepseek.com', model: 'deepseek-chat' },
  Moonshot: { baseUrl: 'https://api.moonshot.cn/v1', model: 'kimi-k2-turbo-preview' },
  GLM: { baseUrl: 'https://open.bigmodel.cn/api/paas/v4', model: 'glm-4.7' },
  Gemini: { baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai', model: 'gemini-2.5-flash-lite' },
  OpenRouter: { baseUrl: 'https://openrouter.ai/api/v1', model: 'openrouter/free' },
};

const PROVIDER_NAMES = [...Object.keys(PROVIDERS), 'Custom'] as ProviderName[];

let outputChannel: vscode.OutputChannel | undefined;

class RequestFailure extends Error {
  constructor(
    public readonly code: RequestFailureCode,
    message: string,
    public readonly status?: number
  ) {
    super(message);
  }
}

export function activate(context: vscode.ExtensionContext) {
  outputChannel = vscode.window.createOutputChannel('WTF Commit');
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

export function deactivate() {
  outputChannel?.dispose();
}

async function runSetApiKey(context: vscode.ExtensionContext): Promise<void> {
  try {
    const provider = await vscode.window.showQuickPick(PROVIDER_NAMES, {
      placeHolder: 'Select Provider to set API Key for',
    });

    if (!provider) {
      return;
    }

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

    const commitMessage = await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: `Generating commit message (${config.provider})...`,
        cancellable: true,
      },
      async (_progress, token) => {
        return callLLM({
          endpoint,
          apiKey,
          model: config.model,
          systemPrompt: config.systemPrompt,
          diff,
          token,
          timeoutMs: DEFAULT_TIMEOUT_MS,
        });
      }
    );

    if (!commitMessage) {
      return;
    }

    const normalizedCommitMessage = normalizeCommitMessage(commitMessage);
    if (!normalizedCommitMessage) {
      vscode.window.showErrorMessage('Generated commit message is empty. Please try again.');
      return;
    }

    repository.inputBox.value = normalizedCommitMessage;

    if (!looksLikeConventionalCommit(normalizedCommitMessage)) {
      vscode.window.showWarningMessage('Generated message may not follow Conventional Commits format.');
    }

    if (!config.autoCommit) {
      vscode.window.showInformationMessage(`[${config.provider}] Commit message generated.`);
      return;
    }

    let shouldCommit = true;
    if (config.confirmBeforeCommit) {
      const response = await vscode.window.showInformationMessage(
        `[${config.provider}] Confirm Commit: ${normalizedCommitMessage}?`,
        'Yes',
        'No'
      );
      shouldCommit = response === 'Yes';
    }

    if (!shouldCommit) {
      vscode.window.showInformationMessage('Commit cancelled.');
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
        logError('Push failed after commit', error);
        vscode.window.showErrorMessage(`Commit successful, but push failed: ${getErrorMessage(error)}`);
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

function readExtensionConfig(): ExtensionConfig {
  const config = vscode.workspace.getConfiguration('wtfCommit');

  const provider = asProviderName(config.get<string>('provider'));
  const languageSetting = config.get<string>('language') || 'English';
  const customLanguage = config.get<string>('customLanguage') || 'English';
  const language = languageSetting === 'Custom' ? customLanguage : languageSetting;

  let baseUrl = config.get<string>('baseUrl')?.trim() || '';
  let model = config.get<string>('model')?.trim() || '';

  if (!baseUrl && provider !== 'Custom') {
    baseUrl = PROVIDERS[provider]?.baseUrl || '';
  }
  if (!model && provider !== 'Custom') {
    model = PROVIDERS[provider]?.model || '';
  }

  if (!baseUrl) {
    throw new Error(`Base URL is missing for ${provider}. Please check your settings.`);
  }
  if (!model) {
    throw new Error(`Model is missing for ${provider}. Please check your settings.`);
  }

  let systemPrompt = config.get<string>('prompt') || DEFAULT_SYSTEM_PROMPT;
  systemPrompt += `\n\nIMPORTANT: Please write the commit message in ${language}.`;

  return {
    provider,
    language,
    autoCommit: config.get<boolean>('autoCommit') || false,
    autoPush: config.get<boolean>('autoPush') || false,
    smartStage: config.get<boolean>('smartStage') ?? true,
    confirmBeforeCommit: config.get<boolean>('confirmBeforeCommit') ?? true,
    systemPrompt,
    baseUrl,
    model,
  };
}

function asProviderName(rawProvider: string | undefined): ProviderName {
  if (rawProvider && PROVIDER_NAMES.includes(rawProvider as ProviderName)) {
    return rawProvider as ProviderName;
  }
  return DEFAULT_PROVIDER;
}

function getSecretKeyName(provider: ProviderName): string {
  return `${SECRET_KEY_PREFIX}${provider}`;
}

function buildChatCompletionsEndpoint(baseUrl: string, provider: ProviderName): string {
  const sanitized = baseUrl.trim().replace(/\/+$/, '');
  if (!sanitized) {
    throw new Error('Base URL is empty.');
  }

  const endpoint =
    provider === 'Custom' && sanitized.endsWith('/chat/completions')
      ? sanitized
      : `${sanitized}/chat/completions`;

  let parsed: URL;
  try {
    parsed = new URL(endpoint);
  } catch {
    throw new Error(`Invalid Base URL: ${baseUrl}`);
  }

  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    throw new Error(`Unsupported URL protocol: ${parsed.protocol}`);
  }

  return parsed.toString();
}

async function resolveRepository(): Promise<Repository | null> {
  const gitExtension = vscode.extensions.getExtension<GitExtension>('vscode.git');
  if (!gitExtension) {
    vscode.window.showErrorMessage('Git extension is not available.');
    return null;
  }

  const git = gitExtension.isActive
    ? gitExtension.exports.getAPI(1)
    : (await gitExtension.activate()).getAPI(1);

  if (git.repositories.length === 0) {
    vscode.window.showErrorMessage('No Git repository found.');
    return null;
  }

  const activeEditor = vscode.window.activeTextEditor;
  if (activeEditor) {
    const activeRepo = git.getRepository(activeEditor.document.uri);
    if (activeRepo) {
      return activeRepo;
    }
  }

  if (git.repositories.length === 1) {
    return git.repositories[0];
  }

  const selected = await vscode.window.showQuickPick(
    git.repositories.map((repository) => ({
      label: repository.rootUri.fsPath,
      repository,
    })),
    { placeHolder: 'Select a Git repository' }
  );

  return selected?.repository || null;
}

async function callLLM(input: LlmCallInput): Promise<string> {
  const requestBody = {
    model: input.model,
    messages: [
      { role: 'system', content: input.systemPrompt },
      { role: 'user', content: `Here is the git diff:\n\n${input.diff}` },
    ],
    temperature: 0.7,
    max_tokens: 256,
  };

  const controller = new AbortController();
  let timedOut = false;
  const timeoutHandle = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, input.timeoutMs);

  const cancellationDisposable = input.token.onCancellationRequested(() => {
    controller.abort();
  });

  try {
    const response = await fetch(input.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${input.apiKey}`,
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorText = await safeReadResponseText(response);
      if (response.status === 401 || response.status === 403) {
        throw new RequestFailure('auth', `Authentication failed (${response.status})`, response.status);
      }
      if (response.status === 429) {
        throw new RequestFailure('rate_limit', 'Rate limit reached. Please retry later.', response.status);
      }
      throw new RequestFailure(
        'api',
        `API request failed (${response.status}): ${errorText || 'No error details returned.'}`,
        response.status
      );
    }

    let data: LlmResponse;
    try {
      data = (await response.json()) as LlmResponse;
    } catch (error) {
      throw new RequestFailure('invalid_response', `Failed to parse API response: ${getErrorMessage(error)}`);
    }

    const content = data.choices?.[0]?.message?.content;
    if (!content || !content.trim()) {
      throw new RequestFailure('invalid_response', 'No content in API response.');
    }

    return content.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
  } catch (error) {
    if (error instanceof RequestFailure) {
      throw error;
    }

    if (input.token.isCancellationRequested) {
      throw new RequestFailure('cancelled', 'Commit message generation cancelled.');
    }

    if (timedOut) {
      throw new RequestFailure('timeout', `Request timed out after ${Math.round(input.timeoutMs / 1000)} seconds.`);
    }

    throw new RequestFailure('network', `Network request failed: ${getErrorMessage(error)}`);
  } finally {
    clearTimeout(timeoutHandle);
    cancellationDisposable.dispose();
  }
}

async function safeReadResponseText(response: Response): Promise<string> {
  try {
    const text = await response.text();
    return text.slice(0, 500);
  } catch {
    return '';
  }
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

  if (error.code === 'rate_limit') {
    vscode.window.showErrorMessage(error.message);
    return;
  }

  if (error.code === 'timeout') {
    vscode.window.showErrorMessage(error.message);
    return;
  }

  if (error.code === 'invalid_response') {
    vscode.window.showErrorMessage(`Invalid API response: ${error.message}`);
    return;
  }

  vscode.window.showErrorMessage(error.message);
}

async function getOptimizedDiff(
  repository: Repository,
  hasStagedChanges: boolean,
  smartStage: boolean
): Promise<string> {
  let diff = '';

  if (hasStagedChanges) {
    diff = await repository.diff(true);
  } else if (smartStage) {
    diff = await repository.diff(false);
  } else {
    throw new Error('No staged changes found. Please stage your changes first.');
  }

  const untrackedChanges = getUntrackedChanges(repository.state).slice(0, MAX_UNTRACKED_FILES);
  if (untrackedChanges.length > 0) {
    const untrackedPatches = await Promise.all(untrackedChanges.map((change) => buildUntrackedPatch(change.uri)));
    const validPatches = untrackedPatches.filter((patch): patch is string => Boolean(patch));
    if (validPatches.length > 0) {
      diff = `${diff}\n${validPatches.join('\n')}`;
    }
  }

  if (!diff.trim()) {
    return '';
  }

  if (diff.length < MAX_DIFF_CHARS) {
    return diff;
  }

  const changes = hasStagedChanges ? repository.state.indexChanges : repository.state.workingTreeChanges;
  return buildLargeDiffSummary(diff, changes);
}

function getUntrackedChanges(state: RepositoryState): Change[] {
  const changesByPath = new Map<string, Change>();

  for (const change of state.untrackedChanges) {
    changesByPath.set(change.uri.fsPath, change);
  }

  for (const change of state.workingTreeChanges) {
    if (change.status === GitStatus.UNTRACKED) {
      changesByPath.set(change.uri.fsPath, change);
    }
  }

  return [...changesByPath.values()];
}

async function buildUntrackedPatch(uri: vscode.Uri): Promise<string | null> {
  const relativePath = vscode.workspace.asRelativePath(uri, false).replace(/\\/g, '/');

  try {
    const stats = await vscode.workspace.fs.stat(uri);
    if (stats.size > MAX_UNTRACKED_FILE_BYTES) {
      return [
        `diff --git a/${relativePath} b/${relativePath}`,
        'new file',
        '--- /dev/null',
        `+++ b/${relativePath}`,
        '@@ -0,0 +1,1 @@',
        `+[content omitted: ${relativePath} is ${stats.size} bytes]`,
      ].join('\n');
    }

    const document = await vscode.workspace.openTextDocument(uri);
    const content = document.getText();
    const lines = content.split(/\r?\n/);
    const visibleLines = lines.slice(0, MAX_UNTRACKED_FILE_LINES);

    const patchLines = [
      `diff --git a/${relativePath} b/${relativePath}`,
      'new file',
      '--- /dev/null',
      `+++ b/${relativePath}`,
      `@@ -0,0 +1,${visibleLines.length} @@`,
      ...visibleLines.map((line) => `+${line}`),
    ];

    if (lines.length > MAX_UNTRACKED_FILE_LINES) {
      patchLines.push(`+[content truncated: ${lines.length - MAX_UNTRACKED_FILE_LINES} more lines]`);
    }

    return patchLines.join('\n');
  } catch (error) {
    logInfo(`Skipping unreadable untracked file: ${relativePath} (${getErrorMessage(error)})`);
    return null;
  }
}

function buildLargeDiffSummary(diff: string, changes: Change[]): string {
  if (changes.length === 0) {
    return `${diff.substring(0, MAX_PARTIAL_DIFF_CHARS)}\n... (truncated)`;
  }

  const dirCounts = new Map<string, number>();

  for (const change of changes) {
    const relativePath = vscode.workspace.asRelativePath(change.uri, false).replace(/\\/g, '/');
    const directory = path.posix.dirname(relativePath);
    const bucket = directory === '.' ? '(root)' : directory;
    dirCounts.set(bucket, (dirCounts.get(bucket) || 0) + 1);
  }

  const topDirs = [...dirCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, MAX_SUMMARY_DIRS)
    .map(([dir, count]) => `- ${dir}: ${count} files`)
    .join('\n');

  return [
    `The diff is too large (${diff.length} characters). Here is a summary of the changes:`,
    '',
    `Total changed files: ${changes.length}`,
    '',
    'Changes by directory:',
    topDirs,
    '',
    `Partial diff (first ${MAX_PARTIAL_DIFF_CHARS} characters):`,
    `${diff.substring(0, MAX_PARTIAL_DIFF_CHARS)}\n... (truncated)`,
  ].join('\n');
}

function collectStageablePaths(state: RepositoryState): string[] {
  const paths = new Set<string>();

  for (const change of state.workingTreeChanges) {
    paths.add(change.uri.fsPath);
  }

  for (const change of state.untrackedChanges) {
    paths.add(change.uri.fsPath);
  }

  return [...paths];
}

function normalizeCommitMessage(rawMessage: string): string {
  let message = rawMessage.trim();

  // Some models wrap plain text in markdown fences.
  message = message.replace(/^```[a-zA-Z0-9_-]*\s*/u, '').replace(/\s*```$/u, '').trim();

  const lines = message.split(/\r?\n/);
  while (lines.length > 0 && lines[0].trim() === '') {
    lines.shift();
  }
  while (lines.length > 0 && lines[lines.length - 1].trim() === '') {
    lines.pop();
  }

  return lines.join('\n').trim();
}

function looksLikeConventionalCommit(message: string): boolean {
  const firstLine = message.split(/\r?\n/, 1)[0] || '';
  return /^(feat|fix|docs|style|refactor|perf|test|chore|ci|build)(\([^)]+\))?!?:\s+.+$/.test(firstLine);
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
    void vscode.commands.executeCommand('markdown.showPreview', changelogUri);
  }

  await context.globalState.update('wtfCommit.lastVersion', currentVersion);
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return String(error);
}

function logInfo(message: string): void {
  outputChannel?.appendLine(`[INFO] ${message}`);
}

function logError(message: string, error: unknown): void {
  outputChannel?.appendLine(`[ERROR] ${message}: ${getErrorMessage(error)}`);
}
