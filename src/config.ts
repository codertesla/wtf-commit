import * as vscode from 'vscode';
import {
  type ExtensionConfig,
  type ProviderName,
  PROVIDER_NAMES,
  DEFAULT_PROVIDER,
  DEFAULT_SYSTEM_PROMPT,
  SECRET_KEY_PREFIX,
  DEFAULT_IGNORE_PATHS,
} from './types';
import { resolveProviderConfig } from './provider-config';
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

  // Prompt is intentionally not shown in Settings UI; power users can still
  // override it via settings.json (`wtfCommit.prompt`).
  const configuredPrompt = config.get<unknown>('prompt');
  let systemPrompt = typeof configuredPrompt === 'string' && configuredPrompt.trim()
    ? configuredPrompt
    : DEFAULT_SYSTEM_PROMPT;
  systemPrompt += `\n\nIMPORTANT: Please write the commit message in ${language}.`;

  return {
    provider,
    language,
    autoCommit: config.get<boolean>('autoCommit') ?? true,
    autoPush: config.get<boolean>('autoPush') ?? false,
    confirmAutoPush: config.get<boolean>('confirmAutoPush') ?? true,
    ignorePaths: readIgnorePaths(config),
    systemPrompt,
    baseUrl,
    model,
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

export function asProviderName(rawProvider: string | undefined): ProviderName {
  if (rawProvider && PROVIDER_NAMES.includes(rawProvider as ProviderName)) {
    return rawProvider as ProviderName;
  }
  return DEFAULT_PROVIDER;
}

export function getSecretKeyName(provider: string): string {
  return `${SECRET_KEY_PREFIX}${provider}`;
}
