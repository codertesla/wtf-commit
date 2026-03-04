import * as vscode from 'vscode';

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
  autoCommit: boolean;
  autoPush: boolean;
  smartStage: boolean;
  confirmBeforeCommit: boolean;
  systemPrompt: string;
  baseUrl: string;
  model: string;
}

export interface LlmCallInput {
  endpoint: string;
  apiKey: string;
  model: string;
  systemPrompt: string;
  diff: string;
  token: vscode.CancellationToken;
  timeoutMs: number;
}

export interface LlmResponse {
  choices?: Array<{
    message?: {
      content?: string;
      reasoning_details?: Array<{ text: string }>;
    };
  }>;
}

export type ProviderName = keyof typeof PROVIDERS | 'Custom';
export type RequestFailureCode = 'auth' | 'rate_limit' | 'timeout' | 'network' | 'cancelled' | 'invalid_response' | 'api';

export const SECRET_KEY_PREFIX = 'wtfCommit.key.';
export const DEFAULT_SYSTEM_PROMPT = 'You are an expert software developer. Generate a clear and concise Git commit message based on the provided diff.';
export const DEFAULT_PROVIDER: ProviderName = 'OpenAI';
export const DEFAULT_TIMEOUT_MS = 45_000;
export const REASONING_TIMEOUT_MS = 90_000; // Extended timeout for deep thinkers
export const MAX_DIFF_CHARS = 20_000;
export const MAX_PARTIAL_DIFF_CHARS = 5_000;
export const MAX_UNTRACKED_FILE_BYTES = 120 * 1024;
export const MAX_UNTRACKED_FILE_LINES = 400;
export const MAX_UNTRACKED_FILES = 30;
export const MAX_SUMMARY_DIRS = 10;

export const GitStatus = {
  UNTRACKED: 7,
};

export const PROVIDERS: Record<string, ProviderConfig> = {
  OpenAI: { baseUrl: 'https://api.openai.com/v1', model: 'gpt-5-nano' },
  DeepSeek: { baseUrl: 'https://api.deepseek.com', model: 'deepseek-chat' },
  MiniMax: { baseUrl: 'https://api.minimaxi.com/v1', model: 'MiniMax-M2.5' },
  Moonshot: { baseUrl: 'https://api.moonshot.cn/v1', model: 'kimi-k2-turbo-preview' },
  GLM: { baseUrl: 'https://open.bigmodel.cn/api/paas/v4', model: 'glm-5' },
  Gemini: { baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai', model: 'gemini-3.1-flash-lite-preview' },
  OpenRouter: { baseUrl: 'https://openrouter.ai/api/v1', model: 'openrouter/free' },
};

export const PROVIDER_NAMES = [...Object.keys(PROVIDERS), 'Custom'] as ProviderName[];

export class RequestFailure extends Error {
  constructor(
    public readonly code: RequestFailureCode,
    message: string,
    public readonly status?: number
  ) {
    super(message);
  }
}
