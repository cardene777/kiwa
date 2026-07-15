/**
 * fidelity test — createFlagClient (kiwa mock) が reference impl と同じ挙動を示すことを検証。
 * 5 case で evaluate / targeting / percentage / attribute / unknown flag の 5 観点を cover。
 */
import { assertFidelity } from '@kiwa-lab/quality-metrics';
import { describe, expect, it } from 'vitest';
import { createFlagClient, evaluateFlag } from '../../src/index.js';

function referenceFlagStore() {
  const flags = new Map<string, boolean>();
  const targeting = new Map<string, string[]>();
  return {
    set(key: string, value: boolean) {
      flags.set(key, value);
    },
    target(key: string, userIds: string[]) {
      targeting.set(key, userIds);
    },
    evaluate(key: string, userId: string): boolean {
      const targeted = targeting.get(key) ?? [];
      if (targeted.includes(userId)) return true;
      return flags.get(key) ?? false;
    },
  };
}

describe('feature-flag client fidelity vs reference impl', () => {
  it('evaluateFlag = default 経路が reference と一致', async () => {
    const mock = createFlagClient({
      provider: 'growthbook',
      flags: [{ key: 'k', variant: 'boolean', defaultValue: false }],
    });
    const real = referenceFlagStore();
    real.set('k', false);
    const result = await assertFidelity({
      mockFn: async (uid: string) => evaluateFlag(mock, 'k', { id: uid }).value,
      realFn: async (uid: string) => real.evaluate('k', uid),
      cases: [{ name: 'default false', args: ['u-1'] }],
    });
    expect(result.ratio).toBe(100);
  });

  it('targeting rule = user id マッチで true 返す', () => {
    const mock = createFlagClient({
      provider: 'launchdarkly',
      flags: [{ key: 'beta', variant: 'boolean', defaultValue: false }],
    });
    mock.registerRule('beta', { type: 'targeting', userIds: ['u-vip'], value: true });
    expect(evaluateFlag(mock, 'beta', { id: 'u-vip' }).value).toBe(true);
    expect(evaluateFlag(mock, 'beta', { id: 'u-other' }).value).toBe(false);
  });

  it('percentage rollout = hash-based で決定性', () => {
    const mock = createFlagClient({
      provider: 'posthog',
      flags: [{ key: 'rollout', variant: 'boolean', defaultValue: false }],
    });
    mock.registerRule('rollout', { type: 'percentage', percentage: 50, value: true, fallback: false });
    const first = evaluateFlag(mock, 'rollout', { id: 'user-deterministic' }).value;
    const second = evaluateFlag(mock, 'rollout', { id: 'user-deterministic' }).value;
    expect(first).toBe(second);
  });

  it('attribute match rule = eq operator で値決定', () => {
    const mock = createFlagClient({
      provider: 'unleash',
      flags: [{ key: 'jp-only', variant: 'string', defaultValue: 'en' }],
    });
    mock.registerRule('jp-only', {
      type: 'attribute',
      attribute: 'country',
      operator: 'eq',
      value: 'JP',
      matchValue: 'ja',
      fallback: 'en',
    });
    expect(evaluateFlag(mock, 'jp-only', { id: 'u-1', attributes: { country: 'JP' } }).value).toBe('ja');
    expect(evaluateFlag(mock, 'jp-only', { id: 'u-2', attributes: { country: 'US' } }).value).toBe('en');
  });

  it('unknown flag = flag-not-found reason で false 返す', () => {
    const mock = createFlagClient({ provider: 'growthbook' });
    const result = evaluateFlag(mock, 'missing', { id: 'u-1' });
    expect(result.value).toBe(false);
    expect(result.reason).toBe('flag-not-found');
  });
});
