import * as vscode from 'vscode';
import {
  PROVIDER_NAMES,
  PROVIDER_API_KEY_URLS,
  PROVIDER_KEY_NOTES,
  DEFAULT_PROVIDER,
  type ProviderName,
} from '../types';
import { asProviderName, getSecretKeyName } from '../config';
import { maskApiKey, validateApiKeyInput } from '../ui';
import { setUiLanguage, t, getUiLanguage, asUiLanguage } from '../i18n';
import { getErrorMessage, logError } from '../prompt';
import { LONG_STATUS_MESSAGE_TIMEOUT_MS, showStatusMessage } from '../status';

export async function runSetApiKey(context: vscode.ExtensionContext): Promise<void> {
  try {
    setUiLanguage(asUiLanguage(vscode.env.language));

    const config = vscode.workspace.getConfiguration('wtfCommit');
    const currentProvider = asProviderName(config.get<string>('provider'));

    const provider = await pickProviderForApiKey(context, currentProvider);
    if (!provider) {
      showStatusMessage(`$(key) ${t('setApiKeyCancelled')}`);
      return;
    }

    // First-time setup: guide users who still need to obtain a key (e.g.
    // OpenCode Go requires a subscription). Users who already have a key just
    // press Enter and go straight to the input box.
    const hasKey = Boolean(await context.secrets.get(getSecretKeyName(provider)));
    if (!hasKey && !(await promptOpenKeyPageOrPaste(provider))) {
      showStatusMessage(`$(key) ${t('setApiKeyCancelled')}`);
      return;
    }

    const apiKey = await vscode.window.showInputBox({
      title: t('setApiKeyTitle', { provider }),
      prompt: t('enterApiKeyPrompt'),
      password: true,
      ignoreFocusOut: true,
      validateInput: validateApiKeyInput,
    });

    const trimmedApiKey = apiKey?.trim();
    if (!trimmedApiKey) {
      showStatusMessage(`$(key) ${t('setApiKeyCancelled')}`);
      return;
    }

    await context.secrets.store(getSecretKeyName(provider), trimmedApiKey);
    const masked = maskApiKey(trimmedApiKey);

    const isCurrentProvider = provider === currentProvider;
    let switchedProvider = isCurrentProvider;
    if (!isCurrentProvider) {
      const switchAction = await vscode.window.showInformationMessage(
        t('apiKeySavedSwitched', { provider, masked }),
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
          ? t('apiKeySwitchedTo', { provider, masked })
          : t('apiKeySavedUnchanged', { provider, masked, current: String(currentProvider) })
      }`,
      LONG_STATUS_MESSAGE_TIMEOUT_MS
    );
  } catch (error) {
    logError('Failed to set API key', error);
    vscode.window.showErrorMessage(t('failedToSaveKey', { message: getErrorMessage(error) }));
  }
}

/**
 * Wizard for providers whose key is not set yet: either paste a key now, or
 * open the key page in the browser. After the page is opened the wizard stays
 * open (ignoreFocusOut), so the user can come back and pick "paste" — the
 * flow never ends silently while waiting for a key. Returns false on cancel.
 */
async function promptOpenKeyPageOrPaste(provider: ProviderName): Promise<boolean> {
  const keyUrl = PROVIDER_API_KEY_URLS[provider];
  if (!keyUrl) {
    return true;
  }
  const note = PROVIDER_KEY_NOTES[provider]?.[getUiLanguage()];
  const openPageLabel = t('openKeyPage', { provider });
  while (true) {
    const choice = await vscode.window.showQuickPick(
      [
        {
          label: `$(key) ${t('enterKeyNow')}`,
          detail: t('enterKeyNowDetail'),
          action: 'paste' as const,
        },
        {
          label: `$(link-external) ${openPageLabel}`,
          detail: note ? `${note}\n${keyUrl}` : keyUrl,
          action: 'open' as const,
        },
      ],
      {
        title: t('setApiKeyFlowTitle'),
        placeHolder: t('keyWizardPlaceholder'),
        ignoreFocusOut: true,
      }
    );
    if (!choice) {
      return false;
    }
    if (choice.action === 'open') {
      await vscode.env.openExternal(vscode.Uri.parse(keyUrl));
      showStatusMessage(t('keyPageOpened', { provider }), LONG_STATUS_MESSAGE_TIMEOUT_MS);
      continue;
    }
    return true;
  }
}

async function pickProviderForApiKey(
  context: vscode.ExtensionContext,
  currentProvider: ProviderName
): Promise<ProviderName | undefined> {
  const currentKey = await context.secrets.get(getSecretKeyName(currentProvider));
  const currentDetail = currentKey
    ? `$(key) ${t('apiKeySet')} (${maskApiKey(currentKey)})`
    : `$(circle-slash) ${t('apiKeyNotSetLabel')}`;

  const primaryLabel = currentProvider === DEFAULT_PROVIDER
    ? t('setKeyForDefaultProvider', { provider: currentProvider })
    : t('setKeyForCurrentProvider', { provider: currentProvider });

  const choice = await vscode.window.showQuickPick(
    [
      {
        label: primaryLabel,
        description: currentProvider === DEFAULT_PROVIDER ? t('defaultProviderBadge') : t('current'),
        detail: currentDetail,
        provider: currentProvider,
      },
      {
        label: t('chooseOtherProvider'),
        description: '',
        detail: t('chooseOtherProviderDetail'),
        provider: undefined as ProviderName | undefined,
      },
    ],
    {
      placeHolder: t('selectProviderPlaceholder'),
      title: t('setApiKeyFlowTitle'),
    }
  );

  if (!choice) {
    return undefined;
  }
  if (choice.provider) {
    return choice.provider;
  }

  const items: Array<vscode.QuickPickItem & { provider: ProviderName }> = await Promise.all(
    PROVIDER_NAMES.map(async (name) => {
      const apiKey = await context.secrets.get(getSecretKeyName(name));
      const isCurrent = name === currentProvider;
      return {
        label: name,
        description: isCurrent
          ? t('current')
          : name === DEFAULT_PROVIDER
            ? t('defaultProviderBadge')
            : '',
        detail: apiKey
          ? `$(key) ${t('apiKeySet')} (${maskApiKey(apiKey)})`
          : `$(circle-slash) ${t('apiKeyNotSetLabel')}`,
        provider: name,
      };
    })
  );

  const selected = await vscode.window.showQuickPick(items, {
    placeHolder: t('selectProviderPlaceholder'),
    title: t('providerStatusTitle'),
  });
  return selected?.provider;
}

export async function offerMissingApiKeyActions(provider: ProviderName): Promise<void> {
  const setKeyLabel = t('setApiKey');
  const getKeyLabel = t('getApiKey');
  const keyUrl = PROVIDER_API_KEY_URLS[provider];
  const actions = keyUrl ? [setKeyLabel, getKeyLabel] : [setKeyLabel];
  const action = await vscode.window.showErrorMessage(
    t('apiKeyNotSet', { provider }),
    ...actions
  );
  if (action === setKeyLabel) {
    void vscode.commands.executeCommand('wtf-commit.setApiKey');
    return;
  }
  if (action === getKeyLabel && keyUrl) {
    await vscode.env.openExternal(vscode.Uri.parse(keyUrl));
  }
}
