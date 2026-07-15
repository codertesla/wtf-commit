import {
  type LlmCallInput,
  RequestFailure,
  REASONING_TIMEOUT_MS,
} from '../types';
import { logError, logInfo } from '../log';
import { getErrorMessage } from '../errors';
import {
  buildAuthHeaders,
  buildRequestBody,
  buildStreamingUrl,
  extractResponseContent,
  extractStreamContent,
} from './adapters';
import { postJson, postSse, type TransportResponse } from './transport';

export { buildProviderEndpoint, extractResponseContent } from './adapters';

const MAX_RETRIES = 2;
const BASE_RETRY_DELAY_MS = 500;
const MAX_RETRY_DELAY_MS = 8_000;

export async function callLLM(input: LlmCallInput): Promise<string> {
  let lastError: RequestFailure | undefined;
  const totalTimeoutMs = getEffectiveTimeout(input);
  const deadline = Date.now() + totalTimeoutMs;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      if (input.token.isCancellationRequested) {
        throw new RequestFailure('cancelled', 'Commit message generation cancelled.');
      }
      const retryDelayMs = computeRetryDelay(attempt, lastError?.retryAfterMs);
      if (deadline - Date.now() <= retryDelayMs) {
        throw timeoutFailure(totalTimeoutMs);
      }
      logInfo(`Retrying LLM request (attempt ${attempt + 1}/${MAX_RETRIES + 1}) after ${retryDelayMs}ms...`);
      await sleep(retryDelayMs, input.token);
    }

    try {
      const remainingMs = deadline - Date.now();
      if (remainingMs <= 0) {
        throw timeoutFailure(totalTimeoutMs);
      }
      return await callLLMOnce(input, remainingMs);
    } catch (error) {
      if (!(error instanceof RequestFailure) || !shouldRetry(error)) {
        throw error;
      }
      lastError = error;
      logError(`LLM request attempt ${attempt + 1} failed`, error);
    }
  }
  throw lastError || new RequestFailure('network', 'All retry attempts failed.');
}

async function callLLMOnce(input: LlmCallInput, effectiveTimeout: number): Promise<string> {
  const isRepair = Boolean(input.repairMessage);
  const systemPrompt = isRepair
    ? [
        input.systemPrompt,
        'Rewrite the commit message so it strictly follows Conventional Commits.',
        'Keep the original intent, but fix format issues.',
        'Output only the final commit message text.',
      ].join('\n\n')
    : input.systemPrompt;
  const userContent = isRepair
    ? buildRepairPrompt(input.repairMessage || '', input.repairReason, input.diff)
    : buildGenerationPrompt(input.diff, input.intent);

  const startedAt = Date.now();
  if (input.onStream) {
    try {
      return await runWithTimeout(input, effectiveTimeout, (signal, isTimedOut) =>
        requestStreamingCompletion(input, systemPrompt, userContent, signal, isTimedOut, effectiveTimeout)
      );
    } catch (error) {
      if (!isEmptyStreamingResponse(error) || input.token.isCancellationRequested) {
        throw error;
      }
      logInfo('Streaming response contained no parsable content. Retrying without streaming...');
    }

    const remainingMs = effectiveTimeout - (Date.now() - startedAt);
    if (remainingMs <= 0) {
      throw timeoutFailure(effectiveTimeout);
    }
    return runWithTimeout(input, remainingMs, (signal) =>
      requestNonStreamingCompletion(input, systemPrompt, userContent, signal)
    );
  }

  return runWithTimeout(input, effectiveTimeout, (signal) =>
    requestNonStreamingCompletion(input, systemPrompt, userContent, signal)
  );
}

async function requestNonStreamingCompletion(
  input: LlmCallInput,
  systemPrompt: string,
  userContent: string,
  signal: AbortSignal
): Promise<string> {
  const response = await postJson({
    url: input.endpoint,
    body: JSON.stringify(buildRequestBody(input, systemPrompt, userContent, false)),
    headers: buildAuthHeaders(input.apiKey, input.provider),
    signal,
  });
  ensureSuccess(response);

  let data: unknown;
  try {
    data = JSON.parse(response.body);
  } catch (error) {
    throw new RequestFailure('invalid_response', `Failed to parse API response: ${getErrorMessage(error)}`);
  }
  const { content } = extractResponseContent(data, input.provider);
  const cleaned = cleanModelContent(content || '');
  if (!cleaned) {
    throw new RequestFailure('invalid_response', 'No content in API response.');
  }
  return cleaned;
}

