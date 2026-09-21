import * as vscode from 'vscode';
import { PROVIDER_NAMES, PROVIDER_API_KEY_URLS, DEFAULT_PROVIDER } from './types';
import { getSecretKeyName } from './config';
import { setUiLanguage, t, asUiLanguage, type UiLanguage } from './i18n';
import { logInfo, logError, setOutputChannel } from './log';
import { runGenerate } from './commands/generate';
import { runSetApiKey } from './commands/set-api-key';
import { migrateLegacySettings } from './settings-migrate';

export function activate(context: vscode.ExtensionContext) {
  const outputChannel = vscode.window.createOutputChannel('WTF Commit');
  setOutputChannel(outputChannel);
  context.subscriptions.push(outputChannel);

  logInfo('Extension activated');

  const settingsReady = migrateLegacySettings(context).catch((error) => {
    logError('Failed to migrate legacy settings', error);
  });

  // Status bar button for quick access (static icon — keep unobtrusive).
  const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
  statusBarItem.command = 'wtf-commit.generate';
  statusBarItem.text = '$(sparkle)';
  statusBarItem.tooltip = t('statusBarButtonTooltip');
  context.subscriptions.push(statusBarItem);

  const syncUiLanguage = (): UiLanguage => {
    const language = asUiLanguage(vscode.env.language);
    setUiLanguage(language);
    statusBarItem.tooltip = t('statusBarButtonTooltip');
    return language;
  };
  syncUiLanguage();

  const updateStatusBarVisibility = (): void => {
    const show = vscode.workspace
      .getConfiguration('wtfCommit')
      .get<boolean>('showStatusBarItem', true);
    if (show) {
      statusBarItem.show();
    } else {
      statusBarItem.hide();
    }
  };
  updateStatusBarVisibility();
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration('wtfCommit.showStatusBarItem')) {
        updateStatusBarVisibility();
      }
      if (event.affectsConfiguration('wtfCommit.autoPush') || event.affectsConfiguration('wtfCommit.autoCommit')) {
        void warnIfAutoPushWithoutAutoCommit();
      }
    })
  );

  void warnIfAutoPushWithoutAutoCommit();

  checkFirstUseGuidance(context).catch((error) => {
    logError('Failed to check first-use guidance', error);
  });

  context.subscriptions.push(
    vscode.commands.registerCommand('wtf-commit.setApiKey', async () => {
      await settingsReady;
      await runSetApiKey(context);
    }),
    vscode.commands.registerCommand('wtf-commit.generate', async () => {
      await settingsReady;
      await runGenerate(context);
    }),
    vscode.commands.registerCommand('wtf-commit.showOutput', () => {
      outputChannel.show();
    })
  );
}

/**
 * autoPush has no effect without autoCommit. Offer to enable Auto Commit when
 * the misconfiguration is detected.
 */
async function warnIfAutoPushWithoutAutoCommit(): Promise<void> {
  const cfg = vscode.workspace.getConfiguration('wtfCommit');
  const autoPush = cfg.get<boolean>('autoPush', false);
  const autoCommit = cfg.get<boolean>('autoCommit', true);
  if (!autoPush || autoCommit) {
    return;
  }
  const enableLabel = t('enableAutoCommit');
  const dismissLabel = t('dismiss');
  const action = await vscode.window.showInformationMessage(
    t('autoPushNeedsAutoCommit'),
    enableLabel,
    dismissLabel
  );
  if (action === enableLabel) {
    await cfg.update('autoCommit', true, vscode.ConfigurationTarget.Global);
  }
}

export function deactivate() {}

const GUIDANCE_DISMISSED_KEY = 'wtfCommit.guidanceDismissed';
/** Persist "Remind Me Later" until this epoch ms. */
const GUIDANCE_SNOOZE_UNTIL_KEY = 'wtfCommit.guidanceSnoozedUntil';
const GUIDANCE_SNOOZE_MS = 72 * 60 * 60 * 1000;

async function checkFirstUseGuidance(context: vscode.ExtensionContext): Promise<void> {
  const dismissed = context.globalState.get<boolean>(GUIDANCE_DISMISSED_KEY);
  if (dismissed) {
    return;
  }

  const snoozedUntil = context.globalState.get<number>(GUIDANCE_SNOOZE_UNTIL_KEY);
  if (typeof snoozedUntil === 'number' && Date.now() < snoozedUntil) {
    return;
  }

  const hasAnyKey = await Promise.all(
    PROVIDER_NAMES.map((name) => context.secrets.get(getSecretKeyName(name)))
  ).then((keys) => keys.some(Boolean));

  if (hasAnyKey) {
    await context.globalState.update(GUIDANCE_DISMISSED_KEY, true);
    await context.globalState.update(GUIDANCE_SNOOZE_UNTIL_KEY, undefined);
    return;
  }

  const setKeyLabel = t('setApiKey');
  const getKeyLabel = t('getApiKey');
  const remindLabel = t('remindMeLater');
  const dontShowLabel = t('dontShowAgain');
  const deepSeekKeyUrl = PROVIDER_API_KEY_URLS[DEFAULT_PROVIDER];
  const action = await vscode.window.showInformationMessage(
    t('welcomeTitle'),
    setKeyLabel,
    ...(deepSeekKeyUrl ? [getKeyLabel] : []),
    remindLabel,
    dontShowLabel
  );

  if (action === setKeyLabel) {
    void vscode.commands.executeCommand('wtf-commit.setApiKey');
    return;
  }

  if (action === getKeyLabel && deepSeekKeyUrl) {
    await vscode.env.openExternal(vscode.Uri.parse(deepSeekKeyUrl));
    void vscode.commands.executeCommand('wtf-commit.setApiKey');
    return;
  }

  if (action === remindLabel) {
    await context.globalState.update(GUIDANCE_SNOOZE_UNTIL_KEY, Date.now() + GUIDANCE_SNOOZE_MS);
    return;
  }

  if (action === dontShowLabel) {
    await context.globalState.update(GUIDANCE_DISMISSED_KEY, true);
    await context.globalState.update(GUIDANCE_SNOOZE_UNTIL_KEY, undefined);
  }
}
