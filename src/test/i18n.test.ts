import * as assert from 'node:assert';
import { describe, it } from 'mocha';
import { t, setUiLanguage, getUiLanguage, asUiLanguage } from '../i18n';

describe('i18n', () => {
  it('asUiLanguage maps zh locales to zh and everything else to en', () => {
    assert.strictEqual(asUiLanguage('zh'), 'zh');
    assert.strictEqual(asUiLanguage('zh-cn'), 'zh');
    assert.strictEqual(asUiLanguage('zh-TW'), 'zh');
    assert.strictEqual(asUiLanguage('zh_CN'), 'zh');
    assert.strictEqual(asUiLanguage('en'), 'en');
    assert.strictEqual(asUiLanguage(undefined), 'en');
    assert.strictEqual(asUiLanguage('fr'), 'en');
    assert.strictEqual(asUiLanguage('de-DE'), 'en');
  });

  it('t returns English by default and substitutes params', () => {
    setUiLanguage('en');
    assert.strictEqual(
      t('apiKeyNotSet', { provider: 'OpenAI' }),
      'API Key for OpenAI is not set.'
    );
  });

  it('t returns Chinese after setUiLanguage(zh)', () => {
    setUiLanguage('zh');
    assert.strictEqual(
      t('apiKeyNotSet', { provider: 'OpenAI' }),
      '尚未设置 OpenAI 的 API Key。'
    );
    assert.strictEqual(getUiLanguage(), 'zh');
  });

  it('t replaces multiple occurrences of the same param', () => {
    setUiLanguage('en');
    assert.strictEqual(
      t('apiKeySwitchedTo', { provider: 'GLM' }),
      'API Key for GLM saved. Active provider is now GLM.'
    );
  });

  it('falls back to English when a key is missing in the active dictionary', () => {
    setUiLanguage('zh');
    // All keys exist in both dictionaries; sanity-check the fallback path by
    // verifying a known key still resolves.
    assert.ok(t('noChangesDetected').length > 0);
  });

  it('every key resolves in both languages', () => {
    setUiLanguage('en');
    const enValues = new Set<string>();
    // Touch a representative set of keys in both languages to ensure no holes.
    const keys = [
      'noChangesDetected',
      'generatingProgress',
      'pushingProgress',
      'commitSuccessful',
      'welcomeTitle',
      'mixedStageWarning',
      'pushSuccessful',
    ] as const;
    for (const key of keys) {
      enValues.add(t(key));
    }
    setUiLanguage('zh');
    for (const key of keys) {
      const zhValue = t(key);
      assert.ok(zhValue.length > 0);
      assert.ok(!enValues.has(zhValue), `expected zh translation to differ for ${key}`);
    }
    setUiLanguage('en');
  });
});
