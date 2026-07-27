import { describe, expect, it } from 'vitest';
import {
  setupCacheEnv,
  setupKeyDBEnv,
  setupMemcachedEnv,
} from '../src/index.js';

describe('library documentation cache recipes', () => {
  it('stores a Redis value with a bounded TTL and cleans up the environment', async () => {
    const env = await setupCacheEnv();

    try {
      await env.set('session:1', 'user-1', { ttlSeconds: 60 });

      await env.assertTTL('session:1', { atLeast: 59, atMost: 60 });
      expect(await env.get('session:1')).toBe('user-1');
    } finally {
      await env.stop();
    }
  });

  it('delivers a Redis invalidation message and closes the subscription', async () => {
    const redis = await setupCacheEnv();
    const subscription = await redis.subscribe('cache-invalidate');

    try {
      await redis.publish('cache-invalidate', 'session:1');
      expect((await subscription.next()).message).toBe('session:1');
      await redis.assertPublished('cache-invalidate', { match: 'session:1' });
    } finally {
      await subscription.close();
      await redis.stop();
    }
  });

  it('keeps Memcached ownership and waits for a lagged KeyDB write', async () => {
    const memcached = await setupMemcachedEnv({ servers: ['a', 'b', 'c'] });
    const keydb = await setupKeyDBEnv({
      cluster: ['m-a', 'm-b'],
      stub: { replicationLagMs: 50 },
    });

    try {
      const owner = memcached.serverFor('rate:alice');
      expect(await memcached.add('rate:alice', '1', { ttlSeconds: 60 })).toBe(true);
      expect(await memcached.replace('rate:alice', '2')).toBe(true);
      expect(await memcached.increment('rate:alice')).toBe(3);
      expect(memcached.serverFor('rate:alice')).toBe(owner);

      await keydb.set('profile:1', 'ready', { master: 'm-a' });
      expect(await keydb.get('profile:1', { master: 'm-b' })).toBeNull();
      await new Promise((resolve) => setTimeout(resolve, 80));
      expect(await keydb.get('profile:1', { master: 'm-b' })).toBe('ready');
    } finally {
      await memcached.stop();
      await keydb.stop();
    }
  });
});
