import {
  type GeminiInteractionResponse,
  type LlmCallInput,
  type LlmResponse,
  type ProviderName,
} from '../types';

const MAX_OUTPUT_TOKENS = 512;
/** Fixed sampling temperature for OpenAI-compatible providers (not sent to Gemini). */
const DEFAULT_TEMPERATURE = 1;

export interface ChatCompletionRequest {
  model: string;
  messages: Array<{ role: 'system' | 'user'; content: string }>;
  temperature: number;
  max_tokens: number;
  stream?: boolean;
  thinking?: { type: 'disabled' | 'enabled' };
}

export interface GeminiInteractionRequest {
  model: string;
  input: string;
  system_instruction: string;
  generation_config: {
    thinking_level: 'minimal';
    max_output_tokens: number;
  };
  stream?: boolean;
}

export type ProviderRequest = ChatCompletionRequest | GeminiInteractionRequest;

interface StreamDelta {
  choices?: Array<{
    delta?: {
      content?: string;
      text?: string;
      output_text?: string;
      reasoning_content?: string;
      reasoning?: string;
    };
    message?: { content?: string };
    text?: string;
  }>;
  content?: string;
  text?: string;
  output_text?: string;
}

interface GeminiStreamEvent {
  event_type?: string;
  delta?: { type?: string; text?: string };
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
  const nativeBaseUrl = baseUrl.endsWith('/openai') ? baseUrl.slice(0, -'/openai'.length) : baseUrl;
  return `${nativeBaseUrl}/interactions`;
}

export function buildRequestBody(
  input: LlmCallInput,
  systemPrompt: string,
  userContent: string,
  useStreaming: boolean
): ProviderRequest {
  if (input.provider === 'Gemini') {
    return {
      model: input.model,
      input: userContent,
      system_instruction: systemPrompt,
      generation_config: {
        thinking_level: 'minimal',
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
    temperature: DEFAULT_TEMPERATURE,
    max_tokens: MAX_OUTPUT_TOKENS,
    stream: useStreaming || undefined,
    ...(shouldDisableThinking(input.provider, input.endpoint) ? { thinking: { type: 'disabled' as const } } : {}),
  };
}

/** DeepSeek / GLM / Z.AI thinking mode slows commit messages; also detect via Custom host. */
export function shouldDisableThinking(provider: ProviderName, endpoint: string): boolean {
  if (provider === 'DeepSeek') {
    return true;
  }
  try {
    const host = new URL(endpoint).hostname.toLowerCase();
    return (
      host === 'api.deepseek.com'
      || host === 'open.bigmodel.cn'
      || host.endsWith('.bigmodel.cn')
      || host === 'api.z.ai'
      || host.endsWith('.z.ai')
    );
  } catch {
    return false;
  }
}

export function buildAuthHeaders(apiKey: string, provider: ProviderName): Record<string, string> {
  return provider === 'Gemini'
    ? { 'x-goog-api-key': apiKey }
    : { Authorization: `Bearer ${apiKey}` };
}

export function buildStreamingUrl(endpoint: string, provider: ProviderName): string {
  const url = new URL(endpoint);
  if (provider === 'Gemini') {
    url.searchParams.set('alt', 'sse');
  }
  return url.toString();
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
    return { content: content || undefined };
  }

  const response = data as LlmResponse;
  const choice = response.choices?.[0];
  const message = choice?.message;
  const reasoningFromDetails = message?.reasoning_details
    ?.map((detail) => detail?.text || '')
    .filter(Boolean)
    .join('\n');
  const content = firstText(
    message?.content,
    message?.text,
    choice?.text,
    response.content,
    response.text,
    response.output_text
  );
  const reasoning = firstText(reasoningFromDetails, message?.reasoning_content, message?.reasoning);
  return { content: content || undefined, reasoning: reasoning || undefined };
}

export function extractStreamContent(
  event: unknown,
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

  const streamEvent = event as StreamDelta;
  const delta = streamEvent.choices?.[0]?.delta;
  const choice = streamEvent.choices?.[0];
  return {
    content: firstText(
      delta?.content,
      delta?.text,
      delta?.output_text,
      choice?.message?.content,
      choice?.text,
      streamEvent.content,
      streamEvent.text,
      streamEvent.output_text
    ),
    reasoning: firstText(delta?.reasoning_content, delta?.reasoning),
  };
}

function firstText(...values: Array<string | undefined>): string {
  return values.find((value) => typeof value === 'string' && value.length > 0) || '';
}

