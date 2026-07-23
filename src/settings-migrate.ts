import * as vscode from 'vscode';
import {
  LEGACY_PROVIDER_NAMES,
  PROVIDER_NAMES,
  isLegacyProviderName,
  type LegacyProviderName,
} from './provider-manifest';
import { planLegacyProviderToCustom } from './legacy-provider-migrate';
import { getSecretKeyName } from './config';
import { logInfo } from './log';
import { mergeLegacyProviderOverride } from './settings-resolve';
import { t } from './i18n';

type ProviderOverride = { baseUrl?: string; model?: string };
type ConfigTarget = vscode.ConfigurationTarget.Global | vscode.ConfigurationTarget.Workspace | vscode.ConfigurationTarget.WorkspaceFolder;

/**
 * One-time migrations for renamed / consolidated settings.
 * Safe to call on every activate — no-ops when already migrated.
 */
export async function migrateLegacySettings(context: vscode.ExtensionContext): Promise<void> {
  const config = vscode.workspace.getConfiguration('wtfCommit');
  await migrateCommitMessageLanguage(config);
  await migrateLegacyProviderKeys(config);
  await migrateRemovedProvidersToCustom(config, context);
}

async function migrateCommitMessageLanguage(config: vscode.WorkspaceConfiguration): Promise<void> {
  await copySettingIfNeeded(config, 'language', 'commitMessageLanguage');
  await copySettingIfNeeded(config, 'customLanguage', 'customCommitMessageLanguage');
}

async function copySettingIfNeeded(
  config: vscode.WorkspaceConfiguration,
  fromKey: string,
  toKey: string
): Promise<void> {
  const from = config.inspect<string>(fromKey);
  const to = config.inspect<string>(toKey);
  if (!from) {
    return;
  }

  const copies: Array<{ value: string | undefined; target: ConfigTarget; alreadySet: unknown }> = [
    { value: from.workspaceFolderValue, target: vscode.ConfigurationTarget.WorkspaceFolder, alreadySet: to?.workspaceFolderValue },
    { value: from.workspaceValue, target: vscode.ConfigurationTarget.Workspace, alreadySet: to?.workspaceValue },
    { value: from.globalValue, target: vscode.ConfigurationTarget.Global, alreadySet: to?.globalValue },
  ];

  for (const { value, target, alreadySet } of copies) {
    if (value === undefined || alreadySet !== undefined) {
      continue;
    }
    await config.update(toKey, value, target);
    logInfo(`Migrated setting ${fromKey} → ${toKey}`);
  }
}

/**
 * Fold legacy `wtfCommit.{Provider}.baseUrl/model` into `providerOverrides`.
 * Does not delete the old keys (user may still have them in settings.json).
 */
async function migrateLegacyProviderKeys(config: vscode.WorkspaceConfiguration): Promise<void> {
  const targets: ConfigTarget[] = [
    vscode.ConfigurationTarget.WorkspaceFolder,
    vscode.ConfigurationTarget.Workspace,
    vscode.ConfigurationTarget.Global,
  ];

  for (const target of targets) {
    const merged = collectLegacyOverridesForTarget(config, target);
    if (Object.keys(merged.additions).length === 0) {
      continue;
    }
    const next: Record<string, ProviderOverride> = { ...merged.existing };
    for (const [provider, entry] of Object.entries(merged.additions)) {
      next[provider] = entry;
    }
    await config.update('providerOverrides', next, target);
    logInfo(`Migrated legacy per-provider endpoint settings into providerOverrides (${targetLabel(target)})`);
  }
}

function collectLegacyOverridesForTarget(
  config: vscode.WorkspaceConfiguration,
  target: ConfigTarget
): { existing: Record<string, ProviderOverride>; additions: Record<string, ProviderOverride> } {
  const overridesInspect = config.inspect<Record<string, ProviderOverride>>('providerOverrides');
  const existing = readOverridesAtTarget(overridesInspect, target);
  const additions: Record<string, ProviderOverride> = {};
  const providerKeys = new Set<string>([...PROVIDER_NAMES, ...LEGACY_PROVIDER_NAMES]);

  for (const provider of providerKeys) {
    const baseUrl = readScopedString(config, `${provider}.baseUrl`, target);
    const model = readScopedString(config, `${provider}.model`, target);
    const merged = mergeLegacyProviderOverride(existing[provider], { baseUrl, model });
    if (merged) {
      additions[provider] = merged;
    }
  }

  return { existing, additions };
}

