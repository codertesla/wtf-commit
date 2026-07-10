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
      text?: string;
      reasoning_content?: string;
      reasoning?: string;
      reasoning_details?: Array<{ text: string }>;
    };
    text?: string;
  }>;
  content?: string;
  text?: string;
  output_text?: string;
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
  'Z.AI',
  'Gemini',
  'OpenRouter',
  'NVIDIA NIM',
] as const;

export type BuiltInProviderName = typeof BUILT_IN_PROVIDER_NAMES[number];

export const PROVIDERS = {
  OpenAI: { baseUrl: 'https://api.openai.com/v1', model: 'gpt-5-nano' },
  DeepSeek: { baseUrl: 'https://api.deepseek.com', model: 'deepseek-v4-flash' },
  MiMo: { baseUrl: 'https://api.xiaomimimo.com/v1', model: 'mimo-v2.5' },
  GLM: { baseUrl: 'https://open.bigmodel.cn/api/paas/v4', model: 'glm-4.7-flashx' },
  'Z.AI': { baseUrl: 'https://api.z.ai/api/paas/v4', model: 'glm-4.7-flashx' },
  Gemini: { baseUrl: 'https://generativelanguage.googleapis.com/v1beta', model: 'gemini-3.1-flash-lite' },
  OpenRouter: { baseUrl: 'https://openrouter.ai/api/v1', model: 'openrouter/free' },
  'NVIDIA NIM': { baseUrl: 'https://integrate.api.nvidia.com/v1', model: 'nvidia/nemotron-3-super-120b-a12b' },
} satisfies Record<BuiltInProviderName, ProviderConfig>;

export type ProviderName = BuiltInProviderName | 'Custom';
export type RequestFailureCode = 'auth' | 'rate_limit' | 'timeout' | 'network' | 'cancelled' | 'invalid_response' | 'api';

export const SECRET_KEY_PREFIX = 'wtfCommit.key.';
export const DEFAULT_SYSTEM_PROMPT =
  'Generate a concise Git commit message from the provided diff.\n\n' +
  'Rules:\n' +
  '1. Use Conventional Commits: <type>(<scope>): <description>\n' +
  '2. Types: feat, fix, docs, style, refactor, perf, test, chore, ci, build\n' +
  '3. Keep the first line under 72 characters; use imperative mood\n' +
  '4. If a new file is added, mention it in the description (especially docs or features); output only the commit message';

export const DEFAULT_IGNORE_PATHS = ['*.snap', '*.min.js', '*.min.css', '.gen.ts', '_generated'] as const;

export const DEFAULT_PROVIDER: ProviderName = 'DeepSeek';
export const DEFAULT_TIMEOUT_MS = 45_000;
export const REASONING_TIMEOUT_MS = 90_000; // Extended timeout for deep thinkers
export const DEFAULT_MAX_DIFF_CHARS = 10_000;
export const DEFAULT_MAX_PARTIAL_DIFF_CHARS = 2_500;
export const DEFAULT_MAX_UNTRACKED_FILE_BYTES = 120 * 1024;
/** Preview lines included for new/untracked files sent to the LLM. */
export const DEFAULT_UNTRACKED_PREVIEW_LINES = 30;
export const DEFAULT_MAX_UNTRACKED_FILES = 30;
export const DEFAULT_MAX_SUMMARY_DIRS = 10;
export const DEFAULT_MAX_DIFF_FILE_CHARS = 2_500;
/** When changed file count exceeds this, keep only a short sample hunk per file. */
export const DEFAULT_COMPACT_FILE_THRESHOLD = 12;
export const DEFAULT_COMPACT_HUNK_LINES = 25;
export const DEFAULT_SUMMARY_HUNK_LINES = 20;
export const DEFAULT_TRUNCATE_HUNK_LINES = 40;
export const DEFAULT_MAX_SUMMARY_FILE_LIST = 50;

export const MAX_DIFF_CHARS = DEFAULT_MAX_DIFF_CHARS;
export const MAX_PARTIAL_DIFF_CHARS = DEFAULT_MAX_PARTIAL_DIFF_CHARS;
export const MAX_UNTRACKED_FILE_BYTES = DEFAULT_MAX_UNTRACKED_FILE_BYTES;
/** @deprecated Use DEFAULT_UNTRACKED_PREVIEW_LINES */
export const MAX_UNTRACKED_FILE_LINES = DEFAULT_UNTRACKED_PREVIEW_LINES;
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
