import { describe, expect, it } from 'vitest';
import { createStripeMock } from '../../src/index.js';

/**
 * payment integration domain test — real Stripe mock で webhook sign /
 * verify workflow を end-to-end で assert する。
 */
describe('payment integration — Stripe mock webhook workflow', () => {
  it('T-INT-D-001 signWebhook + verifyWebhook round-trip', () => {
    const stripe = createStripeMock({ secret: 'test-secret' });
    const { rawBody, signature } = stripe.signWebhook({
      type: 'charge.succeeded',
      amountCents: 1000,
      customerId: 'cus_1',
    });
    const result = stripe.verifyWebhook({ rawBody, signature });
    expect(result.ok).toBe(true);
    expect(result.event?.customerId).toBe('cus_1');
  });

  it('T-INT-D-002 verifyWebhook で bad signature 検知', () => {
    const stripe = createStripeMock({ secret: 'test-secret' });
    const { rawBody } = stripe.signWebhook({
      type: 'charge.succeeded',
      amountCents: 1000,
      customerId: 'cus_2',
    });
    const result = stripe.verifyWebhook({ rawBody, signature: 'invalid' });
    expect(result.ok).toBe(false);
    expect(result.reason).toBe('bad-signature');
  });

  it('T-INT-D-003 onWebhook handler + emit で dispatch', async () => {
    const stripe = createStripeMock({ secret: 'test-secret' });
    const received: unknown[] = [];
    stripe.onWebhook((event) => {
      received.push(event);
    });
    const { event } = stripe.signWebhook({
      type: 'invoice.paid',
      amountCents: 500,
      customerId: 'cus_3',
    });
    await stripe.emit(event);
    expect(received.length).toBe(1);
  });

  it('T-INT-D-004 multiple handler dispatch', async () => {
    const stripe = createStripeMock({ secret: 'test-secret' });
    let count = 0;
    stripe.onWebhook(() => {
      count += 1;
    });
    stripe.onWebhook(() => {
      count += 1;
    });
    const { event } = stripe.signWebhook({
      type: 't',
      amountCents: 1,
      customerId: 'c',
    });
    await stripe.emit(event);
    expect(count).toBe(2);
  });

  it('T-INT-D-005 stale timestamp 検知', () => {
    const stripe = createStripeMock({
      secret: 's',
      toleranceMs: 1000,
      now: () => 10_000_000_000,
    });
    const { rawBody, signature } = stripe.signWebhook({
      type: 't',
      amountCents: 1,
      customerId: 'c',
      timestamp: 1_000_000, // 遠い過去
    });
    const result = stripe.verifyWebhook({ rawBody, signature });
    expect(result.ok).toBe(false);
    expect(result.reason).toBe('stale-timestamp');
  });
});
