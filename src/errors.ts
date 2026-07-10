type GitCommandErrorLike = Error & {
  stderr?: string;
  stdout?: string;
  gitCommand?: string;
  gitArgs?: string[];
  exitCode?: number;
};

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
