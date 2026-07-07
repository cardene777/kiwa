import { describe, expect, it } from 'vitest';
import {
  buildVectorIndex,
  fuseHybrid,
  queryKnn,
  recallAnn,
  startVectorSession,
} from '../../src/semantics/index.js';

const sampleVectors = [
  { id: 'a', vector: [1, 0, 0] },
  { id: 'b', vector: [0, 1, 0] },
  { id: 'c', vector: [1, 1, 0] },
  { id: 'd', vector: [0, 0, 1] },
];

describe('vector axis — happy path', () => {
  it('runs full 4-step lifecycle', () => {
    const s = startVectorSession({ target: 'meilisearch', indexId: 'docs', dimensions: 3 });
    buildVectorIndex(s, sampleVectors);
    const knn = queryKnn(s, [1, 0, 0], 2);
    const hybrid = fuseHybrid(s, {
      vectorHits: knn.hits,
      keywordHits: [{ id: 'a', score: 1 }],
      vectorWeight: 0.7,
      keywordWeight: 0.3,
    });
    recallAnn(s, {
      groundTruth: ['a'],
      retrieved: hybrid.fused.map((h) => h.id),
    });
    expect(s.state).toBe('ann-recalled');
    expect(s.history.map((h) => h.neutralEvent)).toEqual([
      'vector.index_built',
      'vector.knn_queried',
      'vector.hybrid_fused',
      'vector.ann_recalled',
    ]);
  });

  it('knn ranks by cosine similarity descending', () => {
    const s = startVectorSession({ target: 'typesense', indexId: 'x', dimensions: 3 });
    buildVectorIndex(s, sampleVectors);
    const { hits } = queryKnn(s, [1, 0, 0], 4);
    expect(hits[0]?.id).toBe('a');
    expect(hits[0]?.score).toBeCloseTo(1, 6);
    expect(hits[hits.length - 1]?.id).toBe('d');
  });

  it('hybrid fusion combines vector + keyword weights', () => {
    const s = startVectorSession({ target: 'algolia', indexId: 'x', dimensions: 3 });
    buildVectorIndex(s, sampleVectors);
    const knn = queryKnn(s, [1, 1, 0], 4);
    const { fused } = fuseHybrid(s, {
      vectorHits: knn.hits,
      keywordHits: [{ id: 'd', score: 1 }],
      vectorWeight: 0.5,
      keywordWeight: 2,
    });
    expect(fused[0]?.id).toBe('d');
  });

  it('recall = matched/groundTruth ratio', () => {
    const s = startVectorSession({ target: 'opensearch-oss', indexId: 'x', dimensions: 3 });
    buildVectorIndex(s, sampleVectors);
    queryKnn(s, [1, 0, 0], 4);
    const { recall } = recallAnn(s, {
      groundTruth: ['a', 'b'],
      retrieved: ['a', 'x'],
    });
    expect(recall).toBeCloseTo(0.5, 6);
  });

  it('translates provider event for each target', () => {
    for (const target of ['meilisearch', 'typesense', 'algolia', 'opensearch-oss'] as const) {
      const s = startVectorSession({ target, indexId: 'x', dimensions: 3 });
      const step = buildVectorIndex(s, sampleVectors);
      expect(step.providerEvent).not.toBe(step.neutralEvent);
      expect(step.providerEvent).toMatch(/vector|knn/i);
    }
  });

  it('supports HNSW / IVF / flat algorithms', () => {
    for (const algo of ['hnsw', 'ivf', 'flat'] as const) {
      const s = startVectorSession({ target: 'algolia', indexId: 'x', dimensions: 3, algo });
      const step = buildVectorIndex(s, sampleVectors);
      expect(step.metadata.algo).toBe(algo);
    }
  });
});

