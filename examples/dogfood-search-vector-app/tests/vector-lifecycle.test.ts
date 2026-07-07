/**
 * Vector lifecycle tests — walk the vector-axis end-to-end (start
 * index → add vectors → k-NN query → hybrid fuse → recall@k) and
 * assert every op appears on the neutral trace and returns the
 * expected result shape. These tests cover the mock adapter path
 * (state-machine walk) so the search v0.3 vector semantics remain
 * observable.
 */

import { describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import type { SearchHybridAdapter } from '../src/adapters/interface.js';
import {
  driveVectorLifecycle,
} from '../src/flows/search-flows.js';
import {
  FIXTURE_HYBRID_FUSION,
  FIXTURE_VECTOR_RECALL,
} from '../src/policies/query-fixtures.js';

function newMock(): SearchHybridAdapter {
  return makeMockAdapter();
}

describe('dogfood-search-vector-app — vector lifecycle', () => {
  it('T-DFSV-VL-001 startVectorIndex returns the requested backend + dims + algo', async () => {
    const mock = newMock();
    const result = await mock.startVectorIndex({
      backend: 'meilisearch',
      indexId: 'idx-1',
      dimensions: 4,
      algo: 'hnsw',
    });
    expect(result.backend).toBe('meilisearch');
    expect(result.indexId).toBe('idx-1');
    expect(result.dimensions).toBe(4);
    expect(result.algo).toBe('hnsw');
  });

  it('T-DFSV-VL-002 startVectorIndex emits vector.index_started onto the trace', async () => {
    const mock = newMock();
    await mock.startVectorIndex({
      backend: 'meilisearch',
      indexId: 'idx-1',
      dimensions: 4,
    });
    const trace = mock.trace();
    expect(trace).toHaveLength(1);
    expect(trace[0]?.op).toBe('startVectorIndex');
    expect(trace[0]?.neutralEvent).toBe('vector.index_started');
    expect(trace[0]?.ok).toBe(true);
  });

  it('T-DFSV-VL-003 startVectorIndex defaults algo to hnsw', async () => {
    const mock = newMock();
    const result = await mock.startVectorIndex({
      backend: 'typesense',
      indexId: 'idx-x',
      dimensions: 4,
    });
    expect(result.algo).toBe('hnsw');
  });

  it('T-DFSV-VL-004 addVectors records addedCount + totalCount', async () => {
    const mock = newMock();
    await mock.startVectorIndex({
      backend: 'meilisearch',
      indexId: 'idx-1',
      dimensions: 4,
    });
    const result = await mock.addVectors({
      bucket: 'meilisearch',
      indexId: 'idx-1',
      entries: FIXTURE_VECTOR_RECALL.documents,
    });
    expect(result.addedCount).toBe(FIXTURE_VECTOR_RECALL.documents.length);
    expect(result.totalCount).toBe(FIXTURE_VECTOR_RECALL.documents.length);
    expect(result.indexId).toBe('idx-1');
  });

  it('T-DFSV-VL-005 addVectors throws when dimensions mismatch the session', async () => {
    const mock = newMock();
    await mock.startVectorIndex({
      backend: 'meilisearch',
      indexId: 'idx-1',
      dimensions: 4,
    });
    await expect(
      mock.addVectors({
        bucket: 'meilisearch',
        indexId: 'idx-1',
        entries: [{ id: 'bad', vector: [1, 2] }],
      }),
    ).rejects.toThrow(/vector dim/);
  });

  it('T-DFSV-VL-006 queryKnn returns k hits sorted by score desc', async () => {
    const mock = newMock();
    await mock.startVectorIndex({
      backend: 'meilisearch',
      indexId: 'idx-1',
      dimensions: 4,
    });
    await mock.addVectors({
      bucket: 'meilisearch',
      indexId: 'idx-1',
      entries: FIXTURE_VECTOR_RECALL.documents,
    });
    const firstQuery = FIXTURE_VECTOR_RECALL.queries[0]!;
    const result = await mock.queryKnn({
      bucket: 'meilisearch',
      indexId: 'idx-1',
      query: firstQuery.queryEmbedding,
      k: firstQuery.k,
    });
    expect(result.k).toBe(firstQuery.k);
    expect(result.hits).toHaveLength(firstQuery.k);
    // Scores must be sorted descending.
    for (let i = 1; i < result.hits.length; i++) {
      expect(result.hits[i]!.score).toBeLessThanOrEqual(result.hits[i - 1]!.score);
    }
    expect(result.topScore).toBe(result.hits[0]?.score ?? 0);
  });

  it('T-DFSV-VL-007 queryKnn top hit for a red-ish query is doc-red', async () => {
    const mock = newMock();
    await mock.startVectorIndex({
      backend: 'meilisearch',
      indexId: 'idx-1',
      dimensions: 4,
    });
    await mock.addVectors({
      bucket: 'meilisearch',
      indexId: 'idx-1',
      entries: FIXTURE_VECTOR_RECALL.documents,
    });
    const result = await mock.queryKnn({
      bucket: 'meilisearch',
      indexId: 'idx-1',
      query: [0.95, 0.05, 0, 0],
      k: 2,
    });
    expect(result.hits[0]?.id).toBe('doc-red');
  });

  it('T-DFSV-VL-008 queryKnn throws when index is not built', async () => {
    const mock = newMock();
    await mock.startVectorIndex({
      backend: 'meilisearch',
      indexId: 'idx-1',
      dimensions: 4,
    });
    await expect(
      mock.queryKnn({
        bucket: 'meilisearch',
        indexId: 'idx-1',
        query: [1, 0, 0, 0],
        k: 1,
      }),
    ).rejects.toThrow(/index must be built/);
  });

  it('T-DFSV-VL-009 fuseHybrid combines vector + keyword hits by weight', async () => {
    const mock = newMock();
    await mock.startVectorIndex({
      backend: 'meilisearch',
      indexId: 'idx-1',
      dimensions: 4,
    });
    await mock.addVectors({
      bucket: 'meilisearch',
      indexId: 'idx-1',
      entries: FIXTURE_HYBRID_FUSION.documents,
    });
    const knn = await mock.queryKnn({
      bucket: 'meilisearch',
      indexId: 'idx-1',
      query: [0.7, 0.3, 0, 0],
      k: 4,
    });
    const fused = await mock.fuseHybrid({
      bucket: 'meilisearch',
      indexId: 'idx-1',
      vectorHits: knn.hits,
      keywordHits: FIXTURE_HYBRID_FUSION.keywordHits,
      weights: { vectorWeight: 0.5, keywordWeight: 0.5 },
    });
    expect(fused.fusedCount).toBeGreaterThan(0);
    expect(fused.vectorWeight).toBe(0.5);
    expect(fused.keywordWeight).toBe(0.5);
    // Fused scores must also be sorted desc.
    for (let i = 1; i < fused.fused.length; i++) {
      expect(fused.fused[i]!.score).toBeLessThanOrEqual(fused.fused[i - 1]!.score);
    }
  });

  it('T-DFSV-VL-010 fuseHybrid rejects negative weights', async () => {
    const mock = newMock();
    await mock.startVectorIndex({
      backend: 'meilisearch',
      indexId: 'idx-1',
      dimensions: 4,
    });
    await mock.addVectors({
      bucket: 'meilisearch',
      indexId: 'idx-1',
      entries: FIXTURE_VECTOR_RECALL.documents,
    });
    await mock.queryKnn({
      bucket: 'meilisearch',
      indexId: 'idx-1',
      query: [1, 0, 0, 0],
      k: 2,
    });
    await expect(
      mock.fuseHybrid({
        bucket: 'meilisearch',
        indexId: 'idx-1',
        vectorHits: [{ id: 'x', score: 1 }],
        keywordHits: [{ id: 'x', score: 1 }],
        weights: { vectorWeight: -0.1, keywordWeight: 0.5 },
      }),
    ).rejects.toThrow(/weights/);
  });

  it('T-DFSV-VL-011 recallAnn returns a recall fraction between 0 and 1', async () => {
    const mock = newMock();
    await mock.startVectorIndex({
      backend: 'meilisearch',
      indexId: 'idx-1',
      dimensions: 4,
    });
    await mock.addVectors({
      bucket: 'meilisearch',
      indexId: 'idx-1',
      entries: FIXTURE_VECTOR_RECALL.documents,
    });
    const knn = await mock.queryKnn({
      bucket: 'meilisearch',
      indexId: 'idx-1',
      query: [0.95, 0.05, 0, 0],
      k: 2,
    });
    await mock.fuseHybrid({
      bucket: 'meilisearch',
      indexId: 'idx-1',
      vectorHits: knn.hits,
      keywordHits: FIXTURE_VECTOR_RECALL.keywordHits,
      weights: { vectorWeight: 1, keywordWeight: 0 },
    });
    const groundTruth = FIXTURE_VECTOR_RECALL.groundTruth['q-red-ish']!;
    const result = await mock.recallAnn({
      bucket: 'meilisearch',
      indexId: 'idx-1',
      groundTruth,
      retrieved: knn.hits.map((h) => h.id),
    });
    expect(result.recall).toBeGreaterThanOrEqual(0);
    expect(result.recall).toBeLessThanOrEqual(1);
    expect(result.groundTruthSize).toBe(groundTruth.length);
  });

  it('T-DFSV-VL-012 recallAnn returns 1.0 when retrieved matches groundTruth exactly', async () => {
    const mock = newMock();
    await mock.startVectorIndex({
      backend: 'meilisearch',
      indexId: 'idx-1',
      dimensions: 4,
    });
    await mock.addVectors({
      bucket: 'meilisearch',
      indexId: 'idx-1',
      entries: FIXTURE_VECTOR_RECALL.documents,
    });
    const knn = await mock.queryKnn({
      bucket: 'meilisearch',
      indexId: 'idx-1',
      query: [0.95, 0.05, 0, 0],
      k: 2,
    });
    await mock.fuseHybrid({
      bucket: 'meilisearch',
      indexId: 'idx-1',
      vectorHits: knn.hits,
      keywordHits: [],
      weights: { vectorWeight: 1, keywordWeight: 0 },
    });
    const groundTruth = ['doc-red', 'doc-orange'];
    const result = await mock.recallAnn({
      bucket: 'meilisearch',
      indexId: 'idx-1',
      groundTruth,
      retrieved: ['doc-red', 'doc-orange'],
    });
    expect(result.recall).toBe(1);
  });

  it('T-DFSV-VL-013 driveVectorLifecycle emits startVectorIndex + addVectors + queryKnn ops', async () => {
    const mock = newMock();
    await driveVectorLifecycle(mock, {
      backend: 'meilisearch',
      indexId: 'lifecycle-idx',
      fixture: FIXTURE_VECTOR_RECALL,
    });
    const trace = mock.trace();
    const ops = new Set(trace.map((t) => t.op));
    expect(ops.has('startVectorIndex')).toBe(true);
    expect(ops.has('addVectors')).toBe(true);
    expect(ops.has('queryKnn')).toBe(true);
  });

  it('T-DFSV-VL-014 addVectors on unstarted bucket throws', async () => {
    const mock = newMock();
    await expect(
      mock.addVectors({
        bucket: 'meilisearch',
        indexId: 'nope',
        entries: [{ id: 'x', vector: [1, 0, 0, 0] }],
      }),
    ).rejects.toThrow(/has not been started/);
  });

  it('T-DFSV-VL-015 buckets are isolated — meilisearch + typesense hold separate indexes', async () => {
    const mock = newMock();
    await mock.startVectorIndex({
      backend: 'meilisearch',
      indexId: 'idx-m',
      dimensions: 4,
    });
    await mock.startVectorIndex({
      backend: 'typesense',
      indexId: 'idx-t',
      dimensions: 4,
    });
    await mock.addVectors({
      bucket: 'meilisearch',
      indexId: 'idx-m',
      entries: [{ id: 'a', vector: [1, 0, 0, 0] }],
    });
    // typesense bucket has no vectors yet
    const typesenseKnn = mock.queryKnn({
      bucket: 'typesense',
      indexId: 'idx-t',
      query: [1, 0, 0, 0],
      k: 1,
    });
    await expect(typesenseKnn).rejects.toThrow(/index must be built/);
  });

  it('T-DFSV-VL-016 trace emits providerEvent prefixed by target', async () => {
    const mock = newMock();
    await mock.startVectorIndex({
      backend: 'meilisearch',
      indexId: 'idx-1',
      dimensions: 4,
    });
    const trace = mock.trace();
    expect(trace[0]?.providerEvent).toBe('meilisearch.vector.index_started');
  });
});
