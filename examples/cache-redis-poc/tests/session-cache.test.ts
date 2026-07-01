import { afterEach, describe, expect, it } from 'vitest';
import { setupCacheEnv, type CacheTestEnv } from '@kiwa-test/cache';
import {
  SESSION_INVALIDATE_CHANNEL,
  extendSession,
  invalidateSession,
  readSession,
  storeSession,
  type SessionPayload,
} from '../src/session-cache.js';

const envs: CacheTestEnv[] = [];

afterEach(async () => {
  while (envs.length > 0) {
    const env = envs.pop();
    if (env) await env.stop();
  }
});

async function boot(): Promise<CacheTestEnv> {
  const env = await setupCacheEnv();
  envs.push(env);
  return env;
}

const alice: SessionPayload = {
  userId: 'u-101',
  email: 'alice@example.test',
  role: 'member',
};

describe('cache PoC — happy path', () => {
  it('T-CACHE-POC-001 stores and reads back a signup session', async () => {
    const env = await boot();
    await storeSession(env, 'sess-1', alice);
    const readBack = await readSession(env, 'sess-1');
    expect(readBack).toEqual(alice);
  });

  it('T-CACHE-POC-002 attaches the configured 15-minute TTL to a fresh session', async () => {
    const env = await boot();
    await storeSession(env, 'sess-1', alice);
    await env.assertTTL('session:sess-1', { atLeast: 890, atMost: 900 });
  });
});

describe('cache PoC — invalidation + Pub/Sub notification', () => {
  it('T-CACHE-POC-003 invalidateSession removes the key and publishes on the channel', async () => {
    const env = await boot();
    await storeSession(env, 'sess-1', alice);
    const sub = await env.subscribe(SESSION_INVALIDATE_CHANNEL);
    const result = await invalidateSession(env, 'sess-1');
    expect(result.deleted).toBe(true);
    expect(await readSession(env, 'sess-1')).toBeNull();
    const notice = await sub.next();
    expect(JSON.parse(notice.message)).toEqual({ sessionId: 'sess-1', at: 'now' });
    await sub.close();
  });

  it('T-CACHE-POC-004 invalidating a missing session reports deleted=false but still notifies', async () => {
    const env = await boot();
    const sub = await env.subscribe(SESSION_INVALIDATE_CHANNEL);
    const result = await invalidateSession(env, 'never-existed');
    expect(result.deleted).toBe(false);
    const notice = await sub.next();
    expect(notice.message).toContain('never-existed');
    await sub.close();
  });

  it('T-CACHE-POC-005 assertPublished catches the invalidation notice by RegExp match', async () => {
    const env = await boot();
    await storeSession(env, 'sess-1', alice);
    await env.subscribe(SESSION_INVALIDATE_CHANNEL);
    await invalidateSession(env, 'sess-1');
    await env.assertPublished(SESSION_INVALIDATE_CHANNEL, {
      match: /"sessionId":"sess-1"/,
    });
  });
});

describe('cache PoC — TTL extension', () => {
  it('T-CACHE-POC-006 extendSession pushes the TTL out to the requested window', async () => {
    const env = await boot();
    await storeSession(env, 'sess-1', alice);
    const extended = await extendSession(env, 'sess-1', 3600);
    expect(extended).toBe(true);
    await env.assertTTL('session:sess-1', { atLeast: 3590, atMost: 3600 });
  });

  it('T-CACHE-POC-007 extendSession returns false when the session has already expired / been deleted', async () => {
    const env = await boot();
    const extended = await extendSession(env, 'gone', 60);
    expect(extended).toBe(false);
  });
});

describe('cache PoC — expiration semantics', () => {
  it('T-CACHE-POC-008 an expired session reads back as null', async () => {
    const env = await setupCacheEnv({ inMemory: { expiryTickMs: 5 } });
    envs.push(env);
    // Skip the storeSession helper — we need a 1-second TTL for a fast test.
    await env.set('session:short', JSON.stringify(alice), { ttlSeconds: 1 });
    await new Promise((resolve) => setTimeout(resolve, 1200));
    expect(await env.get('session:short')).toBeNull();
  });
});
