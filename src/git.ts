import * as vscode from 'vscode';
import * as path from 'node:path';
import { type GitExtension, type Repository, type RepositoryState } from './types';
import { t } from './i18n';

const LAST_REPO_STATE_KEY = 'wtfCommit.lastRepoPath';

function getActiveRepositoryState(contextLike: { globalState: { get<T>(key: string): T | undefined } }): string | undefined {
  return contextLike.globalState.get<string>(LAST_REPO_STATE_KEY);
}

export async function resolveRepository(context?: vscode.ExtensionContext): Promise<Repository | null> {
  const gitExtension = vscode.extensions.getExtension<GitExtension>('vscode.git');
  if (!gitExtension) {
    vscode.window.showErrorMessage(t('gitExtensionMissing'));
    return null;
  }

  const git = gitExtension.isActive
    ? gitExtension.exports.getAPI(1)
    : (await gitExtension.activate()).getAPI(1);

  if (git.repositories.length === 0) {
    vscode.window.showErrorMessage(t('noGitRepo'));
    return null;
  }

  const activeEditor = vscode.window.activeTextEditor;
  if (activeEditor) {
    const activeRepo = git.getRepository(activeEditor.document.uri);
    if (activeRepo) {
      await rememberRepository(context, activeRepo.rootUri.fsPath);
      return activeRepo;
    }
  }

  if (git.repositories.length === 1) {
    const repo = git.repositories[0];
    await rememberRepository(context, repo.rootUri.fsPath);
    return repo;
  }

  // Multiple repositories: prefer the last-used one if it still exists.
  const lastPath = context ? getActiveRepositoryState(context) : undefined;
  if (lastPath) {
    const remembered = git.repositories.find((repo) => repo.rootUri.fsPath === lastPath);
    if (remembered) {
      return remembered;
    }
  }

  const selected = await vscode.window.showQuickPick(
    git.repositories.map((repository) => ({
      label: path.basename(repository.rootUri.fsPath),
      description: repository.rootUri.fsPath,
      repository,
    })),
    {
      placeHolder: t('selectRepoPlaceholder'),
      title: t('repoPickerTitle'),
    }
  );

  if (selected) {
    await rememberRepository(context, selected.repository.rootUri.fsPath);
  }

  return selected?.repository || null;
}

async function rememberRepository(context: vscode.ExtensionContext | undefined, fsPath: string): Promise<void> {
  if (!context) {
    return;
  }
  await context.globalState.update(LAST_REPO_STATE_KEY, fsPath);
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
