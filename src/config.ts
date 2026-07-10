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

export function readExtensionConfig(): ExtensionConfig {
  const config = vscode.workspace.getConfiguration('wtfCommit');

  const provider = asProviderName(config.get<string>('provider'));
  const languageSetting = config.get<string>('language') || 'English';
  const customLanguage = config.get<string>('customLanguage') || 'English';
  const language = languageSetting === 'Custom' ? customLanguage : languageSetting;

  // 1. Try to read provider-specific overrides
  const overrides = config.get<Record<string, { baseUrl?: string; model?: string }>>('providerOverrides') || {};
  const providerBaseUrl = overrides[provider]?.baseUrl?.trim() || config.get<string>(`${provider}.baseUrl`)?.trim();
  const providerModel = overrides[provider]?.model?.trim() || config.get<string>(`${provider}.model`)?.trim();

  // 2. Global values are only safe for Custom. Built-in providers may use
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
    showStatusBarItem: config.get<boolean>('showStatusBarItem') ?? true,
    changelogPopup: config.get<boolean>('changelogPopup') ?? false,
    warnOnTruncatedDiff: config.get<boolean>('warnOnTruncatedDiff') ?? false,
    ignorePaths: readIgnorePaths(config),
    systemPrompt,
    baseUrl,
    model,
    temperature: config.get<number>('temperature') ?? 1.0,
    maxDiffChars: clampInt(config.get<number>('maxDiffChars'), DEFAULT_MAX_DIFF_CHARS, 1000),
    maxUntrackedFiles: Math.max(0, config.get<number>('maxUntrackedFiles') ?? DEFAULT_MAX_UNTRACKED_FILES),
  };
}

function readIgnorePaths(config: vscode.WorkspaceConfiguration): string[] {
  const configured = config.get<string[]>('ignorePaths');
  const raw = configured === undefined ? [...DEFAULT_IGNORE_PATHS] : configured;
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

function clampInt(value: number | undefined, fallback: number, minimum: number): number {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return fallback;
  }
  return Math.max(minimum, Math.floor(value));
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
