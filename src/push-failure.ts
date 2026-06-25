import { getGitCommandError, getErrorMessage } from './prompt';

export type PushFailureKind =
  | 'push_succeeded_with_followup_warning'
  | 'push_may_have_succeeded'
  | 'push_failed';

export interface PushFailureClassification {
  kind: PushFailureKind;
  commandLabel: string;
  detail: string;
  needsUndoPrompt: boolean;
}

/**
 * Classifies a failure that occurred during/after an Auto Push, so the UI
 * layer can pick the right message and action without re-deriving the logic.
 *
 * The vscode.git API sometimes reports a *follow-up* git command failure
 * (e.g. a status refresh) after the push itself succeeded. When the failing
 * command is not `push`, we treat the push as likely-succeeded and let the
 * caller verify against the upstream before deciding how alarming to be.
 */
export function classifyPushFailure(
  error: unknown,
  pushVerified: boolean
): PushFailureClassification {
  const gitError = getGitCommandError(error);
  const command = gitError?.gitCommand;
  const commandLabel = command ? `git ${command}` : 'Git repository refresh';
  const detail = gitError?.stderr?.trim() || getErrorMessage(error);

  if (command && command !== 'push') {
    if (pushVerified) {
      return {
        kind: 'push_succeeded_with_followup_warning',
        commandLabel,
        detail,
        needsUndoPrompt: false,
      };
    }
    return {
      kind: 'push_may_have_succeeded',
      commandLabel,
      detail,
      needsUndoPrompt: false,
    };
  }

  return {
    kind: 'push_failed',
    commandLabel,
    detail,
    needsUndoPrompt: true,
  };
}

export function formatPushFailureMessage(classification: PushFailureClassification): string {
  switch (classification.kind) {
    case 'push_succeeded_with_followup_warning':
      return `Push succeeded, but ${classification.commandLabel} failed afterward: ${classification.detail}`;
    case 'push_may_have_succeeded':
      return `Push may have succeeded, but ${classification.commandLabel} failed afterward: ${classification.detail}`;
    case 'push_failed':
      return `Commit successful, but push failed: ${classification.detail}`;
  }
}
