/**
 * v1.36-5 docs 補強 (Issue #1079 / CAR-814) — tutorial 73-75 code snippet validation
 * for `@kiwa/search` v0.3 advanced 8 axis (Vector + Semantic + Faceted advanced +
 * Geo + Relevance + Synonym advanced + Index management + Query DSL).
 *
 * `docs/tutorials/73-vector-search-hybrid.md` / `docs/tutorials/74-faceted-geo-search.md` /
 * `docs/tutorials/75-opensearch-relevance-tuning.md` に載っている advanced-semantics
 * snippet が実際に動作することを担保する。
 *
 * v1.23 → v1.36 で 14 milestone 連続 snippet validation streak を延伸。
 */
import { describe, expect, it } from 'vitest';
import { semantics } from '../src/index.js';

const {
  applyCustomRanking,
  advanceRollingReindex,
  allocateShards,
  bridgeTypo,
  buildVectorIndex,
  collectFidelityCoverage,
  computeNestedFacets,
  countDistinct,
  expandMultiLanguage,
  filterBoundingBox,
  filterPolygon,
  filterRadius,
  fuseHybrid,
  matchPhonetic,
  normalizeStemmer,
  promoteReplica,
  queryKnn,
  applyRefinedFilter,
  recallAnn,
  registerSynonyms,
  resolveIsochrone,
  scoreBm25,
  scoreTfIdf,
  seedFacetedDocuments,
  seedGeoDocuments,
  seedRelevanceDocuments,
  selectAbVariant,
  startFacetedSession,
  startGeoSession,
  startIndexMgmtSession,
  startRelevanceSession,
  startSynonymSession,
  startVectorSession,
  swapZeroDowntime,
  traverseHierarchy,
} = semantics;

// ---------------------------------------------------------------------------
// Tutorial 73 — Vector search (kNN + HNSW + hybrid fusion + recall@k)
// ---------------------------------------------------------------------------

const sampleVectors = [
  { id: 'a', vector: [1, 0, 0] },
  { id: 'b', vector: [0, 1, 0] },
  { id: 'c', vector: [1, 1, 0] },
  { id: 'd', vector: [0, 0, 1] },
];

describe('tutorial 73 — startVectorSession + buildVectorIndex', () => {
  it('starts idle and transitions to index-built on buildVectorIndex() (tutorial: session snippet)', () => {
    const session = startVectorSession({
      target: 'meilisearch',
      indexId: 'docs',
      dimensions: 3,
    });
    expect(session.state).toBe('idle');

    const step = buildVectorIndex(session, sampleVectors);
    expect(session.state).toBe('index-built');
    expect(step.neutralEvent).toBe('vector.index_built');
    expect(step.metadata.count).toBe(4);
    expect(step.metadata.dim).toBe(3);
  });

  it('rejects an empty indexId — no silent fallback (tutorial: indexId guard snippet)', () => {
    expect(() =>
      startVectorSession({ target: 'meilisearch', indexId: '', dimensions: 3 }),
    ).toThrow(/indexId must not be empty/);
  });

  it('rejects zero or negative dimensions — the invariant guards against a 0-D fallback (tutorial: dimensions guard snippet)', () => {
    expect(() =>
      startVectorSession({ target: 'meilisearch', indexId: 'x', dimensions: 0 }),
    ).toThrow(/dimensions must be positive/);
    expect(() =>
      startVectorSession({ target: 'meilisearch', indexId: 'x', dimensions: -1 }),
    ).toThrow(/dimensions must be positive/);
  });
});

