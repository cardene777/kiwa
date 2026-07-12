import { describe, expect, it } from 'vitest';
import {
  cancelSubscription,
  changePlan,
  createLemonSqueezyMock,
  createPaddleMock,
  createStripeMock,
  createSubscription,
  pauseSubscription,
  reactivateSubscription,
  resumeSubscription,
} from '../../src/index.js';

describe('subscription-lifecycle defensive — createSubscription currency variants', () => {
  it('createSubscription without currency leaves subscription.currency unset', async () => {
    const adapter = createStripeMock();
    const { subscription } = await createSubscription(adapter, {
      customerId: 'c',
      planId: 'p',
      amountCents: 100,
    });
    expect(subscription.currency).toBeUndefined();
  });

  it('createSubscription with currency populates subscription.currency', async () => {
    const adapter = createPaddleMock();
    const { subscription } = await createSubscription(adapter, {
      customerId: 'c',
      planId: 'p',
      amountCents: 100,
      currency: 'gbp',
    });
    expect(subscription.currency).toBe('gbp');
  });
});

describe('subscription-lifecycle defensive — changePlan edge branches', () => {
  it('rejects changePlan on paused subscription (must resume first)', async () => {
    const adapter = createStripeMock();
    const { subscription } = await createSubscription(adapter, {
      customerId: 'c',
      planId: 'p',
      amountCents: 100,
    });
    await pauseSubscription(adapter, subscription);
    await expect(
      changePlan(adapter, subscription, { newPlanId: 'x', newAmountCents: 200 }),
    ).rejects.toThrow(/paused, resume first/);
  });

  it('changePlan without currency does not include currency in emit', async () => {
    const adapter = createLemonSqueezyMock();
    const { subscription } = await createSubscription(adapter, {
      customerId: 'c',
      planId: 'p',
      amountCents: 100,
    });
    const step = await changePlan(adapter, subscription, {
      newPlanId: 'x',
      newAmountCents: 200,
    });
    expect(step.metadata.isUpgrade).toBe(true);
    expect(subscription.currency).toBeUndefined();
  });

  it('changePlan with currency propagates currency through emit', async () => {
    const adapter = createStripeMock();
    const received: string[] = [];
    adapter.onWebhook((e) => { received.push(e.type); });
    const { subscription } = await createSubscription(adapter, {
      customerId: 'c',
      planId: 'p',
      amountCents: 100,
      currency: 'jpy',
    });
    await changePlan(adapter, subscription, { newPlanId: 'x', newAmountCents: 500 });
    expect(subscription.currency).toBe('jpy');
    expect(received.length).toBe(2);
  });
});

describe('subscription-lifecycle defensive — pauseSubscription edge branches', () => {
  it('rejects pause on already-paused subscription', async () => {
    const adapter = createStripeMock();
    const { subscription } = await createSubscription(adapter, {
      customerId: 'c',
      planId: 'p',
      amountCents: 100,
    });
    await pauseSubscription(adapter, subscription);
    await expect(pauseSubscription(adapter, subscription)).rejects.toThrow(/paused/);
  });

  it('rejects pause on canceled subscription', async () => {
    const adapter = createPaddleMock();
    const { subscription } = await createSubscription(adapter, {
      customerId: 'c',
      planId: 'p',
      amountCents: 100,
    });
    await cancelSubscription(adapter, subscription);
    await expect(pauseSubscription(adapter, subscription)).rejects.toThrow(/canceled/);
  });

  it('pauseSubscription with currency emits with currency', async () => {
    const adapter = createStripeMock();
    const { subscription } = await createSubscription(adapter, {
      customerId: 'c',
      planId: 'p',
      amountCents: 500,
      currency: 'eur',
    });
    const step = await pauseSubscription(adapter, subscription);
    expect(step.state).toBe('paused');
    expect(step.amountCents).toBe(0);
  });
});

describe('subscription-lifecycle defensive — resumeSubscription edge branches', () => {
  it('rejects resume on canceled subscription', async () => {
    const adapter = createStripeMock();
    const { subscription } = await createSubscription(adapter, {
      customerId: 'c',
      planId: 'p',
      amountCents: 100,
    });
    await cancelSubscription(adapter, subscription);
    await expect(resumeSubscription(adapter, subscription)).rejects.toThrow(/canceled/);
  });

  it('resumeSubscription with currency retains currency after resume', async () => {
    const adapter = createPaddleMock();
    const { subscription } = await createSubscription(adapter, {
      customerId: 'c',
      planId: 'p',
      amountCents: 100,
      currency: 'krw',
    });
    await pauseSubscription(adapter, subscription);
    const step = await resumeSubscription(adapter, subscription);
    expect(step.state).toBe('active');
    expect(subscription.currency).toBe('krw');
  });
});

describe('subscription-lifecycle defensive — resumeSubscription without currency branch', () => {
  it('resumeSubscription without currency emits without currency field', async () => {
    const adapter = createStripeMock();
    const { subscription } = await createSubscription(adapter, {
      customerId: 'c',
      planId: 'p',
      amountCents: 100,
    });
    await pauseSubscription(adapter, subscription);
    const step = await resumeSubscription(adapter, subscription);
    expect(step.state).toBe('active');
    expect(subscription.currency).toBeUndefined();
  });
});

describe('subscription-lifecycle defensive — cancelSubscription edge branches', () => {
  it('cancelSubscription with currency emits with currency', async () => {
    const adapter = createStripeMock();
    const received: string[] = [];
    adapter.onWebhook((e) => { received.push(e.type); });
    const { subscription } = await createSubscription(adapter, {
      customerId: 'c',
      planId: 'p',
      amountCents: 100,
      currency: 'inr',
    });
    const step = await cancelSubscription(adapter, subscription);
    expect(step.state).toBe('canceled');
    expect(received[1]).toBeDefined();
  });

  it('cancel from paused state is allowed', async () => {
    const adapter = createStripeMock();
    const { subscription } = await createSubscription(adapter, {
      customerId: 'c',
      planId: 'p',
      amountCents: 100,
    });
    await pauseSubscription(adapter, subscription);
    const step = await cancelSubscription(adapter, subscription);
    expect(step.state).toBe('canceled');
    expect(subscription.state).toBe('canceled');
  });
});

describe('subscription-lifecycle defensive — reactivateSubscription edge branches', () => {
  it('rejects reactivate on paused subscription', async () => {
    const adapter = createStripeMock();
    const { subscription } = await createSubscription(adapter, {
      customerId: 'c',
      planId: 'p',
      amountCents: 100,
    });
    await pauseSubscription(adapter, subscription);
    await expect(reactivateSubscription(adapter, subscription)).rejects.toThrow(/paused/);
  });

  it('reactivateSubscription with currency retains currency after reactivation', async () => {
    const adapter = createPaddleMock();
    const { subscription } = await createSubscription(adapter, {
      customerId: 'c',
      planId: 'p',
      amountCents: 100,
      currency: 'brl',
    });
    await cancelSubscription(adapter, subscription);
    const step = await reactivateSubscription(adapter, subscription);
    expect(step.state).toBe('active');
    expect(subscription.currency).toBe('brl');
  });
});
