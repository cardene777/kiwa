import { describe, expect, it } from 'vitest';
import {
  createLemonSqueezyMock,
  createPaddleMock,
  createStripeMock,
  denyByPolicy,
  fullRefund,
  markWindowExpired,
  partialRefund,
  preventChargeback,
  startRefund,
  type PaymentAdapter,
} from '../../src/index.js';

const providers: Array<{ name: string; make: () => PaymentAdapter }> = [
  { name: 'stripe', make: () => createStripeMock() },
  { name: 'paddle', make: () => createPaddleMock() },
  { name: 'lemonsqueezy', make: () => createLemonSqueezyMock() },
];

describe('refund-advanced axis — 3 provider', () => {
  it.each(providers)('$name: partial refund tracks remaining amount', async ({ make }) => {
    const adapter = make();
    const session = startRefund({
      chargeId: 'ch_1',
      originalAmountCents: 10_000,
      chargedAt: Date.now(),
      customerId: 'cus_1',
      policy: { windowMs: 30 * 24 * 60 * 60 * 1000 },
    });
    const step = await partialRefund(adapter, session, { amountCents: 3000 });
    expect(step.neutralEvent).toBe('refund.partial');
    expect(step.metadata.remainingCents).toBe(7000);
    const second = await partialRefund(adapter, session, { amountCents: 2000 });
    expect(second.metadata.refundedTotalCents).toBe(5000);
    expect(session.state).toBe('partial-issued');
  });

  it.each(providers)('$name: full refund transitions to full-issued', async ({ make }) => {
    const adapter = make();
    const session = startRefund({
      chargeId: 'ch_2',
      originalAmountCents: 5000,
      chargedAt: Date.now(),
      customerId: 'cus_2',
      policy: { windowMs: 30 * 24 * 60 * 60 * 1000 },
    });
    const step = await fullRefund(adapter, session);
    expect(step.neutralEvent).toBe('refund.full');
    expect(step.metadata.remainingCents).toBe(0);
    expect(session.state).toBe('full-issued');
  });

  it('partialRefund rejects when window expired', async () => {
    const adapter = createStripeMock();
    const session = startRefund({
      chargeId: 'ch_3',
      originalAmountCents: 1000,
      chargedAt: Date.now() - 10 * 24 * 60 * 60 * 1000, // 10 days ago
      customerId: 'cus_3',
      policy: { windowMs: 24 * 60 * 60 * 1000 }, // 1 day window
    });
    await expect(partialRefund(adapter, session, { amountCents: 100 })).rejects.toThrow(
      /window has expired/,
    );
  });

  it('partialRefund rejects when amount exceeds original', async () => {
    const adapter = createPaddleMock();
    const session = startRefund({
      chargeId: 'ch_4',
      originalAmountCents: 500,
      chargedAt: Date.now(),
      customerId: 'cus_4',
      policy: { windowMs: 30 * 24 * 60 * 60 * 1000 },
    });
    await expect(partialRefund(adapter, session, { amountCents: 1000 })).rejects.toThrow(
      /exceeds/,
    );
  });

  it('partialRefund rejects when amount below min policy', async () => {
    const adapter = createStripeMock();
    const session = startRefund({
      chargeId: 'ch_5',
      originalAmountCents: 500,
      chargedAt: Date.now(),
      customerId: 'cus_5',
      policy: { windowMs: 30 * 24 * 60 * 60 * 1000, minAmountCents: 100 },
    });
    await expect(partialRefund(adapter, session, { amountCents: 50 })).rejects.toThrow(
      /minAmountCents/,
    );
  });

  it('denyByPolicy emits policy_denied', async () => {
    const adapter = createStripeMock();
    const session = startRefund({
      chargeId: 'ch_6',
      originalAmountCents: 100,
      chargedAt: Date.now(),
      customerId: 'cus_6',
      policy: { windowMs: 24 * 60 * 60 * 1000 },
    });
    const step = await denyByPolicy(adapter, session);
    expect(step.neutralEvent).toBe('refund.policy_denied');
    expect(session.state).toBe('policy-denied');
  });

  it('markWindowExpired emits window_expired', async () => {
    const adapter = createPaddleMock();
    const session = startRefund({
      chargeId: 'ch_7',
      originalAmountCents: 200,
      chargedAt: Date.now(),
      customerId: 'cus_7',
      policy: { windowMs: 1 },
    });
    const step = await markWindowExpired(adapter, session);
    expect(step.neutralEvent).toBe('refund.window_expired');
    expect(session.state).toBe('window-expired');
  });

  it('preventChargeback issues a full refund when policy allows', async () => {
    const adapter = createLemonSqueezyMock();
    const session = startRefund({
      chargeId: 'ch_8',
      originalAmountCents: 2500,
      chargedAt: Date.now(),
      customerId: 'cus_8',
      policy: { windowMs: 30 * 24 * 60 * 60 * 1000, chargebackPrevention: true },
    });
    const step = await preventChargeback(adapter, session);
    expect(step.neutralEvent).toBe('refund.full');
    expect(session.state).toBe('full-issued');
  });

  it('preventChargeback rejects when disabled', async () => {
    const adapter = createStripeMock();
    const session = startRefund({
      chargeId: 'ch_9',
      originalAmountCents: 100,
      chargedAt: Date.now(),
      customerId: 'cus_9',
      policy: { windowMs: 30 * 24 * 60 * 60 * 1000 },
    });
    await expect(preventChargeback(adapter, session)).rejects.toThrow(/disabled/);
  });
});
