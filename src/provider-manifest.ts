export const PROVIDER_MANIFEST = {
  OpenAI: { baseUrl: 'https://api.openai.com/v1', model: 'gpt-5-nano' },
  DeepSeek: { baseUrl: 'https://api.deepseek.com', model: 'deepseek-v4-flash' },
  MiMo: { baseUrl: 'https://api.xiaomimimo.com/v1', model: 'mimo-v2.5' },
  GLM: { baseUrl: 'https://open.bigmodel.cn/api/paas/v4', model: 'glm-4.7-flashx' },
  'Z.AI': { baseUrl: 'https://api.z.ai/api/paas/v4', model: 'glm-4.7-flashx' },
  Gemini: { baseUrl: 'https://generativelanguage.googleapis.com/v1beta', model: 'gemini-3.5-flash-lite' },
  OpenRouter: { baseUrl: 'https://openrouter.ai/api/v1', model: 'openrouter/free' },
  'NVIDIA NIM': { baseUrl: 'https://integrate.api.nvidia.com/v1', model: 'nvidia/nemotron-3-super-120b-a12b' },
} as const;

export type BuiltInProviderName = keyof typeof PROVIDER_MANIFEST;
export type ProviderName = BuiltInProviderName | 'Custom';

export const BUILT_IN_PROVIDER_NAMES = Object.keys(PROVIDER_MANIFEST) as BuiltInProviderName[];
export const PROVIDER_NAMES = [...BUILT_IN_PROVIDER_NAMES, 'Custom'] as const satisfies readonly ProviderName[];
export const DEFAULT_PROVIDER: ProviderName = 'DeepSeek';

