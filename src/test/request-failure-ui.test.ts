import * as assert from 'node:assert';
import { describe, it } from 'mocha';
import { formatRequestFailureMessage } from '../request-failure-ui';
import { setUiLanguage } from '../i18n';
import { RequestFailure } from '../types';

describe('formatRequestFailureMessage', () => {
  it('localizes auth / rate-limit / timeout failures', () => {
    setUiLanguage('en');
    assert.strictEqual(
      formatRequestFailureMessage(new RequestFailure('auth', 'Authentication failed (401)', 401)),
      'Authentication failed (401)'
    );
    assert.strictEqual(
      formatRequestFailureMessage(
        new RequestFailure('rate_limit', 'Rate limit reached.', 429, { retryAfterMs: 2500 })
      ),
      'Rate limit reached. Please retry in 3 seconds.'
    );
    assert.strictEqual(
      formatRequestFailureMessage(
        new RequestFailure('timeout', 'Request timed out after 45 seconds.', undefined, {
          timeoutSeconds: 45,
        })
      ),
      'Request timed out after 45 seconds.'
    );

    setUiLanguage('zh');
    assert.strictEqual(
      formatRequestFailureMessage(new RequestFailure('auth', 'Authentication failed (401)', 401)),
      '认证失败（401）'
    );
    assert.match(
      formatRequestFailureMessage(
        new RequestFailure('rate_limit', 'Rate limit reached.', 429, { retryAfterMs: 2500 })
      ),
      /3/
    );
    setUiLanguage('en');
  });

  it('localizes network and API failures with detail', () => {
    setUiLanguage('zh');
    assert.strictEqual(
      formatRequestFailureMessage(
        new RequestFailure('network', 'Network request failed: ECONNRESET', undefined, {
          detail: 'ECONNRESET',
        })
      ),
      '网络请求失败：ECONNRESET'
    );
    assert.strictEqual(
      formatRequestFailureMessage(
        new RequestFailure('api', 'Service unavailable (503).', 503, { detail: 'unavailable' })
      ),
      '服务不可用（503），请稍后再试。'
    );
    setUiLanguage('en');
  });
});
