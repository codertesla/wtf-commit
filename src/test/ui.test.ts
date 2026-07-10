import * as assert from 'node:assert';
import { describe, it } from 'mocha';
import { createStreamingSink, maskApiKey, restoreIntent, restoreIntentOnAbort } from '../ui';

describe('maskApiKey', () => {
  it('should mask the middle of a long key', () => {
    assert.strictEqual(maskApiKey('sk-abcdef1234567890wxyz'), 'sk-a••••wxyz');
  });

  it('should collapse short keys to bullets', () => {
    assert.strictEqual(maskApiKey('short'), '••••');
    assert.strictEqual(maskApiKey('12345678'), '••••');
  });

  it('should mask keys just over the threshold', () => {
    assert.strictEqual(maskApiKey('123456789'), '1234••••6789');
  });
});

describe('createStreamingSink', () => {
  it('should write buffered content into the input box as chunks arrive', () => {
    const reports: string[] = [];
    const inputBox = { value: '' };
    const sink = createStreamingSink(
      { report: (value) => reports.push(value.message || '') },
      inputBox,
      Number.POSITIVE_INFINITY,
      () => 0
    );

    sink.push('feat');
    sink.push(': add login');
    assert.strictEqual(inputBox.value, 'feat: add login');
    assert.strictEqual(sink.buffered, 'feat: add login');
    // First chunk reports immediately so the user sees activity right away.
    assert.deepStrictEqual(reports, ['feat']);
  });

  it('should report progress at most once per interval', () => {
    let clock = 0;
    const reports: string[] = [];
    const sink = createStreamingSink(
      { report: (value) => reports.push(value.message || '') },
      undefined,
      100,
      () => clock
    );

    clock = 0;
    sink.push('first');
    clock = 50;
    sink.push('-chunk');
    clock = 120;
    sink.push('-chunk2');
    // Two reports: at t=0 and t=120 (>= 100ms after the last report at 0).
    assert.strictEqual(reports.length, 2);
    assert.ok(reports[1].endsWith('-chunk2'));
  });

  it('should flush the latest buffer when asked', () => {
    const reports: string[] = [];
    const sink = createStreamingSink(
      { report: (value) => reports.push(value.message || '') },
      undefined,
      Number.POSITIVE_INFINITY,
      () => 0
    );

    sink.push('hello world');
    sink.flush();
    assert.deepStrictEqual(reports, ['hello world', 'hello world']);
  });
});

describe('restoreIntent', () => {
  it('should restore the intent when the input box is empty', () => {
    const inputBox = { value: '' };
    restoreIntent(inputBox, 'add login form');
    assert.strictEqual(inputBox.value, 'add login form');
  });

  it('should not clobber a non-empty input box (e.g. a generated message)', () => {
    const inputBox = { value: 'feat: add login' };
    restoreIntent(inputBox, 'add login form');
    assert.strictEqual(inputBox.value, 'feat: add login');
  });

  it('should do nothing when there is no captured intent', () => {
    const inputBox = { value: '' };
    restoreIntent(inputBox, '');
    assert.strictEqual(inputBox.value, '');
  });

  it('should treat a whitespace-only input box as empty', () => {
    const inputBox = { value: '   ' };
    restoreIntent(inputBox, 'fix bug');
    assert.strictEqual(inputBox.value, 'fix bug');
  });

  it('should be a no-op when the input box is undefined', () => {
    assert.doesNotThrow(() => restoreIntent(undefined, 'fix bug'));
  });
});

describe('restoreIntentOnAbort', () => {
  it('should replace a partial stream with the original intent', () => {
    const inputBox = { value: 'feat: add log' };
    restoreIntentOnAbort(inputBox, 'fix auth bug');
    assert.strictEqual(inputBox.value, 'fix auth bug');
  });

  it('should clear the input box when intent was empty', () => {
    const inputBox = { value: 'partial stream junk' };
    restoreIntentOnAbort(inputBox, '');
    assert.strictEqual(inputBox.value, '');
  });

  it('should be a no-op when the input box is undefined', () => {
    assert.doesNotThrow(() => restoreIntentOnAbort(undefined, 'fix bug'));
  });
});
