/**
 * Provider-neutral OpenSearch OSS relevance + synonym-advanced +
 * index-management adapter surface for dogfood-search-opensearch-app.
 *
 * The dogfood app drives an OpenSearch-anchored harness through this
 * contract only. Two implementations exist —
 *  - {@link makeMockAdapter} — walks the `@kiwa-test/search` v0.3
 *    `semantics/relevance` + `semantics/synonym-advanced` +
 *    `semantics/index-management` state machines deterministically
 *    without any backend. Every op emits the neutral event onto the
 *    trace so the fidelity harness can diff ordering against the real
 *    adapter.
 *  - {@link makeRealAdapter} — models the wire surface for OpenSearch
 *    OSS behind the `KIWA_MODE=real` env-gate. When env vars
 *    (`KIWA_OPENSEARCH_URL`, `OPENSEARCH_KEY`) are wired the adapter
 *    walks the real path; otherwise every op reports the sentinel
 *    {@link KIWA_SEARCH_ENV_MISSING} so the app can budget the
 *    fallback path.
 *
 * The AC anchors this contract on 1 backend (OpenSearch OSS — the
 * reference production deployment for BM25 + synonym-advanced +
 * rolling-reindex operations) x 3 fixture sets (articles /
 * multilingual / cluster). The 17 ops below cover the relevance +
 * synonym + index-management lifecycles end-to-end so the fidelity
 * harness can point at the exact op that drifted between mock semantics
 * and the real OpenSearch wire surface.
 */

import type { semantics } from '@kiwa-test/search';
import type { SearchBackend } from '@kiwa-test/search';

/** Re-export from search semantics namespace. */
export type SearchTarget = semantics.SearchTarget;

/** Relevance document — id + content + optional boost signal. */
export type RelevanceDocument = semantics.RelevanceDocument;

/** Language codes supported by the synonym-advanced axis. */
export type Language = semantics.Language;

/** Synonym entry — base word + synonyms + language. */
export type SynonymEntry = semantics.SynonymEntry;

/** Scored hit returned from BM25 / TF-IDF. */
export type ScoredHit = semantics.ScoredHit;

/** Backend target this dogfood app anchors on. */
export type OpenSearchBackend = Extract<SearchBackend, 'opensearch-oss'>;

/** Relevance session start input. */
export interface StartRelevanceSessionInput {
  backend: OpenSearchBackend;
  indexId: string;
  bm25K1?: number;
  bm25B?: number;
}

/** Result of starting a relevance session. */
export interface StartRelevanceSessionResult {
  backend: OpenSearchBackend;
  indexId: string;
  bm25K1: number;
  bm25B: number;
}

/** Result of seeding relevance documents. */
export interface SeedRelevanceDocumentsResult {
  indexId: string;
  seededCount: number;
  totalCount: number;
}

/** Result of BM25 scoring. */
export interface ScoreBm25Result {
  query: string;
  hitCount: number;
  hits: readonly ScoredHit[];
}

/** Result of TF-IDF scoring. */
export interface ScoreTfIdfResult {
  query: string;
  hitCount: number;
  hits: readonly ScoredHit[];
}

/** Result of custom ranking (score * boost). */
export interface ApplyCustomRankingResult {
  hitCount: number;
  topScore: number;
  ranked: readonly ScoredHit[];
}

/** Result of A/B variant selection. */
export interface SelectAbVariantResult {
  variant: string;
  variantCount: number;
  userId: string;
}

/** Synonym session start input. */
export interface StartSynonymSessionInput {
  backend: OpenSearchBackend;
  indexId: string;
  activeLanguage?: Language;
}

/** Result of starting a synonym session. */
export interface StartSynonymSessionResult {
  backend: OpenSearchBackend;
  indexId: string;
  activeLanguage: Language;
}

/** Result of expanding a query across languages. */
export interface ExpandMultiLanguageResult {
  original: string;
  expandedCount: number;
  expanded: readonly string[];
}

