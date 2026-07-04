import { describe, expect, it } from 'vitest';
import {
  createLemonSqueezyMock,
  createPaddleMock,
  createStripeMock,
  retryBackoffMs,
  retryDeliver,
  startRetry,
  type PaymentAdapter,
} from '../../src/index.js';

const providers: Array<{ name: string; make: () => PaymentAdapter }> = [
  { name: 'stripe', make: () => createStripeMock() },
  { name: 'paddle', make: () => createPaddleMock() },
  { name: 'lemonsqueezy', make: () => createLemonSqueezyMock() },
];

describe('retry axis — 3 provider', () => {
  it.each(providers)('$name: first attempt success terminates in delivered', async ({ make }) => {
    const adapter = make();
    const { event } = adapter.signWebhook({ type: 't', amountCents: 100, customerId: 'c' });
    const received: string[] = [];
    adapter.onWebhook((e) => {
      received.push(e.id);
    });
    const session = startRetry({ event });
    const step = await retryDeliver(adapter, session, { succeed: true });
    expect(step.state).toBe('delivered');
    expect(step.metadata.attempts).toBe(1);
    expect(received).toEqual([event.id]);
  });

  it.each(providers)(
    '$name: exhausts after maxAttempts failed deliveries',
    async ({ make }) => {
      const adapter = make();
      const { event } = adapter.signWebhook({ type: 't', amountCents: 1, customerId: 'c' });
      const session = startRetry({ event, config: { maxAttempts: 2, baseBackoffMs: 100 } });
      const first = await retryDeliver(adapter, session, { succeed: false });
      expect(first.state).toBe('scheduled');
      expect(first.metadata.attempts).toBe(1);
      const second = await retryDeliver(adapter, session, { succeed: false });
      expect(second.state).toBe('abandoned');
      expect(second.metadata.attempts).toBe(2);
    },
  );

  it('backoff schedule is deterministic', () => {
    // baseBackoffMs = 1000 → attempt 1: 0, 2: 1000, 3: 2000, 4: 4000, 5: 8000
    expect(retryBackoffMs(1, 1000)).toBe(0);
    expect(retryBackoffMs(2, 1000)).toBe(1000);
    expect(retryBackoffMs(3, 1000)).toBe(2000);
    expect(retryBackoffMs(4, 1000)).toBe(4000);
    expect(retryBackoffMs(5, 1000)).toBe(8000);
  });

  it('idempotency key defaults to event.id but overridable', async () => {
    const adapter = createStripeMock();
    const { event } = adapter.signWebhook({ type: 't', amountCents: 1, customerId: 'c' });
    const defaulted = startRetry({ event });
    expect(defaulted.idempotencyKey).toBe(event.id);
    const custom = startRetry({ event, idempotencyKey: 'idem_xyz' });
    expect(custom.idempotencyKey).toBe('idem_xyz');
  });

  it('rejects deliver after termination', async () => {
    const adapter = createPaddleMock();
    const { event } = adapter.signWebhook({ type: 't', amountCents: 1, customerId: 'c' });
    const session = startRetry({ event });
    await retryDeliver(adapter, session, { succeed: true });
    await expect(retryDeliver(adapter, session, { succeed: true })).rejects.toThrow(/delivered/);
  });

  it('scheduled step exposes nextBackoffMs matching schedule', async () => {
    const adapter = createLemonSqueezyMock();
    const { event } = adapter.signWebhook({ type: 't', amountCents: 1, customerId: 'c' });
    const session = startRetry({ event, config: { maxAttempts: 4, baseBackoffMs: 100 } });
    const first = await retryDeliver(adapter, session, { succeed: false });
    // attempt now = 1, next attempt = 2 → backoff = 100
    expect(first.metadata.nextBackoffMs).toBe(100);
    const second = await retryDeliver(adapter, session, { succeed: false });
    // attempt now = 2, next attempt = 3 → backoff = 200
    expect(second.metadata.nextBackoffMs).toBe(200);
  });
});
