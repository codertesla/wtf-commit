import * as assert from 'node:assert';
import { describe, it } from 'mocha';
import {
  createStagedSnapshot,
  stagedSnapshotsEqual,
  buildIndexSignature,
} from '../staged-snapshot';

describe('staged-snapshot', () => {
  it('buildIndexSignature sorts paths for stable order', () => {
    const a = buildIndexSignature([
      { path: 'b.ts', status: 1 },
      { path: 'a.ts', status: 2 },
    ]);
    const b = buildIndexSignature([
      { path: 'a.ts', status: 2 },
      { path: 'b.ts', status: 1 },
    ]);
    assert.strictEqual(a, b);
  });

  it('equal snapshots match for the same index and diff', () => {
    const changes = [{ path: 'src/a.ts', status: 1 }];
    const diff = 'diff --git a/src/a.ts b/src/a.ts\n+hello';
    const left = createStagedSnapshot(changes, diff);
    const right = createStagedSnapshot(changes, diff);
    assert.ok(stagedSnapshotsEqual(left, right));
  });

  it('detects content changes with the same file list', () => {
    const changes = [{ path: 'src/a.ts', status: 1 }];
    const before = createStagedSnapshot(changes, 'diff v1');
    const after = createStagedSnapshot(changes, 'diff v2');
    assert.ok(!stagedSnapshotsEqual(before, after));
  });

  it('detects index membership changes', () => {
    const diff = 'same-diff-body';
    const before = createStagedSnapshot([{ path: 'a.ts', status: 1 }], diff);
    const after = createStagedSnapshot(
      [
        { path: 'a.ts', status: 1 },
        { path: 'b.ts', status: 1 },
      ],
      diff
    );
    assert.ok(!stagedSnapshotsEqual(before, after));
  });

  it('normalizes backslashes in paths', () => {
    const left = createStagedSnapshot([{ path: 'src\\a.ts', status: 1 }], 'x');
    const right = createStagedSnapshot([{ path: 'src/a.ts', status: 1 }], 'x');
    assert.ok(stagedSnapshotsEqual(left, right));
  });
});
