/**
 * Pure planner for which git diff source the generate flow should use.
 * UI confirmation is left to the caller; this only decides the next step.
 */

export type DiffSourcePlan =
  | { action: 'abort_no_changes' }
  | { action: 'use_staged' }
  | { action: 'confirm_mixed_then_staged' }
  | { action: 'auto_stage_working_tree' }
  | { action: 'confirm_working_tree' }
  | { action: 'use_working_tree' }
  | { action: 'abort_no_staged' };

export interface DiffSourceInput {
  hasStaged: boolean;
  hasWorkingTree: boolean;
  autoCommit: boolean;
  smartStage: boolean;
  /** User chose "Don't Remind Me" on mixed staged/unstaged warning. */
  mixedStageReminderDismissed: boolean;
  /** User chose "Don't Remind Me" on working-tree-only generation (non-autoCommit). */
  workingTreeReminderDismissed: boolean;
}

/**
 * Decide how generate should obtain the diff.
 *
 * Rules:
 * - Staged present (optionally with unstaged): prefer staged only.
 * - Working tree only + Auto Commit + Smart Stage: stage then use index.
 * - Working tree only + Smart Stage off: abort (must stage manually).
 * - Working tree only + non-AutoCommit + Smart Stage: confirm (or use after dismiss).
 */
export function planDiffSource(input: DiffSourceInput): DiffSourcePlan {
  const { hasStaged, hasWorkingTree, autoCommit, smartStage } = input;

  if (!hasStaged && !hasWorkingTree) {
    return { action: 'abort_no_changes' };
  }

  if (hasStaged && hasWorkingTree) {
    if (input.mixedStageReminderDismissed) {
      return { action: 'use_staged' };
    }
    return { action: 'confirm_mixed_then_staged' };
  }

  if (hasStaged) {
    return { action: 'use_staged' };
  }

  // Working tree only.
  if (autoCommit && smartStage) {
    return { action: 'auto_stage_working_tree' };
  }

  if (!smartStage) {
    return { action: 'abort_no_staged' };
  }

  // Non-autoCommit (or autoCommit without smartStage already handled): working tree with smartStage.
  if (input.workingTreeReminderDismissed) {
    return { action: 'use_working_tree' };
  }
  return { action: 'confirm_working_tree' };
}
