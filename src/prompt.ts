import * as vscode from 'vscode';

type GitCommandErrorLike = Error & {
  stderr?: string;
  stdout?: string;
  gitCommand?: string;
  gitArgs?: string[];
  exitCode?: number;
};

export function normalizeCommitMessage(rawMessage: string): string {
  let message = rawMessage.trim();

  // Some models wrap plain text in markdown fences.
  message = message.replace(/^```[a-zA-Z0-9_-]*\s*/u, '').replace(/\s*```$/u, '').trim();

  const lines = message.split(/\r?\n/);
  while (lines.length > 0 && lines[0].trim() === '') {
    lines.shift();
  }
  while (lines.length > 0 && lines[lines.length - 1].trim() === '') {
    lines.pop();
  }

  return lines.join('\n').trim();
}

export function looksLikeConventionalCommit(message: string): boolean {
  const firstLine = message.split(/\r?\n/, 1)[0] || '';
  return /^(feat|fix|docs|style|refactor|perf|test|chore|ci|build)(\([^)]+\))?!?:\s+.+$/.test(firstLine);
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