describe('tutorial 73 — queryKnn', () => {
  it('ranks the closest vector first (cosine similarity, k=2) (tutorial: kNN snippet)', () => {
    const session = startVectorSession({
      target: 'typesense',
      indexId: 'docs',
      dimensions: 3,
    });
    buildVectorIndex(session, sampleVectors);

    const { hits, step } = queryKnn(session, [1, 0, 0], 2);
    expect(step.neutralEvent).toBe('vector.knn_queried');
    expect(hits).toHaveLength(2);
    expect(hits[0]?.id).toBe('a');
    expect(hits[0]?.score).toBeCloseTo(1, 6);
    expect(session.state).toBe('knn-queried');
  });

  it('rejects queryKnn() before buildVectorIndex() — state machine is strict (tutorial: state guard snippet)', () => {
    const session = startVectorSession({
      target: 'typesense',
      indexId: 'docs',
      dimensions: 3,
    });
    expect(() => queryKnn(session, [1, 0, 0], 2)).toThrow(/index must be built first/);
  });

  it('supports HNSW / IVF / flat algorithms via config (tutorial: algo snippet)', () => {
    for (const algo of ['hnsw', 'ivf', 'flat'] as const) {
      const session = startVectorSession({
        target: 'algolia',
        indexId: 'docs',
        dimensions: 3,
        algo,
      });
      const step = buildVectorIndex(session, sampleVectors);
      expect(step.metadata.algo).toBe(algo);
    }
  });
});

describe('tutorial 73 — fuseHybrid', () => {
  it('combines vector + keyword hits with weighted sum (tutorial: hybrid snippet)', () => {
    const session = startVectorSession({
      target: 'algolia',
      indexId: 'docs',
      dimensions: 3,
    });
    buildVectorIndex(session, sampleVectors);
    const knn = queryKnn(session, [1, 1, 0], 4);

    const { fused, step } = fuseHybrid(session, {
      vectorHits: knn.hits,
      keywordHits: [{ id: 'd', score: 1 }],
      vectorWeight: 0.5,
      keywordWeight: 2,
    });
    expect(step.neutralEvent).toBe('vector.hybrid_fused');
    expect(fused[0]?.id).toBe('d');
    expect(session.state).toBe('hybrid-fused');
  });

  it('vector-dominated weights favor the semantic hit (tutorial: hybrid weight snippet)', () => {
    const session = startVectorSession({
      target: 'algolia',
      indexId: 'docs',
      dimensions: 3,
    });
    buildVectorIndex(session, sampleVectors);
    const knn = queryKnn(session, [1, 0, 0], 2);

    const { fused } = fuseHybrid(session, {
      vectorHits: knn.hits,
      keywordHits: [{ id: 'd', score: 0.1 }],
      vectorWeight: 0.9,
      keywordWeight: 0.1,
    });
    expect(fused[0]?.id).toBe('a');
  });
});

describe('tutorial 73 — recallAnn', () => {
  it('recall = matched / groundTruth (tutorial: recall snippet)', () => {
    const session = startVectorSession({
      target: 'opensearch-oss',
      indexId: 'docs',
      dimensions: 3,
    });
    buildVectorIndex(session, sampleVectors);
    queryKnn(session, [1, 0, 0], 4);

    const { recall, step } = recallAnn(session, {
      groundTruth: ['a', 'b'],
      retrieved: ['a', 'x'],
    });
    expect(step.neutralEvent).toBe('vector.ann_recalled');
    expect(recall).toBeCloseTo(0.5, 6);
    expect(session.state).toBe('ann-recalled');
  });

  it('perfect recall = 1.0 when retrieved contains the full ground truth (tutorial: perfect recall snippet)', () => {
    const session = startVectorSession({
      target: 'opensearch-oss',
      indexId: 'docs',
      dimensions: 3,
    });
    buildVectorIndex(session, sampleVectors);
    queryKnn(session, [1, 0, 0], 4);

    const { recall } = recallAnn(session, {
      groundTruth: ['a', 'b'],
      retrieved: ['a', 'b', 'c'],
    });
    expect(recall).toBeCloseTo(1, 6);
  });
});

describe('tutorial 73 — vector fidelity coverage', () => {
  it('the 4 provider × vector axis grid emits 4 rows (tutorial: vector fidelity snippet)', () => {
    const coverage = collectFidelityCoverage([
      'meilisearch',
      'typesense',
      'algolia',
      'opensearch-oss',
    ]);
    const vectorRows = coverage.rows.filter((r) => r.axis === 'vector');
    expect(vectorRows).toHaveLength(4);
    for (const row of vectorRows) {
      expect(row.neutralEvents).toEqual([
        'vector.index_built',
        'vector.knn_queried',
        'vector.hybrid_fused',
        'vector.ann_recalled',
      ]);
    }
  });

  it('each provider emits a distinct dialect for vector.index_built (tutorial: vector dialect snippet)', () => {
    const coverage = collectFidelityCoverage();
    const builtByProvider = new Map<string, string>();
    for (const row of coverage.rows.filter((r) => r.axis === 'vector')) {
      builtByProvider.set(row.provider, row.providerEvents[0] ?? '');
    }
    expect(builtByProvider.get('meilisearch')).toBe('meili.vector.index.build');
    expect(builtByProvider.get('typesense')).toBe('typesense.vector.index');
    expect(builtByProvider.get('algolia')).toBe('algolia.vector.build');
    expect(builtByProvider.get('opensearch-oss')).toBe('opensearch.knn.index.build');
  });
});

