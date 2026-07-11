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

/**
 * Merge legacy per-provider fields into an existing override entry.
 * Only fills missing fields — never overwrites an explicit override value.
 * Returns undefined when nothing new would be added.
 */
export function mergeLegacyProviderOverride(
  existing: ProviderOverride | undefined,
  legacy: { baseUrl?: string; model?: string }
): ProviderOverride | undefined {
  const baseUrl = legacy.baseUrl?.trim() || undefined;
  const model = legacy.model?.trim() || undefined;
  if (!baseUrl && !model) {
    return undefined;
  }

  const next: ProviderOverride = { ...(existing || {}) };
  let changed = false;
  if (!next.baseUrl && baseUrl) {
    next.baseUrl = baseUrl;
    changed = true;
  }
  if (!next.model && model) {
    next.model = model;
    changed = true;
  }
  return changed ? next : undefined;
}
