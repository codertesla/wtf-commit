import * as vscode from 'vscode';
import {
  type Repository,
  type RepositoryState,
  type Change,
  GitStatus,
  MAX_UNTRACKED_FILE_BYTES,
  DEFAULT_UNTRACKED_PREVIEW_LINES,
  DEFAULT_MAX_UNTRACKED_FILES,
  DEFAULT_MAX_DIFF_CHARS,
} from './types';
import { shouldFilterPath, isLikelyBinary } from './filters';
import { logInfo, getErrorMessage } from './prompt';
import {
  type DiffLimits,
  type OptimizedDiffResult,
  finalizeDiffForLlm,
} from './diff-optimize';

export type { DiffLimits, OptimizedDiffResult } from './diff-optimize';
export {
  splitDiffSections,
  compactDiffSection,
  extractRepresentativeHunk,
  finalizeDiffForLlm,
} from './diff-optimize';

export type DiffPreparationErrorCode = 'NO_STAGED_CHANGES';

export class DiffPreparationError extends Error {
  constructor(
    public readonly code: DiffPreparationErrorCode,
    message: string
  ) {
    super(message);
    this.name = 'DiffPreparationError';
  }
}

export const DEFAULT_DIFF_LIMITS: DiffLimits = {
  maxDiffChars: DEFAULT_MAX_DIFF_CHARS,
  maxUntrackedFiles: DEFAULT_MAX_UNTRACKED_FILES,
};

export async function getOptimizedDiff(
  repository: Repository,
  hasStagedChanges: boolean,
  smartStage: boolean,
  ignorePatterns: ReadonlyArray<string> = [],
  limits: DiffLimits = DEFAULT_DIFF_LIMITS
): Promise<OptimizedDiffResult> {
  let diff = '';

  if (hasStagedChanges) {
    diff = await repository.diff(true);
  } else if (smartStage) {
    diff = await repository.diff(false);
  } else {
    throw new DiffPreparationError(
      'NO_STAGED_CHANGES',
      'No staged changes found. Please stage your changes first, or enable Smart Stage.'
    );
  }

  const untrackedCap = Math.max(0, limits.maxUntrackedFiles);
  const shouldIncludeUntrackedChanges = !hasStagedChanges && smartStage && untrackedCap > 0;
  const allUntracked = shouldIncludeUntrackedChanges
    ? getUntrackedChanges(repository.state)
    : [];
  const untrackedChanges = allUntracked.slice(0, untrackedCap);
  const untrackedFilesOmitted = Math.max(0, allUntracked.length - untrackedChanges.length);
  if (untrackedChanges.length > 0) {
    const untrackedPatches = await Promise.all(
      untrackedChanges.map((change) => buildUntrackedPatch(change.uri, ignorePatterns))
    );
    const validPatches = untrackedPatches.filter((patch): patch is string => Boolean(patch));
    if (validPatches.length > 0) {
      diff = `${diff}\n${validPatches.join('\n')}`;
    }
  }

  if (!diff.trim()) {
    return { diff: '', truncated: false, untrackedFileCount: 0, untrackedFileCap: untrackedCap, untrackedFilesOmitted };
  }

  const changes = hasStagedChanges
    ? repository.state.indexChanges
    : [...repository.state.workingTreeChanges, ...untrackedChanges];

  const summarizedChanges = changes.map((change) => ({
    relativePath: vscode.workspace.asRelativePath(change.uri, false).replace(/\\/g, '/'),
  }));

  return finalizeDiffForLlm(
    diff,
    summarizedChanges,
    ignorePatterns,
    limits,
    untrackedChanges.length,
    untrackedCap,
    untrackedFilesOmitted
  );
}

function getUntrackedChanges(state: RepositoryState): Change[] {
  const changesByPath = new Map<string, Change>();

  for (const change of state.untrackedChanges) {
    changesByPath.set(change.uri.fsPath, change);
  }

  for (const change of state.workingTreeChanges) {
    if (change.status === GitStatus.UNTRACKED) {
      changesByPath.set(change.uri.fsPath, change);
    }
  }

  return [...changesByPath.values()];
}

async function buildUntrackedPatch(uri: vscode.Uri, ignorePatterns: ReadonlyArray<string>): Promise<string | null> {
  const relativePath = vscode.workspace.asRelativePath(uri, false).replace(/\\/g, '/');

  try {
    if (shouldFilterPath(relativePath, ignorePatterns)) {
      return null;
    }

    const stats = await vscode.workspace.fs.stat(uri);
    if (stats.size > MAX_UNTRACKED_FILE_BYTES) {
      return buildNewFileMetadataPatch(relativePath, `large file (${stats.size} bytes)`);
    }

    const bytes = await vscode.workspace.fs.readFile(uri);
    if (isLikelyBinary(bytes)) {
      return buildNewFileMetadataPatch(relativePath, 'binary file');
    }

    const content = Buffer.from(bytes).toString('utf8');
    const lines = content.split(/\r?\n/);
    return buildNewFilePreviewPatch(relativePath, lines, stats.size);
  } catch (error) {
    logInfo(`Skipping unreadable untracked file: ${relativePath} (${getErrorMessage(error)})`);
    return null;
  }
}

function buildNewFileMetadataPatch(relativePath: string, reason: string): string {
  return [
    `diff --git a/${relativePath} b/${relativePath}`,
    'new file',
    '--- /dev/null',
    `+++ b/${relativePath}`,
    '@@ -0,0 +1,1 @@',
    `+[new file: ${relativePath} (${reason})]`,
  ].join('\n');
}

function buildNewFilePreviewPatch(relativePath: string, lines: string[], sizeBytes: number): string {
  const previewLines = lines.slice(0, DEFAULT_UNTRACKED_PREVIEW_LINES);
  const patchLines = [
    `diff --git a/${relativePath} b/${relativePath}`,
    'new file',
    '--- /dev/null',
    `+++ b/${relativePath}`,
    `@@ -0,0 +1,${lines.length} @@`,
    `+[new file: ${relativePath}, ${lines.length} lines, ${sizeBytes} bytes]`,
    ...previewLines.map((line) => `+${line}`),
  ];

  if (lines.length > DEFAULT_UNTRACKED_PREVIEW_LINES) {
    patchLines.push(`+[preview omitted: ${lines.length - DEFAULT_UNTRACKED_PREVIEW_LINES} more lines]`);
  }

  return patchLines.join('\n');
}
