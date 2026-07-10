import * as vscode from 'vscode';
import { PROVIDER_NAMES, type ProviderName } from '../types';
import { getSecretKeyName } from '../config';
import { maskApiKey } from '../ui';
import { setUiLanguage, t, asUiLanguage } from '../i18n';
import { getErrorMessage, logError } from '../prompt';
import { LONG_STATUS_MESSAGE_TIMEOUT_MS, showStatusMessage } from '../status';

export async function runSetApiKey(context: vscode.ExtensionContext): Promise<void> {
  try {
    const raw = vscode.workspace.getConfiguration('wtfCommit').get<string>('uiLanguage');
    setUiLanguage(asUiLanguage(raw));

    const config = vscode.workspace.getConfiguration('wtfCommit');
    const currentProvider = config.get<string>('provider');

    const items: vscode.QuickPickItem[] = await Promise.all(
      PROVIDER_NAMES.map(async (name) => {
        const apiKey = await context.secrets.get(getSecretKeyName(name));
        const isCurrent = name === currentProvider;
        const hasKey = !!apiKey;

        return {
          label: name,
          description: isCurrent ? t('current') : '',
          detail: hasKey
            ? `$(key) ${t('apiKeySet')}${apiKey ? ` (${maskApiKey(apiKey)})` : ''}`
            : `$(circle-slash) ${t('apiKeyNotSetLabel')}`,
          picked: isCurrent,
        };
      })
    );

    const selectedItem = await vscode.window.showQuickPick(items, {
      placeHolder: t('selectProviderPlaceholder'),
      title: t('providerStatusTitle'),
    });

    if (!selectedItem) {
      return;
    }

    const provider = selectedItem.label as ProviderName;

    const apiKey = await vscode.window.showInputBox({
      title: t('setApiKeyTitle', { provider }),
      prompt: t('enterApiKeyPrompt'),
      password: true,
      ignoreFocusOut: true,
    });

    const trimmedApiKey = apiKey?.trim();
    if (!trimmedApiKey) {
      return;
    }

    await context.secrets.store(getSecretKeyName(provider), trimmedApiKey);

    const isCurrentProvider = provider === currentProvider;
    let switchedProvider = isCurrentProvider;
    if (!isCurrentProvider) {
      const switchAction = await vscode.window.showInformationMessage(
        t('apiKeySavedSwitched', { provider }),
        t('switchProvider'),
        t('keepCurrent')
      );
      if (switchAction === t('switchProvider')) {
        await vscode.workspace
          .getConfiguration('wtfCommit')
          .update('provider', provider, vscode.ConfigurationTarget.Global);
        switchedProvider = true;
      }
    }

    showStatusMessage(
      `$(key) ${
        switchedProvider
          ? t('apiKeySwitchedTo', { provider })
          : t('apiKeySavedUnchanged', { provider, current: String(currentProvider) })
      }`,
      LONG_STATUS_MESSAGE_TIMEOUT_MS
    );
  } catch (error) {
    logError('Failed to set API key', error);
    vscode.window.showErrorMessage(t('failedToSaveKey', { message: getErrorMessage(error) }));
  }
}
