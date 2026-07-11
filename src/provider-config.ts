import { type ProviderName, PROVIDERS } from './types';

export interface ProviderConfigInput {
  provider: ProviderName;
  providerBaseUrl?: string;
  providerModel?: string;
  customBaseUrl?: string;
  customModel?: string;
}

export type IncompleteProviderField = 'baseUrl' | 'model';

export class IncompleteProviderConfigError extends Error {
  constructor(
    public readonly provider: ProviderName,
    public readonly field: IncompleteProviderField
  ) {
    super(
      field === 'baseUrl'
        ? `Base URL is missing for ${provider}.`
        : `Model is missing for ${provider}.`
    );
    this.name = 'IncompleteProviderConfigError';
  }
}

export function resolveProviderConfig(input: ProviderConfigInput): { baseUrl: string; model: string } {
  const baseUrl = input.providerBaseUrl?.trim()
    || (input.provider === 'Custom' ? input.customBaseUrl?.trim() : undefined)
    || (input.provider !== 'Custom' ? PROVIDERS[input.provider].baseUrl : '');
  const model = input.providerModel?.trim()
    || (input.provider === 'Custom' ? input.customModel?.trim() : undefined)
    || (input.provider !== 'Custom' ? PROVIDERS[input.provider].model : '');

  if (!baseUrl) {
    throw new IncompleteProviderConfigError(input.provider, 'baseUrl');
  }
  if (!model) {
    throw new IncompleteProviderConfigError(input.provider, 'model');
  }

  return { baseUrl, model };
}
