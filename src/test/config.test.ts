import * as assert from 'node:assert';
import { describe, it } from 'mocha';
import { resolveProviderConfig } from '../provider-config';

describe('resolveProviderConfig', () => {
  it('should ignore Custom global values for built-in providers', () => {
    assert.deepStrictEqual(
      resolveProviderConfig({
        provider: 'Gemini',
        customBaseUrl: 'https://api.openai.com/v1',
        customModel: 'gpt-5-nano',
      }),
      {
        baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
        model: 'gemini-3.1-flash-lite',
      }
    );
  });

  it('should prefer provider-specific overrides', () => {
    assert.deepStrictEqual(
      resolveProviderConfig({
        provider: 'Gemini',
        providerBaseUrl: 'https://proxy.example.com/gemini',
        providerModel: 'gemini-custom',
      }),
      {
        baseUrl: 'https://proxy.example.com/gemini',
        model: 'gemini-custom',
      }
    );
  });

  it('should use global values for the Custom provider', () => {
    assert.deepStrictEqual(
      resolveProviderConfig({
        provider: 'Custom',
        customBaseUrl: 'http://localhost:11434/v1',
        customModel: 'llama3',
      }),
      {
        baseUrl: 'http://localhost:11434/v1',
        model: 'llama3',
      }
    );
  });

  it('should reject incomplete Custom configuration', () => {
    assert.throws(
      () => resolveProviderConfig({ provider: 'Custom', customBaseUrl: 'http://localhost:11434/v1' }),
      /Model is missing/
    );
  });
});
