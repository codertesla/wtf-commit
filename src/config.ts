import * as vscode from 'vscode';
import {
  type ExtensionConfig,
  type ProviderName,
  PROVIDER_NAMES,
  DEFAULT_PROVIDER,
  DEFAULT_SYSTEM_PROMPT,
  SECRET_KEY_PREFIX,
  DEFAULT_MAX_DIFF_CHARS,
  DEFAULT_MAX_UNTRACKED_FILES,
  DEFAULT_IGNORE_PATHS,
} from './types';
import { resolveProviderConfig } from './provider-config';
import { asUiLanguage } from './i18n';
import { readProviderOverride, resolveCommitMessageLanguage } from './settings-resolve';

export function readExtensionConfig(): ExtensionConfig {
  const config = vscode.workspace.getConfiguration('wtfCommit');

  const provider = asProviderName(config.get<string>('provider'));
  const language = resolveCommitMessageLanguage({
    commitMessageLanguage: readExplicitOrUndefined(config, 'commitMessageLanguage'),
    customCommitMessageLanguage: readExplicitOrUndefined(config, 'customCommitMessageLanguage'),
    legacyLanguage: readExplicitOrUndefined(config, 'language'),
    legacyCustomLanguage: readExplicitOrUndefined(config, 'customLanguage'),
  });

  const overrides = config.get<unknown>('providerOverrides');
  const { baseUrl: providerBaseUrl, model: providerModel } = readProviderOverride(overrides, provider);

  // Global values are only safe for Custom. Built-in providers may use
  // different wire protocols, so sharing an endpoint/model can break them.
  const globalBaseUrl = config.get<string>('baseUrl')?.trim();
  const globalModel = config.get<string>('model')?.trim();

  const { baseUrl, model } = resolveProviderConfig({
    provider,
    providerBaseUrl,
    providerModel,
    customBaseUrl: globalBaseUrl,
    customModel: globalModel,
  });

  let systemPrompt = config.get<string>('prompt') || DEFAULT_SYSTEM_PROMPT;
  systemPrompt += `\n\nIMPORTANT: Please write the commit message in ${language}.`;

  return {
    provider,
    language,
    uiLanguage: asUiLanguage(config.get<string>('uiLanguage')),
    autoCommit: config.get<boolean>('autoCommit') ?? true,
    autoPush: config.get<boolean>('autoPush') ?? false,
    smartStage: config.get<boolean>('smartStage') ?? true,
    confirmBeforeCommit: config.get<boolean>('confirmBeforeCommit') ?? false,
    confirmAutoPush: config.get<boolean>('confirmAutoPush') ?? true,
    warnOnTruncatedDiff: config.get<boolean>('warnOnTruncatedDiff') ?? false,
    ignorePaths: readIgnorePaths(config),
    systemPrompt,
    baseUrl,
    model,
    temperature: clampNumber(config.get<unknown>('temperature'), 1.0, 0, 2),
    maxDiffChars: clampInt(config.get<number>('maxDiffChars'), DEFAULT_MAX_DIFF_CHARS, 1000),
    maxUntrackedFiles: clampInt(
      config.get<number>('maxUntrackedFiles'),
      DEFAULT_MAX_UNTRACKED_FILES,
      0,
      1_000
    ),
  };
}

/** Prefer user/workspace values; ignore package defaults so legacy keys can still win. */
function readExplicitOrUndefined(config: vscode.WorkspaceConfiguration, key: string): string | undefined {
  const inspected = config.inspect<string>(key);
  if (!inspected) {
    return undefined;
  }
  return inspected.workspaceFolderValue ?? inspected.workspaceValue ?? inspected.globalValue;
}

function readIgnorePaths(config: vscode.WorkspaceConfiguration): string[] {
  const configured = config.get<unknown>('ignorePaths');
  const raw = configured === undefined
    ? [...DEFAULT_IGNORE_PATHS]
    : Array.isArray(configured)
      ? configured.filter((entry): entry is string => typeof entry === 'string')
      : [...DEFAULT_IGNORE_PATHS];
  const seen = new Set<string>();
  const result: string[] = [];
  for (const entry of raw) {
    const trimmed = entry.trim();
    if (!trimmed || seen.has(trimmed.toLowerCase())) {
      continue;
    }
    seen.add(trimmed.toLowerCase());
    result.push(trimmed);
  }
  return result;
}

function clampInt(value: number | undefined, fallback: number, minimum: number, maximum = 1_000_000): number {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return fallback;
  }
  return Math.min(maximum, Math.max(minimum, Math.floor(value)));
}

function clampNumber(value: unknown, fallback: number, minimum: number, maximum: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return fallback;
  }
  return Math.min(maximum, Math.max(minimum, value));
}

export function asProviderName(rawProvider: string | undefined): ProviderName {
  if (rawProvider && PROVIDER_NAMES.includes(rawProvider as ProviderName)) {
    return rawProvider as ProviderName;
  }
  return DEFAULT_PROVIDER;
}

export function getSecretKeyName(provider: ProviderName): string {
  return `${SECRET_KEY_PREFIX}${provider}`;
}
