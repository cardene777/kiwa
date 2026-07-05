/**
 * Vercel KV cache invalidation e2e spec (edge-kv axis focus).
 *
 * Sub-Issue GH-916 (v1.24-3) AC — Vercel KV Redis read/write + cache
 * invalidation + range query + edge cache API integration. Covers the
 * edge-kv axis (kvRead / kvWrite / kvRangeQuery + cache hit/miss) end-to-
 * end.
 *
 * Fidelity axes covered here:
 *  1. First read of an absent key returns null via the `cache-miss` path.
 *  2. Write persists to the backing store and clears the cache entry so
 *     the next read is `read` (read-through), not `cache-hit`.
 *  3. Second read after a write is served from cache (`cache-hit`).
 *  4. Rewriting the same key invalidates the cache entry (subsequent
 *     read is `read`, not `cache-hit`).
 *  5. Range query returns matching keys sorted lexicographically —
 *     matches Vercel KV Redis SCAN MATCH semantics.
 *  6. Empty range query returns [] with count 0.
 *  7. HTTP /api/kv route drives the adapter via handleKvGet / handleKvPost.
 *  8. Cache invalidation happens on every write, even when the value is
 *     unchanged (adapter records invalidatedCache = true when the cache
 *     was warm).
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/lib/mock.js';
import { makeRealAdapter, SkippedError } from '../src/lib/real.js';
import {
  handleKvGet,
  handleKvPost,
  handleKvRange,
} from '../src/app/api/kv/route.js';

describe('mock adapter — Vercel KV cache invalidation', () => {
  let adapter: ReturnType<typeof makeMockAdapter>;

  beforeEach(() => {
    adapter = makeMockAdapter();
  });

  afterEach(async () => {
    await adapter.reset();
  });

  it('axis 1: first read of an absent key is cache-miss', async () => {
    const snapshot = await adapter.driveKvRead({ key: 'kv:absent' });
    expect(snapshot.value).toBeNull();
    expect(snapshot.hitPath).toBe('cache-miss');
  });

  it('axis 2: write clears cache; next read is read-through (not cache-hit)', async () => {
    // Warm the cache first by reading + writing.
    await adapter.driveKvWrite({ key: 'kv:k1', value: 'v1' });
    await adapter.driveKvRead({ key: 'kv:k1' }); // populates cache
    // Overwrite — invalidates cache entry.
    const write = await adapter.driveKvWrite({ key: 'kv:k1', value: 'v2' });
    expect(write.invalidatedCache).toBe(true);
    // Next read must go through to the store, not serve stale cache.
    const read = await adapter.driveKvRead({ key: 'kv:k1' });
    expect(read.value).toBe('v2');
    expect(read.hitPath).toBe('read');
  });

  it('axis 3: second read after a first read is served from cache', async () => {
    await adapter.driveKvWrite({ key: 'kv:k2', value: 'hello' });
    const first = await adapter.driveKvRead({ key: 'kv:k2' });
    expect(first.hitPath).toBe('read'); // populated cache
    const second = await adapter.driveKvRead({ key: 'kv:k2' });
    expect(second.hitPath).toBe('cache-hit');
    expect(second.value).toBe('hello');
  });

  it('axis 4: unchanged rewrite still invalidates when cache was warm', async () => {
    await adapter.driveKvWrite({ key: 'kv:k3', value: 'same' });
    await adapter.driveKvRead({ key: 'kv:k3' }); // warm cache
    const rewrite = await adapter.driveKvWrite({ key: 'kv:k3', value: 'same' });
    expect(rewrite.invalidatedCache).toBe(true);
  });

  it('axis 5: range query returns matching keys sorted lexicographically', async () => {
    // Insertion order intentionally scrambled — output must be sorted.
    await adapter.driveKvWrite({ key: 'user:bob', value: '2' });
    await adapter.driveKvWrite({ key: 'user:alice', value: '1' });
    await adapter.driveKvWrite({ key: 'user:carol', value: '3' });
    // Non-matching key must not leak.
    await adapter.driveKvWrite({ key: 'session:tok', value: 'x' });
    const range = await adapter.driveKvRangeQuery({ prefix: 'user:' });
    expect(range.keys).toEqual(['user:alice', 'user:bob', 'user:carol']);
    expect(range.count).toBe(3);
  });

  it('axis 6: empty range query returns [] with count 0', async () => {
    await adapter.driveKvWrite({ key: 'other:1', value: 'x' });
    const range = await adapter.driveKvRangeQuery({ prefix: 'nomatch:' });
    expect(range.keys).toEqual([]);
    expect(range.count).toBe(0);
  });

  it('axis 7: /api/kv HTTP surface drives GET / POST via the adapter', async () => {
    const post = await handleKvPost(adapter, {
      key: 'kv:http:1',
      value: 'via-route',
    });
    expect(post.status).toBe(200);
    expect(post.body.ok).toBe(true);
    expect(post.body.key).toBe('kv:http:1');

    const get = await handleKvGet(adapter, { key: 'kv:http:1' });
    expect(get.status).toBe(200);
    expect(get.body.value).toBe('via-route');
    // Read-through populates cache; hitPath is 'read' on first fetch.
    expect(get.body.hitPath).toBe('read');

    const get2 = await handleKvGet(adapter, { key: 'kv:http:1' });
    expect(get2.body.hitPath).toBe('cache-hit');
  });

  it('axis 7b: GET on an absent key returns 404 with null value', async () => {
    const get = await handleKvGet(adapter, { key: 'kv:http:absent' });
    expect(get.status).toBe(404);
    expect(get.body.value).toBeNull();
    expect(get.body.hitPath).toBe('cache-miss');
  });

  it('axis 8: /api/kv range surface returns prefix-matched keys', async () => {
    await adapter.driveKvWrite({ key: 'cart:u1:item:a', value: '1' });
    await adapter.driveKvWrite({ key: 'cart:u1:item:b', value: '2' });
    await adapter.driveKvWrite({ key: 'cart:u2:item:a', value: '3' });
    const range = await handleKvRange(adapter, { prefix: 'cart:u1:' });
    expect(range.status).toBe(200);
    expect(range.body.keys).toEqual(['cart:u1:item:a', 'cart:u1:item:b']);
    expect(range.body.count).toBe(2);
  });

  it('axis 9: metrics counters + latency samples accumulate on every KV op', async () => {
    await adapter.driveKvWrite({ key: 'metrics:k', value: 'v' });
    await adapter.driveKvRead({ key: 'metrics:k' });
    await adapter.driveKvRangeQuery({ prefix: 'metrics:' });
    const m = adapter.metrics();
    expect(m.kvWriteCount).toBe(1);
    expect(m.kvReadCount).toBe(1);
    expect(m.kvRangeQueryCount).toBe(1);
    expect(m.latencySamplesMs.length).toBe(3);
  });
});

describe('real adapter — env-gate skip path', () => {
  it('records KIWA_VERCEL_EDGE_ENV_MISSING for KV read when env absent', async () => {
    const real = makeRealAdapter();
    await expect(real.driveKvRead({ key: 'r' })).rejects.toBeInstanceOf(
      SkippedError,
    );
    expect(real.traces()[0]?.errorKind).toBe('KIWA_VERCEL_EDGE_ENV_MISSING');
  });

  it('records KIWA_VERCEL_EDGE_ENV_MISSING for KV write when env absent', async () => {
    const real = makeRealAdapter();
    await expect(
      real.driveKvWrite({ key: 'r', value: 'v' }),
    ).rejects.toBeInstanceOf(SkippedError);
    expect(real.traces()[0]?.errorKind).toBe('KIWA_VERCEL_EDGE_ENV_MISSING');
  });

  it('records KIWA_VERCEL_EDGE_ENV_MISSING for KV range query when env absent', async () => {
    const real = makeRealAdapter();
    await expect(
      real.driveKvRangeQuery({ prefix: 'user:' }),
    ).rejects.toBeInstanceOf(SkippedError);
    expect(real.traces()[0]?.errorKind).toBe('KIWA_VERCEL_EDGE_ENV_MISSING');
  });
});
