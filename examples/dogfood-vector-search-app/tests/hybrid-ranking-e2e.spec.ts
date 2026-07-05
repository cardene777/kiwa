import { describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import { sampleDocRow } from '../src/adapters/interface.js';
import { ivfFlatIndex } from '../src/index-store/index.js';

describe('hybrid ranking — semantic + BM25 weighted fusion', () => {
  it('T-DVH-001 vectorWeight=1 makes ranking purely semantic', async () => {
    const adapter = makeMockAdapter();
    const docs = [
      sampleDocRow({
        documentId: 'a',
        body: 'apples oranges',
        embedding: [1, 0, 0, 0],
      }),
      sampleDocRow({
        documentId: 'b',
        body: 'apples pears',
        embedding: [0, 1, 0, 0],
      }),
    ];
    const index = ivfFlatIndex({ name: 'h-1', dimensions: 4, lists: 2 });
    const out = await adapter.driveHybridSearch({
      docs,
      index,
      distanceKind: 'cosine',
      vectorWeight: 1,
      query: { embedding: [1, 0, 0, 0], keyword: 'pears', topK: 2 },
    });
    // Pure semantic: doc a (query-aligned vector) should out-rank doc b
    // despite b matching the keyword.
    expect(out.rankedIds[0]).toBe('a');
    expect(out.vectorWeight).toBe(1);
    expect(out.keywordWeight).toBe(0);
    await adapter.reset();
  });

  it('T-DVH-002 vectorWeight=0 makes ranking purely keyword (BM25)', async () => {
    const adapter = makeMockAdapter();
    const docs = [
      sampleDocRow({
        documentId: 'a',
        body: 'apples oranges',
        embedding: [1, 0, 0, 0],
      }),
      sampleDocRow({
        documentId: 'b',
        body: 'apples pears',
        embedding: [0, 1, 0, 0],
      }),
    ];
    const index = ivfFlatIndex({ name: 'h-2', dimensions: 4, lists: 2 });
    const out = await adapter.driveHybridSearch({
      docs,
      index,
      distanceKind: 'cosine',
      vectorWeight: 0,
      query: { embedding: [1, 0, 0, 0], keyword: 'pears', topK: 2 },
    });
    // Pure keyword: b matches "pears", a does not — so b out-ranks a.
    expect(out.rankedIds[0]).toBe('b');
    expect(out.vectorWeight).toBe(0);
    expect(out.keywordWeight).toBe(1);
    await adapter.reset();
  });

  it('T-DVH-003 vectorWeight in (0, 1) fuses both scores', async () => {
    const adapter = makeMockAdapter();
    const docs = [
      sampleDocRow({
        documentId: 'a',
        body: 'apples oranges',
        embedding: [1, 0, 0, 0],
      }),
      sampleDocRow({
        documentId: 'b',
        body: 'apples pears',
        embedding: [0, 1, 0, 0],
      }),
    ];
    const index = ivfFlatIndex({ name: 'h-3', dimensions: 4, lists: 2 });
    const out = await adapter.driveHybridSearch({
      docs,
      index,
      distanceKind: 'cosine',
      vectorWeight: 0.5,
      query: { embedding: [1, 0, 0, 0], keyword: 'pears', topK: 2 },
    });
    expect(out.scores.length).toBe(2);
    // Fused: neither doc dominates trivially; scores should be positive
    // and finite.
    for (const s of out.scores) {
      expect(s).toBeGreaterThan(0);
      expect(Number.isFinite(s)).toBe(true);
    }
    await adapter.reset();
  });

  it('T-DVH-004 tie-breaker sorts by document id ascending', async () => {
    const adapter = makeMockAdapter();
    // Two identical docs with different ids so scores tie.
    const docs = [
      sampleDocRow({ documentId: 'b', body: 'same body', embedding: [1, 0, 0, 0] }),
      sampleDocRow({ documentId: 'a', body: 'same body', embedding: [1, 0, 0, 0] }),
    ];
    const index = ivfFlatIndex({ name: 'h-4', dimensions: 4, lists: 2 });
    const out = await adapter.driveHybridSearch({
      docs,
      index,
      distanceKind: 'cosine',
      vectorWeight: 0.5,
      query: { embedding: [1, 0, 0, 0], keyword: 'same', topK: 2 },
    });
    expect(out.rankedIds).toEqual(['a', 'b']);
    await adapter.reset();
  });

  it('T-DVH-005 vectorWeight out of [0, 1] throws', async () => {
    const adapter = makeMockAdapter();
    const docs = [sampleDocRow({ embedding: [1, 0, 0, 0] })];
    const index = ivfFlatIndex({ name: 'h-5', dimensions: 4, lists: 2 });
    await expect(
      adapter.driveHybridSearch({
        docs,
        index,
        distanceKind: 'cosine',
        vectorWeight: 1.5,
        query: { embedding: [1, 0, 0, 0], keyword: 'anything', topK: 1 },
      }),
    ).rejects.toThrowError(/vectorWeight 1\.5 must be in \[0, 1\]/);
    await adapter.reset();
  });

  it('T-DVH-006 driveSemanticSearch returns cosine-ranked ids', async () => {
    const adapter = makeMockAdapter();
    const docs = [
      sampleDocRow({ documentId: 'a', body: 'x', embedding: [0, 0, 1, 0] }),
      sampleDocRow({ documentId: 'b', body: 'y', embedding: [1, 0, 0, 0] }),
      sampleDocRow({ documentId: 'c', body: 'z', embedding: [0, 1, 0, 0] }),
    ];
    const index = ivfFlatIndex({ name: 'h-6', dimensions: 4, lists: 2 });
    const out = await adapter.driveSemanticSearch({
      docs,
      index,
      distanceKind: 'cosine',
      query: { embedding: [1, 0, 0, 0], keyword: '', topK: 3 },
    });
    // b is the closest match (identical direction), a + c are equally
    // orthogonal to the query.
    expect(out.rankedIds[0]).toBe('b');
    expect(out.distances[0]).toBeCloseTo(0, 6);
    expect(out.distanceKind).toBe('cosine');
    await adapter.reset();
  });
});