describe('vector axis — invariant guards', () => {
  it('rejects empty indexId', () => {
    expect(() =>
      startVectorSession({ target: 'meilisearch', indexId: '', dimensions: 3 }),
    ).toThrow(/indexId must not be empty/);
  });

  it('rejects zero or negative dimensions', () => {
    expect(() =>
      startVectorSession({ target: 'meilisearch', indexId: 'x', dimensions: 0 }),
    ).toThrow(/dimensions must be positive/);
  });

  it('rejects vector dimension mismatch on build', () => {
    const s = startVectorSession({ target: 'meilisearch', indexId: 'x', dimensions: 3 });
    expect(() => buildVectorIndex(s, [{ id: 'x', vector: [1, 2] }])).toThrow(/dim/);
  });

  it('rejects knn before index built', () => {
    const s = startVectorSession({ target: 'meilisearch', indexId: 'x', dimensions: 3 });
    expect(() => queryKnn(s, [1, 0, 0], 2)).toThrow(/index must be built/);
  });

  it('rejects knn dimension mismatch', () => {
    const s = startVectorSession({ target: 'meilisearch', indexId: 'x', dimensions: 3 });
    buildVectorIndex(s, sampleVectors);
    expect(() => queryKnn(s, [1, 0], 2)).toThrow(/query dim/);
  });

  it('rejects k <= 0', () => {
    const s = startVectorSession({ target: 'meilisearch', indexId: 'x', dimensions: 3 });
    buildVectorIndex(s, sampleVectors);
    expect(() => queryKnn(s, [1, 0, 0], 0)).toThrow(/k must be positive/);
  });

  it('rejects hybrid without knn', () => {
    const s = startVectorSession({ target: 'meilisearch', indexId: 'x', dimensions: 3 });
    buildVectorIndex(s, sampleVectors);
    expect(() =>
      fuseHybrid(s, { vectorHits: [], keywordHits: [], vectorWeight: 1, keywordWeight: 1 }),
    ).toThrow(/not knn-queried/);
  });

  it('rejects negative weights in hybrid', () => {
    const s = startVectorSession({ target: 'meilisearch', indexId: 'x', dimensions: 3 });
    buildVectorIndex(s, sampleVectors);
    queryKnn(s, [1, 0, 0], 2);
    expect(() =>
      fuseHybrid(s, { vectorHits: [], keywordHits: [], vectorWeight: -1, keywordWeight: 0 }),
    ).toThrow(/non-negative/);
  });

  it('rejects recall without knn or hybrid', () => {
    const s = startVectorSession({ target: 'meilisearch', indexId: 'x', dimensions: 3 });
    buildVectorIndex(s, sampleVectors);
    expect(() => recallAnn(s, { groundTruth: ['a'], retrieved: ['a'] })).toThrow(/expected/);
  });

  it('rejects empty groundTruth', () => {
    const s = startVectorSession({ target: 'meilisearch', indexId: 'x', dimensions: 3 });
    buildVectorIndex(s, sampleVectors);
    queryKnn(s, [1, 0, 0], 2);
    expect(() => recallAnn(s, { groundTruth: [], retrieved: [] })).toThrow(/groundTruth must not be empty/);
  });

  it('cosine similarity of zero-vector returns 0', () => {
    const s = startVectorSession({ target: 'meilisearch', indexId: 'x', dimensions: 3 });
    buildVectorIndex(s, [{ id: 'z', vector: [0, 0, 0] }]);
    const { hits } = queryKnn(s, [0, 0, 0], 1);
    expect(hits[0]?.score).toBe(0);
  });

  it('allows rebuild after recall', () => {
    const s = startVectorSession({ target: 'meilisearch', indexId: 'x', dimensions: 3 });
    buildVectorIndex(s, sampleVectors);
    queryKnn(s, [1, 0, 0], 1);
    recallAnn(s, { groundTruth: ['a'], retrieved: ['a'] });
    expect(() => buildVectorIndex(s, sampleVectors)).not.toThrow();
  });
});
