import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { createStagedSnapshotFromGitOutputs, type StagedSnapshot } from './staged-snapshot';

const execFileAsync = promisify(execFile);

export interface GitCommandRunner {
  (cwd: string, args: string[]): Promise<string>;
}

export async function readStagedSnapshot(
  repositoryPath: string,
  runGit: GitCommandRunner = runGitCommand
): Promise<StagedSnapshot> {
  const [nameStatus, stagedDiff] = await Promise.all([
    runGit(repositoryPath, ['diff', '--cached', '--name-status', '-z']),
    runGit(repositoryPath, ['diff', '--cached', '--no-ext-diff']),
  ]);
  return createStagedSnapshotFromGitOutputs(nameStatus, stagedDiff);
}

async function runGitCommand(cwd: string, args: string[]): Promise<string> {
  const { stdout } = await execFileAsync('git', args, {
    cwd,
    encoding: 'utf8',
    windowsHide: true,
    maxBuffer: 20 * 1024 * 1024,
  });
  return stdout;
}
