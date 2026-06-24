import * as http from 'node:http';
import * as https from 'node:https';
import { type GeminiInteractionResponse, type LlmCallInput, type LlmResponse, RequestFailure, REASONING_TIMEOUT_MS, type ProviderName } from '../types';
import { logInfo, logError, getErrorMessage } from '../prompt';

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1_500;
const MAX_OUTPUT_TOKENS = 512;

interface ChatMessage {
  role: 'system' | 'user';
  content: string;
}

interface ChatCompletionRequest {
  model: string;
  messages: ChatMessage[];
  temperature: number;
  max_tokens: number;
  stream?: boolean;
}

interface GeminiInteractionRequest {
  model: string;
  input: string;
  system_instruction: string;
  generation_config: {
    thinking_level: 'minimal';
    temperature: number;
    max_output_tokens: number;
  };
  stream?: boolean;
}

interface ApiResponse {
  ok: boolean;
  status: number;
  text(): Promise<string>;
  json(): Promise<unknown>;
}

interface StreamDelta {
  choices?: Array<{
    delta?: {
      content?: string;
      reasoning_content?: string;
    };
    finish_reason?: string | null;
  }>;
}

interface GeminiStreamEvent {
  event_type?: string;
  delta?: {
    type?: string;
    text?: string;
  };
}

export function buildProviderEndpoint(baseUrl: string, provider: ProviderName): string {
  const sanitized = baseUrl.trim().replace(/\/+$/, '');
  if (!sanitized) {
    throw new Error('Base URL is empty.');
  }

  const endpoint = provider === 'Gemini'
    ? buildGeminiEndpoint(sanitized)
    : provider === 'Custom' && sanitized.endsWith('/chat/completions')
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

function buildGeminiEndpoint(baseUrl: string): string {
  if (baseUrl.endsWith('/interactions')) {
    return baseUrl;
  }

  // Migrate the previous built-in OpenAI-compatible Gemini base URL gracefully.
  const nativeBaseUrl = baseUrl.endsWith('/openai') ? baseUrl.slice(0, -'/openai'.length) : baseUrl;
  return `${nativeBaseUrl}/interactions`;
}

export async function callLLM(input: LlmCallInput): Promise<string> {
  let lastError: RequestFailure | undefined;
  const totalTimeoutMs = getEffectiveTimeout(input);
  const deadline = Date.now() + totalTimeoutMs;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      if (input.token.isCancellationRequested) {
        throw new RequestFailure('cancelled', 'Commit message generation cancelled.');
      }
      const remainingMs = deadline - Date.now();
      const retryDelayMs = RETRY_DELAY_MS * attempt;
      if (remainingMs <= retryDelayMs) {
        throw new RequestFailure('timeout', `Request timed out after ${Math.round(totalTimeoutMs / 1000)} seconds.`);
      }
      logInfo(`Retrying LLM request (attempt ${attempt + 1}/${MAX_RETRIES + 1})...`);
      await sleep(retryDelayMs, input.token);
    }

    try {
      const remainingMs = deadline - Date.now();
      if (remainingMs <= 0) {
        throw new RequestFailure('timeout', `Request timed out after ${Math.round(totalTimeoutMs / 1000)} seconds.`);
      }
      return await callLLMOnce(input, remainingMs);
    } catch (error) {
      if (!(error instanceof RequestFailure)) {
        throw error;
      }

      if (!shouldRetry(error)) {
        throw error;
      }

      lastError = error;
      logError(`LLM request attempt ${attempt + 1} failed`, error);
    }
  }

  throw lastError || new RequestFailure('network', 'All retry attempts failed.');
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
    ? buildRepairPrompt(input.repairMessage || '', input.repairReason)
    : buildGenerationPrompt(input.diff, input.intent);

  const useStreaming = Boolean(input.onStream);

  const requestBody = buildRequestBody(input, systemPrompt, userContent, useStreaming);

  const controller = new AbortController();
  let timedOut = false;

  const timeoutHandle = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, effectiveTimeout);

  const cancellationDisposable = input.token.onCancellationRequested(() => {
    controller.abort();
  });

  try {
    if (useStreaming) {
      return await streamResponse(
        input,
        requestBody,
        controller.signal,
        () => timedOut,
        effectiveTimeout
      );
    }

    const response = await postJson(input.endpoint, requestBody, input.apiKey, input.provider, controller.signal);

    if (!response.ok) {
      const errorText = await safeReadResponseText(response);
      handleHttpError(response.status, errorText);
    }

    let data: unknown;
    try {
      data = await response.json();
    } catch (error) {
      throw new RequestFailure('invalid_response', `Failed to parse API response: ${getErrorMessage(error)}`);
    }

    const { content, reasoning } = extractResponseContent(data, input.provider);

    if (reasoning) {
      logInfo(`Reasoning Trace: ${reasoning}`);
    }

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
      throw new RequestFailure('timeout', `Request timed out after ${Math.round(effectiveTimeout / 1000)} seconds.`);
    }

    throw new RequestFailure('network', `Network request failed: ${getErrorMessage(error)}`);
  } finally {
    clearTimeout(timeoutHandle);
    cancellationDisposable.dispose();
  }
}

