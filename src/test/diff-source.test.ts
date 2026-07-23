import * as assert from 'node:assert';
import { describe, it } from 'mocha';
import { planDiffSource, type DiffSourceInput } from '../flow/diff-source';

function base(overrides: Partial<DiffSourceInput> = {}): DiffSourceInput {
  return {
    hasStaged: false,
    hasWorkingTree: false,
    autoCommit: false,
    mixedStageReminderDismissed: false,
    workingTreeReminderDismissed: false,
    ...overrides,
  };
}

describe('planDiffSource', () => {
  it('aborts when there are no changes', () => {
    assert.deepStrictEqual(planDiffSource(base()), { action: 'abort_no_changes' });
  });

  it('uses staged when only the index has changes', () => {
    assert.deepStrictEqual(
      planDiffSource(base({ hasStaged: true })),
      { action: 'use_staged' }
    );
  });

  it('asks to confirm mixed staged/unstaged unless dismissed', () => {
    assert.deepStrictEqual(
      planDiffSource(base({ hasStaged: true, hasWorkingTree: true })),
      { action: 'confirm_mixed_then_staged' }
    );
    assert.deepStrictEqual(
      planDiffSource(
        base({ hasStaged: true, hasWorkingTree: true, mixedStageReminderDismissed: true })
      ),
      { action: 'use_staged' }
    );
  });

  it('auto-stages working tree when Auto Commit is on', () => {
    assert.deepStrictEqual(
      planDiffSource(base({ hasWorkingTree: true, autoCommit: true })),
      { action: 'auto_stage_working_tree' }
    );
  });

  it('requires working-tree confirmation for non-autoCommit', () => {
    assert.deepStrictEqual(
      planDiffSource(base({ hasWorkingTree: true, autoCommit: false })),
      { action: 'confirm_working_tree' }
    );
    assert.deepStrictEqual(
      planDiffSource(
        base({
          hasWorkingTree: true,
          autoCommit: false,
          workingTreeReminderDismissed: true,
        })
      ),
      { action: 'use_working_tree' }
    );
  });
});
