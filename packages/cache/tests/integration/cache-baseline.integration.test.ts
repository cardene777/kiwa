import { describe, expect, it } from 'vitest';
import { createInMemoryCacheEnv } from '../../src/index.js';

/**
 * cache integration domain test — real cache client (createInMemoryCacheEnv) で
 * get / set / delete / expire / pub-sub workflow を end-to-end で assert する。
 */
describe('cache integration — real client workflow', () => {
  it('T-INT-D-001 set + get round-trip', async () => {
    const env = createInMemoryCacheEnv({ mode: 'in-memory' });
    await env.set('key1', 'value1');
    const value = await env.get('key1');
    expect(value).toBe('value1');
    await env.stop();
  });

  it('T-INT-D-002 delete で key を除去', async () => {
    const env = createInMemoryCacheEnv({ mode: 'in-memory' });
    await env.set('key2', 'value2');
    const deletedCount = await env.delete('key2');
    expect(deletedCount).toBe(1);
    const value = await env.get('key2');
    expect(value).toBeNull();
    await env.stop();
  });

  it('T-INT-D-003 set with TTL + expire manipulation', async () => {
    const env = createInMemoryCacheEnv({ mode: 'in-memory' });
    await env.set('ttl-key', 'ttl-value', { ttlSeconds: 60 });
    const ttl = await env.assertTTL('ttl-key', { atLeast: 1, atMost: 60 });
    expect(ttl).toBeGreaterThan(0);
    expect(ttl).toBeLessThanOrEqual(60);
    await env.stop();
  });

  it('T-INT-D-004 publish + subscribe pub-sub flow', async () => {
    const env = createInMemoryCacheEnv({ mode: 'in-memory' });
    const sub = await env.subscribe('channel1');
    const receivedPromise = sub.next();
    await env.publish('channel1', 'hello');
    const message = await receivedPromise;
    expect(message.channel).toBe('channel1');
    expect(message.message).toBe('hello');
    await sub.close();
    await env.stop();
  });

  it('T-INT-D-005 複数 set + get で isolation', async () => {
    const env = createInMemoryCacheEnv({ mode: 'in-memory' });
    await env.set('a', '1');
    await env.set('b', '2');
    await env.set('c', '3');
    expect(await env.get('a')).toBe('1');
    expect(await env.get('b')).toBe('2');
    expect(await env.get('c')).toBe('3');
    await env.stop();
  });
});
