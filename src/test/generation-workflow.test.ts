import * as assert from 'node:assert';
import { executeGenerationWorkflow } from '../flow/generation-workflow';
import { createStagedSnapshotFromGitOutputs } from '../staged-snapshot';

describe('executeGenerationWorkflow integration', () => {
  const snapshot = createStagedSnapshotFromGitOutputs('M\0src/a.ts\0', 'diff-a');

  it('generates, locally repairs, verifies the index, and commits', async () => {
    const previews: string[] = [];
    const commits: string[] = [];
    const result = await executeGenerationWorkflow(
      { diff: 'diff-a', intent: 'fix parser', autoCommit: true, expectedSnapshot: snapshot },
      {
        generate: async () => 'fix(parser)：handle quoted paths',
        resolveIssues: async () => { throw new Error('local repair should resolve the issue'); },
        setMessage: (message) => previews.push(message),
        confirmCommit: async () => true,
        readSnapshot: async () => snapshot,
        commit: async (message) => { commits.push(message); },
      }
    );
    assert.deepStrictEqual(result, { status: 'committed', message: 'fix(parser): handle quoted paths' });
    assert.deepStrictEqual(commits, ['fix(parser): handle quoted paths']);
    assert.strictEqual(previews.at(-1), 'fix(parser): handle quoted paths');
  });

  it('does not commit when staged content changes during generation', async () => {
    let committed = false;
    const result = await executeGenerationWorkflow(
      { diff: 'diff-a', intent: '', autoCommit: true, expectedSnapshot: snapshot },
      {
        generate: async () => 'fix: update parser',
        resolveIssues: async (message) => message,
        setMessage: () => undefined,
        confirmCommit: async () => true,
        readSnapshot: async () => createStagedSnapshotFromGitOutputs('M\0src/a.ts\0', 'diff-b'),
        commit: async () => { committed = true; },
      }
    );
    assert.strictEqual(result.status, 'snapshot_changed');
    assert.strictEqual(committed, false);
  });

  it('uses the injected AI repair before committing', async () => {
    const result = await executeGenerationWorkflow(
      { diff: 'diff-a', intent: '', autoCommit: true, expectedSnapshot: snapshot },
      {
        generate: async () => 'updated parser behavior',
        resolveIssues: async (_message, issues) => {
          assert.strictEqual(issues[0].field, 'format');
          return 'fix(parser): update behavior';
        },
        setMessage: () => undefined,
        confirmCommit: async () => true,
        readSnapshot: async () => snapshot,
        commit: async () => undefined,
      }
    );
    assert.deepStrictEqual(result, { status: 'committed', message: 'fix(parser): update behavior' });
  });

  it('stops after generation when automatic commit is disabled', async () => {
    const result = await executeGenerationWorkflow(
      { diff: 'diff-a', intent: '', autoCommit: false },
      {
        generate: async () => 'docs: update guide',
        resolveIssues: async (message) => message,
        setMessage: () => undefined,
        confirmCommit: async () => { throw new Error('must not confirm'); },
        readSnapshot: async () => { throw new Error('must not read the index'); },
        commit: async () => { throw new Error('must not commit'); },
      }
    );
    assert.deepStrictEqual(result, { status: 'message_ready', message: 'docs: update guide' });
  });
});

