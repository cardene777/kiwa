import { describe, expect, it } from 'vitest';
import {
  applyProration,
  createStripeMock,
  enterGracePeriod,
  exitGracePeriod,
  stackCoupon,
  startSubscriptionMachine,
} from '../../src/index.js';

describe('subscription-state-machine defensive — startSubscriptionMachine currency variants', () => {
  it('startSubscriptionMachine with currency populates session.currency', () => {
    const s = startSubscriptionMachine({
      subscriptionId: 'sub_1',
      customerId: 'c',
      planPriceCents: 1000,
      currency: 'sgd',
    });
    expect(s.currency).toBe('sgd');
    expect(s.currentCyclePriceCents).toBe(1000);
    expect(s.gracePeriodMs).toBe(7 * 24 * 60 * 60 * 1000);
  });

  it('startSubscriptionMachine without currency leaves currency unset', () => {
    const s = startSubscriptionMachine({
      subscriptionId: 'sub_2',
      customerId: 'c',
      planPriceCents: 500,
    });
    expect(s.currency).toBeUndefined();
    expect(s.state).toBe('active');
  });

  it('startSubscriptionMachine with custom gracePeriodMs overrides default', () => {
    const s = startSubscriptionMachine({
      subscriptionId: 'sub_3',
      customerId: 'c',
      planPriceCents: 100,
      gracePeriodMs: 60_000,
    });
    expect(s.gracePeriodMs).toBe(60_000);
  });
});

describe('subscription-state-machine defensive — enterGracePeriod guards', () => {
  it('happy path from active state', async () => {
    const adapter = createStripeMock();
    const s = startSubscriptionMachine({
      subscriptionId: 'sub_g',
      customerId: 'c',
      planPriceCents: 100,
    });
    const step = await enterGracePeriod(adapter, s);
    expect(s.state).toBe('grace-period');
    expect(s.gracePeriodEnteredAt).not.toBeNull();
    expect(step.neutralEvent).toBe('subscription.grace_period_entered');
    expect(step.metadata.graceEndsAt).toBeGreaterThan(0);
  });

  it('rejects enterGracePeriod when session already in grace-period', async () => {
    const adapter = createStripeMock();
    const s = startSubscriptionMachine({
      subscriptionId: 'sub_g2',
      customerId: 'c',
      planPriceCents: 100,
    });
    await enterGracePeriod(adapter, s);
    await expect(enterGracePeriod(adapter, s)).rejects.toThrow(/must be active/);
  });
});

describe('subscription-state-machine defensive — exitGracePeriod paths', () => {
  it('recovered=true returns to active', async () => {
    const adapter = createStripeMock();
    const s = startSubscriptionMachine({
      subscriptionId: 'sub_er',
      customerId: 'c',
      planPriceCents: 100,
    });
    await enterGracePeriod(adapter, s);
    const step = await exitGracePeriod(adapter, s, { recovered: true });
    expect(s.state).toBe('active');
    expect(s.gracePeriodEnteredAt).toBeNull();
    expect(step.metadata.recovered).toBe(true);
  });

  it('recovered=false transitions to expired', async () => {
    const adapter = createStripeMock();
    const s = startSubscriptionMachine({
      subscriptionId: 'sub_ex',
      customerId: 'c',
      planPriceCents: 100,
    });
    await enterGracePeriod(adapter, s);
    const step = await exitGracePeriod(adapter, s, { recovered: false });
    expect(s.state).toBe('expired');
    expect(step.metadata.recovered).toBe(false);
  });

  it('rejects exitGracePeriod when not in grace-period', async () => {
    const adapter = createStripeMock();
    const s = startSubscriptionMachine({
      subscriptionId: 'sub_ne',
      customerId: 'c',
      planPriceCents: 100,
    });
    await expect(exitGracePeriod(adapter, s, { recovered: true })).rejects.toThrow(/session is active/);
  });
});