async function migrateRemovedProvidersToCustom(
  config: vscode.WorkspaceConfiguration,
  context: vscode.ExtensionContext
): Promise<void> {
  const targets: ConfigTarget[] = [
    vscode.ConfigurationTarget.WorkspaceFolder,
    vscode.ConfigurationTarget.Workspace,
    vscode.ConfigurationTarget.Global,
  ];

  const migratedNames = new Set<LegacyProviderName>();

  for (const target of targets) {
    const provider = readScopedString(config, 'provider', target);
    const overrides = readOverridesAtTarget(config.inspect<Record<string, ProviderOverride>>('providerOverrides'), target);
    const plan = planLegacyProviderToCustom({
      provider,
      baseUrl: readScopedString(config, 'baseUrl', target),
      model: readScopedString(config, 'model', target),
      override: provider && isLegacyProviderName(provider) ? overrides[provider] : undefined,
    });
    if (!plan) {
      continue;
    }

    if (plan.baseUrl) {
      await config.update('baseUrl', plan.baseUrl, target);
    }
    if (plan.model) {
      await config.update('model', plan.model, target);
    }
    await config.update('provider', 'Custom', target);
    migratedNames.add(plan.legacyProvider);
    logInfo(
      `Migrated provider ${plan.legacyProvider} → Custom (${targetLabel(target)})`
    );

    await copyLegacySecretIfNeeded(context, plan.legacyProvider);
  }

  if (migratedNames.size > 0) {
    const list = [...migratedNames].join(', ');
    void vscode.window.showInformationMessage(t('legacyProviderMigrated', { providers: list }));
  }
}

async function copyLegacySecretIfNeeded(
  context: vscode.ExtensionContext,
  legacyProvider: LegacyProviderName
): Promise<void> {
  const legacyKey = await context.secrets.get(getSecretKeyName(legacyProvider));
  if (!legacyKey) {
    return;
  }
  const customKey = await context.secrets.get(getSecretKeyName('Custom'));
  if (customKey) {
    return;
  }
  await context.secrets.store(getSecretKeyName('Custom'), legacyKey);
  logInfo(`Copied API key from ${legacyProvider} → Custom`);
}

function readOverridesAtTarget(
  inspected: ReturnType<vscode.WorkspaceConfiguration['inspect']> | undefined,
  target: ConfigTarget
): Record<string, ProviderOverride> {
  if (!inspected) {
    return {};
  }
  const raw =
    target === vscode.ConfigurationTarget.WorkspaceFolder
      ? inspected.workspaceFolderValue
      : target === vscode.ConfigurationTarget.Workspace
        ? inspected.workspaceValue
        : inspected.globalValue;
  return raw && typeof raw === 'object' ? { ...(raw as Record<string, ProviderOverride>) } : {};
}

function readScopedString(
  config: vscode.WorkspaceConfiguration,
  key: string,
  target: ConfigTarget
): string | undefined {
  const inspected = config.inspect<string>(key);
  if (!inspected) {
    return undefined;
  }
  const raw =
    target === vscode.ConfigurationTarget.WorkspaceFolder
      ? inspected.workspaceFolderValue
      : target === vscode.ConfigurationTarget.Workspace
        ? inspected.workspaceValue
        : inspected.globalValue;
  const trimmed = raw?.trim();
  return trimmed || undefined;
}

function targetLabel(target: ConfigTarget): string {
  switch (target) {
    case vscode.ConfigurationTarget.WorkspaceFolder:
      return 'workspaceFolder';
    case vscode.ConfigurationTarget.Workspace:
      return 'workspace';
    default:
      return 'global';
  }
}
