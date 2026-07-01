import { afterEach, describe, expect, it } from 'vitest';
import { setupMemcachedEnv, type MemcachedTestEnv } from '../src/index.js';

const envs: MemcachedTestEnv[] = [];

afterEach(async () => {
  while (envs.length > 0) {
    const env = envs.pop();
    if (env) await env.stop();
  }
});

describe('setupMemcachedEnv (defaults)', () => {
  it('T-MC-001 defaults to stub backend when no mode is passed', async () => {
    const env = await setupMemcachedEnv();
    envs.push(env);
    expect(env.backend).toBe('stub');
    expect(env.mode).toBe('mock');
    expect(env.memcachedUrl).toBeUndefined();
    expect(env.client).toBe('memjs');
    expect(env.servers).toEqual(['stub-0']);
  });

  it('T-MC-002 accepts a custom client selector', async () => {
    const env = await setupMemcachedEnv({ client: 'memcached' });
    envs.push(env);
    expect(env.client).toBe('memcached');
  });

  it('T-MC-003 accepts a list of servers for the consistent-hash ring', async () => {
    const env = await setupMemcachedEnv({
      servers: ['stub-a', 'stub-b', 'stub-c'],
    });
    envs.push(env);
    expect(env.servers).toEqual(['stub-a', 'stub-b', 'stub-c']);
  });

  it('T-MC-004 rejects an unknown mode', async () => {
    await expect(
      setupMemcachedEnv({ mode: 'invalid' as unknown as 'stub' }),
    ).rejects.toThrow(/unknown mode/);
  });

  it('T-MC-005 requires testcontainers.url for testcontainers mode (v0.2 scope)', async () => {
    await expect(setupMemcachedEnv({ mode: 'testcontainers' })).rejects.toThrow(
      /requires testcontainers\.url/,
    );
  });

  it('T-MC-006 rejects testcontainers URL that is unreachable', async () => {
    await expect(
      setupMemcachedEnv({
        mode: 'testcontainers',
        testcontainers: { url: '127.0.0.1:1' },
      }),
    ).rejects.toThrow(/did not respond/);
  });
});

describe('setupMemcachedEnv (get / set / delete)', () => {
  it('T-MC-007 set then get returns the stored value', async () => {
    const env = await setupMemcachedEnv();
    envs.push(env);
    await env.set('k', 'v');
    expect(await env.get('k')).toBe('v');
  });

  it('T-MC-008 get returns null for missing keys', async () => {
    const env = await setupMemcachedEnv();
    envs.push(env);
    expect(await env.get('missing')).toBeNull();
  });

  it('T-MC-009 delete returns true for existing keys, false for missing', async () => {
    const env = await setupMemcachedEnv();
    envs.push(env);
    await env.set('k', 'v');
    expect(await env.delete('k')).toBe(true);
    expect(await env.delete('k')).toBe(false);
  });

  it('T-MC-010 set with ttlSeconds=0 stores without expiry', async () => {
    const env = await setupMemcachedEnv();
    envs.push(env);
    await env.set('k', 'v', { ttlSeconds: 0 });
    expect(await env.ttl('k')).toBe(-1);
  });

  it('T-MC-011 set with negative ttlSeconds throws', async () => {
    const env = await setupMemcachedEnv();
    envs.push(env);
    await expect(env.set('k', 'v', { ttlSeconds: -1 })).rejects.toThrow(
      /must be non-negative/,
    );
  });
});

describe('setupMemcachedEnv (add / replace)', () => {
  it('T-MC-012 add writes only if the key is missing', async () => {
    const env = await setupMemcachedEnv();
    envs.push(env);
    expect(await env.add('k', 'v1')).toBe(true);
    expect(await env.add('k', 'v2')).toBe(false);
    expect(await env.get('k')).toBe('v1');
  });

  it('T-MC-013 replace writes only if the key already exists', async () => {
    const env = await setupMemcachedEnv();
    envs.push(env);
    expect(await env.replace('k', 'v1')).toBe(false);
    await env.set('k', 'original');
    expect(await env.replace('k', 'replaced')).toBe(true);
    expect(await env.get('k')).toBe('replaced');
  });

  it('T-MC-014 replace with ttlSeconds refreshes expiry', async () => {
    const env = await setupMemcachedEnv();
    envs.push(env);
    await env.set('k', 'v', { ttlSeconds: 60 });
    await env.replace('k', 'v2', { ttlSeconds: 120 });
    const ttl = await env.ttl('k');
    expect(ttl).toBeGreaterThanOrEqual(119);
    expect(ttl).toBeLessThanOrEqual(120);
  });
});

describe('setupMemcachedEnv (increment / decrement)', () => {
  it('T-MC-015 increment on a numeric key adds delta and returns the new value', async () => {
    const env = await setupMemcachedEnv();
    envs.push(env);
    await env.set('n', '10');
    expect(await env.increment('n', 5)).toBe(15);
    expect(await env.get('n')).toBe('15');
  });

  it('T-MC-016 increment defaults delta=1', async () => {
    const env = await setupMemcachedEnv();
    envs.push(env);
    await env.set('n', '10');
    expect(await env.increment('n')).toBe(11);
  });

  it('T-MC-017 increment on a missing key returns null', async () => {
    const env = await setupMemcachedEnv();
    envs.push(env);
    expect(await env.increment('missing')).toBeNull();
  });

  it('T-MC-018 increment on a non-numeric key returns null', async () => {
    const env = await setupMemcachedEnv();
    envs.push(env);
    await env.set('s', 'not-a-number');
    expect(await env.increment('s')).toBeNull();
  });

  it('T-MC-019 decrement clamps at 0 (Memcached semantics)', async () => {
    const env = await setupMemcachedEnv();
    envs.push(env);
    await env.set('n', '3');
    expect(await env.decrement('n', 10)).toBe(0);
    expect(await env.get('n')).toBe('0');
  });

  it('T-MC-020 decrement defaults delta=1', async () => {
    const env = await setupMemcachedEnv();
    envs.push(env);
    await env.set('n', '5');
    expect(await env.decrement('n')).toBe(4);
  });
});

