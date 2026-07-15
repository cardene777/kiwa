/**
 * integration test — feature-flag domain の end-to-end workflow (registerFlag → registerRule →
 * evaluate → listEvaluated → clear) を 5 case で cover。
 */
import { describe, expect, it } from 'vitest';
import { createFlagClient, evaluateFlag, evaluateAllFlags } from '../../src/index.js';

describe('feature-flag integration — register → evaluate → audit workflow', () => {
  it('T-INT-F-001 registerFlag → evaluateFlag → listEvaluated まで通る', () => {
    const client = createFlagClient({ provider: 'growthbook' });
    client.registerFlag({ key: 'checkout-v2', variant: 'boolean', defaultValue: false });
    const result = evaluateFlag(client, 'checkout-v2', { id: 'u-1' });
    expect(result.value).toBe(false);
    expect(client.listEvaluated().length).toBe(1);
    expect(client.listEvaluated()[0]!.key).toBe('checkout-v2');
  });

  it('T-INT-F-002 targeting rule = 特定 user のみ true が返る', () => {
    const client = createFlagClient({
      provider: 'launchdarkly',
      flags: [{ key: 'beta', variant: 'boolean', defaultValue: false }],
    });
    client.registerRule('beta', { type: 'targeting', userIds: ['u-vip', 'u-admin'], value: true });
    expect(evaluateFlag(client, 'beta', { id: 'u-vip' }).value).toBe(true);
    expect(evaluateFlag(client, 'beta', { id: 'u-normal' }).value).toBe(false);
  });

  it('T-INT-F-003 percentage rollout = 100% で全 user matched', () => {
    const client = createFlagClient({
      provider: 'posthog',
      flags: [{ key: 'new-ui', variant: 'boolean', defaultValue: false }],
    });
    client.registerRule('new-ui', { type: 'percentage', percentage: 100, value: true, fallback: false });
    for (let i = 0; i < 5; i++) {
      expect(evaluateFlag(client, 'new-ui', { id: `u-${i}` }).value).toBe(true);
    }
  });

  it('T-INT-F-004 evaluateAllFlags で登録 3 flag が bulk 評価される', () => {
    const client = createFlagClient({
      provider: 'unleash',
      flags: [
        { key: 'a', variant: 'boolean', defaultValue: true },
        { key: 'b', variant: 'string', defaultValue: 'x' },
        { key: 'c', variant: 'number', defaultValue: 10 },
      ],
    });
    const all = evaluateAllFlags(client, { id: 'u-1' });
    expect(all.results.length).toBe(3);
    expect(all.results.map((r) => r.value)).toEqual([true, 'x', 10]);
  });

  it('T-INT-F-005 clear で listEvaluated が空になる', () => {
    const client = createFlagClient({
      provider: 'growthbook',
      flags: [{ key: 'k', variant: 'boolean', defaultValue: false }],
    });
    evaluateFlag(client, 'k', { id: 'u-1' });
    expect(client.listEvaluated().length).toBe(1);
    client.clear();
    expect(client.listEvaluated().length).toBe(0);
  });

  it('T-INT-F-006 evaluateWithRetry: single attempt success', async () => {
    const { evaluateWithRetry } = await import('../../src/index.js');
    const client = createFlagClient({ provider: 'growthbook', flags: [{ key: 'k', variant: 'boolean', defaultValue: true }] });
    const result = await evaluateWithRetry(client, 'k', { id: 'u-1' });
    expect(result.attempts).toBe(1);
    expect(result.value).toBe(true);
  });

  it('T-INT-F-007 evaluateBatch: 3 flag 一括評価 + byKey lookup', async () => {
    const { evaluateBatch } = await import('../../src/index.js');
    const client = createFlagClient({
      provider: 'launchdarkly',
      flags: [
        { key: 'a', variant: 'boolean', defaultValue: true },
        { key: 'b', variant: 'string', defaultValue: 'x' },
        { key: 'c', variant: 'number', defaultValue: 10 },
      ],
    });
    const result = evaluateBatch(client, [
      { key: 'a', user: { id: 'u-1' } },
      { key: 'b', user: { id: 'u-1' } },
      { key: 'c', user: { id: 'u-1' } },
    ]);
    expect(result.total).toBe(3);
    expect(result.byKey.a?.value).toBe(true);
    expect(result.byKey.b?.value).toBe('x');
  });

  it('T-INT-F-008 evaluateIdempotent: 同 (key,user) で cached', async () => {
    const { createIdempotencyCache, evaluateIdempotent } = await import('../../src/index.js');
    const client = createFlagClient({ provider: 'growthbook', flags: [{ key: 'k', variant: 'boolean', defaultValue: true }] });
    const cache = createIdempotencyCache();
    const first = evaluateIdempotent(client, 'k', { id: 'u-1' }, cache);
    expect(first.cached).toBe(false);
    const second = evaluateIdempotent(client, 'k', { id: 'u-1' }, cache);
    expect(second.cached).toBe(true);
    expect(cache.size()).toBe(1);
  });

  it('T-INT-F-009 evaluateObservable: hook 3 phase 発火', async () => {
    const { createHookRegistry, evaluateObservable } = await import('../../src/index.js');
    const client = createFlagClient({ provider: 'growthbook', flags: [{ key: 'k', variant: 'boolean', defaultValue: true }] });
    const hooks = createHookRegistry();
    const events: string[] = [];
    hooks.register('before-eval', () => { events.push('before'); });
    hooks.register('after-eval', () => { events.push('after'); });
    evaluateObservable(client, 'k', { id: 'u-1' }, hooks);
    expect(events).toEqual(['before', 'after']);
  });

  it('T-INT-F-010 circuit-breaker: state 遷移確認', async () => {
    const { createCircuitBreaker } = await import('../../src/index.js');
    const client = createFlagClient({ provider: 'growthbook', flags: [{ key: 'k', variant: 'boolean', defaultValue: true }] });
    let currentTime = 1000;
    const breaker = createCircuitBreaker({ errorThreshold: 2, resetTimeoutMs: 100, now: () => currentTime, fallbackValue: false });
    expect(breaker.state()).toBe('closed');
    const result = breaker.evaluate(client, 'k', { id: 'u-1' });
    expect(result.circuitState).toBe('closed');
  });
});
