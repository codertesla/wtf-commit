import { t } from './i18n';
import { DEFAULT_TIMEOUT_MS, type RequestFailure } from './types';

/** Localized toast text for LLM failures (log channel still uses English error.message). */
export function formatRequestFailureMessage(error: RequestFailure): string {
  switch (error.code) {
    case 'auth':
      return t('authFailed', { status: String(error.status ?? '') });
    case 'rate_limit':
      if (error.retryAfterMs !== undefined) {
        return t('rateLimitWithRetry', { seconds: Math.ceil(error.retryAfterMs / 1000) });
      }
      return t('rateLimit');
    case 'timeout':
      return t('requestTimedOut', {
        seconds: error.timeoutSeconds ?? Math.round(DEFAULT_TIMEOUT_MS / 1000),
      });
    case 'network':
      return t('networkFailed', { detail: error.detail || error.message });
    case 'invalid_response':
      return t('invalidApiResponse', { message: error.message });
    case 'api':
      if (error.detail === 'unavailable') {
        return t('serviceUnavailable', { status: String(error.status ?? '') });
      }
      return t('apiRequestFailed', {
        status: String(error.status ?? ''),
        detail: error.detail || error.message,
      });
    default:
      return error.message;
  }
}
