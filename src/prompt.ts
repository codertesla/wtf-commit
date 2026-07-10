import type * as vscode from 'vscode';

type GitCommandErrorLike = Error & {
  stderr?: string;
  stdout?: string;
  gitCommand?: string;
  gitArgs?: string[];
  exitCode?: number;
};

export function normalizeCommitMessage(rawMessage: string): string {
  let message = rawMessage.trim();

  // Some models wrap plain text in markdown fences (possibly with language tag).
  // Strip leading/trailing fences, and also remove fences that appear on their own line.
  message = message
    .replace(/^```[a-zA-Z0-9_-]*\s*\n?/u, '')
    .replace(/\n?```\s*$/u, '')
    .replace(/^[ \t]*```[a-zA-Z0-9_-]*[ \t]*\n?/gmu, '')
    .trim();

  // Strip simple markdown emphasis that some models add around the whole message.
  message = message
    .replace(/^\s*>\s?/gmu, '')
    .replace(/^\*{1,3}([\s\S]+?)\*{1,3}$/u, '$1')
    .replace(/^_{1,3}([\s\S]+?)_{1,3}$/u, '$1')
    .replace(/^`([\s\S]+?)`$/u, '$1')
    .trim();

  const lines = message.split(/\r?\n/);
  while (lines.length > 0 && lines[0].trim() === '') {
    lines.shift();
  }
  while (lines.length > 0 && lines[lines.length - 1].trim() === '') {
    lines.pop();
  }

  return lines.join('\n').trim();
}

const CONVENTIONAL_TYPES = ['feat', 'fix', 'docs', 'style', 'refactor', 'perf', 'test', 'chore', 'ci', 'build', 'revert'] as const;
const CONVENTIONAL_TYPE_PATTERN = CONVENTIONAL_TYPES.join('|');
const CONVENTIONAL_FIRST_LINE_RE = new RegExp(
  `^(?:revert:.*|(${CONVENTIONAL_TYPE_PATTERN})(\\([^)]+\\))?!?:\\s+.+)$`
);
const CONVENTIONAL_SUBJECT_RE = new RegExp(
  `^(${CONVENTIONAL_TYPE_PATTERN})(\\([^)]+\\))?!?:\\s+.+$`
);

export const CONVENTIONAL_SUBJECT_MAX_LENGTH = 72;

export function looksLikeConventionalCommit(message: string): boolean {
  const firstLine = message.split(/\r?\n/, 1)[0] || '';
  return CONVENTIONAL_FIRST_LINE_RE.test(firstLine);
}

export interface ConventionalCommitIssue {
  field: 'type' | 'format' | 'subject_length';
  message: string;
  repairReason: string;
}

export function findConventionalCommitIssues(message: string): ConventionalCommitIssue[] {
  const firstLine = message.split(/\r?\n/, 1)[0] || '';
  const issues: ConventionalCommitIssue[] = [];

  if (firstLine.startsWith('revert:')) {
    // "revert:" prefix is a valid Conventional Commits form on its own.
    if (firstLine.length > CONVENTIONAL_SUBJECT_MAX_LENGTH) {
      issues.push({
        field: 'subject_length',
        message: `First line is ${firstLine.length} characters; keep it under ${CONVENTIONAL_SUBJECT_MAX_LENGTH}.`,
        repairReason: `Shorten the first line to under ${CONVENTIONAL_SUBJECT_MAX_LENGTH} characters while keeping the "revert:" prefix and the meaning.`,
      });
    }
    return issues;
  }

  if (!CONVENTIONAL_SUBJECT_RE.test(firstLine)) {
    issues.push({
      field: 'format',
      message: 'First line must match Conventional Commits: <type>(<scope>): <description>.',
      repairReason:
        'Rewrite the first line to match Conventional Commits: <type>(<scope>): <description>. Valid types: ' +
        CONVENTIONAL_TYPES.join(', ') +
        '. The scope is optional, and the description must be a non-empty imperative phrase.',
    });
  }

  if (firstLine.length > CONVENTIONAL_SUBJECT_MAX_LENGTH) {
    issues.push({
      field: 'subject_length',
      message: `First line is ${firstLine.length} characters; keep it under ${CONVENTIONAL_SUBJECT_MAX_LENGTH}.`,
      repairReason: `Shorten the first line to under ${CONVENTIONAL_SUBJECT_MAX_LENGTH} characters while preserving the type and the core meaning.`,
    });
  }

  return issues;
}

/** Loose first-line match used only for local deterministic repairs. */
const LOOSE_CC_FIRST_LINE_RE = new RegExp(
  `^(${CONVENTIONAL_TYPE_PATTERN})(\\([^)]*\\))?!?\\s*[:：]\\s*(.+)$`,
  'u'
);
const LOOSE_REVERT_FIRST_LINE_RE = /^revert\s*[:：]\s*(.+)$/iu;

/**
 * Attempt deterministic Conventional Commits fixes without calling the LLM.
 * Returns a repaired message only when validation would then pass; otherwise undefined.
 * Does not invent a type for free-form subjects.
 */
export function tryLocalConventionalRepair(message: string): string | undefined {
  const trimmed = message.trim();
  if (!trimmed) {
    return undefined;
  }

  if (findConventionalCommitIssues(trimmed).length === 0) {
    return undefined;
  }

  const lines = trimmed.split(/\r?\n/);
  let firstLine = lines[0] || '';
  const rest = lines.slice(1);

  const revertMatch = LOOSE_REVERT_FIRST_LINE_RE.exec(firstLine);
  if (revertMatch) {
    firstLine = `revert: ${revertMatch[1].trim()}`;
  } else {
    const match = LOOSE_CC_FIRST_LINE_RE.exec(firstLine);
    if (!match) {
      return undefined;
    }
    const type = match[1].toLowerCase();
    const scope = match[2] || '';
    const hasBang = /^(?:\w+)(?:\([^)]*\))?!/.test(firstLine.trim());
    const description = match[3].trim();
    if (!description) {
      return undefined;
    }
    firstLine = `${type}${scope}${hasBang ? '!' : ''}: ${description}`;
  }

  if (firstLine.length > CONVENTIONAL_SUBJECT_MAX_LENGTH) {
    firstLine = truncateSubjectLine(firstLine, CONVENTIONAL_SUBJECT_MAX_LENGTH);
  }

  const repaired = [firstLine, ...rest].join('\n').trim();
  if (findConventionalCommitIssues(repaired).length > 0) {
    return undefined;
  }
  if (repaired === trimmed) {
    return undefined;
  }
  return repaired;
}

function truncateSubjectLine(line: string, maxLength: number): string {
  if (line.length <= maxLength) {
    return line;
  }

  const separator = ': ';
  const sepIndex = line.indexOf(separator);
  if (sepIndex < 0) {
    return line.slice(0, maxLength).trimEnd();
  }

  const prefix = line.slice(0, sepIndex + separator.length);
  const descriptionBudget = maxLength - prefix.length;
  if (descriptionBudget <= 0) {
    return line.slice(0, maxLength).trimEnd();
  }

  let description = line.slice(sepIndex + separator.length);
  if (description.length <= descriptionBudget) {
    return line;
  }

  description = description.slice(0, descriptionBudget);
  const lastSpace = description.lastIndexOf(' ');
  if (lastSpace >= Math.floor(descriptionBudget * 0.5)) {
    description = description.slice(0, lastSpace);
  }
  return `${prefix}${description.trimEnd()}`;
}

export function getGitCommandError(error: unknown): GitCommandErrorLike | undefined {
  if (!(error instanceof Error)) {
    return undefined;
  }

  const gitError = error as GitCommandErrorLike;
  if (!gitError.gitCommand && !gitError.stderr && !gitError.stdout) {
    return undefined;
  }

  return gitError;
}

export function getErrorMessage(error: unknown): string {
  const gitError = getGitCommandError(error);
  const stderr = gitError?.stderr?.trim();

  if (stderr) {
    return gitError?.gitCommand ? `git ${gitError.gitCommand}: ${stderr}` : stderr;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }
  return String(error);
}

let outputChannel: vscode.OutputChannel | undefined;

export function setOutputChannel(channel: vscode.OutputChannel) {
  outputChannel = channel;
}

export function logInfo(message: string): void {
  outputChannel?.appendLine(`[INFO] ${message}`);
}

export function logError(message: string, error?: unknown): void {
  if (error) {
    outputChannel?.appendLine(`[ERROR] ${message}: ${getErrorMessage(error)}`);
  } else {
    outputChannel?.appendLine(`[ERROR] ${message}`);
  }
}
