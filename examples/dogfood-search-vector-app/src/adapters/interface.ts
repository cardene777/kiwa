/**
 * Provider-neutral vector + semantic + hybrid search adapter surface for
 * the dogfood-search-vector-app.
 *
 * The dogfood app drives a Meilisearch + Typesense hybrid-search harness
 * through this contract only. Two implementations exist —
 *  - {@link makeMockAdapter} — walks the `@kiwa/search` v0.3
 *    `semantics/vector` + `semantics/semantic` state machines
 *    deterministically without any backend. Every op emits the neutral
 *    event onto the trace so the fidelity harness can diff ordering
 *    against the real adapter.
 *  - {@link makeRealAdapter} — models the Meilisearch + Typesense wire
 *    surface (HTTP endpoint / api-key resolution / health check) behind
 *    the `KIWA_MODE=real` env-gate. When env vars (`KIWA_MEILI_URL`,
 *    `KIWA_TYPESENSE_URL`) are wired the adapter walks the real path;
 *    otherwise every op reports the sentinel {@link KIWA_SEARCH_ENV_MISSING}
 *    so the app can budget the fallback path.
 *
 * The AC anchors this contract on 2 backends (meilisearch / typesense)
 * that production search deployments commonly ship, x 5 hybrid weight
 * configs (vector-heavy / keyword-heavy / balanced / vector-only /
 * keyword-only) x 3 canonical query fixture sets (vector-recall /
 * semantic-intent / hybrid-fusion). The 14 ops below cover the vector +
 * semantic + hybrid lifecycle end-to-end so the fidelity harness can
 * point at the exact op that drifted between mock semantics and the
 * real Meilisearch + Typesense wire surface.
 */

import type { semantics } from '@kiwa/search';
import type { SearchBackend } from '@kiwa/search';

/** Re-export from search semantics namespace. */
export type SearchTarget = semantics.SearchTarget;

/** Vector index algorithm — mirrors semantics.VectorAlgo. */
export type VectorAlgo = semantics.VectorAlgo;

/** Backend targets exercised by this dogfood app (subset of SearchBackend). */
export type HybridSearchBackend = Extract<SearchBackend, 'meilisearch' | 'typesense'>;

/** Vector index start-session input. */
export interface StartVectorIndexInput {
  backend: HybridSearchBackend;
  indexId: string;
  dimensions: number;
  algo?: VectorAlgo;
}

/** Result of starting a vector index session. */
export interface StartVectorIndexResult {
  backend: HybridSearchBackend;
  indexId: string;
  dimensions: number;
  algo: VectorAlgo;
}

/** Vector entry (id + embedding). */
export interface VectorEntry {
  id: string;
  vector: number[];
}

/** Result of adding vectors to the index. */
export interface AddVectorsResult {
  indexId: string;
  addedCount: number;
  totalCount: number;
}

/** k-NN query hit. */
export interface KnnHit {
  id: string;
  score: number;
}

/** Result of a k-NN query. */
export interface KnnQueryResult {
  indexId: string;
  k: number;
  hits: readonly KnnHit[];
  topScore: number;
}

/** Semantic session start input. */
export interface StartSemanticSessionInput {
  backend: HybridSearchBackend;
  sessionId: string;
  rerankModel?: string;
}

/** Result of starting a semantic session. */
export interface StartSemanticSessionResult {
  backend: HybridSearchBackend;
  sessionId: string;
  rerankModel: string;
}

/** Result of query-understanding step. */
export interface UnderstandQueryResult {
  rawQuery: string;
  normalizedQuery: string;
  length: number;
}

/** Semantic intent categories — mirrors semantics.Intent. */
export type SemanticIntent = semantics.Intent;

/** Result of intent classification. */
export interface ClassifyIntentResult {
  intent: SemanticIntent;
  query: string;
}

/** A single candidate document for reranking. */
export interface RerankCandidate {
  id: string;
  content: string;
  baseScore: number;
}

/** Reranked hit (id + cross-encoder score + fused score). */
export interface RerankedHit {
  id: string;
  crossEncoderScore: number;
  fusedScore: number;
}

/** Result of cross-encoder rerank. */
export interface CrossEncoderRerankResult {
  reranked: readonly RerankedHit[];
  candidateCount: number;
  model: string;
  topFused: number;
}

/** Result of caching a query embedding. */
export interface CacheEmbeddingResult {
  key: string;
  dim: number;
  cacheSize: number;
}

/** Hybrid weight configuration (vector + keyword weights). */
export interface HybridWeights {
  vectorWeight: number;
  keywordWeight: number;
}

/** Result of hybrid fusion (vector + keyword). */
export interface FuseHybridResult {
  fused: readonly KnnHit[];
  vectorWeight: number;
  keywordWeight: number;
  fusedCount: number;
}

/** Recall@k evaluation input. */
export interface RecallAnnInput {
  groundTruth: readonly string[];
  retrieved: readonly string[];
}

/** Recall@k evaluation result. */
export interface RecallAnnResult {
  recall: number;
  groundTruthSize: number;
  retrievedSize: number;
}

/** Fidelity signal emit input. */
export interface EmitFidelitySignalInput {
  bucket: string;
  signal: 'ok' | 'drift' | 'divergence';
  notes?: string;
}

