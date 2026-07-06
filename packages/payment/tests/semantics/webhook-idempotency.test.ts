import { describe, expect, it } from 'vitest';
import {
  createLemonSqueezyMock,
  createPaddleMock,
  createStripeMock,
  deliver,
  reportFailure,
  rotateSignature,
  startIdempotency,
  type PaymentAdapter,
  type PaymentWebhookEvent,
} from '../../src/index.js';

const providers: Array<{ name: string; make: () => PaymentAdapter }> = [
  { name: 'stripe', make: () => createStripeMock() },
  { name: 'paddle', make: () => createPaddleMock() },
  { name: 'lemonsqueezy', make: () => createLemonSqueezyMock() },
];

function signEvent(adapter: PaymentAdapter, overrides?: Partial<PaymentWebhookEvent>): PaymentWebhookEvent {
  const { event } = adapter.signWebhook({
    type: 'test.event',
    amountCents: 100,
    customerId: 'cus_1',
    ...overrides,
  });
  return event;
}

describe('webhook idempotency advanced axis — 3 provider', () => {
  it.each(providers)('$name: first delivery is accepted, second is deduped', async ({ make }) => {
    const adapter = make();
    const session = startIdempotency({ handlerName: 'orders' });
    const event = signEvent(adapter);
    const first = await deliver(adapter, session, event);
    expect(first.deliver).toBe(true);
    const second = await deliver(adapter, session, event);
    expect(second.deliver).toBe(false);
    expect(second.step.neutralEvent).toBe('webhook.dedup_hit');
    expect(session.state).toBe('dedup-hit');
  });

  it('replay is blocked when timestamp is outside tolerance', async () => {
    const adapter = createStripeMock();
    const session = startIdempotency({
      handlerName: 'billing',
      config: { replayToleranceMs: 1000 },
    });
    const staleEvent = signEvent(adapter, { timestamp: Date.now() - 60_000 });
    const res = await deliver(adapter, session, staleEvent);
    expect(res.deliver).toBe(false);
    expect(res.step.neutralEvent).toBe('webhook.replay_blocked');
    expect(session.state).toBe('replay-blocked');
  });

  it('poison-queues after maxDeliveryAttempts failures', async () => {
    const adapter = createPaddleMock();
    const session = startIdempotency({
      handlerName: 'inventory',
      config: { maxDeliveryAttempts: 2 },
    });
    const event = signEvent(adapter);
    // First delivery — accepted (marked seen)
    await deliver(adapter, session, event);
    // Report failures
    reportFailure(session, event);
    reportFailure(session, event);
    // Third delivery lookup — dedup fires (already seen); but we need a new event
    // to test poison path. Craft a new event with same handler.
    const newEvent = signEvent(adapter);
    reportFailure(session, newEvent);
    reportFailure(session, newEvent);
    const res = await deliver(adapter, session, newEvent);
    expect(res.deliver).toBe(false);
    expect(res.step.neutralEvent).toBe('webhook.poison_queued');
  });

  it('rotateSignature bumps version and emits event', async () => {
    const adapter = createStripeMock();
    const session = startIdempotency({ handlerName: 'audit' });
    expect(session.signatureVersion).toBe(1);
    const step = await rotateSignature(adapter, session);
    expect(step.neutralEvent).toBe('webhook.signature_rotated');
    expect(session.signatureVersion).toBe(2);
    expect(session.state).toBe('rotated');
  });

  it('handler-scoped dedup: same event id under different handler is accepted', async () => {
    const adapter = createLemonSqueezyMock();
    const sessionA = startIdempotency({ handlerName: 'A' });
    const sessionB = startIdempotency({ handlerName: 'B' });
    const event = signEvent(adapter);
    const a = await deliver(adapter, sessionA, event);
    const b = await deliver(adapter, sessionB, event);
    expect(a.deliver).toBe(true);
    expect(b.deliver).toBe(true);
  });

  it('reportFailure returns incremented count', () => {
    const session = startIdempotency({ handlerName: 'metrics' });
    const adapter = createStripeMock();
    const event = signEvent(adapter);
    expect(reportFailure(session, event)).toBe(1);
    expect(reportFailure(session, event)).toBe(2);
    expect(reportFailure(session, event)).toBe(3);
  });
});
