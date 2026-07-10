import * as vscode from 'vscode';
import { PROVIDER_NAMES } from './types';
import { getSecretKeyName } from './config';
import { setUiLanguage, t, asUiLanguage, type UiLanguage } from './i18n';
import { logInfo, logError, setOutputChannel } from './log';
import { runGenerate } from './commands/generate';
import { runSetApiKey } from './commands/set-api-key';

export function activate(context: vscode.ExtensionContext) {
  const outputChannel = vscode.window.createOutputChannel('WTF Commit');
  setOutputChannel(outputChannel);
  context.subscriptions.push(outputChannel);

  logInfo('Extension activated');

  // Status bar button for quick access (static icon — keep unobtrusive).
  const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
  statusBarItem.command = 'wtf-commit.generate';
  statusBarItem.text = '$(sparkle)';
  statusBarItem.tooltip = t('statusBarButtonTooltip');
  context.subscriptions.push(statusBarItem);

  const syncUiLanguage = (): UiLanguage => {
    const language = asUiLanguageFromConfig();
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
      if (event.affectsConfiguration('wtfCommit.uiLanguage')) {
        syncUiLanguage();
      }
      if (event.affectsConfiguration('wtfCommit.autoPush')) {
        void warnIfAutoPushWithoutAutoCommit();
      }
    })
  );

  if (vscode.workspace.getConfiguration('wtfCommit').get<boolean>('changelogPopup', false)) {
    checkChangelog(context).catch((error) => {
      logError('Failed to check changelog', error);
    });
  }

  checkFirstUseGuidance(context).catch((error) => {
    logError('Failed to check first-use guidance', error);
  });

  context.subscriptions.push(
    vscode.commands.registerCommand('wtf-commit.setApiKey', async () => {
      await runSetApiKey(context);
    }),
    vscode.commands.registerCommand('wtf-commit.generate', async () => {
      await runGenerate(context);
    }),
    vscode.commands.registerCommand('wtf-commit.showOutput', () => {
      outputChannel.show();
    })
  );
}

function asUiLanguageFromConfig(): UiLanguage {
  const raw = vscode.workspace.getConfiguration('wtfCommit').get<string>('uiLanguage');
  return asUiLanguage(raw);
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

async function checkChangelog(context: vscode.ExtensionContext): Promise<void> {
  const currentVersion = String(context.extension.packageJSON.version);
  const lastVersion = context.globalState.get<string>('wtfCommit.lastVersion');

  if (currentVersion === lastVersion) {
    return;
  }

  const viewChangelogLabel = t('viewChangelog');
  const action = await vscode.window.showInformationMessage(
    t('updatedToVersion', { version: currentVersion }),
    viewChangelogLabel
  );

  if (action === viewChangelogLabel) {
    const changelogUri = vscode.Uri.joinPath(context.extensionUri, 'CHANGELOG.md');
    void vscode.commands.executeCommand('markdown.showPreview', changelogUri);
  }

  await context.globalState.update('wtfCommit.lastVersion', currentVersion);
}

async function checkFirstUseGuidance(context: vscode.ExtensionContext): Promise<void> {
  const dismissed = context.globalState.get<boolean>('wtfCommit.guidanceDismissed');
  if (dismissed) {
    return;
  }

  const hasAnyKey = await Promise.all(
    PROVIDER_NAMES.map((name) => context.secrets.get(getSecretKeyName(name)))
  ).then((keys) => keys.some(Boolean));

  if (hasAnyKey) {
    await context.globalState.update('wtfCommit.guidanceDismissed', true);
    return;
  }

  const setKeyLabel = t('setApiKey');
  const action = await vscode.window.showInformationMessage(
    t('welcomeTitle'),
    setKeyLabel,
    t('remindMeLater'),
    t('dontShowAgain')
  );

  if (action === setKeyLabel) {
    void vscode.commands.executeCommand('wtf-commit.setApiKey');
    return;
  }

  if (action === t('dontShowAgain')) {
    await context.globalState.update('wtfCommit.guidanceDismissed', true);
  }
}
