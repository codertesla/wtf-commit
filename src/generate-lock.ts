/**
 * Single-flight lock for commit-message generation.
 * A second trigger while a run is active is rejected (no cancel-previous).
 */
export interface GenerateLock {
  /** Returns false if another run is already active. */
  tryAcquire(): boolean;
  release(): void;
  isHeld(): boolean;
}

export function createGenerateLock(): GenerateLock {
  let held = false;

  return {
    tryAcquire() {
      if (held) {
        return false;
      }
      held = true;
      return true;
    },
    release() {
      held = false;
    },
    isHeld() {
      return held;
    },
  };
}

/** Release the active run before dispatching an optional retry. */
export function finishGenerateRun(
  lock: GenerateLock,
  retryRequested: boolean,
  retry: () => void
): void {
  lock.release();
  if (retryRequested) {
    retry();
  }
}

/** Process-wide lock shared by the generate command. */
export const generateLock = createGenerateLock();
