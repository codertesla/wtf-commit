import * as vscode from 'vscode';
import { GitExtension, Repository, RepositoryState, Change } from './types';

export async function resolveRepository(): Promise<Repository | null> {
  const gitExtension = vscode.extensions.getExtension<GitExtension>('vscode.git');
  if (!gitExtension) {
    vscode.window.showErrorMessage('Git extension is not available.');
    return null;
  }

  const git = gitExtension.isActive
    ? gitExtension.exports.getAPI(1)
    : (await gitExtension.activate()).getAPI(1);

  if (git.repositories.length === 0) {
    vscode.window.showErrorMessage('No Git repository found.');
    return null;
  }

  const activeEditor = vscode.window.activeTextEditor;
  if (activeEditor) {
    const activeRepo = git.getRepository(activeEditor.document.uri);
    if (activeRepo) {
      return activeRepo;
    }
  }

  if (git.repositories.length === 1) {
    return git.repositories[0];
  }

  const selected = await vscode.window.showQuickPick(
    git.repositories.map((repository) => ({
      label: repository.rootUri.fsPath,
      repository,
    })),
    { placeHolder: 'Select a Git repository' }
  );

  return selected?.repository || null;
}

export function collectStageablePaths(state: RepositoryState): string[] {
  const paths = new Set<string>();

  for (const change of state.workingTreeChanges) {
    paths.add(change.uri.fsPath);
  }

  for (const change of state.untrackedChanges) {
    paths.add(change.uri.fsPath);
  }

  return [...paths];
}