/** Result of a phonetic match. */
export interface MatchPhoneticResult {
  query: string;
  soundexCode: string;
  matchedCount: number;
  matched: readonly string[];
}

/** Result of stemmer normalization. */
export interface NormalizeStemmerResult {
  language: Language;
  inputCount: number;
  normalizedCount: number;
  normalized: readonly string[];
}

/** Result of typo bridging. */
export interface BridgeTypoResult {
  query: string;
  suggestionCount: number;
  suggestions: ReadonlyArray<{ term: string; distance: number }>;
}

/** Index management session start input. */
export interface StartIndexMgmtSessionInput {
  backend: OpenSearchBackend;
  indexId: string;
  shardCount: number;
  replicaCount: number;
  nodes: readonly string[];
}

/** Result of starting an index management session. */
export interface StartIndexMgmtSessionResult {
  backend: OpenSearchBackend;
  indexId: string;
  shardCount: number;
  replicaCount: number;
  nodeCount: number;
}

/** Result of allocating shards. */
export interface AllocateShardsResult {
  shardCount: number;
  replicaCount: number;
  totalAssignments: number;
}

/** Result of promoting a replica. */
export interface PromoteReplicaResult {
  shardId: number;
  failedNode: string;
  newPrimaryNode: string;
}

/** Result of advancing a rolling reindex. */
export interface AdvanceRollingReindexResult {
  batchPercent: number;
  progress: number;
  completed: boolean;
}

/** Result of a zero-downtime swap. */
export interface SwapZeroDowntimeResult {
  previousAlias: string;
  newAlias: string;
  reindexProgress: number;
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

/** Result of an OpenSearch cluster health check. */
export interface HealthCheckResult {
  backend: OpenSearchBackend;
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
   * ops are always `ok: true`; real adapter ops are `ok: false` with
   * `errorKind: KIWA_SEARCH_ENV_MISSING` when env vars are missing. The
   * fidelity harness surfaces this asymmetry as a behavioural divergence.
   */
  ok: boolean;
  errorKind?: string | undefined;
  metadata: Record<string, string | number | boolean>;
}

/**
 * The 17-op OpenSearch relevance + synonym + index-management harness
 * contract that both adapters satisfy.
 *
 * Ordering — a full run flows through 17 ops so an app / test can drive
 * the entire relevance + synonym + index-management lifecycle once and
 * both adapters emit the same neutral event trace.
 */
export interface OpenSearchAdapter {
  /** Provider target identifier. */
  readonly target: SearchTarget;

  /** Start a relevance session. */
  startRelevanceSession(
    input: StartRelevanceSessionInput,
  ): Promise<StartRelevanceSessionResult>;

  /** Seed relevance documents. */
  seedRelevanceDocuments(input: {
    bucket: string;
    indexId: string;
    documents: readonly RelevanceDocument[];
  }): Promise<SeedRelevanceDocumentsResult>;

  /** Score documents with BM25 against a query. */
  scoreBm25(input: {
    bucket: string;
    indexId: string;
    query: string;
  }): Promise<ScoreBm25Result>;

  /** Score documents with TF-IDF against a query. */
  scoreTfIdf(input: {
    bucket: string;
    indexId: string;
    query: string;
  }): Promise<ScoreTfIdfResult>;

  /** Apply a custom ranking boost function to BM25 hits. */
  applyCustomRanking(input: {
    bucket: string;
    indexId: string;
    hits: readonly ScoredHit[];
    boostFn: (doc: RelevanceDocument) => number;
  }): Promise<ApplyCustomRankingResult>;

  /** Select an A/B variant deterministically for a user. */
  selectAbVariant(input: {
    bucket: string;
    indexId: string;
    variants: readonly string[];
    userId: string;
    salt?: string;
  }): Promise<SelectAbVariantResult>;

  /** Start a synonym-advanced session. */
  startSynonymSession(input: StartSynonymSessionInput): Promise<StartSynonymSessionResult>;

