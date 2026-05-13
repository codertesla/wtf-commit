import * as assert from 'node:assert';
import { describe, it } from 'mocha';
import { normalizeCommitMessage, looksLikeConventionalCommit } from '../prompt';

describe('normalizeCommitMessage', () => {
  it('should trim whitespace', () => {
    assert.strictEqual(normalizeCommitMessage('  feat: add login  '), 'feat: add login');
  });

  it('should strip markdown code fences', () => {
    assert.strictEqual(
      normalizeCommitMessage('```\nfeat: add login\n```'),
      'feat: add login'
    );
  });

  it('should strip markdown code fences with language tag', () => {
    assert.strictEqual(
      normalizeCommitMessage('```text\nfeat: add login\n```'),
      'feat: add login'
    );
  });

  it('should remove leading and trailing blank lines', () => {
    assert.strictEqual(
      normalizeCommitMessage('\n\nfeat: add login\n\n'),
      'feat: add login'
    );
  });

  it('should preserve multi-line messages', () => {
    const input = 'feat: add login\n\n- Added login form\n- Added validation';
    assert.strictEqual(normalizeCommitMessage(input), input);
  });

  it('should return empty string for empty input', () => {
    assert.strictEqual(normalizeCommitMessage(''), '');
  });

  it('should return empty string for whitespace-only input', () => {
    assert.strictEqual(normalizeCommitMessage('   \n\n   '), '');
  });
});

describe('looksLikeConventionalCommit', () => {
  it('should match basic feat commit', () => {
    assert.strictEqual(looksLikeConventionalCommit('feat: add login page'), true);
  });

  it('should match fix with scope', () => {
    assert.strictEqual(looksLikeConventionalCommit('fix(auth): resolve token expiry'), true);
  });

  it('should match breaking change indicator', () => {
    assert.strictEqual(looksLikeConventionalCommit('feat(api)!: change response format'), true);
  });

  it('should match all valid types', () => {
    const types = ['feat', 'fix', 'docs', 'style', 'refactor', 'perf', 'test', 'chore', 'ci', 'build'];
    for (const type of types) {
      assert.strictEqual(
        looksLikeConventionalCommit(`${type}: some description`),
        true,
        `Expected "${type}: some description" to be conventional`
      );
    }
  });

  it('should reject messages without type prefix', () => {
    assert.strictEqual(looksLikeConventionalCommit('add login page'), false);
  });

  it('should reject messages with invalid type', () => {
    assert.strictEqual(looksLikeConventionalCommit('feature: add login page'), false);
  });

  it('should reject messages without colon-space separator', () => {
    assert.strictEqual(looksLikeConventionalCommit('feat:add login page'), false);
  });

  it('should reject empty description after type', () => {
    assert.strictEqual(looksLikeConventionalCommit('feat: '), false);
  });

  it('should only check the first line for multi-line messages', () => {
    assert.strictEqual(
      looksLikeConventionalCommit('feat: add login\n\nThis is not conventional'),
      true
    );
  });
});
