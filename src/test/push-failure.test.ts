import * as assert from 'node:assert';
import { describe, it } from 'mocha';
import { classifyPushFailure, formatPushFailureMessage } from '../push-failure';

interface FakeGitError extends Error {
  stderr?: string;
  gitCommand?: string;
  stdout?: string;
  exitCode?: number;
}

function makeGitError(gitCommand: string, stderr: string): FakeGitError {
  const error = new Error(`git ${gitCommand} failed`) as FakeGitError;
  error.gitCommand = gitCommand;
  error.stderr = stderr;
  return error;
}

describe('classifyPushFailure', () => {
  it('treats a non-push follow-up command with verified upstream as succeeded-with-warning', () => {
    const classification = classifyPushFailure(makeGitError('status', 'refresh failed'), true);
    assert.strictEqual(classification.kind, 'push_succeeded_with_followup_warning');
    assert.strictEqual(classification.commandLabel, 'git status');
    assert.strictEqual(classification.needsUndoPrompt, false);
  });

  it('treats a non-push follow-up command with unverified upstream as may-have-succeeded', () => {
    const classification = classifyPushFailure(makeGitError('status', 'refresh failed'), false);
    assert.strictEqual(classification.kind, 'push_may_have_succeeded');
    assert.strictEqual(classification.needsUndoPrompt, false);
  });

  it('treats a push command failure as a hard failure needing undo prompt', () => {
    const classification = classifyPushFailure(makeGitError('push', 'permission denied'), false);
    assert.strictEqual(classification.kind, 'push_failed');
    assert.strictEqual(classification.commandLabel, 'git push');
    assert.strictEqual(classification.needsUndoPrompt, true);
    assert.ok(classification.detail.includes('permission denied'));
  });

  it('falls back to a generic git-refresh label when the error has no gitCommand', () => {
    const classification = classifyPushFailure(new Error('network down'), false);
    assert.strictEqual(classification.kind, 'push_failed');
    assert.strictEqual(classification.commandLabel, 'Git repository refresh');
    assert.ok(classification.detail.includes('network down'));
  });
});

describe('formatPushFailureMessage', () => {
  it('formats each kind with the right prefix', () => {
    assert.ok(
      formatPushFailureMessage({
        kind: 'push_succeeded_with_followup_warning',
        commandLabel: 'git status',
        detail: 'x',
        needsUndoPrompt: false,
      }).startsWith('Push succeeded, but git status failed afterward')
    );
    assert.ok(
      formatPushFailureMessage({
        kind: 'push_may_have_succeeded',
        commandLabel: 'git status',
        detail: 'x',
        needsUndoPrompt: false,
      }).startsWith('Push may have succeeded')
    );
    assert.ok(
      formatPushFailureMessage({
        kind: 'push_failed',
        commandLabel: 'git push',
        detail: 'x',
        needsUndoPrompt: true,
      }).startsWith('Commit successful, but push failed')
    );
  });
});