  /** Register synonym entries into the session. */
  registerSynonyms(input: {
    bucket: string;
    indexId: string;
    entries: readonly SynonymEntry[];
  }): Promise<{ registeredCount: number }>;

  /** Expand a query across multiple languages. */
  expandMultiLanguage(input: {
    bucket: string;
    indexId: string;
    query: string;
    languages: readonly Language[];
  }): Promise<ExpandMultiLanguageResult>;

  /** Match candidate strings phonetically against the query. */
  matchPhonetic(input: {
    bucket: string;
    indexId: string;
    query: string;
    candidates: readonly string[];
  }): Promise<MatchPhoneticResult>;

  /** Normalize tokens through the language stemmer. */
  normalizeStemmer(input: {
    bucket: string;
    indexId: string;
    tokens: readonly string[];
    language: Language;
  }): Promise<NormalizeStemmerResult>;

  /** Bridge typos via Levenshtein distance against a dictionary. */
  bridgeTypo(input: {
    bucket: string;
    indexId: string;
    query: string;
    dictionary: readonly string[];
    maxDistance?: number;
  }): Promise<BridgeTypoResult>;

  /** Start an index-management session (shards + replicas + nodes). */
  startIndexMgmtSession(
    input: StartIndexMgmtSessionInput,
  ): Promise<StartIndexMgmtSessionResult>;

  /** Allocate primary + replica shards across the cluster nodes. */
  allocateShards(input: { bucket: string; indexId: string }): Promise<AllocateShardsResult>;

  /**
   * Promote a replica to primary after simulating a primary-node
   * failure.
   */
  promoteReplica(input: {
    bucket: string;
    indexId: string;
    shardId: number;
    failedNode: string;
  }): Promise<PromoteReplicaResult>;

  /** Advance the rolling reindex by a batch percentage. */
  advanceRollingReindex(input: {
    bucket: string;
    indexId: string;
    batchPercent: number;
  }): Promise<AdvanceRollingReindexResult>;

  /**
   * Zero-downtime alias swap once the rolling reindex is complete.
   */
  swapZeroDowntime(input: {
    bucket: string;
    indexId: string;
    newIndexId: string;
  }): Promise<SwapZeroDowntimeResult>;

  /** Emit a synthesised fidelity marker used by the harness. */
  emitFidelitySignal(input: EmitFidelitySignalInput): Promise<EmitFidelitySignalResult>;

  /**
   * OpenSearch `/_cluster/health` check (real path: HTTP GET; mock:
   * always ok).
   */
  queryOpensearchHealth(input: { bucket: string }): Promise<HealthCheckResult>;

  /** Reset the adapter (drop all state, resettable across tests). */
  reset(): Promise<void>;

  /** Trace transcript for fidelity diffing. */
  trace(): TraceEvent[];
}

/**
 * The 18 op names + synthesised `resetVerified` step used both to drive
 * the fidelity harness and to assert both adapters implement the same
 * surface. `reset` is on the interface but exercised at the top of every
 * lifecycle rather than as a matrix step.
 */
export const OPENSEARCH_HARNESS_OPS = [
  'startRelevanceSession',
  'seedRelevanceDocuments',
  'scoreBm25',
  'scoreTfIdf',
  'applyCustomRanking',
  'selectAbVariant',
  'startSynonymSession',
  'registerSynonyms',
  'expandMultiLanguage',
  'matchPhonetic',
  'normalizeStemmer',
  'bridgeTypo',
  'startIndexMgmtSession',
  'allocateShards',
  'promoteReplica',
  'advanceRollingReindex',
  'swapZeroDowntime',
  'emitFidelitySignal',
  'queryOpensearchHealth',
  'reset',
  'resetVerified',
] as const;

export type OpenSearchHarnessOp = (typeof OPENSEARCH_HARNESS_OPS)[number];

/** Sentinel emitted by the real adapter when env is missing. */
export const KIWA_SEARCH_ENV_MISSING = 'KIWA_SEARCH_ENV_MISSING';
