export const PROVIDER_MANIFEST = {
  DeepSeek: { baseUrl: 'https://api.deepseek.com', model: 'deepseek-v4-flash' },
  'OpenCode Go': { baseUrl: 'https://opencode.ai/zen/go/v1', model: 'deepseek-v4-flash' },
  Gemini: { baseUrl: 'https://generativelanguage.googleapis.com/v1beta', model: 'gemini-3.5-flash-lite' },
  OpenAI: { baseUrl: 'https://api.openai.com/v1', model: 'gpt-5.6-luna' },
  OpenRouter: { baseUrl: 'https://openrouter.ai/api/v1', model: 'openrouter/free' },
} as const;

/** Removed built-ins — kept only so activation can migrate them to Custom. */
export const LEGACY_PROVIDER_MANIFEST = {
  MiMo: { baseUrl: 'https://api.xiaomimimo.com/v1', model: 'mimo-v2.5' },
  GLM: { baseUrl: 'https://open.bigmodel.cn/api/paas/v4', model: 'glm-4.7-flashx' },
  'Z.AI': { baseUrl: 'https://api.z.ai/api/paas/v4', model: 'glm-4.7-flashx' },
  'NVIDIA NIM': {
    baseUrl: 'https://integrate.api.nvidia.com/v1',
    model: 'nvidia/nemotron-3-super-120b-a12b',
  },
} as const;

export type BuiltInProviderName = keyof typeof PROVIDER_MANIFEST;
export type LegacyProviderName = keyof typeof LEGACY_PROVIDER_MANIFEST;
export type ProviderName = BuiltInProviderName | 'Custom';

export const BUILT_IN_PROVIDER_NAMES = Object.keys(PROVIDER_MANIFEST) as BuiltInProviderName[];
export const LEGACY_PROVIDER_NAMES = Object.keys(LEGACY_PROVIDER_MANIFEST) as LegacyProviderName[];
export const PROVIDER_NAMES = [...BUILT_IN_PROVIDER_NAMES, 'Custom'] as const satisfies readonly ProviderName[];
export const DEFAULT_PROVIDER: ProviderName = 'DeepSeek';

export function isLegacyProviderName(name: string): name is LegacyProviderName {
  return Object.prototype.hasOwnProperty.call(LEGACY_PROVIDER_MANIFEST, name);
}

/** Where users create API keys (opened from Set API Key / missing-key prompts). */
export const PROVIDER_API_KEY_URLS: Partial<Record<ProviderName, string>> = {
  DeepSeek: 'https://platform.deepseek.com/api_keys',
  'OpenCode Go': 'https://opencode.ai/go?ref=J9E8732NMP',
  Gemini: 'https://aistudio.google.com/api-keys',
  OpenAI: 'https://platform.openai.com/api-keys',
  OpenRouter: 'https://openrouter.ai/keys',
};

/**
 * Extra guidance shown in the Set API Key flow when a provider's key is not
 * set yet. Kept next to the key URLs so provider-specific quirks (e.g. a
 * subscription-first requirement) are described in one place.
 */
export const PROVIDER_KEY_NOTES: Partial<Record<ProviderName, { en: string; zh: string }>> = {
  'OpenCode Go': {
    en: 'Needs an active OpenCode Go subscription — subscribe via this link first, then copy the key from your dashboard.',
    zh: '需要先订阅 OpenCode Go（经该链接订阅可额外获得 $5 额度），订阅后到控制台复制 Key。',
  },
  Gemini: {
    en: 'Google AI Studio offers a generous free tier (15 RPM) — generate your API key for free without a credit card.',
    zh: 'Google AI Studio 提供慷慨的免费额度（15 RPM）— 无需信用卡即可免费创建 API Key。',
  },
};
