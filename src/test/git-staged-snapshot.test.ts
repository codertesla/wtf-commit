import * as assert from 'node:assert';
import { readStagedSnapshot } from '../git-staged-snapshot';
import { createStagedSnapshotFromGitOutputs } from '../staged-snapshot';

describe('readStagedSnapshot', () => {
  it('uses authoritative git outputs rather than repository UI state', async () => {
    const calls: string[][] = [];
    const runner = async (_cwd: string, args: string[]): Promise<string> => {
      calls.push(args);
      return args.includes('--name-status') ? 'R100\0old.ts\0new.ts\0' : 'binary diff';
    };
    const result = await readStagedSnapshot('/repo', runner);
    assert.deepStrictEqual(result, createStagedSnapshotFromGitOutputs('R100\0old.ts\0new.ts\0', 'binary diff'));
    assert.deepStrictEqual(calls, [
      ['diff', '--cached', '--name-status', '-z'],
      ['diff', '--cached', '--no-ext-diff'],
    ]);
  });
});
