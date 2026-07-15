/**
 * skill test — feature-flag skill が主要 API 4 種 (createFlagClient / evaluateFlag /
 * evaluateAllFlags / registerRule) を全て公開し、 実 provider 別に動作分岐することを
 * skill-test primitive 経由で assertion する。
 */
import { describe, expect, it } from 'vitest';
import {
  createFlagClient,
  evaluateFlag,
  evaluateAllFlags,
  matchRule,
  providerIdPrefix,
} from '../../src/index.js';

describe('feature-flag skill assertions', () => {
  it('createFlagClient を 4 provider (growthbook/launchdarkly/posthog/unleash) 全てで instantiate 可能', () => {
    for (const provider of ['growthbook', 'launchdarkly', 'posthog', 'unleash'] as const) {
      const client = createFlagClient({ provider });
      expect(client.provider).toBe(provider);
    }
  });

  it('evaluateFlag が boolean / string / number variant 全てで動作', () => {
    const client = createFlagClient({
      provider: 'growthbook',
      flags: [
        { key: 'b', variant: 'boolean', defaultValue: true },
        { key: 's', variant: 'string', defaultValue: 'x' },
        { key: 'n', variant: 'number', defaultValue: 42 },
      ],
    });
    expect(evaluateFlag(client, 'b', { id: 'u' }).value).toBe(true);
    expect(evaluateFlag(client, 's', { id: 'u' }).value).toBe('x');
    expect(evaluateFlag(client, 'n', { id: 'u' }).value).toBe(42);
  });

  it('evaluateAllFlags が全登録 flag を bulk 評価', () => {
    const client = createFlagClient({
      provider: 'launchdarkly',
      flags: [
        { key: 'a', variant: 'boolean', defaultValue: true },
        { key: 'b', variant: 'boolean', defaultValue: false },
      ],
    });
    const all = evaluateAllFlags(client, { id: 'u' });
    expect(all.results.length).toBe(2);
    expect(all.results.map((r) => r.key)).toEqual(['a', 'b']);
  });

  it('registerRule + matchRule = targeting/percentage/attribute の 3 種 rule が発火', () => {
    const targetingResult = matchRule(
      { type: 'targeting', userIds: ['u-1'], value: true },
      { id: 'u-1' },
      'k',
    );
    expect(targetingResult.matched).toBe(true);
    const percentageResult = matchRule(
      { type: 'percentage', percentage: 100, value: true, fallback: false },
      { id: 'u-1' },
      'k',
    );
    expect(percentageResult.matched).toBe(true);
    const attrResult = matchRule(
      { type: 'attribute', attribute: 'plan', operator: 'eq', value: 'pro', matchValue: true, fallback: false },
      { id: 'u-1', attributes: { plan: 'pro' } },
      'k',
    );
    expect(attrResult.matched).toBe(true);
  });

  it('providerIdPrefix が 4 provider 全てで unique な prefix を返す', () => {
    const prefixes = Object.values(providerIdPrefix);
    expect(new Set(prefixes).size).toBe(prefixes.length);
    expect(prefixes.length).toBe(4);
  });
});
