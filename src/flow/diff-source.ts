/**
 * Pure planner for which git diff source the generate flow should use.
 * UI tips are left to the caller; this only decides the next step.
 *
 * Smart Stage is always on: Auto Commit stages the working tree when needed;
 * review-only mode can generate from the working tree after a confirm.
 */

export type DiffSourcePlan =
  | { action: 'abort_no_changes' }
  | { action: 'use_staged' }
  | { action: 'use_staged_mixed' }
  | { action: 'auto_stage_working_tree' }
  | { action: 'confirm_working_tree' }
  | { action: 'use_working_tree' };

export interface DiffSourceInput {
  hasStaged: boolean;
  hasWorkingTree: boolean;
  autoCommit: boolean;
  /** User chose "Don't Remind Me" on working-tree-only generation (non-autoCommit). */
  workingTreeReminderDismissed: boolean;
}

/**
 * Decide how generate should obtain the diff.
 *
 * Rules:
 * - Staged present (optionally with unstaged): prefer staged only (mixed is non-blocking).
 * - Working tree only + Auto Commit: stage then use index.
 * - Working tree only + non-AutoCommit: confirm (or use after dismiss).
 */
export function planDiffSource(input: DiffSourceInput): DiffSourcePlan {
  const { hasStaged, hasWorkingTree, autoCommit } = input;

  if (!hasStaged && !hasWorkingTree) {
    return { action: 'abort_no_changes' };
  }

  if (hasStaged && hasWorkingTree) {
    return { action: 'use_staged_mixed' };
  }

  if (hasStaged) {
    return { action: 'use_staged' };
  }

  // Working tree only.
  if (autoCommit) {
    return { action: 'auto_stage_working_tree' };
  }

  if (input.workingTreeReminderDismissed) {
    return { action: 'use_working_tree' };
  }
  return { action: 'confirm_working_tree' };
}
