import * as assert from 'node:assert';
import { describe, it } from 'mocha';
import { planLegacyProviderToCustom } from '../legacy-provider-migrate';

describe('planLegacyProviderToCustom', () => {
  it('returns undefined for current built-in providers', () => {
    assert.strictEqual(
      planLegacyProviderToCustom({ provider: 'DeepSeek' }),
      undefined
    );
    assert.strictEqual(
      planLegacyProviderToCustom({ provider: 'Custom' }),
      undefined
    );
    assert.strictEqual(
      planLegacyProviderToCustom({ provider: undefined }),
      undefined
    );
  });

  it('plans Z.AI → Custom with default endpoint and model', () => {
    assert.deepStrictEqual(
      planLegacyProviderToCustom({ provider: 'Z.AI' }),
      {
        legacyProvider: 'Z.AI',
        baseUrl: 'https://api.z.ai/api/paas/v4',
        model: 'glm-4.7-flashx',
      }
    );
  });

  it('prefers providerOverrides over legacy defaults', () => {
    assert.deepStrictEqual(
      planLegacyProviderToCustom({
        provider: 'MiMo',
        override: {
          baseUrl: 'https://proxy.example/v1',
          model: 'mimo-custom',
        },
      }),
      {
        legacyProvider: 'MiMo',
        baseUrl: 'https://proxy.example/v1',
        model: 'mimo-custom',
      }
    );
  });

  it('does not overwrite existing Custom baseUrl or model', () => {
    assert.deepStrictEqual(
      planLegacyProviderToCustom({
        provider: 'GLM',
        baseUrl: 'https://already.set/v1',
        model: 'already-model',
      }),
      {
        legacyProvider: 'GLM',
        baseUrl: undefined,
        model: undefined,
      }
    );
  });

  it('fills only the empty Custom fields', () => {
    assert.deepStrictEqual(
      planLegacyProviderToCustom({
        provider: 'NVIDIA NIM',
        baseUrl: 'https://keep.example/v1',
      }),
      {
        legacyProvider: 'NVIDIA NIM',
        baseUrl: undefined,
        model: 'nvidia/nemotron-3-super-120b-a12b',
      }
    );
  });
});
