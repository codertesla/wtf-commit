import type * as vscode from 'vscode';

export interface GitExtension {
  getAPI(version: number): API;
}

export interface API {
  repositories: Repository[];
  getRepository(uri: vscode.Uri): Repository | null;
}

export interface Repository {
  rootUri: vscode.Uri;
  state: RepositoryState;
  inputBox: InputBox;
  diff(cached?: boolean): Promise<string>;
  add(paths: string[]): Promise<void>;
  commit(message: string, opts?: CommitOptions): Promise<void>;
  push(): Promise<void>;
}

export interface CommitOptions {
  all?: boolean | 'tracked';
  amend?: boolean;
  signoff?: boolean;
  signCommit?: boolean;
  empty?: boolean;
  noVerify?: boolean;
}

export interface RepositoryState {
  indexChanges: Change[];
  workingTreeChanges: Change[];
  untrackedChanges: Change[];
  upstream?: BranchUpstream;
}

export interface BranchUpstream {
  name: string;
  remote: string;
  commit?: string;
}

export interface Change {
  uri: vscode.Uri;
  status: number;
}

export interface InputBox {
  value: string;
}

export interface ProviderConfig {
  baseUrl: string;
  model: string;
}

export interface ExtensionConfig {
  provider: ProviderName;
  language: string;
  uiLanguage: 'en' | 'zh';
  autoCommit: boolean;
  autoPush: boolean;
  smartStage: boolean;
  confirmBeforeCommit: boolean;
  confirmAutoPush: boolean;
  showStatusBarItem: boolean;
  changelogPopup: boolean;
  warnOnTruncatedDiff: boolean;
  ignorePaths: string[];
  systemPrompt: string;
  baseUrl: string;
  model: string;
  temperature: number;
  maxDiffChars: number;
  maxUntrackedFiles: number;
}

export interface LlmCallInput {
  provider: ProviderName;
  endpoint: string;
  apiKey: string;
  model: string;
  systemPrompt: string;
  diff: string;
  intent?: string;
  repairMessage?: string;
  repairReason?: string;
  token: vscode.CancellationToken;
  timeoutMs: number;
  temperature: number;
  onStream?: (chunk: string) => void;
}

export interface LlmResponse {
  choices?: Array<{
    message?: {
      content?: string;
      reasoning_details?: Array<{ text: string }>;
    };
  }>;
}

export interface GeminiInteractionResponse {
  steps?: Array<{
    type?: string;
    content?: Array<{
      type?: string;
      text?: string;
    }>;
  }>;
}

export const BUILT_IN_PROVIDER_NAMES = [
  'OpenAI',
  'DeepSeek',
  'MiMo',
  'GLM',
  'Gemini',
  'OpenRouter',
] as const;

export type BuiltInProviderName = typeof BUILT_IN_PROVIDER_NAMES[number];

export const PROVIDERS = {
  OpenAI: { baseUrl: 'https://api.openai.com/v1', model: 'gpt-5-nano' },
  DeepSeek: { baseUrl: 'https://api.deepseek.com', model: 'deepseek-v4-flash' },
  MiMo: { baseUrl: 'https://api.xiaomimimo.com/v1', model: 'mimo-v2.5' },
  GLM: { baseUrl: 'https://open.bigmodel.cn/api/paas/v4', model: 'glm-4.7-flash' },
  Gemini: { baseUrl: 'https://generativelanguage.googleapis.com/v1beta', model: 'gemini-3.1-flash-lite' },
  OpenRouter: { baseUrl: 'https://openrouter.ai/api/v1', model: 'openrouter/free' },
} satisfies Record<BuiltInProviderName, ProviderConfig>;

export type ProviderName = BuiltInProviderName | 'Custom';
export type RequestFailureCode = 'auth' | 'rate_limit' | 'timeout' | 'network' | 'cancelled' | 'invalid_response' | 'api';

export const SECRET_KEY_PREFIX = 'wtfCommit.key.';
export const DEFAULT_SYSTEM_PROMPT = 'You are an expert software developer. Generate a clear and concise Git commit message based on the provided diff.';
export const DEFAULT_PROVIDER: ProviderName = 'OpenAI';
export const DEFAULT_TIMEOUT_MS = 45_000;
export const REASONING_TIMEOUT_MS = 90_000; // Extended timeout for deep thinkers
export const DEFAULT_MAX_DIFF_CHARS = 20_000;
export const DEFAULT_MAX_PARTIAL_DIFF_CHARS = 5_000;
export const DEFAULT_MAX_UNTRACKED_FILE_BYTES = 120 * 1024;
export const DEFAULT_MAX_UNTRACKED_FILE_LINES = 400;
export const DEFAULT_MAX_UNTRACKED_FILES = 30;
export const DEFAULT_MAX_SUMMARY_DIRS = 10;
export const DEFAULT_MAX_DIFF_FILE_CHARS = 3_500;

export const MAX_DIFF_CHARS = DEFAULT_MAX_DIFF_CHARS;
export const MAX_PARTIAL_DIFF_CHARS = DEFAULT_MAX_PARTIAL_DIFF_CHARS;
export const MAX_UNTRACKED_FILE_BYTES = DEFAULT_MAX_UNTRACKED_FILE_BYTES;
export const MAX_UNTRACKED_FILE_LINES = DEFAULT_MAX_UNTRACKED_FILE_LINES;
export const MAX_UNTRACKED_FILES = DEFAULT_MAX_UNTRACKED_FILES;
export const MAX_SUMMARY_DIRS = DEFAULT_MAX_SUMMARY_DIRS;
export const MAX_DIFF_FILE_CHARS = DEFAULT_MAX_DIFF_FILE_CHARS;

export const GitStatus = {
  UNTRACKED: 7,
};

export const PROVIDER_NAMES = [...BUILT_IN_PROVIDER_NAMES, 'Custom'] as const satisfies readonly ProviderName[];

export class RequestFailure extends Error {
  public readonly retryAfterMs?: number;
  constructor(
    public readonly code: RequestFailureCode,
    message: string,
    public readonly status?: number,
    retryAfterMs?: number
  ) {
    super(message);
    if (retryAfterMs !== undefined && Number.isFinite(retryAfterMs) && retryAfterMs >= 0) {
      this.retryAfterMs = retryAfterMs;
    }
  }
}
