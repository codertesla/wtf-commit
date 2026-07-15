import { createHash } from 'node:crypto';

export interface StagedChangeRef {
  /** Repo-relative or absolute path string used only for equality. */
  path: string;
  status: number;
}

export interface StagedSnapshot {
  /** Sorted path:status fingerprint of the index. */
  indexSignature: string;
  /** SHA-256 of the full staged diff text. */
  contentHash: string;
}

/**
 * Build a compact staged snapshot: index membership + content hash.
 * Cheaper to compare than retaining two full multi-MB diff strings, and
 * allows a fast path when only the index file list changes.
 */
export function createStagedSnapshot(
  indexChanges: ReadonlyArray<StagedChangeRef>,
  stagedDiff: string
): StagedSnapshot {
  return {
    indexSignature: buildIndexSignature(indexChanges),
    contentHash: hashText(stagedDiff),
  };
}

export function stagedSnapshotsEqual(a: StagedSnapshot, b: StagedSnapshot): boolean {
  return a.indexSignature === b.indexSignature && a.contentHash === b.contentHash;
}

/** Build a snapshot from authoritative git command output, independent of VS Code Git UI refresh timing. */
export function createStagedSnapshotFromGitOutputs(
  nameStatusZ: string,
  stagedDiff: string
): StagedSnapshot {
  return {
    indexSignature: hashText(nameStatusZ),
    contentHash: hashText(stagedDiff),
  };
}

export function buildIndexSignature(indexChanges: ReadonlyArray<StagedChangeRef>): string {
  return indexChanges
    .map((change) => `${normalizePath(change.path)}:${change.status}`)
    .sort()
    .join('\n');
}

function normalizePath(path: string): string {
  return path.replace(/\\/g, '/');
}

function hashText(text: string): string {
  return createHash('sha256').update(text, 'utf8').digest('hex');
}
