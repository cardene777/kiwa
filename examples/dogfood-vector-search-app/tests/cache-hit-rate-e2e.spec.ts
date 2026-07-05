import { describe, expect, it } from 'vitest';
import { cacheKey, createEmbeddingCache } from '../src/cache/index.js';
import { makeMockAdapter } from '../src/adapters/mock.js';
import { sampleDocRow } from '../src/adapters/interface.js';

describe('embedding cache — hit rate + on-demand re-index invalidation', () => {
  it('T-DVC-001 cacheKey is deterministic across identical inputs', () => {
    const k1 = cacheKey({ body: 'the quick brown fox', model: 'kiwa-mock-embed-v1' });
    const k2 = cacheKey({ body: 'the quick brown fox', model: 'kiwa-mock-embed-v1' });
    expect(k1).toBe(k2);
    expect(k1).toHaveLength(8);
  });

  it('T-DVC-002 cacheKey differentiates model name changes', () => {
    const k1 = cacheKey({ body: 'x', model: 'model-a' });
    const k2 = cacheKey({ body: 'x', model: 'model-b' });
    expect(k1).not.toBe(k2);
  });

  it('T-DVC-003 empty cache reports 0 hit rate + get returns undefined', () => {
    const c = createEmbeddingCache({ maxEntries: 4 });
    expect(c.get('nope')).toBeUndefined();
    const m = c.metrics();
    expect(m.hits).toBe(0);
    expect(m.misses).toBe(1);
    expect(m.hitRate).toBe(0);
  });

  it('T-DVC-004 set + get produces hit + updates metrics', () => {
    const c = createEmbeddingCache({ maxEntries: 4 });
    c.set('k1', [0.1, 0.2]);
    const v = c.get('k1');
    expect(v).toEqual([0.1, 0.2]);
    const m = c.metrics();
    expect(m.hits).toBe(1);
    expect(m.misses).toBe(0);
    expect(m.hitRate).toBe(1);
  });

  it('T-DVC-005 maxEntries evicts oldest entry when exceeded', () => {
    const c = createEmbeddingCache({ maxEntries: 2 });
    c.set('a', [1]);
    c.set('b', [2]);
    c.set('c', [3]); // evicts 'a'
    expect(c.get('a')).toBeUndefined();
    expect(c.get('b')).toEqual([2]);
    expect(c.get('c')).toEqual([3]);
  });

  it('T-DVC-006 delete returns true when key existed and false otherwise', () => {
    const c = createEmbeddingCache({ maxEntries: 4 });
    c.set('present', [1]);
    expect(c.delete('present')).toBe(true);
    expect(c.delete('absent')).toBe(false);
    expect(c.get('present')).toBeUndefined();
  });

  it('T-DVC-007 driveCacheHitRate reports hits after 2 lookup passes', async () => {
    const adapter = makeMockAdapter();
    const docs = [sampleDocRow({ documentId: 'a', embedding: [0.1, 0.2, 0.3, 0.4] })];
    const out = await adapter.driveCacheHitRate({
      docs,
      lookups: [
        { key: 'query-1', expectedEmbedding: [0.1, 0.2, 0.3, 0.4] },
        { key: 'query-2', expectedEmbedding: [0.5, 0.6, 0.7, 0.8] },
      ],
      reindex: false,
    });
    // Second pass in the mock does get→set→get per lookup so hit rate
    // is exactly 50% (miss then hit per key).
    expect(out.hits).toBe(out.misses);
    expect(out.hitRate).toBeCloseTo(0.5, 6);
    expect(out.reindexed).toBe(false);
    await adapter.reset();
  });

  it('T-DVC-008 driveCacheHitRate with reindex=true still reports the same window shape', async () => {
    const adapter = makeMockAdapter();
    const docs = [sampleDocRow({ documentId: 'a', embedding: [0.1, 0.2, 0.3, 0.4] })];
    const out = await adapter.driveCacheHitRate({
      docs,
      lookups: [{ key: 'query-1', expectedEmbedding: [0.1, 0.2, 0.3, 0.4] }],
      reindex: true,
    });
    expect(out.reindexed).toBe(true);
    expect(out.totalLookups).toBeGreaterThan(0);
    await adapter.reset();
  });

  it('T-DVC-009 reset zeroes hits + misses + size', () => {
    const c = createEmbeddingCache({ maxEntries: 4 });
    c.set('a', [1]);
    c.get('a');
    c.get('missing');
    c.reset();
    const m = c.metrics();
    expect(m.hits).toBe(0);
    expect(m.misses).toBe(0);
    expect(m.size).toBe(0);
  });
});
