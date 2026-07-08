/**
 * Provider-neutral SvelteKit + Kysely + Postgres 16 pgvector + Redis
 * embedding-cache adapter contract for the dogfood-vector-search-app
 * dogfood (v1.26-4).
 *
 * The dogfood talks to the vector-search pipeline only through this
 * interface. Two implementations exist: {@link makeMockAdapter} (backed
 * by `@kiwa/orm`'s vector-store semantics + an in-memory document
 * store + an in-memory embedding cache) and {@link makeRealAdapter}
 * (probes a Postgres 16 + pgvector + Redis 7 broker via `VECTOR_KEY`
 * when set, else returns a skipped variant whose every method records a
 * `VECTOR_ENV_MISSING` trace).
 *
 * Both satisfy the same 5-op surface so behavioural fidelity between
 * real vs mock can be measured side-by-side and fed to
 * `@kiwa/quality-metrics` 7-axis release gate.
 */

import type { DocumentRow } from '../document/index.js';
import type { VectorDistanceKind, VectorIndex } from '../index-store/index.js';

export interface SearchQuery {
  readonly embedding: readonly number[];
  readonly keyword: string;
  readonly topK: number;
}

/** Index build observation — pgvector CREATE INDEX equivalent. */
export interface IndexBuildObservation {
  readonly indexKind: 'ivfflat' | 'hnsw';
  readonly dimensions: number;
  readonly indexed: boolean;
  readonly documentsIndexed: number;
}

/** k-NN semantic search observation — cosine / L2 ranked list. */
export interface SemanticSearchObservation {
  readonly rankedIds: readonly string[];
  readonly distances: readonly number[];
  readonly distanceKind: VectorDistanceKind;
}

/** Hybrid search observation — vector + keyword score fused. */
export interface HybridSearchObservation {
  readonly rankedIds: readonly string[];
  readonly scores: readonly number[];
  readonly vectorWeight: number;
  readonly keywordWeight: number;
}

/** Embedding-cache observation — hit-rate over a window. */
export interface CacheHitRateObservation {
  readonly totalLookups: number;
  readonly hits: number;
  readonly misses: number;
  readonly hitRate: number;
  readonly reindexed: boolean;
}

/** Trace event — every adapter method appends 1 entry. */
export interface TraceEvent {
  op: string;
  ok: boolean;
  errorKind?: string | undefined;
  detail?: Record<string, unknown> | undefined;
}

export interface AdapterMetrics {
  latencySamplesMs: number[];
  documentsIndexed: number;
  semanticSearches: number;
  hybridSearches: number;
  cacheLookups: number;
  cacheHits: number;
}

/**
 * Provider-neutral SvelteKit + Kysely + Postgres 16 pgvector + Redis
 * driver. 5 ops map to the AC in Issue #943 (index build with dimension
 * guard / k-NN semantic search / hybrid vector + BM25 search / cache
 * hit-rate observation with on-demand re-index / fidelity report
 * generation).
 *
 * 1. `driveIndexBuild`      — mount an ivfflat or hnsw index over N
 *                             documents, verify the index transitions
 *                             the session to 'indexed'
 * 2. `driveSemanticSearch`  — run a k-NN query with cosine or L2
 *                             distance, return the ranked doc ids +
 *                             raw distances
 * 3. `driveHybridSearch`    — combine k-NN score + BM25 keyword score
 *                             with a vector weight in [0, 1], return
 *                             the fused ranking
 * 4. `driveCacheHitRate`    — prime the embedding cache, run repeated
 *                             lookups, optionally invalidate + re-index
 *                             to observe hit-rate recovery
 * 5. `emitFidelity`         — assemble a quality-report + release-gate
 *                             verdict, write to quality-report/
 */
export interface VectorSearchAdapter {
  readonly mode: 'real' | 'mock';
  readonly traces: () => TraceEvent[];

  driveIndexBuild(input: {
    docs: readonly DocumentRow[];
    index: VectorIndex;
  }): Promise<IndexBuildObservation>;

  driveSemanticSearch(input: {
    docs: readonly DocumentRow[];
    query: SearchQuery;
    index: VectorIndex;
    distanceKind: VectorDistanceKind;
  }): Promise<SemanticSearchObservation>;

  driveHybridSearch(input: {
    docs: readonly DocumentRow[];
    query: SearchQuery;
    index: VectorIndex;
    distanceKind: VectorDistanceKind;
    vectorWeight: number;
  }): Promise<HybridSearchObservation>;

  driveCacheHitRate(input: {
    docs: readonly DocumentRow[];
    lookups: readonly { key: string; expectedEmbedding: readonly number[] }[];
    reindex?: boolean;
  }): Promise<CacheHitRateObservation>;

  emitFidelity(): Promise<void>;

  metrics(): AdapterMetrics;

  reset(): Promise<void>;
}

/** Convenience sample factory for tests + perf. */
export function sampleDocRow(overrides: Partial<DocumentRow> = {}): DocumentRow {
  return {
    documentId: overrides.documentId ?? 'doc-sample',
    body: overrides.body ?? 'the quick brown fox jumps over the lazy dog',
    embedding: overrides.embedding ?? [0.1, 0.2, 0.3, 0.4],
  };
}

/** Neutral op names that fidelity harness diffs across mock vs real. */
export const OPS_UNDER_TEST: readonly string[] = [
  'driveIndexBuild',
  'driveSemanticSearch',
  'driveHybridSearch',
  'driveCacheHitRate',
  'emitFidelity',
];

export type { DocumentRow, VectorDistanceKind, VectorIndex };