// ---------------------------------------------------------------------------
// Tutorial 74 — Faceted geo search (nested facet + distinct + bounding box +
// radius + polygon + isochrone)
// ---------------------------------------------------------------------------

describe('tutorial 74 — computeNestedFacets', () => {
  it('groups inner values per outer value with per-cell counts (tutorial: nested facet snippet)', () => {
    const session = startFacetedSession({ target: 'algolia', indexId: 'products' });
    seedFacetedDocuments(session, [
      { id: '1', facets: { category: 'shoes', color: 'red' } },
      { id: '2', facets: { category: 'shoes', color: 'red' } },
      { id: '3', facets: { category: 'shoes', color: 'blue' } },
      { id: '4', facets: { category: 'hats', color: 'red' } },
    ]);

    const { tree, step } = computeNestedFacets(session, {
      facetField: 'category',
      subFacetField: 'color',
    });
    expect(step.neutralEvent).toBe('facet.nested_computed');
    expect(session.state).toBe('nested-computed');

    const shoes = tree.find((n) => n.value === 'shoes');
    expect(shoes?.count).toBe(3);
    const shoesRed = shoes?.children?.find((c) => c.value === 'red');
    expect(shoesRed?.count).toBe(2);
  });

  it('rejects an empty indexId (tutorial: faceted indexId guard snippet)', () => {
    expect(() => startFacetedSession({ target: 'algolia', indexId: '' })).toThrow(
      /indexId must not be empty/,
    );
  });
});

describe('tutorial 74 — countDistinct', () => {
  it('counts distinct brand values across duplicates (tutorial: distinct snippet)', () => {
    const session = startFacetedSession({ target: 'algolia', indexId: 'products' });
    seedFacetedDocuments(session, [
      { id: 'a', facets: { brand: 'kiwa' } },
      { id: 'b', facets: { brand: 'kiwa' } },
      { id: 'c', facets: { brand: 'fable' } },
      { id: 'd', facets: { brand: 'fable' } },
      { id: 'e', facets: { brand: 'fable' } },
    ]);
    const { distinct, step } = countDistinct(session, { field: 'brand' });
    expect(step.neutralEvent).toBe('facet.distinct_counted');
    expect(distinct).toBe(2);
  });
});

describe('tutorial 74 — applyRefinedFilter + traverseHierarchy', () => {
  it('narrows to a matching category path (tutorial: refine snippet)', () => {
    const session = startFacetedSession({ target: 'algolia', indexId: 'restaurants' });
    seedFacetedDocuments(session, [
      { id: 'a', facets: { category: 'italian' } },
      { id: 'b', facets: { category: 'italian' } },
      { id: 'c', facets: { category: 'japanese' } },
    ]);
    const { remaining, step } = applyRefinedFilter(session, {
      field: 'category',
      value: 'italian',
    });
    expect(step.neutralEvent).toBe('facet.refined_filter_applied');
    const ids = remaining.map((d) => d.id);
    expect(ids).toContain('a');
    expect(ids).toContain('b');
    expect(ids).not.toContain('c');
  });

  it('traverses category path segments into level counts for breadcrumb render (tutorial: hierarchy snippet)', () => {
    const session = startFacetedSession({ target: 'algolia', indexId: 'restaurants' });
    seedFacetedDocuments(session, [
      { id: 'a', facets: { categories: 'Root>Italian>Pizza' } },
      { id: 'b', facets: { categories: 'Root>Italian>Pasta' } },
      { id: 'c', facets: { categories: 'Root>Japanese>Ramen' } },
    ]);
    const { levels, step } = traverseHierarchy(session, {
      field: 'categories',
    });
    expect(step.neutralEvent).toBe('facet.hierarchy_traversed');
    expect(levels['Root']).toBe(3);
    expect(levels['Root>Italian']).toBe(2);
    expect(levels['Root>Italian>Pizza']).toBe(1);
  });
});

