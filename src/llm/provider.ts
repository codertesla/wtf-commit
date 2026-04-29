import * as http from 'node:http';
import * as https from 'node:https';
import { LlmCallInput, LlmResponse, RequestFailure, REASONING_TIMEOUT_MS, ProviderName } from '../types';
import { logInfo, getErrorMessage } from '../prompt';

interface ChatMessage {
  role: 'system' | 'user';
  content: string;
}

interface ChatCompletionRequest {
  model: string;
  messages: ChatMessage[];
  temperature: number;
  max_tokens: number;
  extra_body?: {
    reasoning_split?: boolean;
  };
}

interface ApiResponse {
  ok: boolean;
  status: number;
  text(): Promise<string>;
  json(): Promise<unknown>;
}

export function buildChatCompletionsEndpoint(baseUrl: string, provider: ProviderName): string {
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

export async function callLLM(input: LlmCallInput): Promise<string> {
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

  const requestBody: ChatCompletionRequest = {
    model: input.model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userContent },
    ],
    temperature: 1.0,
    max_tokens: 4096,
  };

  const isMiniMax = input.endpoint.includes('minimaxi.com');
  const isDeepSeek = input.endpoint.includes('deepseek.com');
  const isReasoner = isMiniMax || input.model.toLowerCase().includes('reasoner') || input.model.toLowerCase().includes('think');

  if (isMiniMax) {
    requestBody.extra_body = { reasoning_split: true };
  }

  const controller = new AbortController();
  let timedOut = false;
  
  // Apply a longer timeout for reasoning models automatically
  const effectiveTimeout = isReasoner ? REASONING_TIMEOUT_MS : input.timeoutMs;

  const timeoutHandle = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, effectiveTimeout);

  const cancellationDisposable = input.token.onCancellationRequested(() => {
    controller.abort();
  });

  try {
    const response = await postJson(input.endpoint, requestBody, input.apiKey, controller.signal);

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

    const message = data.choices?.[0]?.message;
    const content = message?.content;
    const reasoning = message?.reasoning_details?.[0]?.text;

    if (reasoning) {
      logInfo(`Reasoning Trace: ${reasoning}`);
    }

    if (!content || !content.trim()) {
      throw new RequestFailure('invalid_response', 'No content in API response.');
    }

    // Strip internal think tags some models might return directly in content
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
  requestBody: ChatCompletionRequest,
  apiKey: string,
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
          Authorization: `Bearer ${apiKey}`,
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

async function safeReadResponseText(response: ApiResponse): Promise<string> {
  try {
    const text = await response.text();
    return text.slice(0, 500);
  } catch {
    return '';
  }
}
