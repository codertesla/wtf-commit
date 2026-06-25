import * as vscode from 'vscode';
import * as path from 'path';
import {
  type Repository,
  type RepositoryState,
  type Change,
  GitStatus,
  MAX_DIFF_FILE_CHARS,
  MAX_PARTIAL_DIFF_CHARS,
  MAX_UNTRACKED_FILE_BYTES,
  MAX_UNTRACKED_FILE_LINES,
  MAX_SUMMARY_DIRS,
  DEFAULT_MAX_UNTRACKED_FILES,
  DEFAULT_MAX_DIFF_CHARS,
} from './types';
import { shouldFilterPath, isLikelyBinary, redactSensitiveContent } from './filters';
import { logInfo, getErrorMessage } from './prompt';

export interface DiffLimits {
  maxDiffChars: number;
  maxUntrackedFiles: number;
}

export interface OptimizedDiffResult {
  diff: string;
  truncated: boolean;
  untrackedFileCount: number;
  untrackedFileCap: number;
  untrackedFilesOmitted: number;
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
    throw new Error('No staged changes found. Please stage your changes first.');
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

  diff = redactSensitiveContent(optimizeDiffForLlm(diff, ignorePatterns));

  const maxDiffChars = Math.max(1000, limits.maxDiffChars);
  if (diff.length < maxDiffChars) {
    return { diff, truncated: false, untrackedFileCount: untrackedChanges.length, untrackedFileCap: untrackedCap, untrackedFilesOmitted };
  }

  const changes = hasStagedChanges
    ? repository.state.indexChanges
    : [...repository.state.workingTreeChanges, ...untrackedChanges];
  const summary = buildLargeDiffSummary(diff, changes, maxDiffChars);
  return { diff: summary, truncated: true, untrackedFileCount: untrackedChanges.length, untrackedFileCap: untrackedCap, untrackedFilesOmitted };
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
      return [
        `diff --git a/${relativePath} b/${relativePath}`,
        'new file',
        '--- /dev/null',
        `+++ b/${relativePath}`,
        '@@ -0,0 +1,1 @@',
        `+[content omitted: ${relativePath} is ${stats.size} bytes]`,
      ].join('\n');
    }

    const bytes = await vscode.workspace.fs.readFile(uri);
    if (isLikelyBinary(bytes)) {
      return [
        `diff --git a/${relativePath} b/${relativePath}`,
        'new file',
        '--- /dev/null',
        `+++ b/${relativePath}`,
        '@@ -0,0 +1,1 @@',
        `+[content omitted: ${relativePath} appears to be binary]`,
      ].join('\n');
    }

    const content = Buffer.from(bytes).toString('utf8');
    const lines = content.split(/\r?\n/);
    const visibleLines = lines.slice(0, MAX_UNTRACKED_FILE_LINES);

    const patchLines = [
      `diff --git a/${relativePath} b/${relativePath}`,
      'new file',
      '--- /dev/null',
      `+++ b/${relativePath}`,
      `@@ -0,0 +1,${visibleLines.length} @@`,
      ...visibleLines.map((line) => `+${line}`),
    ];

    if (lines.length > MAX_UNTRACKED_FILE_LINES) {
      patchLines.push(`+[content truncated: ${lines.length - MAX_UNTRACKED_FILE_LINES} more lines]`);
    }

    return patchLines.join('\n');
  } catch (error) {
    logInfo(`Skipping unreadable untracked file: ${relativePath} (${getErrorMessage(error)})`);
    return null;
  }
}

function buildLargeDiffSummary(diff: string, changes: Change[], maxDiffChars: number): string {
  const partialBudget = Math.min(MAX_PARTIAL_DIFF_CHARS, Math.max(1000, Math.floor(maxDiffChars / 4)));
  if (changes.length === 0) {
    return `${diff.substring(0, partialBudget)}\n... (truncated)`;
  }

  const uniqueChanges = [...new Map(changes.map((change) => [change.uri.fsPath, change])).values()];
  const dirCounts = new Map<string, number>();

  for (const change of uniqueChanges) {
    const relativePath = vscode.workspace.asRelativePath(change.uri, false).replace(/\\/g, '/');
    const directory = path.posix.dirname(relativePath);
    const bucket = directory === '.' ? '(root)' : directory;
    dirCounts.set(bucket, (dirCounts.get(bucket) || 0) + 1);
  }

  const topDirs = [...dirCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, MAX_SUMMARY_DIRS)
    .map(([dir, count]) => `- ${dir}: ${count} files`)
    .join('\n');

  const sections = splitDiffSections(diff);
  const perFileBudget = Math.max(1, Math.floor(partialBudget / Math.max(sections.length, 1)));
  const balancedPartialDiff = sections
    .map((section) => section.substring(0, perFileBudget))
    .join('\n');

  return [
    `The diff is too large (${diff.length} characters). Here is a summary of the changes:`,
    '',
    `Total changed files: ${uniqueChanges.length}`,
    '',
    'Changes by directory:',
    topDirs,
    '',
    `Balanced partial diff (${perFileBudget} characters per file):`,
    `${balancedPartialDiff}\n... (truncated)`,
  ].join('\n');
}

function optimizeDiffForLlm(rawDiff: string, ignorePatterns: ReadonlyArray<string> = []): string {
  const sections = splitDiffSections(rawDiff);
  const optimizedSections = sections
    .map((section) => optimizeDiffSection(section, ignorePatterns))
    .filter((section) => section.trim().length > 0);
  return optimizedSections.join('\n');
}

function splitDiffSections(rawDiff: string): string[] {
  const normalized = rawDiff.trim();
  if (!normalized) {
    return [];
  }

  const parts = normalized.split(/^diff --git /m);
  return parts
    .filter((part) => part.trim().length > 0)
    .map((part) => (part.startsWith('diff --git ') ? part : `diff --git ${part}`));
}

function optimizeDiffSection(section: string, ignorePatterns: ReadonlyArray<string> = []): string {
  const targetPath = extractDiffPath(section);
  if (!targetPath) {
    return section;
  }

  if (shouldFilterPath(targetPath, ignorePatterns)) {
    return buildOmittedSection(targetPath, 'non-code or generated file omitted');
  }

  if (section.length <= MAX_DIFF_FILE_CHARS) {
    return section;
  }

  return truncateDiffSection(section, targetPath);
}

function extractDiffPath(section: string): string | null {
  const firstLine = section.split('\n', 1)[0] || '';
  const match = firstLine.match(/^diff --git a\/.+ b\/(.+)$/);
  return match?.[1] || null;
}

function buildOmittedSection(filePath: string, reason: string): string {
  return [
    `diff --git a/${filePath} b/${filePath}`,
    `--- [omitted: ${reason}]`,
  ].join('\n');
}

function truncateDiffSection(section: string, filePath: string): string {
  const lines = section.split('\n');
  const keptLines: string[] = [];
  let seenHunk = false;
  let remainingHunkLines = 80;

  for (const line of lines) {
    if (!seenHunk) {
      keptLines.push(line);
      if (line.startsWith('@@')) {
        seenHunk = true;
      }
      continue;
    }

    if (line.startsWith('@@')) {
      if (remainingHunkLines <= 0) {
        break;
      }
      keptLines.push(line);
      continue;
    }

    if (remainingHunkLines <= 0) {
      break;
    }

    keptLines.push(line);
    remainingHunkLines -= 1;
  }

  keptLines.push(`--- [truncated: ${filePath} exceeded ${MAX_DIFF_FILE_CHARS} characters]`);
  return keptLines.join('\n');
}
