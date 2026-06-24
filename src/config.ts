import * as vscode from 'vscode';
import {
  type ExtensionConfig,
  type ProviderName,
  PROVIDER_NAMES,
  DEFAULT_PROVIDER,
  DEFAULT_SYSTEM_PROMPT,
  SECRET_KEY_PREFIX,
} from './types';
import { resolveProviderConfig } from './provider-config';

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
    autoCommit: config.get<boolean>('autoCommit') || false,
    autoPush: config.get<boolean>('autoPush') || false,
    smartStage: config.get<boolean>('smartStage') ?? true,
    confirmBeforeCommit: config.get<boolean>('confirmBeforeCommit') ?? true,
    systemPrompt,
    baseUrl,
    model,
    temperature: config.get<number>('temperature') ?? 1.0,
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
