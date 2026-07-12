import { describe, expect, it } from 'vitest';
import {
  createStripeMock,
  deliver,
  providerEventName,
  reportFailure,
  rotateSignature,
  startIdempotency,
  type PaymentAdapter,
  type PaymentWebhookEvent,
} from '../../src/index.js';

function makeEvent(overrides: Partial<PaymentWebhookEvent> = {}): PaymentWebhookEvent {
  return {
    provider: overrides.provider ?? 'stripe',
    id: overrides.id ?? 'evt_1',
    type: overrides.type ?? 'payment.processed',
    amountCents: overrides.amountCents ?? 1000,
    currency: overrides.currency ?? 'USD',
    timestamp: overrides.timestamp ?? Date.now(),
    customerId: overrides.customerId ?? 'cus',
    raw: overrides.raw ?? 'raw_synth',
  };
}

async function signAndSample(adapter: PaymentAdapter): Promise<PaymentWebhookEvent> {
  const { event } = adapter.signWebhook({
    type: 'payment.processed',
    amountCents: 500,
    customerId: 'cus',
  });
  return event;
}

describe('Webhook idempotency — defensive branch closure', () => {
  it('startIdempotency uses default config when none provided', () => {
    const session = startIdempotency({ handlerName: 'h1' });
    expect(session.config.dedupWindowMs).toBe(24 * 60 * 60 * 1000);
    expect(session.config.maxDeliveryAttempts).toBe(5);
    expect(session.config.replayToleranceMs).toBe(5 * 60 * 1000);
    expect(session.state).toBe('idle');
    expect(session.signatureVersion).toBe(1);
  });

  it('startIdempotency merges partial config with defaults', () => {
    const session = startIdempotency({
      handlerName: 'h2',
      config: { maxDeliveryAttempts: 3 },
    });
    expect(session.config.maxDeliveryAttempts).toBe(3);
    expect(session.config.dedupWindowMs).toBe(24 * 60 * 60 * 1000);
  });

  it('first delivery succeeds and marks seen', async () => {
    const adapter = createStripeMock();
    const session = startIdempotency({ handlerName: 'h' });
    const event = await signAndSample(adapter);
    const r = await deliver(adapter, session, event);
    expect(r.deliver).toBe(true);
    expect(r.step.metadata.firstSeen).toBe(true);
    expect(session.seenIds.has(`h:${event.id}`)).toBe(true);
  });

  it('second delivery of same event id is deduped', async () => {
    const adapter = createStripeMock();
    const session = startIdempotency({ handlerName: 'h' });
    const event = await signAndSample(adapter);
    await deliver(adapter, session, event);
    const r = await deliver(adapter, session, event);
    expect(r.deliver).toBe(false);
    expect(session.state).toBe('dedup-hit');
    expect(r.step.neutralEvent).toBe('webhook.dedup_hit');
  });

  it('replay blocked when timestamp skew (past) exceeds tolerance', async () => {
    const adapter = createStripeMock();
    const session = startIdempotency({ handlerName: 'h', config: { replayToleranceMs: 1000 } });
    const event = makeEvent({ id: 'evt_replay_past', timestamp: Date.now() - 60_000 });
    const r = await deliver(adapter, session, event);
    expect(r.deliver).toBe(false);
    expect(session.state).toBe('replay-blocked');
    expect(r.step.neutralEvent).toBe('webhook.replay_blocked');
    expect(Number(r.step.metadata.timestampSkewMs)).toBeGreaterThan(0);
  });

  it('replay blocked when timestamp skew (future) exceeds tolerance', async () => {
    const adapter = createStripeMock();
    const session = startIdempotency({ handlerName: 'h', config: { replayToleranceMs: 1000 } });
    const event = makeEvent({ id: 'evt_replay_future', timestamp: Date.now() + 60_000 });
    const r = await deliver(adapter, session, event);
    expect(r.deliver).toBe(false);
    expect(session.state).toBe('replay-blocked');
    expect(Number(r.step.metadata.timestampSkewMs)).toBeLessThan(0);
  });

  it('poisoned when failure count exceeds max attempts', async () => {
    const adapter = createStripeMock();
    const session = startIdempotency({ handlerName: 'h', config: { maxDeliveryAttempts: 2 } });
    const event = makeEvent({ id: 'evt_poison' });
    reportFailure(session, event);
    reportFailure(session, event);
    const r = await deliver(adapter, session, event);
    expect(r.deliver).toBe(false);
    expect(session.state).toBe('poisoned');
    expect(r.step.neutralEvent).toBe('webhook.poison_queued');
    expect(r.step.metadata.failureCount).toBe(2);
  });

  it('reportFailure increments failure count', () => {
    const session = startIdempotency({ handlerName: 'h' });
    const event = makeEvent({ id: 'evt_f' });
    expect(reportFailure(session, event)).toBe(1);
    expect(reportFailure(session, event)).toBe(2);
    expect(reportFailure(session, event)).toBe(3);
  });

  it('rotateSignature increments version and emits rotated event', async () => {
    const adapter = createStripeMock();
    const received: string[] = [];
    adapter.onWebhook((e) => { received.push(e.type); });
    const session = startIdempotency({ handlerName: 'h' });
    const step1 = await rotateSignature(adapter, session);
    expect(session.signatureVersion).toBe(2);
    expect(step1.metadata.newVersion).toBe(2);
    await rotateSignature(adapter, session);
    expect(session.signatureVersion).toBe(3);
    expect(received.every((t) => t === providerEventName(adapter.provider, 'webhook.signature_rotated'))).toBe(true);
  });

  it('pruneSeen removes ids older than dedup window', async () => {
    const adapter = createStripeMock();
    const session = startIdempotency({ handlerName: 'h', config: { dedupWindowMs: 1000 } });
    session.seenIds.set('h:old_evt', Date.now() - 60_000);
    const fresh = makeEvent({ id: 'fresh_evt' });
    await deliver(adapter, session, fresh);
    expect(session.seenIds.has('h:old_evt')).toBe(false);
    expect(session.seenIds.has('h:fresh_evt')).toBe(true);
  });

  it('different handlers scope dedup independently', async () => {
    const adapter = createStripeMock();
    const s1 = startIdempotency({ handlerName: 'ha' });
    const s2 = startIdempotency({ handlerName: 'hb' });
    const event = makeEvent({ id: 'evt_shared' });
    const r1 = await deliver(adapter, s1, event);
    const r2 = await deliver(adapter, s2, event);
    expect(r1.deliver).toBe(true);
    expect(r2.deliver).toBe(true);
  });

  it('deliver propagates currency from event to emitStep webhook', async () => {
    const adapter = createStripeMock();
    const received: Array<{ type: string; currency?: string }> = [];
    adapter.onWebhook((e) => { received.push({ type: e.type, currency: e.currency }); });
    const session = startIdempotency({ handlerName: 'h' });
    const event = makeEvent({ id: 'evt_cur', currency: 'GBP' });
    await deliver(adapter, session, event);
    await deliver(adapter, session, event);
    const dedupEvent = received.find(
      (r) => r.type === providerEventName(adapter.provider, 'webhook.dedup_hit'),
    );
    expect(dedupEvent?.currency).toBe('GBP');
  });

  it('history captures dedup and replay steps in order', async () => {
    const adapter = createStripeMock();
    const session = startIdempotency({ handlerName: 'h', config: { replayToleranceMs: 1000 } });
    const fresh = makeEvent({ id: 'evt_ok' });
    await deliver(adapter, session, fresh);
    await deliver(adapter, session, fresh);
    const replay = makeEvent({ id: 'evt_stale', timestamp: Date.now() - 60_000 });
    await deliver(adapter, session, replay);
    const events = session.history.map((h) => h.neutralEvent);
    expect(events).toContain('webhook.dedup_hit');
    expect(events).toContain('webhook.replay_blocked');
  });
});
