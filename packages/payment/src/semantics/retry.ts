import type { PaymentAdapter, PaymentWebhookEvent } from '../types.js';
import { providerEventName, type AxisStep } from './types.js';

/**
 * Webhook delivery retry semantics. All 3 real providers retry undelivered
 * webhooks with exponential backoff until a configured max attempt count
 * (Stripe = 3 days at increasing intervals, Paddle = 3 attempts at 5s / 5m /
 * 10m, Lemon Squeezy = up to 3 attempts). The mock reproduces the observable
 * envelope: an idempotency key per event, backoff schedule, and a max-attempt
 * abandon terminal state.
 */
export type RetryState = 'scheduled' | 'delivered' | 'abandoned';

export interface RetryConfig {
  maxAttempts?: number;
  /** milliseconds between attempt N and N+1 = baseBackoffMs * 2^(N-1) */
  baseBackoffMs?: number;
}

export interface RetrySession {
  idempotencyKey: string;
  event: PaymentWebhookEvent;
  attempt: number;
  state: RetryState;
  config: Required<RetryConfig>;
  history: AxisStep<RetryState>[];
}

const RETRY_DEFAULTS: Required<RetryConfig> = {
  maxAttempts: 3,
  baseBackoffMs: 5 * 1000,
};

/**
 * Compute the deterministic delay for attempt N (1-indexed). Attempt 1 has
 * no backoff (fires immediately), attempt N > 1 waits baseBackoffMs * 2^(N-2).
 */
export function retryBackoffMs(attempt: number, baseBackoffMs: number): number {
  if (attempt <= 1) return 0;
  return baseBackoffMs * 2 ** (attempt - 2);
}

/**
 * Start a retry session for a given webhook event. The event is not emitted
 * yet — call {@link retryDeliver} with `succeed: true` to emit and mark
 * delivered, or `succeed: false` to schedule the next backoff. The
 * idempotencyKey defaults to `event.id` so downstream consumers can dedupe
 * repeated deliveries of the same event.
 */
export function startRetry(input: {
  event: PaymentWebhookEvent;
  idempotencyKey?: string;
  config?: RetryConfig;
}): RetrySession {
  return {
    idempotencyKey: input.idempotencyKey ?? input.event.id,
    event: input.event,
    attempt: 0,
    state: 'scheduled',
    config: { ...RETRY_DEFAULTS, ...(input.config ?? {}) },
    history: [],
  };
}

/**
 * Attempt to deliver the event. If `succeed: true` the event is emitted
 * through the adapter and the session terminates in `delivered`. If
 * `succeed: false` and attempts remain, emits `retry.scheduled` and returns
 * with the next delay. Once maxAttempts is reached without success, the
 * session terminates in `abandoned`.
 */
export async function retryDeliver(
  adapter: PaymentAdapter,
  session: RetrySession,
  input: { succeed: boolean },
): Promise<AxisStep<RetryState>> {
  if (session.state !== 'scheduled') {
    throw new Error(`retryDeliver: session is ${session.state}`);
  }
  session.attempt += 1;
  if (input.succeed) {
    await adapter.emit(session.event);
    session.state = 'delivered';
    const step: AxisStep<RetryState> = {
      neutralEvent: 'retry.delivered',
      providerEvent: providerEventName(adapter.provider, 'retry.delivered'),
      state: 'delivered',
      amountCents: session.event.amountCents,
      metadata: {
        idempotencyKey: session.idempotencyKey,
        attempts: session.attempt,
      },
    };
    session.history.push(step);
    return step;
  }
  const noMoreAttempts = session.attempt >= session.config.maxAttempts;
  if (noMoreAttempts) {
    session.state = 'abandoned';
    const step: AxisStep<RetryState> = {
      neutralEvent: 'retry.abandoned',
      providerEvent: providerEventName(adapter.provider, 'retry.abandoned'),
      state: 'abandoned',
      amountCents: session.event.amountCents,
      metadata: {
        idempotencyKey: session.idempotencyKey,
        attempts: session.attempt,
      },
    };
    session.history.push(step);
    return step;
  }
  const nextBackoff = retryBackoffMs(session.attempt + 1, session.config.baseBackoffMs);
  const step: AxisStep<RetryState> = {
    neutralEvent: 'retry.scheduled',
    providerEvent: providerEventName(adapter.provider, 'retry.scheduled'),
    state: 'scheduled',
    amountCents: session.event.amountCents,
    metadata: {
      idempotencyKey: session.idempotencyKey,
      attempts: session.attempt,
      nextBackoffMs: nextBackoff,
      remainingAttempts: session.config.maxAttempts - session.attempt,
    },
  };
  session.history.push(step);
  return step;
}