/** Result of emitting a fidelity signal. */
export interface EmitFidelitySignalResult {
  bucket: string;
  signal: 'ok' | 'drift' | 'divergence';
  emittedAt: number;
}

/** Result of a Meilisearch or Typesense health check. */
export interface HealthCheckResult {
  backend: HybridSearchBackend;
  endpoint: string;
  healthy: boolean;
}

/** Neutral trace event emitted by both adapters. */
export interface TraceEvent {
  op: string;
  bucket: string;
  neutralEvent: string;
  providerEvent: string;
  target: SearchTarget;
  state: string;
  timestampMs: number;
  /**
   * Whether the op completed against a functional backend. Mock adapter
   * ops are always `ok: true` (in-memory state machine); real adapter
   * ops are `ok: false` with `errorKind: KIWA_SEARCH_ENV_MISSING` when
   * env vars are missing. The fidelity harness surfaces this asymmetry
   * as a behavioural divergence.
   */
  ok: boolean;
  errorKind?: string | undefined;
  metadata: Record<string, string | number | boolean>;
}

/**
 * The 14-op vector + semantic + hybrid search harness contract that both
 * adapters satisfy.
 *
 * Ordering — a full run flows through 14 ops so an app / test can drive
 * the entire vector index build + kNN query + semantic understand +
 * intent classify + rerank + embedding cache + hybrid fuse + recall
 * measurement + health check + reset lifecycle once and both adapters
 * emit the same neutral event trace.
 */
export interface SearchHybridAdapter {
  /** Provider target identifier. */
  readonly target: SearchTarget;

  /** Start a vector index session for the given backend. */
  startVectorIndex(input: StartVectorIndexInput): Promise<StartVectorIndexResult>;

  /** Bulk add vectors to a started index. */
  addVectors(input: {
    bucket: string;
    indexId: string;
    entries: readonly VectorEntry[];
  }): Promise<AddVectorsResult>;

  /** k-NN query returning top-k hits by cosine similarity. */
  queryKnn(input: {
    bucket: string;
    indexId: string;
    query: readonly number[];
    k: number;
  }): Promise<KnnQueryResult>;

  /** Start a semantic session for a target backend. */
  startSemanticSession(input: StartSemanticSessionInput): Promise<StartSemanticSessionResult>;

  /** Parse a raw query into a normalized form. */
  understandQuery(input: {
    bucket: string;
    sessionId: string;
    rawQuery: string;
  }): Promise<UnderstandQueryResult>;

  /** Classify the (already-understood) query into a categorical intent. */
  classifyIntent(input: {
    bucket: string;
    sessionId: string;
  }): Promise<ClassifyIntentResult>;

  /** Rerank candidates through a cross-encoder scorer. */
  crossEncoderRerank(input: {
    bucket: string;
    sessionId: string;
    candidates: readonly RerankCandidate[];
  }): Promise<CrossEncoderRerankResult>;

  /** Cache a query embedding by key. */
  cacheEmbedding(input: {
    bucket: string;
    sessionId: string;
    key: string;
    embedding: readonly number[];
  }): Promise<CacheEmbeddingResult>;

  /** Combine vector + keyword hits with tunable weights. */
  fuseHybrid(input: {
    bucket: string;
    indexId: string;
    vectorHits: readonly KnnHit[];
    keywordHits: readonly KnnHit[];
    weights: HybridWeights;
  }): Promise<FuseHybridResult>;

  /** Compute recall@k on the fused / retrieved result set. */
  recallAnn(input: {
    bucket: string;
    indexId: string;
    groundTruth: readonly string[];
    retrieved: readonly string[];
  }): Promise<RecallAnnResult>;

  /** Emit a synthesised fidelity marker used by the harness. */
  emitFidelitySignal(input: EmitFidelitySignalInput): Promise<EmitFidelitySignalResult>;

  /** Meilisearch /health check (real path: HTTP GET; mock: always ok). */
  queryMeilisearchHealth(input: { bucket: string }): Promise<HealthCheckResult>;

  /** Typesense /health check (real path: HTTP GET; mock: always ok). */
  queryTypesenseHealth(input: { bucket: string }): Promise<HealthCheckResult>;

  /** Reset the adapter (drop all state, resettable across tests). */
  reset(): Promise<void>;

  /** Trace transcript for fidelity diffing. */
  trace(): TraceEvent[];
}

/**
 * The full 14 op names + synthesised `resetVerified` step used both to
 * drive the fidelity harness and to assert both adapters implement the
 * same surface. `reset` itself is on the interface but exercised at the
 * top of every lifecycle rather than as a matrix step, so the sequence
 * captures what a single lifecycle traces.
 */
export const SEARCH_HYBRID_HARNESS_OPS = [
  'startVectorIndex',
  'addVectors',
  'queryKnn',
  'startSemanticSession',
  'understandQuery',
  'classifyIntent',
  'crossEncoderRerank',
  'cacheEmbedding',
  'fuseHybrid',
  'recallAnn',
  'emitFidelitySignal',
  'queryMeilisearchHealth',
  'queryTypesenseHealth',
  'reset',
  'resetVerified',
] as const;

export type SearchHybridHarnessOp = (typeof SEARCH_HYBRID_HARNESS_OPS)[number];

/** Sentinel emitted by the real adapter when env is missing. */
export const KIWA_SEARCH_ENV_MISSING = 'KIWA_SEARCH_ENV_MISSING';