const sampleGeoDocs = [
  { id: 'tokyo-station', lat: 35.681, lng: 139.767 },
  { id: 'shinjuku', lat: 35.69, lng: 139.7 },
  { id: 'yokohama', lat: 35.44, lng: 139.64 },
  { id: 'sapporo', lat: 43.06, lng: 141.35 },
];

describe('tutorial 74 — filterBoundingBox', () => {
  it('selects docs within the Tokyo area rectangle (tutorial: bounding box snippet)', () => {
    const session = startGeoSession({ target: 'algolia', indexId: 'places' });
    seedGeoDocuments(session, sampleGeoDocs);
    const { hits, step } = filterBoundingBox(session, {
      swLat: 35.4,
      swLng: 139.5,
      neLat: 35.75,
      neLng: 139.85,
    });
    expect(step.neutralEvent).toBe('geo.bounding_box_filtered');
    const ids = hits.map((h) => h.id);
    expect(ids).toContain('tokyo-station');
    expect(ids).toContain('shinjuku');
    expect(ids).toContain('yokohama');
    expect(ids).not.toContain('sapporo');
  });
});

describe('tutorial 74 — filterRadius', () => {
  it('returns hits within radius sorted by distance (tutorial: radius snippet)', () => {
    const session = startGeoSession({ target: 'algolia', indexId: 'places' });
    seedGeoDocuments(session, sampleGeoDocs);
    const { hits, step } = filterRadius(session, {
      centerLat: 35.681,
      centerLng: 139.767,
      radiusMeters: 10_000,
    });
    expect(step.neutralEvent).toBe('geo.radius_filtered');
    expect(hits[0]?.id).toBe('tokyo-station');
    expect(hits[0]?.distanceMeters).toBeLessThan(1);
    expect(hits.map((h) => h.id)).not.toContain('sapporo');
  });
});

describe('tutorial 74 — filterPolygon + resolveIsochrone', () => {
  it('polygon uses ray casting to select interior points (tutorial: polygon snippet)', () => {
    const session = startGeoSession({ target: 'algolia', indexId: 'places' });
    seedGeoDocuments(session, sampleGeoDocs);
    const { hits, step } = filterPolygon(session, {
      vertices: [
        { lat: 35.4, lng: 139.5 },
        { lat: 35.4, lng: 139.85 },
        { lat: 35.75, lng: 139.85 },
        { lat: 35.75, lng: 139.5 },
      ],
    });
    expect(step.neutralEvent).toBe('geo.polygon_filtered');
    const ids = hits.map((h) => h.id);
    expect(ids).toContain('tokyo-station');
    expect(ids).toContain('shinjuku');
    expect(ids).not.toContain('sapporo');
  });

  it('isochrone converts travel time to reachable area (tutorial: isochrone snippet)', () => {
    const session = startGeoSession({ target: 'algolia', indexId: 'places' });
    seedGeoDocuments(session, sampleGeoDocs);
    const { hits, step } = resolveIsochrone(session, {
      centerLat: 35.681,
      centerLng: 139.767,
      travelTimeMinutes: 30,
      avgSpeedKmh: 30,
    });
    expect(step.neutralEvent).toBe('geo.isochrone_resolved');
    expect(hits.map((h) => h.id)).toContain('tokyo-station');
    expect(hits.map((h) => h.id)).toContain('shinjuku');
  });
});