describe('setupMemcachedEnv (TTL / expiry)', () => {
  it('T-MC-021 ttl returns the remaining TTL in seconds', async () => {
    const env = await setupMemcachedEnv();
    envs.push(env);
    await env.set('k', 'v', { ttlSeconds: 60 });
    const ttl = await env.ttl('k');
    expect(ttl).toBeGreaterThanOrEqual(59);
    expect(ttl).toBeLessThanOrEqual(60);
  });

  it('T-MC-022 ttl returns -1 for keys without expiry', async () => {
    const env = await setupMemcachedEnv();
    envs.push(env);
    await env.set('k', 'v');
    expect(await env.ttl('k')).toBe(-1);
  });

  it('T-MC-023 ttl returns -2 for missing keys', async () => {
    const env = await setupMemcachedEnv();
    envs.push(env);
    expect(await env.ttl('missing')).toBe(-2);
  });

  it('T-MC-024 keys with expired TTL disappear on next read', async () => {
    const env = await setupMemcachedEnv({ stub: { expiryTickMs: 5 } });
    envs.push(env);
    await env.set('k', 'v', { ttlSeconds: 0.05 });
    await new Promise((r) => setTimeout(r, 100));
    expect(await env.get('k')).toBeNull();
  });

  it('T-MC-025 assertTTL matches an exact TTL', async () => {
    const env = await setupMemcachedEnv();
    envs.push(env);
    await env.set('k', 'v', { ttlSeconds: 60 });
    // Allow drift by using a bounded check for the exact-second variant.
    await env.assertTTL('k', { atLeast: 59, atMost: 60 });
  });

  it('T-MC-026 assertTTL bounded check succeeds within range', async () => {
    const env = await setupMemcachedEnv();
    envs.push(env);
    await env.set('k', 'v', { ttlSeconds: 100 });
    await env.assertTTL('k', { atLeast: 50, atMost: 100 });
  });

  it('T-MC-027 assertTTL rejects when TTL is outside range', async () => {
    const env = await setupMemcachedEnv();
    envs.push(env);
    await env.set('k', 'v', { ttlSeconds: 10 });
    await expect(env.assertTTL('k', { atLeast: 100 })).rejects.toThrow(
      /expected TTL >= 100s/,
    );
  });
});

describe('setupMemcachedEnv (consistent hashing)', () => {
  it('T-MC-028 serverFor is deterministic for the same key', async () => {
    const env = await setupMemcachedEnv({ servers: ['a', 'b', 'c'] });
    envs.push(env);
    const first = env.serverFor('some-key');
    const second = env.serverFor('some-key');
    expect(first).toBe(second);
  });

  it('T-MC-029 serverFor distributes keys across the ring', async () => {
    const env = await setupMemcachedEnv({ servers: ['a', 'b', 'c'] });
    envs.push(env);
    const distribution = new Map<string, number>();
    for (let i = 0; i < 100; i += 1) {
      const server = env.serverFor(`key-${i}`);
      distribution.set(server, (distribution.get(server) ?? 0) + 1);
    }
    // All three servers should receive some keys — no zero-key server.
    expect(distribution.size).toBe(3);
    for (const count of distribution.values()) {
      expect(count).toBeGreaterThan(0);
    }
  });

  it('T-MC-030 entries record their owning server', async () => {
    const env = await setupMemcachedEnv({ servers: ['a', 'b', 'c'] });
    envs.push(env);
    await env.set('foo', 'bar');
    const entries = env.listEntries();
    expect(entries).toHaveLength(1);
    expect(entries[0]?.server).toBe(env.serverFor('foo'));
  });

  it('T-MC-031 rejects operations when the ring has no servers', async () => {
    // Empty servers array cannot serve any keys — first key write throws via ring.
    const env = await setupMemcachedEnv({ servers: [] });
    envs.push(env);
    await expect(env.set('k', 'v')).rejects.toThrow(/no servers configured/);
  });
});

describe('setupMemcachedEnv (flush + introspection)', () => {
  it('T-MC-032 flush wipes every key across every server', async () => {
    const env = await setupMemcachedEnv({ servers: ['a', 'b'] });
    envs.push(env);
    await env.set('k1', 'v1');
    await env.set('k2', 'v2');
    await env.flush();
    expect(env.listEntries()).toHaveLength(0);
    expect(await env.get('k1')).toBeNull();
  });

  it('T-MC-033 listEntries filters out expired entries', async () => {
    const env = await setupMemcachedEnv({ stub: { expiryTickMs: 5 } });
    envs.push(env);
    await env.set('k', 'v', { ttlSeconds: 0.05 });
    await new Promise((r) => setTimeout(r, 100));
    expect(env.listEntries()).toHaveLength(0);
  });
});

describe('setupMemcachedEnv (lifecycle)', () => {
  it('T-MC-034 stop() prevents further operations and clears state', async () => {
    const env = await setupMemcachedEnv();
    await env.set('k', 'v');
    await env.stop();
    await expect(env.set('k', 'v2')).rejects.toThrow(/cannot use env after stop/);
  });
});
