import * as vscode from 'vscode';
import {
  ExtensionConfig,
  ProviderName,
  PROVIDER_NAMES,
  PROVIDERS,
  DEFAULT_PROVIDER,
  DEFAULT_SYSTEM_PROMPT,
  SECRET_KEY_PREFIX,
} from './types';

export function readExtensionConfig(): ExtensionConfig {
  const config = vscode.workspace.getConfiguration('wtfCommit');

  const provider = asProviderName(config.get<string>('provider'));
  const languageSetting = config.get<string>('language') || 'English';
  const customLanguage = config.get<string>('customLanguage') || 'English';
  const language = languageSetting === 'Custom' ? customLanguage : languageSetting;

  // 1. Try to read provider-specific overrides
  const overrides = config.get<Record<string, { baseUrl?: string; model?: string }>>('providerOverrides') || {};
  let providerBaseUrl = overrides[provider]?.baseUrl?.trim() || config.get<string>(`${provider}.baseUrl`)?.trim();
  let providerModel = overrides[provider]?.model?.trim() || config.get<string>(`${provider}.model`)?.trim();

  // 2. Try to read global overrides
  let globalBaseUrl = config.get<string>('baseUrl')?.trim();
  let globalModel = config.get<string>('model')?.trim();

  let baseUrl = providerBaseUrl || globalBaseUrl || '';
  let model = providerModel || globalModel || '';

  // 3. Fallback to defaults if not set and not Custom provider
  if (!baseUrl && provider !== 'Custom') {
    baseUrl = PROVIDERS[provider]?.baseUrl || '';
  }
  if (!model && provider !== 'Custom') {
    model = PROVIDERS[provider]?.model || '';
  }

  if (!baseUrl) {
    throw new Error(`Base URL is missing for ${provider}. Please check your settings.`);
  }
  if (!model) {
    throw new Error(`Model is missing for ${provider}. Please check your settings.`);
  }

  let systemPrompt = config.get<string>('prompt') || DEFAULT_SYSTEM_PROMPT;
  systemPrompt += `\n\nIMPORTANT: Please write the commit message in ${language}.`;

  return {
    provider,
    language,
    autoCommit: config.get<boolean>('autoCommit') || false,
    autoPush: config.get<boolean>('autoPush') || false,
    smartStage: config.get<boolean>('smartStage') ?? true,
    confirmBeforeCommit: config.get<boolean>('confirmBeforeCommit') ?? true,
    systemPrompt,
    baseUrl,
    model,
  };
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