describe('tutorial 74 — faceted + geo fidelity coverage', () => {
  it('the 4 provider × faceted-advanced grid emits 4 rows (tutorial: faceted fidelity snippet)', () => {
    const coverage = collectFidelityCoverage();
    const facetedRows = coverage.rows.filter((r) => r.axis === 'faceted-advanced');
    expect(facetedRows).toHaveLength(4);
    for (const row of facetedRows) {
      // Neutral events for faceted-advanced axis (order defined by SEARCH_AXIS_TO_EVENTS SSOT):
      expect(new Set(row.neutralEvents)).toEqual(
        new Set([
          'facet.nested_computed',
          'facet.hierarchy_traversed',
          'facet.distinct_counted',
          'facet.refined_filter_applied',
        ]),
      );
    }
  });

  it('the 4 provider × geo grid emits 4 rows (tutorial: geo fidelity snippet)', () => {
    const coverage = collectFidelityCoverage();
    const geoRows = coverage.rows.filter((r) => r.axis === 'geo');
    expect(geoRows).toHaveLength(4);
    for (const row of geoRows) {
      expect(row.neutralEvents).toEqual([
        'geo.bounding_box_filtered',
        'geo.radius_filtered',
        'geo.polygon_filtered',
        'geo.isochrone_resolved',
      ]);
    }
  });

  it('Algolia dialect is stable for geo.bounding_box_filtered (tutorial: geo dialect snippet)', () => {
    const coverage = collectFidelityCoverage(['algolia']);
    const box = coverage.rows.find((r) => r.axis === 'geo');
    expect(box?.providerEvents[0]).toMatch(/^algolia\./);
  });
});

// ---------------------------------------------------------------------------
// Tutorial 75 — OpenSearch relevance tuning (BM25 + TF-IDF + custom ranking +
// A/B + synonym advanced + rolling reindex + zero-downtime swap)
// ---------------------------------------------------------------------------

const relevanceDocs = [
  { id: 'a', content: 'search engine mock kiwa realtime' },
  { id: 'b', content: 'kiwa release gate mock' },
  { id: 'c', content: 'random unrelated text' },
  { id: 'd', content: 'kiwa kiwa kiwa dense hit' },
];

describe('tutorial 75 — scoreBm25', () => {
  it('ranks documents with more term matches higher (tutorial: BM25 snippet)', () => {
    const session = startRelevanceSession({ target: 'opensearch-oss', indexId: 'articles' });
    seedRelevanceDocuments(session, relevanceDocs);
    const { hits, step } = scoreBm25(session, 'kiwa');
    expect(step.neutralEvent).toBe('relevance.bm25_scored');
    expect(hits[0]?.id).toBe('d');
    expect(session.state).toBe('bm25-scored');
  });

  it('rejects an empty query — the invariant guards against a "return everything" fallback (tutorial: BM25 empty guard snippet)', () => {
    const session = startRelevanceSession({ target: 'opensearch-oss', indexId: 'x' });
    seedRelevanceDocuments(session, relevanceDocs);
    expect(() => scoreBm25(session, '')).toThrow(/at least one token/);
  });

  it('BM25 tuning params k1 / b flow through to metadata (tutorial: BM25 tuning snippet)', () => {
    const session = startRelevanceSession({
      target: 'opensearch-oss',
      indexId: 'x',
      bm25K1: 1.5,
      bm25B: 0.5,
    });
    seedRelevanceDocuments(session, relevanceDocs);
    const { step } = scoreBm25(session, 'kiwa');
    expect(step.metadata.k1).toBe(1.5);
    expect(step.metadata.b).toBe(0.5);
  });
});

describe('tutorial 75 — scoreTfIdf', () => {
  it('rewards terms that are rare across the corpus (tutorial: TF-IDF snippet)', () => {
    const session = startRelevanceSession({ target: 'opensearch-oss', indexId: 'x' });
    seedRelevanceDocuments(session, relevanceDocs);
    const { hits, step } = scoreTfIdf(session, 'random');
    expect(step.neutralEvent).toBe('relevance.tfidf_scored');
    expect(hits[0]?.id).toBe('c');
  });
});

describe('tutorial 75 — applyCustomRanking', () => {
  it('multiplies by a caller-provided signal (tutorial: custom ranking snippet)', () => {
    const session = startRelevanceSession({ target: 'opensearch-oss', indexId: 'x' });
    seedRelevanceDocuments(session, [
      { id: 'a', content: 'kiwa', boostSignal: 1 },
      { id: 'b', content: 'kiwa kiwa', boostSignal: 10 },
    ]);
    const { hits } = scoreBm25(session, 'kiwa');
    const { ranked, step } = applyCustomRanking(session, hits, {
      boostFn: (d) => d.boostSignal ?? 1,
    });
    expect(step.neutralEvent).toBe('relevance.custom_ranking_applied');
    expect(ranked[0]?.id).toBe('b');
  });
});

