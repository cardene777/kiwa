import { describe, expect, it } from 'vitest';
import {
  applyProration,
  createLemonSqueezyMock,
  createPaddleMock,
  createStripeMock,
  enterGracePeriod,
  exitGracePeriod,
  stackCoupon,
  startSubscriptionMachine,
  type PaymentAdapter,
} from '../../src/index.js';

const providers: Array<{ name: string; make: () => PaymentAdapter }> = [
  { name: 'stripe', make: () => createStripeMock() },
  { name: 'paddle', make: () => createPaddleMock() },
  { name: 'lemonsqueezy', make: () => createLemonSqueezyMock() },
];

describe('subscription-state-machine axis — 3 provider', () => {
  it.each(providers)('$name: grace period lifecycle', async ({ make }) => {
    const adapter = make();
    const session = startSubscriptionMachine({
      subscriptionId: 'sub_1',
      customerId: 'cus_1',
      planPriceCents: 999,
    });
    const enter = await enterGracePeriod(adapter, session);
    expect(enter.neutralEvent).toBe('subscription.grace_period_entered');
    expect(session.state).toBe('grace-period');
    expect(enter.metadata.graceEndsAt).toBeGreaterThan(Date.now());
    const exit = await exitGracePeriod(adapter, session, { recovered: true });
    expect(exit.neutralEvent).toBe('subscription.grace_period_exited');
    expect(session.state).toBe('active');
  });

  it('exitGracePeriod expired terminal', async () => {
    const adapter = createStripeMock();
    const session = startSubscriptionMachine({
      subscriptionId: 'sub_2',
      customerId: 'cus_2',
      planPriceCents: 1999,
    });
    await enterGracePeriod(adapter, session);
    await exitGracePeriod(adapter, session, { recovered: false });
    expect(session.state).toBe('expired');
  });

  it('enterGracePeriod rejects on non-active session', async () => {
    const adapter = createPaddleMock();
    const session = startSubscriptionMachine({
      subscriptionId: 'sub_3',
      customerId: 'cus_3',
      planPriceCents: 500,
    });
    await enterGracePeriod(adapter, session);
    await expect(enterGracePeriod(adapter, session)).rejects.toThrow(/must be active/);
  });

  it('applyProration computes delta correctly', async () => {
    const adapter = createStripeMock();
    const session = startSubscriptionMachine({
      subscriptionId: 'sub_4',
      customerId: 'cus_4',
      planPriceCents: 3000,
    });
    const step = await applyProration(adapter, session, {
      daysElapsed: 15,
      daysInCycle: 30,
      newPlanPriceCents: 5000,
    });
    expect(step.neutralEvent).toBe('subscription.proration_applied');
    // 15 days remain: old = 1500, new = 2500 → delta = +1000
    expect(step.metadata.prorationDeltaCents).toBe(1000);
    expect(session.currentCyclePriceCents).toBe(5000);
  });

  it('applyProration rejects invalid daysInCycle', async () => {
    const adapter = createLemonSqueezyMock();
    const session = startSubscriptionMachine({
      subscriptionId: 'sub_5',
      customerId: 'cus_5',
      planPriceCents: 100,
    });
    await expect(
      applyProration(adapter, session, {
        daysElapsed: 1,
        daysInCycle: 0,
        newPlanPriceCents: 100,
      }),
    ).rejects.toThrow(/daysInCycle must be positive/);
  });

  it('stackCoupon combines stackable coupons', async () => {
    const adapter = createStripeMock();
    const session = startSubscriptionMachine({
      subscriptionId: 'sub_6',
      customerId: 'cus_6',
      planPriceCents: 10_000,
    });
    const first = await stackCoupon(adapter, session, {
      code: 'SAVE10',
      percentOff: 10,
      stackable: true,
    });
    expect(first.metadata.totalPercentOff).toBe(10);
    const second = await stackCoupon(adapter, session, {
      code: 'SAVE20',
      percentOff: 20,
      stackable: true,
    });
    expect(second.metadata.totalPercentOff).toBe(30);
    expect(second.metadata.discountedCents).toBe(7000);
    expect(session.coupons).toHaveLength(2);
  });

  it('stackCoupon caps total percent off at 100', async () => {
    const adapter = createPaddleMock();
    const session = startSubscriptionMachine({
      subscriptionId: 'sub_7',
      customerId: 'cus_7',
      planPriceCents: 500,
    });
    await stackCoupon(adapter, session, { code: 'A', percentOff: 60, stackable: true });
    const step = await stackCoupon(adapter, session, {
      code: 'B',
      percentOff: 60,
      stackable: true,
    });
    expect(step.metadata.totalPercentOff).toBe(100);
    expect(step.metadata.discountedCents).toBe(0);
  });

  it('non-stackable coupon replaces existing stack', async () => {
    const adapter = createLemonSqueezyMock();
    const session = startSubscriptionMachine({
      subscriptionId: 'sub_8',
      customerId: 'cus_8',
      planPriceCents: 1000,
    });
    await stackCoupon(adapter, session, { code: 'A', percentOff: 10, stackable: true });
    await stackCoupon(adapter, session, { code: 'B', percentOff: 30, stackable: false });
    expect(session.coupons).toHaveLength(1);
    expect(session.coupons[0]?.code).toBe('B');
  });
});
