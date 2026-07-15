import {
  findConventionalCommitIssues,
  normalizeCommitMessage,
  tryLocalConventionalRepair,
  type ConventionalCommitIssue,
} from '../prompt';
import { stagedSnapshotsEqual, type StagedSnapshot } from '../staged-snapshot';

export type GenerationWorkflowResult =
  | { status: 'empty' }
  | { status: 'cancelled'; message: string }
  | { status: 'message_ready'; message: string }
  | { status: 'snapshot_changed'; message: string }
  | { status: 'committed'; message: string };

export interface GenerationWorkflowInput {
  diff: string;
  intent: string;
  autoCommit: boolean;
  expectedSnapshot?: StagedSnapshot;
}

export interface GenerationWorkflowDependencies {
  generate(diff: string, intent: string): Promise<string | undefined>;
  resolveIssues(
    message: string,
    issues: ConventionalCommitIssue[]
  ): Promise<string | undefined>;
  setMessage(message: string): void;
  confirmCommit(message: string): Promise<boolean>;
  readSnapshot(): Promise<StagedSnapshot>;
  commit(message: string): Promise<void>;
  onLocalRepair?(): void;
}

/**
 * Core generation transaction. UI and provider details are injected so the
 * state transitions can be integration-tested without a VS Code process.
 */
export async function executeGenerationWorkflow(
  input: GenerationWorkflowInput,
  dependencies: GenerationWorkflowDependencies
): Promise<GenerationWorkflowResult> {
  const generated = await dependencies.generate(input.diff, input.intent);
  if (!generated) {
    return { status: 'empty' };
  }

  let message = normalizeCommitMessage(generated);
  if (!message) {
    return { status: 'empty' };
  }
  dependencies.setMessage(message);

  let issues = findConventionalCommitIssues(message);
  if (issues.length > 0) {
    const localRepair = tryLocalConventionalRepair(message);
    if (localRepair) {
      message = localRepair;
      dependencies.setMessage(message);
      dependencies.onLocalRepair?.();
      issues = findConventionalCommitIssues(message);
    }
  }

  if (issues.length > 0) {
    const resolved = await dependencies.resolveIssues(message, issues);
    if (!resolved) {
      return { status: 'cancelled', message };
    }
    message = normalizeCommitMessage(resolved);
    if (!message) {
      return { status: 'empty' };
    }
    dependencies.setMessage(message);
  }

  if (!input.autoCommit) {
    return { status: 'message_ready', message };
  }
  if (!input.expectedSnapshot) {
    throw new Error('A staged snapshot is required before automatic commit.');
  }
  if (!(await dependencies.confirmCommit(message))) {
    return { status: 'cancelled', message };
  }

  const currentSnapshot = await dependencies.readSnapshot();
  if (!stagedSnapshotsEqual(input.expectedSnapshot, currentSnapshot)) {
    return { status: 'snapshot_changed', message };
  }
  await dependencies.commit(message);
  return { status: 'committed', message };
}