function buildRequestBody(
  input: LlmCallInput,
  systemPrompt: string,
  userContent: string,
  useStreaming: boolean
): ChatCompletionRequest | GeminiInteractionRequest {
  if (input.provider === 'Gemini') {
    return {
      model: input.model,
      input: userContent,
      system_instruction: systemPrompt,
      generation_config: {
        thinking_level: 'minimal',
        temperature: input.temperature,
        max_output_tokens: MAX_OUTPUT_TOKENS,
      },
      stream: useStreaming || undefined,
    };
  }

  return {
    model: input.model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userContent },
    ],
    temperature: input.temperature,
    max_tokens: MAX_OUTPUT_TOKENS,
    stream: useStreaming || undefined,
  };
}

export function extractResponseContent(
  data: unknown,
  provider: ProviderName
): { content?: string; reasoning?: string } {
  if (provider === 'Gemini') {
    const response = data as GeminiInteractionResponse;
    const content = response.steps
      ?.filter((step) => step.type === 'model_output')
      .flatMap((step) => step.content || [])
      .filter((part) => part.type === 'text')
      .map((part) => part.text || '')
      .join('');
    return { content };
  }

  const response = data as LlmResponse;
  const message = response.choices?.[0]?.message;
  return {
    content: message?.content,
    reasoning: message?.reasoning_details?.[0]?.text,
  };
}

async function streamResponse(
  input: LlmCallInput,
  requestBody: ChatCompletionRequest | GeminiInteractionRequest,
  signal: AbortSignal,
  isTimedOut: () => boolean,
  effectiveTimeout: number
): Promise<string> {
  const url = new URL(input.endpoint);
  if (input.provider === 'Gemini') {
    url.searchParams.set('alt', 'sse');
  }
  const transport = url.protocol === 'https:' ? https : http;
  const body = JSON.stringify(requestBody);

  return new Promise((resolve, reject) => {
    const rejectForAbort = () => {
      if (input.token.isCancellationRequested) {
        reject(new RequestFailure('cancelled', 'Commit message generation cancelled.'));
        return;
      }

      if (isTimedOut()) {
        reject(new RequestFailure('timeout', `Request timed out after ${Math.round(effectiveTimeout / 1000)} seconds.`));
        return;
      }

      reject(new RequestFailure('network', 'Network request aborted.'));
    };

    if (signal.aborted) {
      rejectForAbort();
      return;
    }

    const request = transport.request(
      url,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
          ...buildAuthHeaders(input.apiKey, input.provider),
          Accept: 'text/event-stream',
        },
      },
      (response) => {
        if (response.statusCode && (response.statusCode < 200 || response.statusCode >= 300)) {
          const chunks: Buffer[] = [];
          response.on('data', (chunk: Buffer | string) => {
            chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
          });
          response.on('end', () => {
            const errorText = Buffer.concat(chunks).toString('utf8').slice(0, 500);
            try {
              handleHttpError(response.statusCode || 0, errorText);
            } catch (error) {
              reject(error);
            }
          });
          return;
        }

        let fullContent = '';
        let buffer = '';

        response.on('data', (chunk: Buffer | string) => {
          buffer += Buffer.isBuffer(chunk) ? chunk.toString('utf8') : chunk;

          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith('data:')) {
              continue;
            }

            const data = trimmed.slice(5).trimStart();
            if (data === '[DONE]') {
              continue;
            }

            try {
              const parsed = JSON.parse(data) as StreamDelta | GeminiStreamEvent;
              const { content, reasoning } = extractStreamContent(parsed, input.provider);

              if (reasoning) {
                logInfo(`Reasoning chunk: ${reasoning}`);
              }

              if (content) {
                fullContent += content;
                input.onStream?.(content);
              }
            } catch {
              // Skip malformed SSE lines
            }
          }
        });

        response.on('end', () => {
          const cleaned = fullContent.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
          if (!cleaned) {
            reject(new RequestFailure('invalid_response', 'No content in streaming response.'));
            return;
          }
          resolve(cleaned);
        });

        response.on('error', reject);
      }
    );

    const abortRequest = () => {
      request.destroy(new Error('Request aborted.'));
      rejectForAbort();
    };

    signal.addEventListener('abort', abortRequest, { once: true });
    request.on('error', reject);
    request.on('close', () => {
      signal.removeEventListener('abort', abortRequest);
    });

    request.end(body);
  });
}

