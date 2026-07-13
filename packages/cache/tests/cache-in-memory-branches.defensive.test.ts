import { describe, expect, it } from 'vitest';
import { createInMemoryCacheEnv } from '../src/in-memory-cache.js';

describe('createInMemoryCacheEnv defensive branches', () => {
  it('creates env with default client (ioredis)', () => {
    const env = createInMemoryCacheEnv({});
    expect(env.client).toBe('ioredis');
  });

  it('creates env with explicit client=node-redis', () => {
    const env = createInMemoryCacheEnv({ client: 'node-redis' });
    expect(env.client).toBe('node-redis');
  });

  it('get returns null for missing key', async () => {
    const env = createInMemoryCacheEnv({});
    const result = await env.get('nonexistent');
    expect(result).toBeNull();
  });

  it('get returns null for expired key (auto-cleanup on access)', async () => {
    const env = createInMemoryCacheEnv({});
    await env.set('short-lived', 'value', { ttlSeconds: 1 });
    await new Promise((r) => setTimeout(r, 1100));
    const result = await env.get('short-lived');
    expect(result).toBeNull();
  });

  it('ttl returns -2 for missing key', async () => {
    const env = createInMemoryCacheEnv({});
    const result = await env.ttl('nonexistent');
    expect(result).toBe(-2);
  });

  it('ttl returns -1 for key without expiration', async () => {
    const env = createInMemoryCacheEnv({});
    await env.set('persistent', 'value');
    const result = await env.ttl('persistent');
    expect(result).toBe(-1);
  });

  it('ttl returns -2 for expired key (race with sweep)', async () => {
    const env = createInMemoryCacheEnv({});
    await env.set('expiring', 'value', { ttlSeconds: 1 });
    await new Promise((r) => setTimeout(r, 1100));
    const result = await env.ttl('expiring');
    expect(result).toBe(-2);
  });

  it('assertTTL passes when observed matches expected seconds', async () => {
    const env = createInMemoryCacheEnv({});
    await env.set('ttl-check', 'value', { ttlSeconds: 100 });
    // TTL might be 99 or 100 depending on timing; test with a tolerance approach
    await expect(env.assertTTL('ttl-check', { atLeast: 90 })).resolves.toBeDefined();
  });

  it('publish + subscribe pattern round trip', async () => {
    const env = createInMemoryCacheEnv({});
    const sub = await env.subscribe('news');
    await env.publish('news', 'hello');
    const msg = await sub.next({ timeoutMs: 500 });
    expect(msg.message).toBe('hello');
    await sub.close();
  });

  it('subscribe.next times out when no message arrives', async () => {
    const env = createInMemoryCacheEnv({});
    const sub = await env.subscribe('quiet');
    await expect(
      sub.next({ timeoutMs: 50 }),
    ).rejects.toThrow(/timeout waiting on channel/);
    await sub.close();
  });

  it('subscribe.close is idempotent', async () => {
    const env = createInMemoryCacheEnv({});
    const sub = await env.subscribe('close-me');
    await sub.close();
    await expect(sub.close()).resolves.toBeUndefined();
  });
});
