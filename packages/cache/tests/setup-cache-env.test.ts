import { afterEach, describe, expect, it } from 'vitest';
import { setupCacheEnv, type CacheTestEnv } from '../src/index.js';

const envs: CacheTestEnv[] = [];

afterEach(async () => {
  while (envs.length > 0) {
    const env = envs.pop();
    if (env) await env.stop();
  }
});

async function fresh(overrides: Parameters<typeof setupCacheEnv>[0] = {}): Promise<CacheTestEnv> {
  const env = await setupCacheEnv(overrides);
  envs.push(env);
  return env;
}

describe('setupCacheEnv (defaults)', () => {
  it('defaults to in-memory backend when no mode is passed', async () => {
    const env = await fresh();
    expect(env.backend).toBe('in-memory');
    expect(env.mode).toBe('mock');
    expect(env.redisUrl).toBeUndefined();
    expect(env.client).toBe('ioredis');
  });

  it('preserves the client selection informational field', async () => {
    const env = await fresh({ client: 'node-redis' });
    expect(env.client).toBe('node-redis');
  });

  it('rejects an unknown mode', async () => {
    await expect(
      setupCacheEnv({ mode: 'invalid' as unknown as 'in-memory' }),
    ).rejects.toThrow(/unknown mode/);
  });

  it('rejects an unknown client', async () => {
    await expect(
      setupCacheEnv({ client: 'not-a-client' as unknown as 'ioredis' }),
    ).rejects.toThrow(/unknown client/);
  });
});

describe('setupCacheEnv (in-memory — get / set / delete)', () => {
  it('T-CACHE-001 returns null for missing keys', async () => {
    const env = await fresh();
    expect(await env.get('missing')).toBeNull();
  });

  it('T-CACHE-002 stores and retrieves a value without TTL', async () => {
    const env = await fresh();
    await env.set('greeting', 'hello');
    expect(await env.get('greeting')).toBe('hello');
    expect(await env.ttl('greeting')).toBe(-1);
  });

  it('T-CACHE-003 delete returns 1 for existing keys and 0 for missing ones', async () => {
    const env = await fresh();
    await env.set('temp', 'x');
    expect(await env.delete('temp')).toBe(1);
    expect(await env.delete('temp')).toBe(0);
    expect(await env.get('temp')).toBeNull();
  });

  it('T-CACHE-004 flushAll wipes every key', async () => {
    const env = await fresh();
    await env.set('a', '1');
    await env.set('b', '2');
    await env.flushAll();
    expect(await env.get('a')).toBeNull();
    expect(await env.get('b')).toBeNull();
  });

  it('T-CACHE-005 rejects non-positive TTL on set', async () => {
    const env = await fresh();
    await expect(env.set('bad', 'x', { ttlSeconds: 0 })).rejects.toThrow(/ttlSeconds/);
    await expect(env.set('bad', 'x', { ttlSeconds: -5 })).rejects.toThrow(/ttlSeconds/);
  });
});

describe('setupCacheEnv (in-memory — TTL semantics)', () => {
  it('T-CACHE-006 assertTTL matches an exact TTL when set with SETEX-style call', async () => {
    const env = await fresh();
    await env.set('session:1', 'user-1', { ttlSeconds: 60 });
    const observed = await env.assertTTL('session:1', { atLeast: 59, atMost: 60 });
    expect(observed).toBeGreaterThanOrEqual(59);
    expect(observed).toBeLessThanOrEqual(60);
  });

  it('T-CACHE-007 assertTTL(-2) reports missing keys', async () => {
    const env = await fresh();
    await env.assertTTL('nope', { seconds: -2 });
  });

  it('T-CACHE-008 assertTTL(-1) reports keys without expiry', async () => {
    const env = await fresh();
    await env.set('sticky', 'x');
    await env.assertTTL('sticky', { seconds: -1 });
  });

  it('T-CACHE-009 assertTTL throws when the bound is missed', async () => {
    const env = await fresh();
    await env.set('short', 'x', { ttlSeconds: 60 });
    await expect(env.assertTTL('short', { atLeast: 120 })).rejects.toThrow(/expected TTL/);
    await expect(env.assertTTL('short', { atMost: 10 })).rejects.toThrow(/expected TTL/);
  });

  it('T-CACHE-010 assertTTL throws with a helpful message when no bound is given', async () => {
    const env = await fresh();
    await env.set('any', 'x', { ttlSeconds: 30 });
    await expect(env.assertTTL('any', {})).rejects.toThrow(/at least one of/);
  });

  it('T-CACHE-011 expire returns false on missing keys', async () => {
    const env = await fresh();
    expect(await env.expire('ghost', 10)).toBe(false);
  });

  it('T-CACHE-012 expire attaches a TTL to a key set without one', async () => {
    const env = await fresh();
    await env.set('later', 'x');
    expect(await env.expire('later', 30)).toBe(true);
    const ttl = await env.ttl('later');
    expect(ttl).toBeGreaterThan(0);
    expect(ttl).toBeLessThanOrEqual(30);
  });

  it('T-CACHE-013 expire rejects non-positive seconds', async () => {
    const env = await fresh();
    await env.set('x', 'y');
    await expect(env.expire('x', 0)).rejects.toThrow(/positive/);
  });

  it('T-CACHE-014 keys expire once their TTL elapses (deterministic sub-second window)', async () => {
    const env = await fresh({ inMemory: { expiryTickMs: 5 } });
    // Force the smallest testable TTL (1s) — expiryTickMs=5 keeps the sweep
    // active. We assert both TTL readback + eventual absence of the key.
    await env.set('flash', 'x', { ttlSeconds: 1 });
    const before = await env.ttl('flash');
    expect(before).toBeGreaterThan(0);
    // Wait past the 1s TTL. Use 1200ms to absorb setInterval scheduling
    // slack without introducing flakiness at the coarse end.
    await new Promise((resolve) => setTimeout(resolve, 1200));
    expect(await env.get('flash')).toBeNull();
    expect(await env.ttl('flash')).toBe(-2);
  });
});

