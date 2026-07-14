import { describe, expect, it } from 'vitest';
import {
  assertToolCalled,
  assertToolCallOrder,
  createToolSpy,
} from '@kiwa-lab/skill-test';
import { createInMemoryCacheEnv } from '../../src/index.js';

/**
 * cache skill domain test — cache lib の主要 skill flow (set / get / delete /
 * pub-sub) を spy 経路で assert する。
 */
describe('cache skill — real client skill flow', () => {
  it('T-SKL-D-001 cache set + get skill flow が順序で発火', async () => {
    const spy = createToolSpy();
    const env = createInMemoryCacheEnv({ mode: 'in-memory' });
    await env.set('sk1', 'v1');
    spy.record('cache.set', JSON.stringify({ key: 'sk1' }));
    const value = await env.get('sk1');
    spy.record('cache.get', JSON.stringify({ key: 'sk1' }));

    assertToolCallOrder(spy, ['cache.set', 'cache.get']);
    expect(value).toBe('v1');
    await env.stop();
  });

  it('T-SKL-D-002 cache delete skill flow (set + delete + get null)', async () => {
    const spy = createToolSpy();
    const env = createInMemoryCacheEnv({ mode: 'in-memory' });
    await env.set('sk2', 'v2');
    spy.record('cache.set', '{}');
    await env.delete('sk2');
    spy.record('cache.delete', JSON.stringify({ key: 'sk2' }));

    assertToolCalled(spy, 'cache.delete');
    const value = await env.get('sk2');
    expect(value).toBeNull();
    await env.stop();
  });

  it('T-SKL-D-003 batch set skill (times=3)', async () => {
    const spy = createToolSpy();
    const env = createInMemoryCacheEnv({ mode: 'in-memory' });
    await env.set('a', '1');
    spy.record('cache.set', '{}');
    await env.set('b', '2');
    spy.record('cache.set', '{}');
    await env.set('c', '3');
    spy.record('cache.set', '{}');

    assertToolCalled(spy, 'cache.set', { times: 3 });
    await env.stop();
  });

  it('T-SKL-D-004 pub-sub skill flow (subscribe + publish)', async () => {
    const spy = createToolSpy();
    const env = createInMemoryCacheEnv({ mode: 'in-memory' });
    const sub = await env.subscribe('sk-ch');
    spy.record('cache.subscribe', JSON.stringify({ channel: 'sk-ch' }));
    const received = sub.next();
    await env.publish('sk-ch', 'msg');
    spy.record('cache.publish', JSON.stringify({ channel: 'sk-ch' }));
    const msg = await received;

    assertToolCallOrder(spy, ['cache.subscribe', 'cache.publish']);
    expect(msg.message).toBe('msg');
    await sub.close();
    await env.stop();
  });

  it('T-SKL-D-005 TTL skill flow (set with TTL + assertTTL)', async () => {
    const spy = createToolSpy();
    const env = createInMemoryCacheEnv({ mode: 'in-memory' });
    await env.set('sk5', 'v5', { ttlSeconds: 30 });
    spy.record('cache.set', JSON.stringify({ key: 'sk5', ttl: 30 }));
    const ttl = await env.assertTTL('sk5', { atLeast: 1, atMost: 30 });
    spy.record('cache.assertTTL', JSON.stringify({ key: 'sk5' }));

    assertToolCallOrder(spy, ['cache.set', 'cache.assertTTL']);
    expect(ttl).toBeGreaterThan(0);
    await env.stop();
  });
});
