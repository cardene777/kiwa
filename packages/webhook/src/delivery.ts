import type { NormalizedWebhookEvent } from './payload.js';

export interface DispatchRetryOptions {
  maxAttempts?: number;
  initialDelayMs?: number;
  backoffFactor?: number;
  sleep?: (ms: number) => Promise<void>;
}

export interface DispatchAttempt {
  attempt: number;
  ok: boolean;
  durationMs: number;
  error?: string;
}

export interface DispatchRetryResult {
  delivered: boolean;
  attempts: DispatchAttempt[];
  totalDurationMs: number;
}

/**
 * exponential backoff で handler を retry する delivery loop。 実 webhook subscriber
 * (Stripe / GitHub の redelivery loop) を再現するための test helper。 sleep は
 * injectable なので test では即 resolve で回せる。
 */
export async function dispatchWithRetry(
  handler: (event: NormalizedWebhookEvent) => Promise<void>,
  event: NormalizedWebhookEvent,
  options: DispatchRetryOptions = {},
): Promise<DispatchRetryResult> {
  const maxAttempts = options.maxAttempts ?? 3;
  const initialDelayMs = options.initialDelayMs ?? 100;
  const backoffFactor = options.backoffFactor ?? 2;
  const sleep = options.sleep ?? ((ms: number) => new Promise((r) => setTimeout(r, ms)));

  const attempts: DispatchAttempt[] = [];
  const startTotal = performance.now();
  let delay = initialDelayMs;

  for (let i = 1; i <= maxAttempts; i += 1) {
    const start = performance.now();
    try {
      await handler(event);
      const durationMs = performance.now() - start;
      attempts.push({ attempt: i, ok: true, durationMs });
      return { delivered: true, attempts, totalDurationMs: performance.now() - startTotal };
    } catch (e) {
      const durationMs = performance.now() - start;
      attempts.push({ attempt: i, ok: false, durationMs, error: (e as Error).message });
      if (i < maxAttempts) {
        await sleep(delay);
        delay *= backoffFactor;
      }
    }
  }
  return { delivered: false, attempts, totalDurationMs: performance.now() - startTotal };
}
