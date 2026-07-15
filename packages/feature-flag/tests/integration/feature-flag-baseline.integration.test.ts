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
});