async function requestStreamingCompletion(
  input: LlmCallInput,
  systemPrompt: string,
  userContent: string,
  signal: AbortSignal,
  isTimedOut: () => boolean,
  effectiveTimeout: number
): Promise<string> {
  let fullContent = '';
  let emittedClean = '';
  const response = await postSse({
    url: buildStreamingUrl(input.endpoint, input.provider),
    body: JSON.stringify(buildRequestBody(input, systemPrompt, userContent, true)),
    headers: {
      ...buildAuthHeaders(input.apiKey, input.provider),
      Accept: 'text/event-stream',
    },
    signal,
  }, (data) => {
    try {
      const { content } = extractStreamContent(JSON.parse(data), input.provider);
      if (!content) {
        return;
      }
      fullContent += content;
      const cleaned = cleanModelContentForStream(fullContent);
      if (cleaned.startsWith(emittedClean)) {
        const delta = cleaned.slice(emittedClean.length);
        if (delta) {
          emittedClean = cleaned;
          input.onStream?.(delta);
        }
      }
    } catch {
      // Ignore malformed provider events; an entirely empty stream is handled below.
    }
  }).catch((error: unknown) => {
    if (input.token.isCancellationRequested) {
      throw new RequestFailure('cancelled', 'Commit message generation cancelled.');
    }
    if (isTimedOut()) {
      throw timeoutFailure(effectiveTimeout);
    }
    throw error;
  });

  ensureSuccess(response);
  const cleaned = cleanModelContent(fullContent);
  if (!cleaned) {
    throw new RequestFailure('invalid_response', 'No content in streaming response.');
  }
  return cleaned;
}

async function runWithTimeout<T>(
  input: LlmCallInput,
  timeoutMs: number,
  run: (signal: AbortSignal, isTimedOut: () => boolean) => Promise<T>
): Promise<T> {
  const controller = new AbortController();
  let timedOut = false;
  const timeoutHandle = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);
  const cancellationDisposable = input.token.onCancellationRequested(() => controller.abort());

  try {
    return await run(controller.signal, () => timedOut);
  } catch (error) {
    if (error instanceof RequestFailure) {
      throw error;
    }
    if (input.token.isCancellationRequested) {
      throw new RequestFailure('cancelled', 'Commit message generation cancelled.');
    }
    if (timedOut) {
      throw timeoutFailure(timeoutMs);
    }
    throw new RequestFailure('network', `Network request failed: ${getErrorMessage(error)}`);
  } finally {
    clearTimeout(timeoutHandle);
    cancellationDisposable.dispose();
  }
}

function ensureSuccess(response: TransportResponse): void {
  if (response.status >= 200 && response.status < 300) {
    return;
  }
  handleHttpError(response.status, response.body, parseRetryAfter(response.headers['retry-after']));
}

function handleHttpError(status: number, errorText: string, retryAfterMs?: number): never {
  if (status === 401 || status === 403) {
    throw new RequestFailure('auth', `Authentication failed (${status})`, status);
  }
  if (status === 429) {
    const hint = retryAfterMs !== undefined ? ` Please retry in ${Math.ceil(retryAfterMs / 1000)} seconds.` : '';
    throw new RequestFailure('rate_limit', `Rate limit reached.${hint} Please retry later.`, status, retryAfterMs);
  }
  if (status === 503 && retryAfterMs !== undefined) {
    throw new RequestFailure('api', `Service unavailable (${status}). Please retry later.`, status, retryAfterMs);
  }
  throw new RequestFailure(
    'api',
    `API request failed (${status}): ${sanitizeErrorText(errorText)}`,
    status,
    retryAfterMs
  );
}

function getEffectiveTimeout(input: LlmCallInput): number {
  const model = input.model.toLowerCase();
  return model.includes('reasoner') || model.includes('think')
    ? REASONING_TIMEOUT_MS
    : input.timeoutMs;
}