function extractStreamContent(
  event: StreamDelta | GeminiStreamEvent,
  provider: ProviderName
): { content: string; reasoning?: string } {
  if (provider === 'Gemini') {
    const geminiEvent = event as GeminiStreamEvent;
    return {
      content: geminiEvent.event_type === 'step.delta' && geminiEvent.delta?.type === 'text'
        ? geminiEvent.delta.text || ''
        : '',
    };
  }

  const delta = (event as StreamDelta).choices?.[0]?.delta;
  return {
    content: delta?.content || '',
    reasoning: delta?.reasoning_content,
  };
}

function handleHttpError(status: number, errorText: string): never {
  if (status === 401 || status === 403) {
    throw new RequestFailure('auth', `Authentication failed (${status})`, status);
  }
  if (status === 429) {
    throw new RequestFailure('rate_limit', 'Rate limit reached. Please retry later.', status);
  }
  throw new RequestFailure(
    'api',
    `API request failed (${status}): ${errorText || 'No error details returned.'}`,
    status
  );
}

function buildGenerationPrompt(diff: string, intent?: string): string {
  const sections: string[] = [];

  if (intent?.trim()) {
    sections.push(`Primary intent from the SCM input box:\n${intent.trim()}`);
  }

  sections.push(`Here is the git diff:\n\n${diff}`);
  return sections.join('\n\n');
}

function buildRepairPrompt(message: string, reason?: string): string {
  const sections = [
    'Fix the following commit message without changing its meaning:',
    message.trim(),
  ];

  if (reason?.trim()) {
    sections.push(`Validation issue:\n${reason.trim()}`);
  } else {
    sections.push(
      'Validation issue:\nThe first line must match Conventional Commits: <type>(<scope>): <description>.'
    );
  }

  return sections.join('\n\n');
}

async function postJson(
  endpoint: string,
  requestBody: ChatCompletionRequest | GeminiInteractionRequest,
  apiKey: string,
  provider: ProviderName,
  signal: AbortSignal
): Promise<ApiResponse> {
  const body = JSON.stringify(requestBody);
  const url = new URL(endpoint);
  const transport = url.protocol === 'https:' ? https : http;

  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(new Error('Request aborted.'));
      return;
    }

    const request = transport.request(
      url,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
          ...buildAuthHeaders(apiKey, provider),
        },
      },
      (response) => {
        const chunks: Buffer[] = [];

        response.on('data', (chunk: Buffer | string) => {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        });

        response.on('end', () => {
          const responseText = Buffer.concat(chunks).toString('utf8');
          resolve({
            ok: Boolean(response.statusCode && response.statusCode >= 200 && response.statusCode < 300),
            status: response.statusCode || 0,
            text: async () => responseText,
            json: async () => JSON.parse(responseText),
          });
        });
      }
    );

    const abortRequest = () => {
      request.destroy(new Error('Request aborted.'));
    };

    signal.addEventListener('abort', abortRequest, { once: true });
    request.on('error', reject);
    request.on('close', () => {
      signal.removeEventListener('abort', abortRequest);
    });

    request.end(body);
  });
}

function buildAuthHeaders(apiKey: string, provider: ProviderName): Record<string, string> {
  return provider === 'Gemini'
    ? { 'x-goog-api-key': apiKey }
    : { Authorization: `Bearer ${apiKey}` };
}

async function safeReadResponseText(response: ApiResponse): Promise<string> {
  try {
    const text = await response.text();
    return text.slice(0, 500);
  } catch {
    return '';
  }
}
