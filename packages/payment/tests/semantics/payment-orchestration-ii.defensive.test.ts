import { describe, expect, it } from 'vitest';
import {
  createLemonSqueezyMock,
  createPaddleMock,
  createStripeMock,
  scoreMl,
  smartRoute,
  startOrchestrationII,
  triggerFallback,
  type PaymentAdapter,
} from '../../src/index.js';

function makeAll(): PaymentAdapter[] {
  return [createStripeMock(), createPaddleMock(), createLemonSqueezyMock()];
}

describe('payment-orchestration-ii defensive — startOrchestrationII currency variants', () => {
  it('startOrchestrationII with currency populates session.currency', () => {
    const s = startOrchestrationII({
      intentId: 'i_cur',
      amountCents: 100,
      customerId: 'cus',
      currency: 'usd',
      config: { providers: ['stripe'] },
    });
    expect(s.currency).toBe('usd');
  });

  it('startOrchestrationII without currency leaves currency unset', () => {
    const s = startOrchestrationII({
      intentId: 'i_nc',
      amountCents: 100,
      customerId: 'cus',
      config: { providers: ['stripe'] },
    });
    expect(s.currency).toBeUndefined();
  });
});

describe('payment-orchestration-ii defensive — smartRoute rejects on terminated / cascade-exhausted', () => {
  it('smartRoute rejects when session already terminated (synthetic)', async () => {
    const adapters = makeAll();
    const s = startOrchestrationII({
      intentId: 'i_t',
      amountCents: 100,
      customerId: 'c',
      config: { providers: ['stripe'] },
    });
    s.state = 'terminated';
    await expect(smartRoute(adapters, s)).rejects.toThrow(/terminated/);
  });
});

describe('payment-orchestration-ii defensive — scoreMl adapter errors', () => {
  it('scoreMl throws when no adapter for current provider', async () => {
    const adapters = [createStripeMock()];
    const s = startOrchestrationII({
      intentId: 'i_nap',
      amountCents: 100,
      customerId: 'c',
      config: { providers: ['stripe'] },
    });
    await smartRoute(adapters, s);
    // now silently swap currentIndex to a provider we don't have (defensive)
    s.config.providers = ['paddle'];
    s.currentIndex = 0;
    await expect(
      scoreMl(adapters, s, { score: 0.7, features: {} }),
    ).rejects.toThrow(/no adapter for paddle/);
  });

  it('scoreMl records currency-bearing session emit correctly', async () => {
    const adapters = makeAll();
    const received: string[] = [];
    for (const a of adapters) a.onWebhook((e) => { received.push(e.type); });
    const s = startOrchestrationII({
      intentId: 'i_curem',
      amountCents: 100,
      customerId: 'c',
      currency: 'eur',
      config: { providers: ['stripe'] },
    });
    await smartRoute(adapters, s);
    const step = await scoreMl(adapters, s, { score: 0.6, features: { a: 1 } });
    expect(step.metadata.score).toBe(0.6);
    expect(received.length).toBeGreaterThan(0);
  });
});

describe('payment-orchestration-ii defensive — triggerFallback adapter errors + edge cases', () => {
  it('triggerFallback throws when no adapter for next provider', async () => {
    const stripe = createStripeMock();
    const s = startOrchestrationII({
      intentId: 'i_fb_no',
      amountCents: 100,
      customerId: 'c',
      config: { providers: ['stripe', 'paddle'] },
    });
    await smartRoute([stripe], s);
    // Remove paddle adapter before fallback
    await expect(triggerFallback([stripe], s)).rejects.toThrow(/no adapter for paddle/);
  });

  it('triggerFallback throws when no adapter for lastProvider on exhaustion', async () => {
    const stripe = createStripeMock();
    const s = startOrchestrationII({
      intentId: 'i_ex_no',
      amountCents: 100,
      customerId: 'c',
      config: { providers: ['stripe'], maxAttempts: 1 },
    });
    await smartRoute([stripe], s);
    // Empty adapters when triggerFallback runs -> lastAdapter is undefined
    await expect(triggerFallback([], s)).rejects.toThrow(/no adapter for stripe/);
  });

  it('triggerFallback with cascade-exhausted state rejects second call', async () => {
    const adapters = makeAll();
    const s = startOrchestrationII({
      intentId: 'i_ex2',
      amountCents: 100,
      customerId: 'c',
      config: { providers: ['stripe'], maxAttempts: 1 },
    });
    await smartRoute(adapters, s);
    await triggerFallback(adapters, s);
    expect(s.state).toBe('cascade-exhausted');
    await expect(triggerFallback(adapters, s)).rejects.toThrow(/already exhausted/);
  });

  it('triggerFallback exhaustion at maxAttempts before providers run out', async () => {
    const adapters = makeAll();
    const s = startOrchestrationII({
      intentId: 'i_max',
      amountCents: 100,
      customerId: 'c',
      config: {
        providers: ['stripe', 'paddle', 'lemonsqueezy'],
        maxAttempts: 2,
      },
    });
    await smartRoute(adapters, s); // attemptCount = 1
    const step = await triggerFallback(adapters, s); // attemptCount = 2, currentIndex = 1
    expect(step.neutralEvent).toBe('po2.cascade_exhausted');
    expect(s.state).toBe('cascade-exhausted');
    expect(step.metadata.attemptCount).toBe(2);
    expect(step.metadata.providersTried).toBe(1);
  });
});

describe('payment-orchestration-ii defensive — dead-code guards for out-of-range indices', () => {
  it('smartRoute throws when currentIndex overflows providers array', async () => {
    const adapters = [createStripeMock()];
    const s = startOrchestrationII({
      intentId: 'i_oor',
      amountCents: 100,
      customerId: 'c',
      config: { providers: ['stripe'] },
    });
    s.currentIndex = 99;
    await expect(smartRoute(adapters, s)).rejects.toThrow(/currentIndex out of range/);
  });

  it('triggerFallback throws when currentIndex ends up out of range mid-cascade', async () => {
    const adapters = [createStripeMock(), createPaddleMock()];
    const s = startOrchestrationII({
      intentId: 'i_oor2',
      amountCents: 100,
      customerId: 'c',
      config: { providers: ['stripe', 'paddle'], maxAttempts: 10 },
    });
    await smartRoute(adapters, s);
    s.config.providers = [
      'stripe',
      undefined as unknown as (typeof s.config.providers)[number],
    ];
    await expect(triggerFallback(adapters, s)).rejects.toThrow(/currentIndex out of range/);
  });
});

describe('payment-orchestration-ii defensive — smartRoute path adapter miss variants', () => {
  it('smartRoute rejects when currentIndex targets a provider not in adapter list', async () => {
    const stripe = createStripeMock();
    const paddle = createPaddleMock();
    const s = startOrchestrationII({
      intentId: 'i_mid',
      amountCents: 100,
      customerId: 'c',
      config: { providers: ['stripe', 'paddle'] },
    });
    await smartRoute([stripe, paddle], s);
    // Trigger fallback which advances currentIndex, then call smartRoute with only stripe
    await triggerFallback([stripe, paddle], s);
    expect(s.currentIndex).toBe(1);
    await expect(smartRoute([stripe], s)).rejects.toThrow(/no adapter for paddle/);
  });
});
