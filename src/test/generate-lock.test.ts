import * as assert from 'node:assert';
import { describe, it } from 'mocha';
import { createGenerateLock } from '../generate-lock';

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
});
