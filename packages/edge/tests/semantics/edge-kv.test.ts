import { describe, expect, it } from 'vitest';
import {
  createEdgeKvSession,
  kvRangeQuery,
  kvRead,
  kvWrite,
  platformEventName,
  type EdgePlatform,
} from '../../src/index.js';

const platforms: EdgePlatform[] = ['cloudflare', 'vercel', 'deno'];

describe('edge-kv axis — 3 platform', () => {
  it.each(platforms)('%s: write → read (cold) → read (warm) cache flow', (platform) => {
    const session = createEdgeKvSession({ platform });
    const write = kvWrite(session, { key: 'k', value: 'v' });
    expect(write.neutralEvent).toBe('kv.write');

    const cold = kvRead(session, { key: 'k' });
    expect(cold.neutralEvent).toBe('kv.read');
    expect(cold.metadata.hit).toBe(false);
    expect(session.cache.get('k')).toBe('v');

    const warm = kvRead(session, { key: 'k' });
    expect(warm.neutralEvent).toBe('kv.cache-hit');
    expect(warm.metadata.hit).toBe(true);
  });

  it.each(platforms)('%s: missing key emits cache-miss with platform dialect', (platform) => {
    const session = createEdgeKvSession({ platform });
    const miss = kvRead(session, { key: 'absent' });
    expect(miss.neutralEvent).toBe('kv.cache-miss');
    expect(miss.platformEvent).toBe(platformEventName(platform, 'kv.cache-miss'));
    expect(miss.metadata.hit).toBe(false);
  });

  it('write invalidates a warm cache entry', () => {
    const session = createEdgeKvSession({ platform: 'cloudflare' });
    kvWrite(session, { key: 'k', value: 'v1' });
    kvRead(session, { key: 'k' });
    expect(session.cache.has('k')).toBe(true);
    kvWrite(session, { key: 'k', value: 'v2' });
    expect(session.cache.has('k')).toBe(false);
    const reread = kvRead(session, { key: 'k' });
    expect(reread.neutralEvent).toBe('kv.read');
  });

  it('defaults to eventual consistency + honours explicit state', () => {
    const def = createEdgeKvSession({ platform: 'deno' });
    expect(def.state).toBe('eventually-consistent');
    const strong = createEdgeKvSession({ platform: 'deno', state: 'consistent' });
    expect(strong.state).toBe('consistent');
    expect(kvWrite(strong, { key: 'k', value: 'v' }).state).toBe('consistent');
  });

  it('range query filters + sorts by prefix and respects limit', () => {
    const session = createEdgeKvSession({ platform: 'vercel' });
    kvWrite(session, { key: 'user:2', value: 'b' });
    kvWrite(session, { key: 'user:1', value: 'a' });
    kvWrite(session, { key: 'post:1', value: 'p' });
    const { matches, step } = kvRangeQuery(session, { prefix: 'user:', limit: 1 });
    expect(matches).toEqual(['user:1']);
    expect(step.neutralEvent).toBe('kv.read');
    expect(step.metadata.matched).toBe(1);
    expect(step.metadata.prefix).toBe('user:');
    expect(step.metadata.limit).toBe(1);
  });

  it('history accumulates a step per read + write', () => {
    const session = createEdgeKvSession({ platform: 'cloudflare' });
    kvWrite(session, { key: 'k', value: 'v' });
    kvRead(session, { key: 'k' });
    kvRead(session, { key: 'missing' });
    expect(session.history.map((s) => s.neutralEvent)).toEqual([
      'kv.write',
      'kv.read',
      'kv.cache-miss',
    ]);
  });
});