describe('tutorial 75 — selectAbVariant', () => {
  it('is stable per userId (tutorial: A/B stable snippet)', () => {
    const session = startRelevanceSession({ target: 'opensearch-oss', indexId: 'x' });
    const first = selectAbVariant(session, { variants: ['A', 'B'], userId: 'user-42' });
    const second = selectAbVariant(session, { variants: ['A', 'B'], userId: 'user-42' });
    expect(first.variant).toBe(second.variant);
  });

  it('distributes across a large user population (tutorial: A/B distribution snippet)', () => {
    const session = startRelevanceSession({ target: 'opensearch-oss', indexId: 'x' });
    const variants = new Set<string>();
    for (let i = 0; i < 200; i += 1) {
      const { variant } = selectAbVariant(session, {
        variants: ['A', 'B', 'C'],
        userId: `u-${i}`,
      });
      variants.add(variant);
    }
    expect(variants.size).toBeGreaterThanOrEqual(2);
  });
});

describe('tutorial 75 — expandMultiLanguage', () => {
  it('expands base to synonyms across languages (tutorial: synonym expand snippet)', () => {
    const session = startSynonymSession({ target: 'opensearch-oss', indexId: 'catalog' });
    registerSynonyms(session, [
      { base: 'car', synonyms: ['automobile', 'vehicle'], language: 'en' },
      { base: 'coche', synonyms: ['automovil'], language: 'es' },
    ]);
    const { expanded, step } = expandMultiLanguage(session, {
      query: 'car',
      languages: ['en', 'es'],
    });
    expect(step.neutralEvent).toBe('synonym.multi_language_expanded');
    expect(expanded).toContain('car');
    expect(expanded).toContain('automobile');
    expect(expanded).toContain('vehicle');
  });

  it('bidirectional expansion — synonym resolves back to base (tutorial: bidirectional snippet)', () => {
    const session = startSynonymSession({ target: 'opensearch-oss', indexId: 'x' });
    registerSynonyms(session, [
      { base: 'car', synonyms: ['automobile'], language: 'en' },
    ]);
    const { expanded } = expandMultiLanguage(session, {
      query: 'automobile',
      languages: ['en'],
    });
    expect(expanded).toContain('car');
  });
});

describe('tutorial 75 — matchPhonetic + normalizeStemmer + bridgeTypo', () => {
  it('phonetic match uses soundex codes (tutorial: phonetic snippet)', () => {
    const session = startSynonymSession({ target: 'opensearch-oss', indexId: 'x' });
    const { matched, step } = matchPhonetic(session, {
      query: 'Robert',
      candidates: ['Rupert', 'Robbert', 'Alice', 'Robb'],
    });
    expect(step.neutralEvent).toBe('synonym.phonetic_matched');
    expect(matched).toContain('Rupert');
    expect(matched).toContain('Robbert');
    expect(matched).not.toContain('Alice');
  });

  it('stemmer normalizes English suffixes (tutorial: stemmer snippet)', () => {
    const session = startSynonymSession({ target: 'opensearch-oss', indexId: 'x' });
    const { normalized, step } = normalizeStemmer(session, {
      tokens: ['running', 'jumped', 'happily', 'fastes'],
      language: 'en',
    });
    expect(step.neutralEvent).toBe('synonym.stemmer_normalized');
    expect(normalized[0]).toBe('runn');
    expect(normalized[1]).toBe('jump');
  });

  it('typo bridge suggests edit-distance-1 corrections (tutorial: typo bridge snippet)', () => {
    const session = startSynonymSession({ target: 'opensearch-oss', indexId: 'x' });
    const { suggestions, step } = bridgeTypo(session, {
      query: 'realtim',
      dictionary: ['realtime', 'random', 'realtor', 'realtimee'],
    });
    expect(step.neutralEvent).toBe('synonym.typo_bridged');
    expect(suggestions[0]?.term).toBe('realtime');
    expect(suggestions[0]?.distance).toBe(1);
  });
});

