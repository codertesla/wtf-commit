import { type ProviderName } from './types';

export type ProviderOverride = { baseUrl?: string; model?: string };

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
  overrides: unknown,
  provider: ProviderName
): { baseUrl?: string; model?: string } {
  if (!isRecord(overrides)) {
    return { baseUrl: undefined, model: undefined };
  }
  const entry = overrides[provider];
  if (!isRecord(entry)) {
    return { baseUrl: undefined, model: undefined };
  }
  return {
    baseUrl: asTrimmedString(entry.baseUrl),
    model: asTrimmedString(entry.model),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asTrimmedString(value: unknown): string | undefined {
  return typeof value === 'string' ? value.trim() || undefined : undefined;
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
