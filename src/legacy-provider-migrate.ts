import {
  LEGACY_PROVIDER_MANIFEST,
  isLegacyProviderName,
  type LegacyProviderName,
} from './provider-manifest';

type ProviderOverride = { baseUrl?: string; model?: string };

export interface LegacyToCustomPlan {
  legacyProvider: LegacyProviderName;
  /** Set only when the scope's Custom baseUrl is empty. */
  baseUrl?: string;
  /** Set only when the scope's Custom model is empty. */
  model?: string;
}

/**
 * Pure plan for migrating a removed built-in provider setting to Custom.
 * Returns undefined when the provider is not a legacy name.
 */
export function planLegacyProviderToCustom(input: {
  provider: string | undefined;
  baseUrl?: string;
  model?: string;
  override?: ProviderOverride;
}): LegacyToCustomPlan | undefined {
  const provider = input.provider?.trim();
  if (!provider || !isLegacyProviderName(provider)) {
    return undefined;
  }

  const defaults = LEGACY_PROVIDER_MANIFEST[provider];
  const preferredBase = input.override?.baseUrl?.trim() || defaults.baseUrl;
  const preferredModel = input.override?.model?.trim() || defaults.model;

  return {
    legacyProvider: provider,
    baseUrl: input.baseUrl?.trim() ? undefined : preferredBase,
    model: input.model?.trim() ? undefined : preferredModel,
  };
}