describe('tutorial 75 — rolling reindex + zero-downtime swap', () => {
  it('walks the full lifecycle allocate → promote → reindex → swap (tutorial: lifecycle snippet)', () => {
    const session = startIndexMgmtSession({
      target: 'opensearch-oss',
      indexId: 'products-v1',
      shardCount: 3,
      replicaCount: 1,
      nodes: ['n1', 'n2', 'n3'],
    });
    allocateShards(session);
    expect(session.shards.filter((sh) => sh.role === 'primary')).toHaveLength(3);

    const failedNode = session.shards[0]?.nodeId ?? 'n1';
    promoteReplica(session, { shardId: 0, failedNode });

    advanceRollingReindex(session, { batchPercent: 50 });
    advanceRollingReindex(session, { batchPercent: 50 });
    swapZeroDowntime(session, { newIndexId: 'products-v2' });
    expect(session.state).toBe('zero-downtime-swapped');
    expect(session.aliasTarget).toBe('products-v2');
  });

  it('rolling reindex batchPercent accumulates until 100 (tutorial: batch progress snippet)', () => {
    const session = startIndexMgmtSession({
      target: 'opensearch-oss',
      indexId: 'x',
      shardCount: 1,
      replicaCount: 0,
      nodes: ['n1'],
    });
    allocateShards(session);
    const step1 = advanceRollingReindex(session, { batchPercent: 30 });
    expect(step1.metadata.progress).toBe(30);
    const step2 = advanceRollingReindex(session, { batchPercent: 40 });
    expect(step2.metadata.progress).toBe(70);
    const step3 = advanceRollingReindex(session, { batchPercent: 30 });
    expect(step3.metadata.progress).toBe(100);
    expect(step3.metadata.completed).toBe(true);
  });
});

describe('tutorial 75 — relevance + synonym + index-mgmt fidelity coverage', () => {
  it('the 4 provider × relevance grid emits 4 rows (tutorial: relevance fidelity snippet)', () => {
    const coverage = collectFidelityCoverage();
    const relevanceRows = coverage.rows.filter((r) => r.axis === 'relevance');
    expect(relevanceRows).toHaveLength(4);
    for (const row of relevanceRows) {
      expect(row.neutralEvents).toEqual([
        'relevance.bm25_scored',
        'relevance.tfidf_scored',
        'relevance.custom_ranking_applied',
        'relevance.ab_variant_selected',
      ]);
    }
  });

  it('the 4 provider × synonym-advanced grid emits 4 rows (tutorial: synonym fidelity snippet)', () => {
    const coverage = collectFidelityCoverage();
    const synonymRows = coverage.rows.filter((r) => r.axis === 'synonym-advanced');
    expect(synonymRows).toHaveLength(4);
  });

  it('the 4 provider × index-management grid emits 4 rows (tutorial: index-mgmt fidelity snippet)', () => {
    const coverage = collectFidelityCoverage();
    const idxRows = coverage.rows.filter((r) => r.axis === 'index-management');
    expect(idxRows).toHaveLength(4);
  });

  it('OpenSearch dialect is stable for relevance.bm25_scored (tutorial: relevance dialect snippet)', () => {
    const coverage = collectFidelityCoverage(['opensearch-oss']);
    const bm25 = coverage.rows.find((r) => r.axis === 'relevance');
    expect(bm25?.providerEvents[0]).toMatch(/^opensearch\./);
  });
});

// ---------------------------------------------------------------------------
// 32-cell grid contract — 4 provider × 8 axis
// ---------------------------------------------------------------------------

describe('v1.36 concept — 4 provider × 8 axis = 32 cell grid', () => {
  it('collectFidelityCoverage default returns all 4 providers × 8 axes = 32 rows (concept: grid size snippet)', () => {
    const coverage = collectFidelityCoverage();
    expect(coverage.providers).toEqual(['meilisearch', 'typesense', 'algolia', 'opensearch-oss']);
    expect(coverage.axes).toHaveLength(8);
    expect(coverage.rows).toHaveLength(32);
  });

  it('every row has a non-empty neutralEvents + providerEvents pair (concept: row structure snippet)', () => {
    const coverage = collectFidelityCoverage();
    for (const row of coverage.rows) {
      expect(row.neutralEvents.length).toBeGreaterThan(0);
      expect(row.providerEvents.length).toBe(row.neutralEvents.length);
    }
  });
});
