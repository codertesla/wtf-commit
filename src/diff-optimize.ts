import * as path from 'path';
import {
  MAX_DIFF_FILE_CHARS,
  MAX_PARTIAL_DIFF_CHARS,
  DEFAULT_UNTRACKED_PREVIEW_LINES,
  MAX_SUMMARY_DIRS,
  DEFAULT_COMPACT_FILE_THRESHOLD,
  DEFAULT_COMPACT_HUNK_LINES,
  DEFAULT_SUMMARY_HUNK_LINES,
  DEFAULT_TRUNCATE_HUNK_LINES,
  DEFAULT_MAX_SUMMARY_FILE_LIST,
} from './types';
import { shouldFilterPath, redactSensitiveContent } from './filters';

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

export interface SummarizedChange {
  relativePath: string;
}

export function finalizeDiffForLlm(
  rawDiff: string,
  changes: SummarizedChange[],
  ignorePatterns: ReadonlyArray<string>,
  limits: DiffLimits,
  untrackedFileCount = 0,
  untrackedFileCap = 0,
  untrackedFilesOmitted = 0
): OptimizedDiffResult {
  const baseResult = {
    untrackedFileCount,
    untrackedFileCap,
    untrackedFilesOmitted,
  };

  let diff = optimizeDiffForLlm(rawDiff, ignorePatterns);
  const sections = splitDiffSections(diff);
  if (sections.length > DEFAULT_COMPACT_FILE_THRESHOLD) {
    diff = sections
      .map((section) => compactDiffSection(section, DEFAULT_COMPACT_HUNK_LINES))
      .filter((section) => section.trim().length > 0)
      .join('\n');
  }

  diff = redactSensitiveContent(diff);

  const maxDiffChars = Math.max(1000, limits.maxDiffChars);
  if (diff.length <= maxDiffChars) {
    return { diff, truncated: false, ...baseResult };
  }

  const summary = buildLargeDiffSummary(diff, changes, maxDiffChars);
  return { diff: summary, truncated: true, ...baseResult };
}

function buildLargeDiffSummary(diff: string, changes: SummarizedChange[], maxDiffChars: number): string {
  const partialBudget = Math.min(MAX_PARTIAL_DIFF_CHARS, Math.max(800, Math.floor(maxDiffChars / 5)));
  if (changes.length === 0) {
    return `${diff.substring(0, partialBudget)}\n... (truncated)`;
  }

  const uniqueChanges = [...new Map(changes.map((change) => [change.relativePath, change])).values()];
  const dirCounts = new Map<string, number>();
  const filePaths: string[] = [];

  for (const change of uniqueChanges) {
    filePaths.push(change.relativePath);
    const directory = path.posix.dirname(change.relativePath);
    const bucket = directory === '.' ? '(root)' : directory;
    dirCounts.set(bucket, (dirCounts.get(bucket) || 0) + 1);
  }

  const topDirs = [...dirCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, MAX_SUMMARY_DIRS)
    .map(([dir, count]) => `- ${dir}: ${count} files`)
    .join('\n');

  const listedFiles = filePaths
    .slice(0, DEFAULT_MAX_SUMMARY_FILE_LIST)
    .map((filePath) => `- ${filePath}`)
    .join('\n');
  const omittedFileCount = Math.max(0, filePaths.length - DEFAULT_MAX_SUMMARY_FILE_LIST);

  const sections = splitDiffSections(diff);
  const sampleHunks = sections
    .map((section) => extractRepresentativeHunk(section, DEFAULT_SUMMARY_HUNK_LINES))
    .filter((section) => section.trim().length > 0)
    .join('\n')
    .substring(0, partialBudget);

  const parts = [
    `The diff is too large (${diff.length} characters). Here is a compact summary:`,
    '',
    `Total changed files: ${uniqueChanges.length}`,
    '',
    'Changed files:',
    listedFiles,
  ];

  if (omittedFileCount > 0) {
    parts.push(`- ... and ${omittedFileCount} more files`);
  }

  parts.push(
    '',
    'Changes by directory:',
    topDirs,
    '',
    'Sample hunks (one per file):',
    `${sampleHunks}\n... (truncated)`
  );

  return parts.join('\n');
}

function optimizeDiffForLlm(rawDiff: string, ignorePatterns: ReadonlyArray<string> = []): string {
  const sections = splitDiffSections(rawDiff);
  const optimizedSections = sections
    .map((section) => optimizeDiffSection(section, ignorePatterns))
    .filter((section) => section.trim().length > 0);
  return optimizedSections.join('\n');
}

export function splitDiffSections(rawDiff: string): string[] {
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

  if (isNewFileSection(section)) {
    return compactNewFileSection(section, targetPath);
  }

  if (section.length <= MAX_DIFF_FILE_CHARS) {
    return section;
  }

  return truncateDiffSection(section, targetPath);
}

export function compactDiffSection(section: string, maxHunkLines: number): string {
  const targetPath = extractDiffPath(section);
  if (!targetPath) {
    return section;
  }

  if (isNewFileSection(section)) {
    return compactNewFileSection(section, targetPath);
  }

  if (section.length <= MAX_DIFF_FILE_CHARS) {
    return extractRepresentativeHunk(section, maxHunkLines);
  }

  return truncateDiffSection(section, targetPath, maxHunkLines);
}

function isNewFileSection(section: string): boolean {
  return /(?:^|\n)new file mode /m.test(section) || section.includes('--- /dev/null');
}

function compactNewFileSection(section: string, filePath: string): string {
  const lines = section.split('\n');
  const plusLines = lines.filter((line) => line.startsWith('+') && !line.startsWith('+++'));
  if (plusLines.length <= DEFAULT_UNTRACKED_PREVIEW_LINES + 1) {
    return section.length <= MAX_DIFF_FILE_CHARS ? section : truncateDiffSection(section, filePath);
  }

  const headerEnd = lines.findIndex((line) => line.startsWith('@@'));
  const header = headerEnd >= 0 ? lines.slice(0, headerEnd + 1) : lines.slice(0, 4);
  const preview = plusLines.slice(0, DEFAULT_UNTRACKED_PREVIEW_LINES);
  const omitted = plusLines.length - preview.length;

  const compactLines = [
    ...header,
    `+[new file: ${filePath}, ${plusLines.length} lines]`,
    ...preview,
  ];
  if (omitted > 0) {
    compactLines.push(`+[preview omitted: ${omitted} more lines]`);
  }

  return compactLines.join('\n');
}

export function extractRepresentativeHunk(section: string, maxHunkLines: number): string {
  const lines = section.split('\n');
  const keptLines: string[] = [];
  let seenHunk = false;
  let remainingHunkLines = maxHunkLines;

  for (const line of lines) {
    if (!seenHunk) {
      keptLines.push(line);
      if (line.startsWith('@@')) {
        seenHunk = true;
      }
      continue;
    }

    if (line.startsWith('@@')) {
      break;
    }

    if (remainingHunkLines <= 0) {
      break;
    }

    keptLines.push(line);
    remainingHunkLines -= 1;
  }

  const targetPath = extractDiffPath(section);
  if (targetPath && lines.length > keptLines.length) {
    keptLines.push(`--- [sample hunk only: ${targetPath}]`);
  }

  return keptLines.join('\n');
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

function truncateDiffSection(
  section: string,
  filePath: string,
  maxHunkLines: number = DEFAULT_TRUNCATE_HUNK_LINES
): string {
  const lines = section.split('\n');
  const keptLines: string[] = [];
  let seenHunk = false;
  let remainingHunkLines = maxHunkLines;

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
