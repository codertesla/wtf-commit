import { type ProviderName } from './types';

type ProviderOverride = { baseUrl?: string; model?: string };

/** Resolve commit-message language with Custom + legacy key fallbacks (pure). */
export function resolveCommitMessageLanguage(input: {
  commitMessageLanguage?: string;
  customCommitMessageLanguage?: string;
  legacyLanguage?: string;
  legacyCustomLanguage?: string;
}): string {
  const setting =
    input.commitMessageLanguage?.trim() ||
    input.legacyLanguage?.trim() ||
    'English';
  if (setting !== 'Custom') {
    return setting;
  }
  return (
    input.customCommitMessageLanguage?.trim() ||
    input.legacyCustomLanguage?.trim() ||
    'English'
  );
}

export function readProviderOverride(
  overrides: Record<string, ProviderOverride> | undefined,
  provider: ProviderName
): { baseUrl?: string; model?: string } {
  const entry = overrides?.[provider];
  return {
    baseUrl: entry?.baseUrl?.trim() || undefined,
    model: entry?.model?.trim() || undefined,
  };
}
