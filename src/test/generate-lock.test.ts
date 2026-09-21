import * as assert from 'node:assert';
import { describe, it } from 'mocha';
import { createGenerateLock, finishGenerateRun } from '../generate-lock';

describe('createGenerateLock', () => {
  it('should acquire when free', () => {
    const lock = createGenerateLock();
    assert.strictEqual(lock.tryAcquire(), true);
    assert.strictEqual(lock.isHeld(), true);
  });

  it('should reject a second acquire while held', () => {
    const lock = createGenerateLock();
    assert.strictEqual(lock.tryAcquire(), true);
    assert.strictEqual(lock.tryAcquire(), false);
    assert.strictEqual(lock.isHeld(), true);
  });

  it('should allow re-acquire after release', () => {
    const lock = createGenerateLock();
    assert.strictEqual(lock.tryAcquire(), true);
    lock.release();
    assert.strictEqual(lock.isHeld(), false);
    assert.strictEqual(lock.tryAcquire(), true);
  });

  it('should be idempotent on release when not held', () => {
    const lock = createGenerateLock();
    lock.release();
    assert.strictEqual(lock.isHeld(), false);
    assert.strictEqual(lock.tryAcquire(), true);
  });

  it('releases the lock before dispatching a requested retry', () => {
    const lock = createGenerateLock();
    assert.strictEqual(lock.tryAcquire(), true);

    let retryAcquired = false;
    finishGenerateRun(lock, true, () => {
      retryAcquired = lock.tryAcquire();
    });

    assert.strictEqual(retryAcquired, true);
  });

  it('does not dispatch a retry when none was requested', () => {
    const lock = createGenerateLock();
    assert.strictEqual(lock.tryAcquire(), true);

    let retried = false;
    finishGenerateRun(lock, false, () => { retried = true; });

    assert.strictEqual(retried, false);
    assert.strictEqual(lock.isHeld(), false);
  });
});
