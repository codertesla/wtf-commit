import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import * as vscode from 'vscode';
import type { Repository } from '../types';
import { getGitCommandError } from '../errors';
import { logError, logInfo } from '../log';
import { classifyPushFailure, formatPushFailureMessage } from '../push-failure';
import { t } from '../i18n';
import { LONG_STATUS_MESSAGE_TIMEOUT_MS, showStatusMessage } from '../status';

const execFileAsync = promisify(execFile);

export async function runAutoPush(
  repository: Repository,
  commitMessage: string,
  confirmBeforePush: boolean
): Promise<void> {
  if (confirmBeforePush) {
    const response = await vscode.window.showWarningMessage(
      t('pushNowConfirm'),
      { modal: true, detail: commitMessage },
      t('push'),
      t('cancel')
    );
    if (response !== t('push')) {
      showStatusMessage(`$(debug-pause) ${t('autoPushSkipped')}`, LONG_STATUS_MESSAGE_TIMEOUT_MS);
      return;
    }
  }

  try {
    const upstream = repository.state.upstream;
    const title = upstream
      ? `${t('pushingProgress')} (${upstream.remote}/${upstream.name})`
      : t('pushingProgress');
    await vscode.window.withProgress(
      { location: vscode.ProgressLocation.Notification, title },
      async () => repository.push()
    );
    showStatusMessage(
      upstream
        ? `$(cloud-upload) ${t('pushSuccessful')} (${upstream.remote}/${upstream.name})`
        : `$(cloud-upload) ${t('pushSuccessful')}`,
      LONG_STATUS_MESSAGE_TIMEOUT_MS
    );
  } catch (error) {
    await handlePushFailure(repository, error);
  }
}

async function handlePushFailure(repository: Repository, error: unknown): Promise<void> {
  logError('Push failed after commit', error);
  const command = getGitCommandError(error)?.gitCommand;
  const pushVerified = command && command !== 'push'
    ? await verifyUpstreamMatchesHead(repository.rootUri.fsPath)
    : false;
  const classification = classifyPushFailure(error, pushVerified);
  const message = formatPushFailureMessage(classification);

  if (classification.kind === 'push_succeeded_with_followup_warning') {
    logInfo(`Push verified after ${classification.commandLabel} failed; HEAD matches upstream.`);
    showStatusMessage(`$(cloud-upload) ${t('pushCompletedWithRefreshWarning')}`, LONG_STATUS_MESSAGE_TIMEOUT_MS);
    vscode.window.showWarningMessage(message);
    return;
  }
  if (classification.kind === 'push_may_have_succeeded') {
    vscode.window.showWarningMessage(message);
    return;
  }
  const undoLabel = t('undoCommit');
  if (await vscode.window.showErrorMessage(message, undoLabel) === undoLabel) {
    await vscode.commands.executeCommand('git.undoCommit');
  }
}

async function verifyUpstreamMatchesHead(repositoryPath: string): Promise<boolean> {
  const head = await runGitCommand(repositoryPath, ['rev-parse', 'HEAD']);
  const upstream = await runGitCommand(repositoryPath, ['rev-parse', '@{upstream}']);
  return Boolean(head && upstream && head === upstream);
}

async function runGitCommand(repositoryPath: string, args: string[]): Promise<string | undefined> {
  try {
    const { stdout } = await execFileAsync('git', args, {
      cwd: repositoryPath,
      encoding: 'utf8',
      windowsHide: true,
    });
    return stdout.trim();
  } catch (error) {
    logError(`Failed to run git ${args.join(' ')} during push verification`, error);
    return undefined;
  }
}

