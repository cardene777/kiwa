import type { EmailClient, EmailMessage, EmailSendResult } from './client.js';

export interface RetryOptions {
  maxAttempts?: number;
  initialDelayMs?: number;
  backoffMultiplier?: number;
  maxDelayMs?: number;
  onRetry?: (attempt: number, lastError: string) => void;
}

export interface RetrySendResult extends EmailSendResult {
  attempts: number;
}

/**
 * send with exponential backoff。 failed status で retry、 maxAttempts 到達で最後の result を返す。
 * default = maxAttempts 3 / initialDelayMs 100 / backoffMultiplier 2 / maxDelayMs 5000。
 */
export async function sendWithRetry(
  client: EmailClient,
  msg: EmailMessage,
  options: RetryOptions = {},
): Promise<RetrySendResult> {
  const maxAttempts = options.maxAttempts ?? 3;
  const initialDelay = options.initialDelayMs ?? 100;
  const multiplier = options.backoffMultiplier ?? 2;
  const maxDelay = options.maxDelayMs ?? 5000;
  let last: EmailSendResult | null = null;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    last = await client.send(msg);
    if (last.status !== 'failed') return { ...last, attempts: attempt };
    if (attempt < maxAttempts) {
      options.onRetry?.(attempt, last.reason ?? 'unknown');
      const delay = Math.min(initialDelay * multiplier ** (attempt - 1), maxDelay);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  return { ...(last as EmailSendResult), attempts: maxAttempts };
}
