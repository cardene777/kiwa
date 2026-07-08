import { afterEach, describe, expect, it } from 'vitest';
import { setupMemcachedEnv, type MemcachedTestEnv } from '@kiwa/cache';
import { createSessionCache } from '../src/session-cache.js';

const envs: MemcachedTestEnv[] = [];

afterEach(async () => {
  while (envs.length > 0) {
    const env = envs.pop();
    if (env) await env.stop();
  }
});

async function makeEnv(): Promise<MemcachedTestEnv> {
  const env = await setupMemcachedEnv({
    servers: ['stub-a', 'stub-b', 'stub-c'],
    stub: { expiryTickMs: 5 },
  });
  envs.push(env);
  return env;
}

describe('Memcached PoC — session cache (happy path)', () => {
  it('T-MC-POC-001 register creates a session and initializes pageview counter', async () => {
    const env = await makeEnv();
    const cache = createSessionCache(env, 60);
    const ok = await cache.register('u-1', 'token-1');
    expect(ok).toBe(true);
    const state = await cache.fetch('u-1');
    expect(state).toEqual({ userId: 'u-1', token: 'token-1', pageviews: 0 });
  });

  it('T-MC-POC-002 duplicate register returns false and does not overwrite', async () => {
    const env = await makeEnv();
    const cache = createSessionCache(env, 60);
    await cache.register('u-1', 'first');
    const ok = await cache.register('u-1', 'second');
    expect(ok).toBe(false);
    const state = await cache.fetch('u-1');
    expect(state?.token).toBe('first');
  });

  it('T-MC-POC-003 pageview counter increments across events', async () => {
    const env = await makeEnv();
    const cache = createSessionCache(env, 60);
    await cache.register('u-1', 'token');
    await cache.recordPageview('u-1');
    await cache.recordPageview('u-1');
    await cache.recordPageview('u-1');
    const state = await cache.fetch('u-1');
    expect(state?.pageviews).toBe(3);
  });

  it('T-MC-POC-004 rotate replaces the token only if session exists', async () => {
    const env = await makeEnv();
    const cache = createSessionCache(env, 60);
    // No session yet — rotate refuses.
    expect(await cache.rotate('u-1', 'v2')).toBe(false);
    await cache.register('u-1', 'v1');
    expect(await cache.rotate('u-1', 'v2')).toBe(true);
    const state = await cache.fetch('u-1');
    expect(state?.token).toBe('v2');
  });
});

describe('Memcached PoC — session cache (lifecycle)', () => {
  it('T-MC-POC-005 logout removes token and counter', async () => {
    const env = await makeEnv();
    const cache = createSessionCache(env, 60);
    await cache.register('u-1', 'token');
    await cache.recordPageview('u-1');
    const removed = await cache.logout('u-1');
    expect(removed).toBe(true);
    expect(await cache.fetch('u-1')).toBeNull();
  });

  it('T-MC-POC-006 expired sessions disappear without explicit logout', async () => {
    const env = await makeEnv();
    const cache = createSessionCache(env, 0.05);
    await cache.register('u-1', 'token');
    await new Promise((r) => setTimeout(r, 100));
    expect(await cache.fetch('u-1')).toBeNull();
  });
});

describe('Memcached PoC — consistent hashing', () => {
  it('T-MC-POC-007 session keys distribute across the ring', async () => {
    const env = await makeEnv();
    const cache = createSessionCache(env, 60);
    for (let i = 0; i < 30; i += 1) {
      await cache.register(`u-${i}`, `token-${i}`);
    }
    const entries = env.listEntries();
    const serversSeen = new Set(entries.map((e) => e.server));
    // Some keys land on each of the three servers.
    expect(serversSeen.size).toBeGreaterThanOrEqual(2);
  });

  it('T-MC-POC-008 flushAll wipes every session across every server', async () => {
    const env = await makeEnv();
    const cache = createSessionCache(env, 60);
    for (let i = 0; i < 5; i += 1) {
      await cache.register(`u-${i}`, `token-${i}`);
    }
    await cache.flushAll();
    expect(env.listEntries()).toHaveLength(0);
    for (let i = 0; i < 5; i += 1) {
      expect(await cache.fetch(`u-${i}`)).toBeNull();
    }
  });
});
