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

const MIXED_STAGE_DISMISSED_KEY = 'wtfCommit.mixedStageReminderDismissed';
const WORKING_TREE_DISMISSED_KEY = 'wtfCommit.workingTreeReminderDismissed';

export interface PreparedGeneration {
  diff: string;
  intent: string;
  stagedSnapshot?: StagedSnapshot;
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
    mixedStageReminderDismissed: Boolean(context.globalState.get(MIXED_STAGE_DISMISSED_KEY)),
    workingTreeReminderDismissed: Boolean(context.globalState.get(WORKING_TREE_DISMISSED_KEY)),
  });

  let useWorkingTreeDiff = false;
  switch (plan.action) {
    case 'abort_no_changes':
      showStatusMessage(`$(circle-slash) ${t('noChangesDetected')}`, LONG_STATUS_MESSAGE_TIMEOUT_MS);
      return undefined;
    case 'confirm_mixed_then_staged':
      if (!await confirmDiffSource(context, 'mixed')) {
        return undefined;
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
      if (!await confirmDiffSource(context, 'workingTree')) {
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
  };
}

async function confirmDiffSource(
  context: vscode.ExtensionContext,
  kind: 'mixed' | 'workingTree'
): Promise<boolean> {
  const isMixed = kind === 'mixed';
  const dismissedKey = isMixed ? MIXED_STAGE_DISMISSED_KEY : WORKING_TREE_DISMISSED_KEY;
  if (context.globalState.get<boolean>(dismissedKey)) {
    return true;
  }
  const useLabel = t(isMixed ? 'useStagedChanges' : 'useWorkingTreeChanges');
  const dontRemindLabel = t('dontRemindMe');
  const openScmLabel = t('openSourceControl');
  const action = await vscode.window.showWarningMessage(
    t(isMixed ? 'mixedStageWarning' : 'workingTreeOnlyWarning'),
    useLabel,
    dontRemindLabel,
    openScmLabel,
    t('cancel')
  );
  if (action === dontRemindLabel) {
    await context.globalState.update(dismissedKey, true);
    return true;
  }
  if (action === openScmLabel) {
    await vscode.commands.executeCommand('workbench.view.scm');
    return false;
  }
  return action === useLabel;
}
