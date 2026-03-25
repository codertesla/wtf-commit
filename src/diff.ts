import * as vscode from 'vscode';
import * as path from 'path';
import {
  Repository,
  RepositoryState,
  Change,
  GitStatus,
  MAX_DIFF_CHARS,
  MAX_DIFF_FILE_CHARS,
  MAX_PARTIAL_DIFF_CHARS,
  MAX_UNTRACKED_FILE_BYTES,
  MAX_UNTRACKED_FILE_LINES,
  MAX_UNTRACKED_FILES,
  MAX_SUMMARY_DIRS
} from './types';
import { logInfo, getErrorMessage } from './prompt';

export async function getOptimizedDiff(
  repository: Repository,
  hasStagedChanges: boolean,
  smartStage: boolean
): Promise<string> {
  let diff = '';

  if (hasStagedChanges) {
    diff = await repository.diff(true);
  } else if (smartStage) {
    diff = await repository.diff(false);
  } else {
    throw new Error('No staged changes found. Please stage your changes first.');
  }

  const untrackedChanges = getUntrackedChanges(repository.state).slice(0, MAX_UNTRACKED_FILES);
  if (untrackedChanges.length > 0) {
    const untrackedPatches = await Promise.all(untrackedChanges.map((change) => buildUntrackedPatch(change.uri)));
    const validPatches = untrackedPatches.filter((patch): patch is string => Boolean(patch));
    if (validPatches.length > 0) {
      diff = `${diff}\n${validPatches.join('\n')}`;
    }
  }

  if (!diff.trim()) {
    return '';
  }

  diff = optimizeDiffForLlm(diff);

  if (diff.length < MAX_DIFF_CHARS) {
    return diff;
  }

  const changes = hasStagedChanges ? repository.state.indexChanges : repository.state.workingTreeChanges;
  return buildLargeDiffSummary(diff, changes);
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

async function buildUntrackedPatch(uri: vscode.Uri): Promise<string | null> {
  const relativePath = vscode.workspace.asRelativePath(uri, false).replace(/\\/g, '/');

  try {
    if (shouldFilterPath(relativePath)) {
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

    const document = await vscode.workspace.openTextDocument(uri);
    const content = document.getText();
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

function buildLargeDiffSummary(diff: string, changes: Change[]): string {
  if (changes.length === 0) {
    return `${diff.substring(0, MAX_PARTIAL_DIFF_CHARS)}\n... (truncated)`;
  }

  const dirCounts = new Map<string, number>();

  for (const change of changes) {
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

  return [
    `The diff is too large (${diff.length} characters). Here is a summary of the changes:`,
    '',
    `Total changed files: ${changes.length}`,
    '',
    'Changes by directory:',
    topDirs,
    '',
    `Partial diff (first ${MAX_PARTIAL_DIFF_CHARS} characters):`,
    `${diff.substring(0, MAX_PARTIAL_DIFF_CHARS)}\n... (truncated)`,
  ].join('\n');
}

function optimizeDiffForLlm(rawDiff: string): string {
  const sections = splitDiffSections(rawDiff);
  const optimizedSections = sections.map(optimizeDiffSection).filter((section) => section.trim().length > 0);
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

function optimizeDiffSection(section: string): string {
  const targetPath = extractDiffPath(section);
  if (!targetPath) {
    return section;
  }

  if (shouldFilterPath(targetPath)) {
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

function shouldFilterPath(filePath: string): boolean {
  const normalized = filePath.replace(/\\/g, '/').toLowerCase();
  const baseName = path.posix.basename(normalized);

  const filteredNames = new Set([
    'package-lock.json',
    'yarn.lock',
    'pnpm-lock.yaml',
    'cargo.lock',
    'go.sum',
    'gemfile.lock',
  ]);

  const filteredExtensions = new Set([
    '.png',
    '.jpg',
    '.jpeg',
    '.gif',
    '.webp',
    '.ico',
    '.pdf',
    '.woff',
    '.woff2',
    '.ttf',
    '.eot',
    '.otf',
    '.mp4',
    '.mov',
    '.mp3',
    '.zip',
    '.gz',
    '.jar',
    '.svg',
    '.map',
  ]);

  const filteredDirectories = [
    '/dist/',
    '/build/',
    '/coverage/',
    '/out/',
    '/target/',
    '/.next/',
    '/node_modules/',
  ];

  if (filteredNames.has(baseName)) {
    return true;
  }

  if (filteredExtensions.has(path.posix.extname(baseName))) {
    return true;
  }

  return filteredDirectories.some((segment) => normalized.includes(segment));
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