describe('setupCacheEnv (in-memory — Pub/Sub)', () => {
  it('T-CACHE-015 publish returns the delivered subscriber count', async () => {
    const env = await fresh();
    const sub = await env.subscribe('room');
    // Wait until the first publish is queued so we can observe the count.
    const delivered = await env.publish('room', 'hi');
    expect(delivered).toBe(1);
    const msg = await sub.next();
    expect(msg.message).toBe('hi');
    expect(msg.channel).toBe('room');
    await sub.close();
  });

  it('T-CACHE-016 subscribe accumulates messages in order', async () => {
    const env = await fresh();
    const sub = await env.subscribe('feed');
    await env.publish('feed', 'first');
    await env.publish('feed', 'second');
    await env.publish('feed', 'third');
    const a = await sub.next();
    const b = await sub.next();
    const c = await sub.next();
    expect([a.message, b.message, c.message]).toEqual(['first', 'second', 'third']);
    expect(sub.received().map((m) => m.message)).toEqual(['first', 'second', 'third']);
    await sub.close();
  });

  it('T-CACHE-017 publish to a channel with no subscribers reports zero', async () => {
    const env = await fresh();
    expect(await env.publish('nobody-listening', 'boop')).toBe(0);
  });

  it('T-CACHE-018 subscribe.next rejects on timeout', async () => {
    const env = await fresh();
    const sub = await env.subscribe('idle');
    await expect(sub.next({ timeoutMs: 20 })).rejects.toThrow(/timeout waiting/);
    await sub.close();
  });

  it('T-CACHE-019 assertPublished matches a string payload after the fact', async () => {
    const env = await fresh();
    const sub = await env.subscribe('log');
    await env.publish('log', 'error: db down');
    const hit = await env.assertPublished('log', { match: 'error: db down' });
    expect(hit.message).toBe('error: db down');
    await sub.close();
  });

  it('T-CACHE-020 assertPublished matches a RegExp payload', async () => {
    const env = await fresh();
    const sub = await env.subscribe('log');
    await env.publish('log', 'user 42 signed up');
    const hit = await env.assertPublished('log', { match: /user \d+ signed up/ });
    expect(hit.message).toMatch(/user \d+ signed up/);
    await sub.close();
  });

  it('T-CACHE-021 assertPublished rejects when no message matches', async () => {
    const env = await fresh();
    await env.subscribe('log');
    await env.publish('log', 'nothing interesting');
    await expect(
      env.assertPublished('log', { match: /^critical:/, timeoutMs: 30 }),
    ).rejects.toThrow(/no message on "log" matched/);
  });

  it('T-CACHE-022 assertPublished waits for a subsequent publish within the timeout', async () => {
    const env = await fresh();
    await env.subscribe('log');
    const pending = env.assertPublished('log', {
      match: /welcome/,
      timeoutMs: 500,
    });
    setTimeout(() => {
      void env.publish('log', 'welcome onboard');
    }, 30);
    const hit = await pending;
    expect(hit.message).toBe('welcome onboard');
  });

  it('T-CACHE-023 subscribe.close unblocks in-flight next() calls', async () => {
    const env = await fresh();
    const sub = await env.subscribe('blocked');
    const pending = sub.next({ timeoutMs: 1000 });
    await sub.close();
    // After close(), the waiter resolves with a sentinel (index=-1) rather
    // than hanging until the timer fires.
    const resolved = await pending;
    expect(resolved.index).toBe(-1);
  });
});

describe('setupCacheEnv (in-memory — lifecycle)', () => {
  it('T-CACHE-024 stop invalidates further get/set/delete', async () => {
    const env = await setupCacheEnv();
    await env.set('k', 'v');
    await env.stop();
    await expect(env.get('k')).rejects.toThrow(/after stop/);
    await expect(env.set('k2', 'v2')).rejects.toThrow(/after stop/);
    await expect(env.delete('k')).rejects.toThrow(/after stop/);
  });

  it('T-CACHE-025 stop is idempotent', async () => {
    const env = await setupCacheEnv();
    await env.stop();
    await expect(env.stop()).resolves.toBeUndefined();
  });

  it('T-CACHE-026 subscribing after stop throws', async () => {
    const env = await setupCacheEnv();
    await env.stop();
    await expect(env.subscribe('x')).rejects.toThrow(/after stop/);
  });
});

describe('setupCacheEnv (in-memory — namespace isolation)', () => {
  it('T-CACHE-027 flushAll on one env does not affect another', async () => {
    const envA = await fresh();
    const envB = await fresh();
    await envA.set('shared-key', 'a-value');
    await envB.set('shared-key', 'b-value');
    await envA.flushAll();
    expect(await envA.get('shared-key')).toBeNull();
    expect(await envB.get('shared-key')).toBe('b-value');
  });

  it('T-CACHE-028 publishing on one env does not deliver to another env subscribed to the same channel', async () => {
    const envA = await fresh();
    const envB = await fresh();
    const subB = await envB.subscribe('cross-env');
    await envA.publish('cross-env', 'from-A');
    // envB should never see the payload — assertPublished must time out.
    await expect(
      envB.assertPublished('cross-env', { match: /./, timeoutMs: 30 }),
    ).rejects.toThrow(/no message on/);
    await subB.close();
  });
});
