import type { PaymentAdapter, PaymentWebhookEvent } from '../types.js';
import { providerEventName, type AxisStep } from './types.js';

/**
 * Webhook idempotency advanced axis — dedup key + replay protection +
 * signature rotation + poison queue. Real payment webhooks routinely
 * duplicate (retry storms, at-least-once delivery), replay attackers can
 * capture and resubmit a valid signed body inside the tolerance window,
 * providers rotate signing secrets during incident response, and
 * repeatedly failing handlers need to be sidelined into a poison queue
 * so successful traffic isn't blocked.
 */
export type WebhookState =
  | 'idle'
  | 'dedup-hit'
  | 'replay-blocked'
  | 'rotated'
  | 'poisoned';

export interface WebhookIdempotencyConfig {
  /** ms window for dedup lookups (event ids older than this are pruned) */
  dedupWindowMs?: number;
  /** max redelivery attempts before poison-queue */
  maxDeliveryAttempts?: number;
  /** ms window for replay protection (timestamp tolerance) */
  replayToleranceMs?: number;
}

export interface WebhookIdempotencySession {
  handlerName: string;
  config: Required<WebhookIdempotencyConfig>;
  seenIds: Map<string, number>;
  signatureVersion: number;
  deliveryFailures: Map<string, number>;
  state: WebhookState;
  history: AxisStep<WebhookState>[];
}

const WEBHOOK_DEFAULTS: Required<WebhookIdempotencyConfig> = {
  dedupWindowMs: 24 * 60 * 60 * 1000,
  maxDeliveryAttempts: 5,
  replayToleranceMs: 5 * 60 * 1000,
};

/**
 * Start an idempotency session tied to a specific handler. Handler names
 * scope the dedup table so different handlers can process the same event
 * without interference.
 */
export function startIdempotency(input: {
  handlerName: string;
  config?: WebhookIdempotencyConfig;
}): WebhookIdempotencySession {
  return {
    handlerName: input.handlerName,
    config: { ...WEBHOOK_DEFAULTS, ...(input.config ?? {}) },
    seenIds: new Map(),
    signatureVersion: 1,
    deliveryFailures: new Map(),
    state: 'idle',
    history: [],
  };
}

/**
 * Attempt to deliver an event to the handler. Returns true if the caller
 * should invoke the handler; false if the event was deduped, replay-blocked,
 * or already poisoned.
 */
export async function deliver(
  adapter: PaymentAdapter,
  session: WebhookIdempotencySession,
  event: PaymentWebhookEvent,
): Promise<{ deliver: boolean; step: AxisStep<WebhookState> }> {
  pruneSeen(session);
  const dedupKey = `${session.handlerName}:${event.id}`;
  const now = Date.now();
  // Dedup — already-seen event id inside window.
  if (session.seenIds.has(dedupKey)) {
    session.state = 'dedup-hit';
    const step = await emitStep(adapter, session, event, 'webhook.dedup_hit', {
      dedupKey,
    });
    return { deliver: false, step };
  }
  // Replay — timestamp outside tolerance window.
  if (Math.abs(now - event.timestamp) > session.config.replayToleranceMs) {
    session.state = 'replay-blocked';
    const step = await emitStep(adapter, session, event, 'webhook.replay_blocked', {
      dedupKey,
      timestampSkewMs: now - event.timestamp,
    });
    return { deliver: false, step };
  }
  // Poison — failed too many times.
  const failures = session.deliveryFailures.get(dedupKey) ?? 0;
  if (failures >= session.config.maxDeliveryAttempts) {
    session.state = 'poisoned';
    const step = await emitStep(adapter, session, event, 'webhook.poison_queued', {
      dedupKey,
      failureCount: failures,
    });
    return { deliver: false, step };
  }
  session.seenIds.set(dedupKey, now);
  session.state = 'idle';
  const step: AxisStep<WebhookState> = {
    neutralEvent: 'webhook.dedup_hit',
    providerEvent: providerEventName(adapter.provider, 'webhook.dedup_hit'),
    state: 'idle',
    amountCents: event.amountCents,
    metadata: {
      dedupKey,
      firstSeen: true,
    },
  };
  session.history.push(step);
  return { deliver: true, step };
}

/**
 * Report handler failure — bumps the failure counter and eventually
 * transitions to poison state.
 */
export function reportFailure(
  session: WebhookIdempotencySession,
  event: PaymentWebhookEvent,
): number {
  const dedupKey = `${session.handlerName}:${event.id}`;
  const current = (session.deliveryFailures.get(dedupKey) ?? 0) + 1;
  session.deliveryFailures.set(dedupKey, current);
  return current;
}

/**
 * Rotate the signing secret. Emits `webhook.signature_rotated` so
 * downstream consumers know to refresh their cached secret.
 */
export async function rotateSignature(
  adapter: PaymentAdapter,
  session: WebhookIdempotencySession,
): Promise<AxisStep<WebhookState>> {
  session.signatureVersion += 1;
  session.state = 'rotated';
  const providerEvent = providerEventName(adapter.provider, 'webhook.signature_rotated');
  const { event } = adapter.signWebhook({
    type: providerEvent,
    amountCents: 0,
    customerId: 'system',
  });
  await adapter.emit(event);
  const step: AxisStep<WebhookState> = {
    neutralEvent: 'webhook.signature_rotated',
    providerEvent,
    state: 'rotated',
    amountCents: 0,
    metadata: {
      handlerName: session.handlerName,
      newVersion: session.signatureVersion,
    },
  };
  session.history.push(step);
  return step;
}

function pruneSeen(session: WebhookIdempotencySession): void {
  const cutoff = Date.now() - session.config.dedupWindowMs;
  for (const [id, seenAt] of session.seenIds) {
    if (seenAt < cutoff) session.seenIds.delete(id);
  }
}

async function emitStep(
  adapter: PaymentAdapter,
  session: WebhookIdempotencySession,
  event: PaymentWebhookEvent,
  neutral:
    | 'webhook.dedup_hit'
    | 'webhook.replay_blocked'
    | 'webhook.poison_queued',
  extra: Record<string, string | number | boolean>,
): Promise<AxisStep<WebhookState>> {
  const providerEvent = providerEventName(adapter.provider, neutral);
  // Emit a synthetic secondary event via adapter (raw HMAC signed).
  const { event: signalEvent } = adapter.signWebhook({
    type: providerEvent,
    amountCents: event.amountCents,
    currency: event.currency,
    customerId: event.customerId,
  });
  await adapter.emit(signalEvent);
  const step: AxisStep<WebhookState> = {
    neutralEvent: neutral,
    providerEvent,
    state: session.state,
    amountCents: event.amountCents,
    metadata: {
      handlerName: session.handlerName,
      eventId: event.id,
      ...extra,
    },
  };
  session.history.push(step);
  return step;
}
