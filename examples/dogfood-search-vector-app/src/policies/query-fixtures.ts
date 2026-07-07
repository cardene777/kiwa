/**
 * Canonical query fixtures + sample vectors + sample documents for the
 * dogfood app.
 *
 * The 3 fixture sets exercise the vector + semantic + hybrid axes
 * canonical production workloads —
 *  - `FIXTURE_VECTOR_RECALL` — dense-vector kNN + recall@k measurement.
 *  - `FIXTURE_SEMANTIC_INTENT` — query-understanding + intent
 *    classification (informational vs transactional vs commercial vs
 *    navigational) + cross-encoder rerank.
 *  - `FIXTURE_HYBRID_FUSION` — vector + keyword hits combined through
 *    tunable weights; the fixture ships pre-computed vector + keyword
 *    hit sets so the fusion output is deterministic.
 *
 * All vectors are kept at 4 dimensions to keep the fixtures readable in
 * tests. The mock adapter's cosineSimilarity comparator is dimension-
 * agnostic so the numbers are stable across runs.
 */

import type { KnnHit, RerankCandidate, VectorEntry } from '../adapters/interface.js';

/** A single query fixture — one raw query + optional embedding. */
export interface QueryFixture {
  id: string;
  rawQuery: string;
  queryEmbedding: readonly number[];
  k: number;
}

/** A named fixture set with docs + queries + ground truth. */
export interface FixtureSet {
  id: string;
  label: string;
  dimensions: number;
  documents: readonly VectorEntry[];
  queries: readonly QueryFixture[];
  groundTruth: Record<string, readonly string[]>;
  rerankCandidates: readonly RerankCandidate[];
  keywordHits: readonly KnnHit[];
}

/** Vector-recall — 4 documents in 4-dim space, cosine-nearest to a probe query. */
export const FIXTURE_VECTOR_RECALL: FixtureSet = {
  id: 'vector-recall',
  label: 'vector-recall (kNN + recall@k)',
  dimensions: 4,
  documents: [
    { id: 'doc-red', vector: [1, 0, 0, 0] },
    { id: 'doc-orange', vector: [0.9, 0.1, 0, 0] },
    { id: 'doc-green', vector: [0, 1, 0, 0] },
    { id: 'doc-blue', vector: [0, 0, 1, 0] },
  ],
  queries: [
    {
      id: 'q-red-ish',
      rawQuery: 'red hue',
      queryEmbedding: [0.95, 0.05, 0, 0],
      k: 2,
    },
  ],
  groundTruth: {
    'q-red-ish': ['doc-red', 'doc-orange'],
  },
  rerankCandidates: [
    { id: 'doc-red', content: 'red color hue swatch', baseScore: 0.9 },
    { id: 'doc-orange', content: 'orange sunset hue', baseScore: 0.8 },
  ],
  keywordHits: [
    { id: 'doc-red', score: 0.6 },
    { id: 'doc-orange', score: 0.4 },
  ],
};

/** Semantic-intent — 3 queries exercising informational + transactional + navigational intent. */
export const FIXTURE_SEMANTIC_INTENT: FixtureSet = {
  id: 'semantic-intent',
  label: 'semantic-intent (understand + intent + rerank)',
  dimensions: 4,
  documents: [
    { id: 'doc-guide', vector: [1, 0, 0, 0] },
    { id: 'doc-checkout', vector: [0, 1, 0, 0] },
    { id: 'doc-login', vector: [0, 0, 1, 0] },
  ],
  queries: [
    {
      id: 'q-info',
      rawQuery: 'how do i tune a Meilisearch index',
      queryEmbedding: [0.9, 0.1, 0, 0],
      k: 3,
    },
    {
      id: 'q-txn',
      rawQuery: 'buy Meilisearch subscription discount price',
      queryEmbedding: [0, 0.9, 0.1, 0],
      k: 3,
    },
    {
      id: 'q-nav',
      rawQuery: 'Meilisearch login official homepage',
      queryEmbedding: [0, 0, 0.9, 0.1],
      k: 3,
    },
  ],
  groundTruth: {
    'q-info': ['doc-guide'],
    'q-txn': ['doc-checkout'],
    'q-nav': ['doc-login'],
  },
  rerankCandidates: [
    { id: 'doc-guide', content: 'tune Meilisearch index guide tutorial', baseScore: 0.7 },
    { id: 'doc-checkout', content: 'buy price checkout Meilisearch', baseScore: 0.6 },
    { id: 'doc-login', content: 'login homepage official Meilisearch', baseScore: 0.5 },
  ],
  keywordHits: [
    { id: 'doc-guide', score: 0.5 },
    { id: 'doc-checkout', score: 0.5 },
    { id: 'doc-login', score: 0.5 },
  ],
};

/** Hybrid-fusion — pre-computed vector + keyword hit sets to exercise all 5 weight configs. */
export const FIXTURE_HYBRID_FUSION: FixtureSet = {
  id: 'hybrid-fusion',
  label: 'hybrid-fusion (vector + keyword weighted)',
  dimensions: 4,
  documents: [
    { id: 'doc-alpha', vector: [1, 0, 0, 0] },
    { id: 'doc-beta', vector: [0, 1, 0, 0] },
    { id: 'doc-gamma', vector: [0, 0, 1, 0] },
    { id: 'doc-delta', vector: [0, 0, 0, 1] },
  ],
  queries: [
    {
      id: 'q-hybrid',
      rawQuery: 'compare alpha vs beta review best',
      queryEmbedding: [0.7, 0.3, 0, 0],
      k: 4,
    },
  ],
  groundTruth: {
    'q-hybrid': ['doc-alpha', 'doc-beta'],
  },
  rerankCandidates: [
    { id: 'doc-alpha', content: 'alpha compare review', baseScore: 0.8 },
    { id: 'doc-beta', content: 'beta compare review', baseScore: 0.75 },
    { id: 'doc-gamma', content: 'gamma unrelated', baseScore: 0.3 },
    { id: 'doc-delta', content: 'delta unrelated', baseScore: 0.2 },
  ],
  keywordHits: [
    { id: 'doc-alpha', score: 0.7 },
    { id: 'doc-beta', score: 0.65 },
    { id: 'doc-gamma', score: 0.3 },
    { id: 'doc-delta', score: 0.15 },
  ],
};

/** All 3 canonical fixture sets. */
export const ALL_FIXTURES: readonly FixtureSet[] = [
  FIXTURE_VECTOR_RECALL,
  FIXTURE_SEMANTIC_INTENT,
  FIXTURE_HYBRID_FUSION,
];
