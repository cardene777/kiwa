import { describe, expect, it } from 'vitest';
import {
  cancelSubscription,
  changePlan,
  createLemonSqueezyMock,
  createPaddleMock,
  createStripeMock,
  createSubscription,
  pauseSubscription,
  providerEventName,
  reactivateSubscription,
  resumeSubscription,
  type PaymentAdapter,
} from '../../src/index.js';

const providers: Array<{ name: string; make: () => PaymentAdapter }> = [
  { name: 'stripe', make: () => createStripeMock() },
  { name: 'paddle', make: () => createPaddleMock() },
  { name: 'lemonsqueezy', make: () => createLemonSqueezyMock() },
];

describe('subscription-lifecycle axis — 3 provider', () => {
  it.each(providers)('$name: create → upgrade → cancel → reactivate', async ({ make }) => {
    const adapter = make();
    const received: string[] = [];
    adapter.onWebhook((e) => {
      received.push(e.type);
    });
    const { subscription } = await createSubscription(adapter, {
      customerId: 'cus_1',
      planId: 'basic',
      amountCents: 1000,
    });
    const upgrade = await changePlan(adapter, subscription, {
      newPlanId: 'pro',
      newAmountCents: 3000,
    });
    expect(upgrade.state).toBe('upgraded');
    expect(subscription.planId).toBe('pro');
    const canceled = await cancelSubscription(adapter, subscription);
    expect(canceled.state).toBe('canceled');
    const reactivated = await reactivateSubscription(adapter, subscription);
    expect(reactivated.state).toBe('active');
    expect(received).toEqual([
      providerEventName(adapter.provider, 'subscription.created'),
      providerEventName(adapter.provider, 'subscription.upgraded'),
      providerEventName(adapter.provider, 'subscription.canceled'),
      providerEventName(adapter.provider, 'subscription.reactivated'),
    ]);
  });

  it.each(providers)('$name: pause → resume returns to active', async ({ make }) => {
    const adapter = make();
    const { subscription } = await createSubscription(adapter, {
      customerId: 'cus_2',
      planId: 'p',
      amountCents: 2000,
      currency: 'eur',
    });
    const paused = await pauseSubscription(adapter, subscription);
    expect(paused.state).toBe('paused');
    const resumed = await resumeSubscription(adapter, subscription);
    expect(resumed.state).toBe('active');
    expect(resumed.amountCents).toBe(2000);
  });

  it('downgrade sets state to downgraded', async () => {
    const adapter = createStripeMock();
    const { subscription } = await createSubscription(adapter, {
      customerId: 'c',
      planId: 'pro',
      amountCents: 5000,
    });
    const step = await changePlan(adapter, subscription, {
      newPlanId: 'basic',
      newAmountCents: 1000,
    });
    expect(step.state).toBe('downgraded');
    expect(step.metadata.isUpgrade).toBe(false);
    expect(step.metadata.previousAmountCents).toBe(5000);
  });

  it('rejects same-amount plan change as no-op', async () => {
    const adapter = createPaddleMock();
    const { subscription } = await createSubscription(adapter, {
      customerId: 'c',
      planId: 'p1',
      amountCents: 2000,
    });
    await expect(
      changePlan(adapter, subscription, { newPlanId: 'p2', newAmountCents: 2000 }),
    ).rejects.toThrow(/no-op/);
  });

  it('rejects changePlan on canceled subscription', async () => {
    const adapter = createLemonSqueezyMock();
    const { subscription } = await createSubscription(adapter, {
      customerId: 'c',
      planId: 'p',
      amountCents: 100,
    });
    await cancelSubscription(adapter, subscription);
    await expect(
      changePlan(adapter, subscription, { newPlanId: 'x', newAmountCents: 200 }),
    ).rejects.toThrow(/canceled/);
  });

  it('rejects double cancel', async () => {
    const adapter = createStripeMock();
    const { subscription } = await createSubscription(adapter, {
      customerId: 'c',
      planId: 'p',
      amountCents: 100,
    });
    await cancelSubscription(adapter, subscription);
    await expect(cancelSubscription(adapter, subscription)).rejects.toThrow(/already/);
  });

  it('rejects resume when not paused', async () => {
    const adapter = createStripeMock();
    const { subscription } = await createSubscription(adapter, {
      customerId: 'c',
      planId: 'p',
      amountCents: 100,
    });
    await expect(resumeSubscription(adapter, subscription)).rejects.toThrow(/active/);
  });

  it('rejects reactivate when active', async () => {
    const adapter = createStripeMock();
    const { subscription } = await createSubscription(adapter, {
      customerId: 'c',
      planId: 'p',
      amountCents: 100,
    });
    await expect(reactivateSubscription(adapter, subscription)).rejects.toThrow(/active/);
  });
});
