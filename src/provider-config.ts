import { type ProviderName, PROVIDERS } from './types';

export interface ProviderConfigInput {
  provider: ProviderName;
  providerBaseUrl?: string;
  providerModel?: string;
  customBaseUrl?: string;
  customModel?: string;
}

export function resolveProviderConfig(input: ProviderConfigInput): { baseUrl: string; model: string } {
  const baseUrl = input.providerBaseUrl?.trim()
    || (input.provider === 'Custom' ? input.customBaseUrl?.trim() : undefined)
    || (input.provider !== 'Custom' ? PROVIDERS[input.provider].baseUrl : '');
  const model = input.providerModel?.trim()
    || (input.provider === 'Custom' ? input.customModel?.trim() : undefined)
    || (input.provider !== 'Custom' ? PROVIDERS[input.provider].model : '');

  if (!baseUrl) {
    throw new Error(
      `Base URL is missing for ${input.provider}. For Custom, set Base URL under Settings → WTF Commit › Advanced; for built-ins, use Provider Overrides.`
    );
  }
  if (!model) {
    throw new Error(
      `Model is missing for ${input.provider}. For Custom, set Model under Settings → WTF Commit › Advanced; for built-ins, use Provider Overrides.`
    );
  }

  return { baseUrl, model };
}
