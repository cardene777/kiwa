import { describe, expect, it } from 'vitest';
import {
  createFlagClient,
  createIdempotencyCache,
  evaluateFlag,
  evaluateIdempotent,
} from '../src/index.js';

describe('library documentation feature flag recipes', () => {
  it('returns a default value and safely rejects an unknown key', () => {
    const client = createFlagClient({
      provider: 'growthbook',
      idSeed: 0,
      flags: [{ key: 'new-checkout', variant: 'boolean', defaultValue: false }],
    });

    const defaultResult = evaluateFlag(client, 'new-checkout', { id: 'u1' });
    expect(defaultResult).toMatchObject({ value: false, reason: 'default', record: { id: 'gb-1' } });

    const missingClient = createFlagClient({ provider: 'growthbook', idSeed: 10 });
    const missing = evaluateFlag(missingClient, 'removed-checkout', { id: 'u1' });
    expect(missing).toMatchObject({
      value: false,
      reason: 'flag-not-found',
      record: { id: 'gb-11', variant: 'boolean' },
    });
  });

  it('evaluates targeting, attributes, and a full rollout in registration order', () => {
    const client = createFlagClient({
      provider: 'growthbook',
      flags: [{ key: 'new-checkout', variant: 'boolean', defaultValue: false }],
    });
    client.registerRule('new-checkout', { type: 'targeting', userIds: ['u-vip'], value: true });
    client.registerRule('new-checkout', {
      type: 'attribute', attribute: 'plan', operator: 'eq', value: 'pro', matchValue: true, fallback: false,
    });
    client.registerRule('new-checkout', { type: 'percentage', percentage: 100, value: true, fallback: false });

    expect(evaluateFlag(client, 'new-checkout', { id: 'u-vip' })).toMatchObject({ value: true, reason: 'targeted:u-vip' });
    expect(evaluateFlag(client, 'new-checkout', { id: 'u-pro', attributes: { plan: 'pro' } })).toMatchObject({ value: true, reason: 'attr-match:plan' });
    expect(evaluateFlag(client, 'new-checkout', { id: 'u-free', attributes: { plan: 'free' } })).toMatchObject({ value: true, reason: expect.stringMatching(/^bucket:/) });
  });

  it('requires a new cache after a rule changes', () => {
    const client = createFlagClient({
      flags: [{ key: 'new-checkout', variant: 'boolean', defaultValue: false }],
    });
    const cache = createIdempotencyCache();
    const first = evaluateIdempotent(client, 'new-checkout', { id: 'u-1' }, cache);
    client.registerRule('new-checkout', { type: 'targeting', userIds: ['u-1'], value: true });
    const stale = evaluateIdempotent(client, 'new-checkout', { id: 'u-1' }, cache);
    cache.clear();
    const fresh = evaluateIdempotent(client, 'new-checkout', { id: 'u-1' }, cache);

    expect(first).toMatchObject({ value: false, cached: false });
    expect(stale).toMatchObject({ value: false, cached: true });
    expect(fresh).toMatchObject({ value: true, cached: false });
  });
});
