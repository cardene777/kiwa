import { describe, expect, it } from 'vitest';
import {
  buildVectorIndex,
  bridgeTypo,
  bucketHistogram,
  cacheEmbedding,
  computeNestedFacets,
  computePercentile,
  filterBoundingBox,
  filterRadius,
  queryKnn,
  scoreBm25,
  seedFacetedDocuments,
  seedGeoDocuments,
  seedRelevanceDocuments,
  seedQueryDslDocuments,
  startFacetedSession,
  startGeoSession,
  startQueryDslSession,
  startRelevanceSession,
  startSemanticSession,
  startSynonymSession,
  startVectorSession,
} from '../../src/semantics/index.js';

describe('v0.3 edge cases — vector', () => {
  it('handles high-dimensional vectors', () => {
    const s = startVectorSession({ target: 'meilisearch', indexId: 'x', dimensions: 128 });
    const zeroVec = new Array(128).fill(0);
    const oneVec = new Array(128).fill(0);
    oneVec[0] = 1;
    buildVectorIndex(s, [
      { id: 'a', vector: zeroVec },
      { id: 'b', vector: oneVec },
    ]);
    const { hits } = queryKnn(s, oneVec, 1);
    expect(hits[0]?.id).toBe('b');
  });

  it('knn with k > number of docs returns all', () => {
    const s = startVectorSession({ target: 'meilisearch', indexId: 'x', dimensions: 2 });
    buildVectorIndex(s, [
      { id: 'a', vector: [1, 0] },
      { id: 'b', vector: [0, 1] },
    ]);
    const { hits } = queryKnn(s, [1, 1], 100);
    expect(hits).toHaveLength(2);
  });
});

describe('v0.3 edge cases — geo', () => {
  it('bbox exactly on boundary is inclusive', () => {
    const s = startGeoSession({ target: 'meilisearch', indexId: 'x' });
    seedGeoDocuments(s, [
      { id: 'edge', lat: 35.5, lng: 139.5 },
    ]);
    const { hits } = filterBoundingBox(s, {
      swLat: 35.5,
      swLng: 139.5,
      neLat: 36,
      neLng: 140,
    });
    expect(hits).toHaveLength(1);
  });

  it('radius filter uses haversine (not linear)', () => {
    const s = startGeoSession({ target: 'meilisearch', indexId: 'x' });
    seedGeoDocuments(s, [{ id: 'near', lat: 0, lng: 0 }, { id: 'far', lat: 0, lng: 1 }]);
    const { hits } = filterRadius(s, {
      centerLat: 0,
      centerLng: 0,
      radiusMeters: 1000,
    });
    expect(hits).toHaveLength(1);
    expect(hits[0]?.id).toBe('near');
  });
});

describe('v0.3 edge cases — facet + synonym', () => {
  it('nested facet with 3 outer keys returns sorted tree', () => {
    const s = startFacetedSession({ target: 'meilisearch', indexId: 'x' });
    seedFacetedDocuments(s, [
      { id: '1', facets: { c: 'c', s: 'x' } },
      { id: '2', facets: { c: 'a', s: 'y' } },
      { id: '3', facets: { c: 'b', s: 'z' } },
    ]);
    const { tree } = computeNestedFacets(s, { facetField: 'c', subFacetField: 's' });
    expect(tree.map((n) => n.value)).toEqual(['a', 'b', 'c']);
  });

  it('typo bridge deprioritizes longer distance suggestions', () => {
    const s = startSynonymSession({ target: 'meilisearch', indexId: 'x' });
    const { suggestions } = bridgeTypo(s, {
      query: 'a',
      dictionary: ['ab', 'aa', 'abcd'],
      maxDistance: 3,
    });
    expect(suggestions[0]?.distance).toBeLessThanOrEqual(
      suggestions[suggestions.length - 1]?.distance ?? 999,
    );
  });
});

describe('v0.3 edge cases — relevance + query-dsl', () => {
  it('BM25 with rare term ranks single-match doc first', () => {
    const s = startRelevanceSession({ target: 'meilisearch', indexId: 'x' });
    seedRelevanceDocuments(s, [
      { id: 'rare', content: 'quokka runs quickly' },
      { id: 'noise1', content: 'random text here' },
      { id: 'noise2', content: 'another random text' },
    ]);
    const { hits } = scoreBm25(s, 'quokka');
    expect(hits[0]?.id).toBe('rare');
  });

  it('histogram groups by exact interval boundaries', () => {
    const s = startQueryDslSession({ target: 'meilisearch', indexId: 'x' });
    seedQueryDslDocuments(s, [
      { id: '1', fields: { v: 0 } },
      { id: '2', fields: { v: 5 } },
      { id: '3', fields: { v: 10 } },
      { id: '4', fields: { v: 15 } },
    ]);
    const { buckets } = bucketHistogram(s, { field: 'v', interval: 10 });
    const map = new Map(buckets.map((b) => [b.key, b.count]));
    expect(map.get(0)).toBe(2); // 0, 5
    expect(map.get(10)).toBe(2); // 10, 15
  });

  it('percentile with single value returns that value', () => {
    const s = startQueryDslSession({ target: 'meilisearch', indexId: 'x' });
    seedQueryDslDocuments(s, [{ id: '1', fields: { v: 42 } }]);
    const { value } = computePercentile(s, { field: 'v', percentile: 99 });
    expect(value).toBe(42);
  });
});

describe('v0.3 edge cases — semantic embedding cache', () => {
  it('cache overwrites duplicate keys', () => {
    const s = startSemanticSession({ target: 'algolia', sessionId: 'x' });
    cacheEmbedding(s, 'k', [1, 2, 3]);
    cacheEmbedding(s, 'k', [4, 5, 6]);
    expect(s.embeddingCache.size).toBe(1);
    expect(s.embeddingCache.get('k')).toEqual([4, 5, 6]);
  });

  it('cache is target-independent state', () => {
    const s = startSemanticSession({ target: 'meilisearch', sessionId: 'x' });
    cacheEmbedding(s, 'a', [0]);
    cacheEmbedding(s, 'b', [1]);
    cacheEmbedding(s, 'c', [2]);
    expect(s.embeddingCache.size).toBe(3);
  });
});
