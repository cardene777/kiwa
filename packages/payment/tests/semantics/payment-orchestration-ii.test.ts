import { describe, expect, it } from 'vitest';
import {
  createLemonSqueezyMock,
  createPaddleMock,
  createStripeMock,
  type PaymentAdapter,
  scoreMl,
  smartRoute,
  startOrchestrationII,
  triggerFallback,
} from '../../src/index.js';

function makeAll(): PaymentAdapter[] {
  return [createStripeMock(), createPaddleMock(), createLemonSqueezyMock()];
}

describe('payment-orchestration-ii axis — smart routing + ML + fallback + cascade', () => {
  it('startOrchestrationII rejects empty providers', () => {
    expect(() =>
      startOrchestrationII({
        intentId: 'int_bad',
        amountCents: 100,
        customerId: 'cus',
        config: { providers: [] },
      }),
    ).toThrow(/providers must not be empty/);
  });

  it('startOrchestrationII loads default config', () => {
    const s = startOrchestrationII({
      intentId: 'int_1',
      amountCents: 500,
      customerId: 'cus_1',
      config: { providers: ['stripe'] },
    });
    expect(s.config.mlScoringEnabled).toBe(true);
    expect(s.config.minMlScore).toBe(0.5);
    expect(s.config.maxAttempts).toBe(5);
    expect(s.state).toBe('initial');
  });

  it('smartRoute emits smart_routed on primary provider', async () => {
    const adapters = makeAll();
    const s = startOrchestrationII({
      intentId: 'int_2',
      amountCents: 1000,
      customerId: 'cus_2',
      config: { providers: ['stripe', 'paddle'] },
    });
    const step = await smartRoute(adapters, s);
    expect(step.neutralEvent).toBe('po2.smart_routed');
    expect(step.metadata.provider).toBe('stripe');
    expect(step.metadata.attemptCount).toBe(1);
    expect(s.state).toBe('smart-routed');
    expect(s.attemptCount).toBe(1);
  });

  it('smartRoute rejects when cascade exhausted', async () => {
    const adapters = makeAll();
    const s = startOrchestrationII({
      intentId: 'int_ex',
      amountCents: 100,
      customerId: 'cus',
      config: { providers: ['stripe'], maxAttempts: 1 },
    });
    await smartRoute(adapters, s);
    await triggerFallback(adapters, s); // exhausts
    await expect(smartRoute(adapters, s)).rejects.toThrow(/cascade-exhausted/);
  });

  it('smartRoute rejects when no adapter for provider', async () => {
    const adapters = [createStripeMock()]; // only stripe
    const s = startOrchestrationII({
      intentId: 'int_na',
      amountCents: 100,
      customerId: 'cus',
      config: { providers: ['paddle'] },
    });
    await expect(smartRoute(adapters, s)).rejects.toThrow(/no adapter for paddle/);
  });

  it('scoreMl records score + emits ml_scored', async () => {
    const adapters = makeAll();
    const s = startOrchestrationII({
      intentId: 'int_ml',
      amountCents: 200,
      customerId: 'cus_ml',
      config: { providers: ['stripe'] },
    });
    await smartRoute(adapters, s);
    const step = await scoreMl(adapters, s, {
      score: 0.8,
      features: { device: 1, velocity: 0 },
    });
    expect(step.neutralEvent).toBe('po2.ml_scored');
    expect(step.metadata.passed).toBe(true);
    expect(step.metadata.featureCount).toBe(2);
    expect(s.mlScore).toBe(0.8);
    expect(s.state).toBe('ml-scored');
  });

  it('scoreMl marks failed when < minMlScore', async () => {
    const adapters = makeAll();
    const s = startOrchestrationII({
      intentId: 'int_ml2',
      amountCents: 200,
      customerId: 'cus',
      config: { providers: ['stripe'] },
    });
    await smartRoute(adapters, s);
    const step = await scoreMl(adapters, s, {
      score: 0.3,
      features: {},
    });
    expect(step.metadata.passed).toBe(false);
  });

  it('scoreMl rejects when disabled', async () => {
    const adapters = makeAll();
    const s = startOrchestrationII({
      intentId: 'int_dis',
      amountCents: 100,
      customerId: 'cus',
      config: { providers: ['stripe'], mlScoringEnabled: false },
    });
    await smartRoute(adapters, s);
    await expect(scoreMl(adapters, s, { score: 0.9, features: {} })).rejects.toThrow(/disabled/);
  });

  it('scoreMl rejects score outside 0-1', async () => {
    const adapters = makeAll();
    const s = startOrchestrationII({
      intentId: 'int_bs',
      amountCents: 100,
      customerId: 'cus',
      config: { providers: ['stripe'] },
    });
    await smartRoute(adapters, s);
    await expect(scoreMl(adapters, s, { score: -0.1, features: {} })).rejects.toThrow(/between 0 and 1/);
    await expect(scoreMl(adapters, s, { score: 1.5, features: {} })).rejects.toThrow(/between 0 and 1/);
  });

  it('triggerFallback advances to next provider', async () => {
    const adapters = makeAll();
    const s = startOrchestrationII({
      intentId: 'int_fb',
      amountCents: 500,
      customerId: 'cus_fb',
      config: { providers: ['stripe', 'paddle', 'lemonsqueezy'] },
    });
    await smartRoute(adapters, s);
    const step = await triggerFallback(adapters, s);
    expect(step.neutralEvent).toBe('po2.fallback_triggered');
    expect(step.metadata.toProvider).toBe('paddle');
    expect(s.state).toBe('fallback-triggered');
    expect(s.currentIndex).toBe(1);
  });

  it('triggerFallback exhausts cascade when providers run out', async () => {
    const adapters = makeAll();
    const s = startOrchestrationII({
      intentId: 'int_last',
      amountCents: 100,
      customerId: 'cus',
      config: { providers: ['stripe', 'paddle'] },
    });
    await smartRoute(adapters, s);
    await triggerFallback(adapters, s); // → paddle
    const exhausted = await triggerFallback(adapters, s);
    expect(exhausted.neutralEvent).toBe('po2.cascade_exhausted');
    expect(s.state).toBe('cascade-exhausted');
  });

  it('triggerFallback exhausts when maxAttempts reached', async () => {
    const adapters = makeAll();
    const s = startOrchestrationII({
      intentId: 'int_max',
      amountCents: 100,
      customerId: 'cus',
      config: {
        providers: ['stripe', 'paddle', 'lemonsqueezy'],
        maxAttempts: 2,
      },
    });
    await smartRoute(adapters, s); // attempt 1
    const step = await triggerFallback(adapters, s); // attempt 2 → exhausted
    expect(step.neutralEvent).toBe('po2.cascade_exhausted');
  });

  it('triggerFallback rejects on already-exhausted cascade', async () => {
    const adapters = makeAll();
    const s = startOrchestrationII({
      intentId: 'int_ex2',
      amountCents: 100,
      customerId: 'cus',
      config: { providers: ['stripe'], maxAttempts: 1 },
    });
    await smartRoute(adapters, s);
    await triggerFallback(adapters, s);
    await expect(triggerFallback(adapters, s)).rejects.toThrow(/already exhausted/);
  });

  it('cascade_exhausted includes total attemptCount', async () => {
    const adapters = makeAll();
    const s = startOrchestrationII({
      intentId: 'int_at',
      amountCents: 100,
      customerId: 'cus',
      config: { providers: ['stripe'], maxAttempts: 1 },
    });
    await smartRoute(adapters, s);
    const ex = await triggerFallback(adapters, s);
    expect(ex.metadata.attemptCount).toBeGreaterThanOrEqual(2);
  });

  it('history captures full lifecycle', async () => {
    const adapters = makeAll();
    const s = startOrchestrationII({
      intentId: 'int_h',
      amountCents: 500,
      customerId: 'cus_h',
      config: { providers: ['stripe', 'paddle'] },
    });
    await smartRoute(adapters, s);
    await scoreMl(adapters, s, { score: 0.3, features: {} });
    await triggerFallback(adapters, s);
    expect(s.history).toHaveLength(3);
    expect(s.history.map((h) => h.neutralEvent)).toEqual([
      'po2.smart_routed',
      'po2.ml_scored',
      'po2.fallback_triggered',
    ]);
  });

  it('multiple smartRoute calls increment attemptCount', async () => {
    const adapters = makeAll();
    const s = startOrchestrationII({
      intentId: 'int_inc',
      amountCents: 100,
      customerId: 'cus',
      config: { providers: ['stripe'] },
    });
    await smartRoute(adapters, s);
    await smartRoute(adapters, s);
    await smartRoute(adapters, s);
    expect(s.attemptCount).toBe(3);
  });
});
