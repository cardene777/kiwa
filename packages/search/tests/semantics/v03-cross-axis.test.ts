import { describe, expect, it } from 'vitest';
import {
  applyRefinedFilter,
  buildVectorIndex,
  computeNestedFacets,
  crossEncoderRerank,
  classifyIntent,
  filterRadius,
  fuseHybrid,
  queryKnn,
  scoreBm25,
  seedFacetedDocuments,
  seedGeoDocuments,
  seedRelevanceDocuments,
  startFacetedSession,
  startGeoSession,
  startRelevanceSession,
  startSemanticSession,
  startVectorSession,
  understandQuery,
} from '../../src/semantics/index.js';

describe('cross-axis integration — vector + relevance', () => {
  it('vector knn hits can feed relevance ranking', () => {
    const vs = startVectorSession({ target: 'algolia', indexId: 'docs', dimensions: 3 });
    buildVectorIndex(vs, [
      { id: 'a', vector: [1, 0, 0] },
      { id: 'b', vector: [0.5, 0.5, 0] },
      { id: 'c', vector: [0, 1, 0] },
    ]);
    const knn = queryKnn(vs, [1, 0, 0], 3);

    const rs = startRelevanceSession({ target: 'algolia', indexId: 'docs' });
    seedRelevanceDocuments(rs, [
      { id: 'a', content: 'kiwa realtime a', boostSignal: 2 },
      { id: 'b', content: 'kiwa release b' },
      { id: 'c', content: 'unrelated c' },
    ]);
    const bm25 = scoreBm25(rs, 'kiwa');
    const knnIds = new Set(knn.hits.map((h) => h.id));
    const filtered = bm25.hits.filter((h) => knnIds.has(h.id));
    expect(filtered.length).toBeGreaterThan(0);
  });
});

describe('cross-axis integration — semantic + vector', () => {
  it('semantic rerank consumes vector hits', () => {
    const vs = startVectorSession({ target: 'meilisearch', indexId: 'docs', dimensions: 2 });
    buildVectorIndex(vs, [
      { id: 'a', vector: [1, 0] },
      { id: 'b', vector: [0, 1] },
    ]);
    const knn = queryKnn(vs, [1, 0], 2);

    const sm = startSemanticSession({ target: 'meilisearch', sessionId: 'x' });
    understandQuery(sm, 'kiwa realtime');
    classifyIntent(sm);
    const rerank = crossEncoderRerank(
      sm,
      knn.hits.map((h) => ({ id: h.id, content: `content ${h.id}`, baseScore: h.score })),
    );
    expect(rerank.reranked).toHaveLength(2);
  });
});

describe('cross-axis integration — vector + hybrid + relevance', () => {
  it('hybrid fusion combines vector and keyword branches', () => {
    const vs = startVectorSession({ target: 'opensearch-oss', indexId: 'docs', dimensions: 3 });
    buildVectorIndex(vs, [
      { id: 'a', vector: [1, 0, 0] },
      { id: 'b', vector: [0, 1, 0] },
    ]);
    const knn = queryKnn(vs, [1, 0, 0], 2);

    const rs = startRelevanceSession({ target: 'opensearch-oss', indexId: 'docs' });
    seedRelevanceDocuments(rs, [
      { id: 'a', content: 'kiwa' },
      { id: 'b', content: 'kiwa kiwa' },
    ]);
    const bm25 = scoreBm25(rs, 'kiwa');
    const { fused } = fuseHybrid(vs, {
      vectorHits: knn.hits,
      keywordHits: bm25.hits,
      vectorWeight: 0.6,
      keywordWeight: 0.4,
    });
    expect(fused).toHaveLength(2);
    expect(fused[0]?.score).toBeGreaterThanOrEqual(fused[1]?.score ?? 0);
  });
});

describe('cross-axis integration — geo + facet', () => {
  it('geo radius hits feed facet refinement', () => {
    const gs = startGeoSession({ target: 'typesense', indexId: 'restaurants' });
    seedGeoDocuments(gs, [
      { id: 'r1', lat: 35.68, lng: 139.76, attributes: { category: 'sushi' } },
      { id: 'r2', lat: 35.7, lng: 139.75, attributes: { category: 'ramen' } },
      { id: 'r3', lat: 42, lng: 141, attributes: { category: 'sushi' } },
    ]);
    const { hits } = filterRadius(gs, {
      centerLat: 35.68,
      centerLng: 139.76,
      radiusMeters: 20_000,
    });

    const fs = startFacetedSession({ target: 'typesense', indexId: 'restaurants' });
    seedFacetedDocuments(
      fs,
      hits.map((h) => ({
        id: h.id,
        facets: { category: String(h.attributes?.['category'] ?? '') },
      })),
    );
    const { remaining } = applyRefinedFilter(fs, { field: 'category', value: 'sushi' });
    expect(remaining.map((d) => d.id)).toEqual(['r1']);
  });
});

describe('cross-axis integration — semantic + facet nested', () => {
  it('classified intent can drive nested facet compute', () => {
    const sm = startSemanticSession({ target: 'algolia', sessionId: 'x' });
    understandQuery(sm, 'buy iphone red');
    classifyIntent(sm);
    expect(sm.intent).toBe('transactional');

    const fs = startFacetedSession({ target: 'algolia', indexId: 'products' });
    seedFacetedDocuments(fs, [
      { id: '1', facets: { category: 'phone', color: 'red' } },
      { id: '2', facets: { category: 'phone', color: 'red' } },
      { id: '3', facets: { category: 'phone', color: 'blue' } },
    ]);
    const { tree } = computeNestedFacets(fs, {
      facetField: 'category',
      subFacetField: 'color',
    });
    expect(tree[0]?.children?.length).toBeGreaterThanOrEqual(2);
  });
});
