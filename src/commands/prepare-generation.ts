import * as vscode from 'vscode';
import {
  type ExtensionConfig,
  type Repository,
  DEFAULT_MAX_DIFF_CHARS,
  DEFAULT_MAX_UNTRACKED_FILES,
} from '../types';
import { collectStageablePaths } from '../git';
import { getOptimizedDiff } from '../diff';
import { planDiffSource } from '../flow/diff-source';
import { readStagedSnapshot } from '../git-staged-snapshot';
import type { StagedSnapshot } from '../staged-snapshot';
import { logInfo } from '../log';
import { t } from '../i18n';
import { LONG_STATUS_MESSAGE_TIMEOUT_MS, showStatusMessage } from '../status';

const WORKING_TREE_DISMISSED_KEY = 'wtfCommit.workingTreeReminderDismissed';
const MIXED_STAGE_TIPPED_KEY = 'wtfCommit.mixedStageTipShown';

export interface PreparedGeneration {
  diff: string;
  intent: string;
  stagedSnapshot?: StagedSnapshot;
  /** Unstaged / untracked files left out of a staged-only generate (for post-commit tip). */
  remainingUnstagedCount: number;
}

export async function prepareGeneration(
  context: vscode.ExtensionContext,
  config: ExtensionConfig,
  repository: Repository
): Promise<PreparedGeneration | undefined> {
  let hasStaged = repository.state.indexChanges.length > 0;
  const hasWorkingTree = repository.state.workingTreeChanges.length > 0
    || repository.state.untrackedChanges.length > 0;
  const plan = planDiffSource({
    hasStaged,
    hasWorkingTree,
    autoCommit: config.autoCommit,
    workingTreeReminderDismissed: Boolean(context.globalState.get(WORKING_TREE_DISMISSED_KEY)),
  });

  let useWorkingTreeDiff = false;
  let remainingUnstagedCount = 0;
  switch (plan.action) {
    case 'abort_no_changes':
      showStatusMessage(`$(circle-slash) ${t('noChangesDetected')}`, LONG_STATUS_MESSAGE_TIMEOUT_MS);
      return undefined;
    case 'use_staged_mixed':
      remainingUnstagedCount = repository.state.workingTreeChanges.length
        + repository.state.untrackedChanges.length;
      if (!context.globalState.get<boolean>(MIXED_STAGE_TIPPED_KEY)) {
        showStatusMessage(`$(info) ${t('mixedStageStatusTip')}`, LONG_STATUS_MESSAGE_TIMEOUT_MS);
        await context.globalState.update(MIXED_STAGE_TIPPED_KEY, true);
      }
      break;
    case 'auto_stage_working_tree': {
      const stagePaths = collectStageablePaths(repository.state);
      if (stagePaths.length === 0) {
        throw new Error(t('noStageableChanges'));
      }
      await repository.add(stagePaths);
      hasStaged = true;
      break;
    }
    case 'confirm_working_tree':
      if (!await confirmWorkingTree(context)) {
        return undefined;
      }
      useWorkingTreeDiff = true;
      break;
    case 'use_working_tree':
      useWorkingTreeDiff = true;
      break;
    case 'use_staged':
      break;
  }

  const diffUsesStaged = hasStaged && !useWorkingTreeDiff;
  if (diffUsesStaged && remainingUnstagedCount === 0) {
    remainingUnstagedCount = repository.state.workingTreeChanges.length
      + repository.state.untrackedChanges.length;
  }
  const stagedSnapshot = config.autoCommit && diffUsesStaged
    ? await readStagedSnapshot(repository.rootUri.fsPath)
    : undefined;
  const result = await getOptimizedDiff(
    repository,
    diffUsesStaged,
    config.ignorePaths,
    { maxDiffChars: DEFAULT_MAX_DIFF_CHARS, maxUntrackedFiles: DEFAULT_MAX_UNTRACKED_FILES }
  );
  if (!result.diff.trim()) {
    showStatusMessage(`$(circle-slash) ${t('noDiffContent')}`, LONG_STATUS_MESSAGE_TIMEOUT_MS);
    return undefined;
  }
  if (result.truncated) {
    logInfo(`Diff truncated before sending to AI (length exceeded ${DEFAULT_MAX_DIFF_CHARS} chars).`);
    showStatusMessage(`$(warning) ${t('diffTruncatedStatusTip')}`, LONG_STATUS_MESSAGE_TIMEOUT_MS);
  }
  if (result.untrackedFilesOmitted > 0) {
    logInfo(
      `Omitted ${result.untrackedFilesOmitted} untracked file(s) (cap: ${result.untrackedFileCap}).`
    );
  }
  return {
    diff: result.diff,
    intent: repository.inputBox.value.trim(),
    stagedSnapshot,
    remainingUnstagedCount: diffUsesStaged ? remainingUnstagedCount : 0,
  };
}

async function confirmWorkingTree(context: vscode.ExtensionContext): Promise<boolean> {
  if (context.globalState.get<boolean>(WORKING_TREE_DISMISSED_KEY)) {
    return true;
  }
  const useLabel = t('useWorkingTreeChanges');
  const dontRemindLabel = t('dontRemindMe');
  const openScmLabel = t('openSourceControl');
  const action = await vscode.window.showWarningMessage(
    t('workingTreeOnlyWarning'),
    useLabel,
    dontRemindLabel,
    openScmLabel,
    t('cancel')
  );
  if (action === dontRemindLabel) {
    await context.globalState.update(WORKING_TREE_DISMISSED_KEY, true);
    return true;
  }
  if (action === openScmLabel) {
    await vscode.commands.executeCommand('workbench.view.scm');
    return false;
  }
  return action === useLabel;
}
