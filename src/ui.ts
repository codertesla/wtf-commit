export interface ProgressReporter {
  report(value: { message?: string; increment?: number }): void;
}

export interface InputBoxLike {
  value: string;
}

export interface StreamingSink {
  push(chunk: string): void;
  flush(): void;
  /** Current buffered content (mainly for tests). */
  readonly buffered: string;
}

const DEFAULT_REPORT_INTERVAL_MS = 100;

export function createStreamingSink(
  progress: ProgressReporter,
  inputBox?: InputBoxLike,
  reportIntervalMs = DEFAULT_REPORT_INTERVAL_MS,
  now = () => Date.now()
): StreamingSink {
  let buffered = '';
  let lastReportAt: number | undefined;

  return {
    get buffered() {
      return buffered;
    },
    push(chunk: string) {
      buffered += chunk;
      if (inputBox) {
        inputBox.value = buffered;
      }
      const current = now();
      if (lastReportAt === undefined || current - lastReportAt >= reportIntervalMs) {
        lastReportAt = current;
        progress.report({ message: buffered.slice(-60) });
      }
    },
    flush() {
      if (buffered) {
        progress.report({ message: buffered.slice(-60) });
      }
    },
  };
}

/**
 * Returns a masked representation of an API key for display in pickers/logs,
 * e.g. `sk-1abc••••wxyz`. Short keys collapse to `••••`.
 */
export function maskApiKey(apiKey: string): string {
  if (apiKey.length <= 8) {
    return '••••';
  }
  return `${apiKey.slice(0, 4)}••••${apiKey.slice(-4)}`;
}
