import type * as vscode from 'vscode';
import type { ProviderName } from './provider-manifest';

export {
  BUILT_IN_PROVIDER_NAMES,
  DEFAULT_PROVIDER,
  PROVIDER_MANIFEST as PROVIDERS,
  PROVIDER_NAMES,
} from './provider-manifest';
export type { BuiltInProviderName, ProviderName } from './provider-manifest';

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
  /** Resolved commit-message language (Custom already expanded). */
  language: string;
  uiLanguage: 'en' | 'zh';
  autoCommit: boolean;
  autoPush: boolean;
  confirmAutoPush: boolean;
  ignorePaths: string[];
  systemPrompt: string;
  baseUrl: string;
  model: string;
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
