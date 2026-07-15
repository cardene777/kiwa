import type { WebhookVerifier, IncomingWebhook, WebhookVerifyOutcome } from './client.js';

export interface RetryOptions {
  maxAttempts?: number;
  initialDelayMs?: number;
  backoffMultiplier?: number;
  onRetry?: (attempt: number, reason: string) => void;
}

export interface RetryVerifyResult extends WebhookVerifyOutcome {
  attempts: number;
}

/** verify with exponential backoff (transient signature failure retry)。 */
export async function verifyWithRetry(
  verifier: WebhookVerifier,
  incoming: IncomingWebhook,
  options: RetryOptions = {},
): Promise<RetryVerifyResult> {
  const maxAttempts = options.maxAttempts ?? 3;
  const initialDelay = options.initialDelayMs ?? 100;
  const multiplier = options.backoffMultiplier ?? 2;
  let last: WebhookVerifyOutcome | null = null;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    last = verifier.verify(incoming);
    if (last.status === 'verified') return { ...last, attempts: attempt };
    if (attempt < maxAttempts) {
      options.onRetry?.(attempt, last.reason ?? 'unknown');
      await new Promise((r) => setTimeout(r, initialDelay * multiplier ** (attempt - 1)));
    }
  }
  return { ...(last as WebhookVerifyOutcome), attempts: maxAttempts };
}