function shouldRetry(error: RequestFailure): boolean {
  if (error.code === 'network' || error.code === 'timeout' || error.code === 'rate_limit') {
    return true;
  }
  return error.code === 'api' && Boolean(
    error.status === 408 || (error.status && error.status >= 500 && error.status <= 599)
  );
}

function computeRetryDelay(attempt: number, retryAfterMs?: number): number {
  if (retryAfterMs !== undefined && retryAfterMs > 0) {
    return Math.min(retryAfterMs, MAX_RETRY_DELAY_MS);
  }
  const capped = Math.min(BASE_RETRY_DELAY_MS * Math.pow(2, attempt - 1), MAX_RETRY_DELAY_MS);
  const half = Math.floor(capped / 2);
  return half + Math.floor(Math.random() * (half + 1));
}

function sleep(ms: number, token: LlmCallInput['token']): Promise<void> {
  return new Promise((resolve, reject) => {
    if (token.isCancellationRequested) {
      reject(new RequestFailure('cancelled', 'Commit message generation cancelled.'));
      return;
    }
    const cancellationDisposable = token.onCancellationRequested(() => {
      clearTimeout(timeoutHandle);
      reject(new RequestFailure('cancelled', 'Commit message generation cancelled.'));
    });
    const timeoutHandle = setTimeout(() => {
      cancellationDisposable.dispose();
      resolve();
    }, ms);
  });
}

function timeoutFailure(timeoutMs: number): RequestFailure {
  return new RequestFailure('timeout', `Request timed out after ${Math.round(timeoutMs / 1000)} seconds.`);
}

function isEmptyStreamingResponse(error: unknown): boolean {
  return error instanceof RequestFailure
    && error.code === 'invalid_response'
    && error.message === 'No content in streaming response.';
}

function cleanModelContent(content: string): string {
  return content.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
}

function cleanModelContentForStream(content: string): string {
  const withoutClosed = content.replace(/<think>[\s\S]*?<\/think>/gi, '');
  const openMatch = /<think>/i.exec(withoutClosed);
  return openMatch ? withoutClosed.slice(0, openMatch.index) : withoutClosed;
}

function sanitizeErrorText(errorText: string): string {
  if (!errorText) {
    return 'No error details returned.';
  }
  return errorText.trim().slice(0, 240)
    .replace(/\b(sk-[A-Za-z0-9_-]{6,})\b/g, '[redacted]')
    .replace(/\b(Bearer\s+[A-Za-z0-9._~+/-]{8,}={0,2})/gi, 'Bearer [redacted]')
    .replace(/\b(x-goog-api-key:\s*[^\s,]+)/gi, 'x-goog-api-key: [redacted]');
}

function parseRetryAfter(value: string | string[] | undefined): number | undefined {
  if (!value) {
    return undefined;
  }
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) {
    return undefined;
  }
  const seconds = Number(raw);
  if (Number.isFinite(seconds) && seconds >= 0) {
    return Math.min(Math.round(seconds * 1000), 60_000);
  }
  const dateMs = Date.parse(raw);
  if (Number.isFinite(dateMs)) {
    const delta = dateMs - Date.now();
    return delta > 0 ? Math.min(delta, 60_000) : 0;
  }
  return undefined;
}

export const REPAIR_DIFF_MAX_CHARS = 4_000;

export function buildGenerationPrompt(diff: string, intent?: string): string {
  const sections: string[] = [];
  if (intent?.trim()) {
    sections.push(`Primary intent from the SCM input box:\n${intent.trim()}`);
  }
  sections.push(`Here is the git diff:\n\n${diff}`);
  return sections.join('\n\n');
}

export function buildRepairPrompt(message: string, reason?: string, diff?: string): string {
  const sections = ['Fix the following commit message without changing its meaning:', message.trim()];
  sections.push(reason?.trim()
    ? `Validation issue:\n${reason.trim()}`
    : 'Validation issue:\nThe first line must match Conventional Commits: <type>(<scope>): <description>.');
  const diffContext = diff?.trim();
  if (diffContext) {
    const capped = diffContext.length > REPAIR_DIFF_MAX_CHARS
      ? `${diffContext.slice(0, REPAIR_DIFF_MAX_CHARS)}\n... (diff truncated for repair)`
      : diffContext;
    sections.push(`Git diff context (may be truncated):\n${capped}`);
  }
  return sections.join('\n\n');
}