describe('subscription-state-machine defensive — applyProration paths', () => {
  it('rejects applyProration with non-positive daysInCycle', async () => {
    const adapter = createStripeMock();
    const s = startSubscriptionMachine({
      subscriptionId: 'sub_pr',
      customerId: 'c',
      planPriceCents: 3000,
    });
    await expect(
      applyProration(adapter, s, { daysElapsed: 5, daysInCycle: 0, newPlanPriceCents: 1000 }),
    ).rejects.toThrow(/positive/);
  });

  it('upgrade proration (delta positive)', async () => {
    const adapter = createStripeMock();
    const s = startSubscriptionMachine({
      subscriptionId: 'sub_up',
      customerId: 'c',
      planPriceCents: 1000,
    });
    const step = await applyProration(adapter, s, {
      daysElapsed: 10,
      daysInCycle: 30,
      newPlanPriceCents: 3000,
    });
    expect(step.metadata.prorationDeltaCents).toBeGreaterThan(0);
    expect(s.currentCyclePriceCents).toBe(3000);
  });

  it('downgrade proration (delta negative)', async () => {
    const adapter = createStripeMock();
    const s = startSubscriptionMachine({
      subscriptionId: 'sub_dn',
      customerId: 'c',
      planPriceCents: 3000,
    });
    const step = await applyProration(adapter, s, {
      daysElapsed: 10,
      daysInCycle: 30,
      newPlanPriceCents: 1000,
    });
    expect(step.metadata.prorationDeltaCents).toBeLessThan(0);
    expect(s.currentCyclePriceCents).toBe(1000);
  });

  it('applyProration with currency emits with currency', async () => {
    const adapter = createStripeMock();
    const s = startSubscriptionMachine({
      subscriptionId: 'sub_pc',
      customerId: 'c',
      planPriceCents: 1000,
      currency: 'aud',
    });
    const step = await applyProration(adapter, s, {
      daysElapsed: 15,
      daysInCycle: 30,
      newPlanPriceCents: 2000,
    });
    expect(step.amountCents).toBe(2000);
  });
});

describe('subscription-state-machine defensive — stackCoupon paths', () => {
  it('stackable=true combines with existing coupons', async () => {
    const adapter = createStripeMock();
    const s = startSubscriptionMachine({
      subscriptionId: 'sub_c1',
      customerId: 'c',
      planPriceCents: 1000,
    });
    await stackCoupon(adapter, s, { code: 'A', percentOff: 10, stackable: true });
    const step = await stackCoupon(adapter, s, { code: 'B', percentOff: 20, stackable: true });
    expect(s.coupons.length).toBe(2);
    expect(step.metadata.totalPercentOff).toBe(30);
    expect(step.metadata.stackSize).toBe(2);
  });

  it('stackable=undefined defaults to stackable behaviour', async () => {
    const adapter = createStripeMock();
    const s = startSubscriptionMachine({
      subscriptionId: 'sub_c2',
      customerId: 'c',
      planPriceCents: 1000,
    });
    await stackCoupon(adapter, s, { code: 'A', percentOff: 5 });
    const step = await stackCoupon(adapter, s, { code: 'B', percentOff: 10 });
    expect(s.coupons.length).toBe(2);
    expect(step.metadata.totalPercentOff).toBe(15);
  });

  it('stackable=false replaces all coupons', async () => {
    const adapter = createStripeMock();
    const s = startSubscriptionMachine({
      subscriptionId: 'sub_c3',
      customerId: 'c',
      planPriceCents: 1000,
    });
    await stackCoupon(adapter, s, { code: 'A', percentOff: 15, stackable: true });
    const step = await stackCoupon(adapter, s, {
      code: 'REPLACE',
      percentOff: 50,
      stackable: false,
    });
    expect(s.coupons.length).toBe(1);
    expect(s.coupons[0]?.code).toBe('REPLACE');
    expect(step.metadata.totalPercentOff).toBe(50);
  });

  it('stackable=false keeps prior non-stackable coupons (documents contract)', async () => {
    const adapter = createStripeMock();
    const s = startSubscriptionMachine({
      subscriptionId: 'sub_c4',
      customerId: 'c',
      planPriceCents: 1000,
    });
    await stackCoupon(adapter, s, { code: 'FIXED', percentOff: 25, stackable: false });
    const step = await stackCoupon(adapter, s, {
      code: 'SECOND-FIXED',
      percentOff: 20,
      stackable: false,
    });
    expect(s.coupons.length).toBe(1);
    expect(s.coupons[0]?.code).toBe('SECOND-FIXED');
    expect(step.metadata.totalPercentOff).toBe(20);
  });

  it('total percent capped at 100', async () => {
    const adapter = createStripeMock();
    const s = startSubscriptionMachine({
      subscriptionId: 'sub_c5',
      customerId: 'c',
      planPriceCents: 1000,
    });
    await stackCoupon(adapter, s, { code: 'A', percentOff: 60, stackable: true });
    const step = await stackCoupon(adapter, s, { code: 'B', percentOff: 60, stackable: true });
    expect(step.metadata.totalPercentOff).toBe(100);
    expect(step.metadata.discountedCents).toBe(0);
  });

  it('stackCoupon with currency emits with currency', async () => {
    const adapter = createStripeMock();
    const s = startSubscriptionMachine({
      subscriptionId: 'sub_c6',
      customerId: 'c',
      planPriceCents: 1000,
      currency: 'usd',
    });
    const step = await stackCoupon(adapter, s, {
      code: 'CUR',
      percentOff: 10,
      stackable: true,
    });
    expect(step.metadata.stackSize).toBe(1);
    expect(s.currency).toBe('usd');
  });
});
