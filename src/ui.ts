import { normalizeCommitMessage } from './prompt';
import { t } from './i18n';

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

/**
 * Preview text for the SCM input while streaming.
 * Prefer a lightly normalized form so fences/emphasis do not flash;
 * fall back to raw buffer when normalize would empty a partial stream.
 */
export function previewStreamText(buffered: string): string {
  const normalized = normalizeCommitMessage(buffered);
  return normalized || buffered;
}

/**
 * Streams LLM chunks into the SCM input box for live preview.
 * Progress notifications keep a static title — do not mirror commit text there
 * (noisy for sighted users and poor for screen readers).
 */
export function createStreamingSink(
  _progress: ProgressReporter,
  inputBox?: InputBoxLike,
  _reportIntervalMs = DEFAULT_REPORT_INTERVAL_MS,
  _now = () => Date.now()
): StreamingSink {
  let buffered = '';

  return {
    get buffered() {
      return buffered;
    },
    push(chunk: string) {
      buffered += chunk;
      if (inputBox) {
        inputBox.value = previewStreamText(buffered);
      }
    },
    flush() {
      // Progress title already covers status; SCM holds the preview.
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

/**
 * Lightweight sanity check for a pasted API key, used as the input-box
 * validator. Catches obvious paste mistakes (stray inner whitespace, an
 * implausibly short value) with a clear message; empty values pass so
 * callers can treat them as cancel.
 */
export function validateApiKeyInput(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }
  if (/\s/.test(trimmed)) {
    return t('keyContainsWhitespace');
  }
  if (trimmed.length < 16) {
    return t('keyLooksInvalid');
  }
  return undefined;
}

/**
 * Restores a previously captured intent into the SCM input box when generation
 * did not produce a usable message. Only restores when the input box is still
 * empty, so a successfully generated message is never clobbered by a later error.
 */
export function restoreIntent(inputBox: { value: string } | undefined, intent: string): void {
  if (!inputBox) {
    return;
  }
  if (inputBox.value.trim() === '' && intent) {
    inputBox.value = intent;
  }
}

/**
 * Force-restores the pre-generation intent after cancel or empty generation.
 * Stream previews often leave a partial message in the input box; those must
 * be cleared even when the original intent was empty.
 */
export function restoreIntentOnAbort(
  inputBox: { value: string } | undefined,
  intent: string
): void {
  if (!inputBox) {
    return;
  }
  inputBox.value = intent;
}
