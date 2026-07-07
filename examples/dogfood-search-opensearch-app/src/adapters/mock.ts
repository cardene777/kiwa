/**
 * Mock adapter — drives `@kiwa-test/search` v0.3 `semantics/relevance` +
 * `semantics/synonym-advanced` + `semantics/index-management` state
 * machines deterministically without any backend. The same app code
 * exercises a full relevance + synonym + index-management lifecycle
 * without launching an OpenSearch cluster.
 *
 * State model — one {@link BucketSession} per bucket; sessions are
 * isolated so multi-fixture harnesses can run articles / multilingual /
 * cluster side-by-side without state leakage. That mirrors how
 * OpenSearch keeps per-index state in production.
 *
 * The mock adapter piggy-backs on the same neutral event vocabulary
 * that `@kiwa-test/search` v0.3 relevance + synonym-advanced +
 * index-management semantics emit — every op appends the matching
 * neutral event onto the trace so the fidelity harness can assert both
 * adapters produce identical event orderings.
 */

import { semantics } from '@kiwa-test/search';
import {
  type AllocateShardsResult,
  type ApplyCustomRankingResult,
  type BridgeTypoResult,
  type EmitFidelitySignalInput,
  type EmitFidelitySignalResult,
  type ExpandMultiLanguageResult,
  type HealthCheckResult,
  type Language,
  type MatchPhoneticResult,
  type NormalizeStemmerResult,
  type OpenSearchAdapter,
  type OpenSearchBackend,
  type PromoteReplicaResult,
  type RelevanceDocument,
  type ScoreBm25Result,
  type ScoreTfIdfResult,
  type ScoredHit,
  type SearchTarget,
  type SeedRelevanceDocumentsResult,
  type SelectAbVariantResult,
  type StartIndexMgmtSessionInput,
  type StartIndexMgmtSessionResult,
  type StartRelevanceSessionInput,
  type StartRelevanceSessionResult,
  type StartSynonymSessionInput,
  type StartSynonymSessionResult,
  type SwapZeroDowntimeResult,
  type SynonymEntry,
  type AdvanceRollingReindexResult,
  type TraceEvent,
} from './interface.js';

const {
  advanceRollingReindex: idxAdvanceRollingReindex,
  allocateShards: idxAllocateShards,
  applyCustomRanking: relevanceApplyCustomRanking,
  bridgeTypo: synonymBridgeTypo,
  expandMultiLanguage: synonymExpandMultiLanguage,
  matchPhonetic: synonymMatchPhonetic,
  normalizeStemmer: synonymNormalizeStemmer,
  promoteReplica: idxPromoteReplica,
  registerSynonyms: synonymRegisterSynonyms,
  scoreBm25: relevanceScoreBm25,
  scoreTfIdf: relevanceScoreTfIdf,
  seedRelevanceDocuments: relevanceSeedDocuments,
  selectAbVariant: relevanceSelectAbVariant,
  startIndexMgmtSession: idxStartSession,
  startRelevanceSession: relevanceStartSession,
  startSynonymSession: synonymStartSession,
  swapZeroDowntime: idxSwapZeroDowntime,
} = semantics;

type RelevanceSession = ReturnType<typeof relevanceStartSession>;
type SynonymSession = ReturnType<typeof synonymStartSession>;
type IndexMgmtSession = ReturnType<typeof idxStartSession>;

/**
 * Per-bucket session state — one relevance + synonym + index-management
 * trio per bucket. Buckets isolate fixture combinations (articles /
 * multilingual / cluster) so the matrix harness can drive N fixtures
 * without state leakage.
 */
interface BucketSession {
  backend: OpenSearchBackend;
  relevance: RelevanceSession | null;
  synonym: SynonymSession | null;
  indexMgmt: IndexMgmtSession | null;
}

/**
 * Build a mock OpenSearch adapter. `target` selects the provider
 * vocabulary in the emitted trace; the default `opensearch-oss` gives
 * the fidelity harness a natural label for the mock leg of the diff.
 */
export function makeMockAdapter(
  input: { target?: SearchTarget } = {},
): OpenSearchAdapter {
  const target: SearchTarget = input.target ?? 'opensearch-oss';
  const buckets = new Map<string, BucketSession>();
  const traceLog: TraceEvent[] = [];

  const emit = (
    op: string,
    bucket: string,
    session: BucketSession | null,
    neutralEvent: string,
    metadata: Record<string, string | number | boolean> = {},
  ) => {
    const providerEvent = providerEventFor(target, neutralEvent);
    traceLog.push({
      op,
      bucket,
      neutralEvent,
      providerEvent,
      target,
      state: sessionStateLabel(session),
      timestampMs: Date.now(),
      ok: true,
      metadata: { target, bucket, ...metadata },
    });
  };

  const requireBucket = (bucket: string): BucketSession => {
    const session = buckets.get(bucket);
    if (!session) {
      throw new Error(`mock adapter: bucket ${bucket} has not been started`);
    }
    return session;
  };

  const ensureBucket = (bucket: string, backend: OpenSearchBackend): BucketSession => {
    const existing = buckets.get(bucket);
    if (existing) return existing;
    const created: BucketSession = {
      backend,
      relevance: null,
      synonym: null,
      indexMgmt: null,
    };
    buckets.set(bucket, created);
    return created;
  };

  return {
    target,

    async startRelevanceSession(
      inputArg: StartRelevanceSessionInput,
    ): Promise<StartRelevanceSessionResult> {
      const bucket = inputArg.backend;
      const session = ensureBucket(bucket, inputArg.backend);
      session.relevance = relevanceStartSession({
        target: mapBackendToTarget(inputArg.backend),
        indexId: inputArg.indexId,
        ...(inputArg.bm25K1 !== undefined ? { bm25K1: inputArg.bm25K1 } : {}),
        ...(inputArg.bm25B !== undefined ? { bm25B: inputArg.bm25B } : {}),
      });
      emit('startRelevanceSession', bucket, session, 'relevance.session_started', {
        backend: inputArg.backend,
        indexId: inputArg.indexId,
        bm25K1: session.relevance.bm25K1,
        bm25B: session.relevance.bm25B,
      });
      return {
        backend: inputArg.backend,
        indexId: inputArg.indexId,
        bm25K1: session.relevance.bm25K1,
        bm25B: session.relevance.bm25B,
      };
    },

    async seedRelevanceDocuments(inputArg: {
      bucket: string;
      indexId: string;
      documents: readonly RelevanceDocument[];
    }): Promise<SeedRelevanceDocumentsResult> {
      const session = requireBucket(inputArg.bucket);
      if (!session.relevance) {
        throw new Error(
          `mock adapter: bucket ${inputArg.bucket} has no relevance session`,
        );
      }
      relevanceSeedDocuments(
        session.relevance,
        inputArg.documents.map((d) => ({ ...d })),
      );
      emit('seedRelevanceDocuments', inputArg.bucket, session, 'relevance.documents_seeded', {
        indexId: inputArg.indexId,
        seededCount: inputArg.documents.length,
        totalCount: session.relevance.documents.length,
      });
      return {
        indexId: inputArg.indexId,
        seededCount: inputArg.documents.length,
        totalCount: session.relevance.documents.length,
      };
    },

    async scoreBm25(inputArg: {
      bucket: string;
      indexId: string;
      query: string;
    }): Promise<ScoreBm25Result> {
      const session = requireBucket(inputArg.bucket);
      if (!session.relevance) {
        throw new Error(
          `mock adapter: bucket ${inputArg.bucket} has no relevance session`,
        );
      }
      const { hits } = relevanceScoreBm25(session.relevance, inputArg.query);
      emit('scoreBm25', inputArg.bucket, session, 'relevance.bm25_scored', {
        indexId: inputArg.indexId,
        query: inputArg.query,
        hitCount: hits.length,
      });
      return { query: inputArg.query, hitCount: hits.length, hits };
    },

    async scoreTfIdf(inputArg: {
      bucket: string;
      indexId: string;
      query: string;
    }): Promise<ScoreTfIdfResult> {
      const session = requireBucket(inputArg.bucket);
      if (!session.relevance) {
        throw new Error(
          `mock adapter: bucket ${inputArg.bucket} has no relevance session`,
        );
      }
      const { hits } = relevanceScoreTfIdf(session.relevance, inputArg.query);
      emit('scoreTfIdf', inputArg.bucket, session, 'relevance.tfidf_scored', {
        indexId: inputArg.indexId,
        query: inputArg.query,
        hitCount: hits.length,
      });
      return { query: inputArg.query, hitCount: hits.length, hits };
    },

    async applyCustomRanking(inputArg: {
      bucket: string;
      indexId: string;
      hits: readonly ScoredHit[];
      boostFn: (doc: RelevanceDocument) => number;
    }): Promise<ApplyCustomRankingResult> {
      const session = requireBucket(inputArg.bucket);
      if (!session.relevance) {
        throw new Error(
          `mock adapter: bucket ${inputArg.bucket} has no relevance session`,
        );
      }
      const { ranked } = relevanceApplyCustomRanking(
        session.relevance,
        [...inputArg.hits],
        { boostFn: inputArg.boostFn },
      );
      const topScore = ranked[0]?.score ?? 0;
      emit('applyCustomRanking', inputArg.bucket, session, 'relevance.custom_ranking_applied', {
        indexId: inputArg.indexId,
        hitCount: ranked.length,
        topScore,
      });
      return { hitCount: ranked.length, topScore, ranked };
    },

    async selectAbVariant(inputArg: {
      bucket: string;
      indexId: string;
      variants: readonly string[];
      userId: string;
      salt?: string;
    }): Promise<SelectAbVariantResult> {
      const session = requireBucket(inputArg.bucket);
      if (!session.relevance) {
        throw new Error(
          `mock adapter: bucket ${inputArg.bucket} has no relevance session`,
        );
      }
      const { variant } = relevanceSelectAbVariant(session.relevance, {
        variants: [...inputArg.variants],
        userId: inputArg.userId,
        ...(inputArg.salt !== undefined ? { salt: inputArg.salt } : {}),
      });
      emit('selectAbVariant', inputArg.bucket, session, 'relevance.ab_variant_selected', {
        indexId: inputArg.indexId,
        variant,
        variantCount: inputArg.variants.length,
        userId: inputArg.userId,
      });
      return { variant, variantCount: inputArg.variants.length, userId: inputArg.userId };
    },

    async startSynonymSession(
      inputArg: StartSynonymSessionInput,
    ): Promise<StartSynonymSessionResult> {
      const bucket = inputArg.backend;
      const session = ensureBucket(bucket, inputArg.backend);
      session.synonym = synonymStartSession({
        target: mapBackendToTarget(inputArg.backend),
        indexId: inputArg.indexId,
        ...(inputArg.activeLanguage !== undefined
          ? { activeLanguage: inputArg.activeLanguage }
          : {}),
      });
      emit('startSynonymSession', bucket, session, 'synonym.session_started', {
        backend: inputArg.backend,
        indexId: inputArg.indexId,
        activeLanguage: session.synonym.activeLanguage,
      });
      return {
        backend: inputArg.backend,
        indexId: inputArg.indexId,
        activeLanguage: session.synonym.activeLanguage,
      };
    },

    async registerSynonyms(inputArg: {
      bucket: string;
      indexId: string;
      entries: readonly SynonymEntry[];
    }): Promise<{ registeredCount: number }> {
      const session = requireBucket(inputArg.bucket);
      if (!session.synonym) {
        throw new Error(
          `mock adapter: bucket ${inputArg.bucket} has no synonym session`,
        );
      }
      synonymRegisterSynonyms(
        session.synonym,
        inputArg.entries.map((e) => ({ ...e, synonyms: [...e.synonyms] })),
      );
      emit('registerSynonyms', inputArg.bucket, session, 'synonym.entries_registered', {
        indexId: inputArg.indexId,
        registeredCount: inputArg.entries.length,
        totalCount: session.synonym.entries.length,
      });
      return { registeredCount: inputArg.entries.length };
    },

    async expandMultiLanguage(inputArg: {
      bucket: string;
      indexId: string;
      query: string;
      languages: readonly Language[];
    }): Promise<ExpandMultiLanguageResult> {
      const session = requireBucket(inputArg.bucket);
      if (!session.synonym) {
        throw new Error(
          `mock adapter: bucket ${inputArg.bucket} has no synonym session`,
        );
      }
      const { expanded } = synonymExpandMultiLanguage(session.synonym, {
        query: inputArg.query,
        languages: [...inputArg.languages],
      });
      emit('expandMultiLanguage', inputArg.bucket, session, 'synonym.multi_language_expanded', {
        indexId: inputArg.indexId,
        original: inputArg.query,
        expandedCount: expanded.length,
      });
      return {
        original: inputArg.query,
        expandedCount: expanded.length,
        expanded,
      };
    },

    async matchPhonetic(inputArg: {
      bucket: string;
      indexId: string;
      query: string;
      candidates: readonly string[];
    }): Promise<MatchPhoneticResult> {
      const session = requireBucket(inputArg.bucket);
      if (!session.synonym) {
        throw new Error(
          `mock adapter: bucket ${inputArg.bucket} has no synonym session`,
        );
      }
      const { step, matched } = synonymMatchPhonetic(session.synonym, {
        query: inputArg.query,
        candidates: [...inputArg.candidates],
      });
      const soundexCode = String(step.metadata['soundexCode'] ?? '');
      emit('matchPhonetic', inputArg.bucket, session, 'synonym.phonetic_matched', {
        indexId: inputArg.indexId,
        query: inputArg.query,
        soundexCode,
        matchedCount: matched.length,
      });
      return {
        query: inputArg.query,
        soundexCode,
        matchedCount: matched.length,
        matched,
      };
    },

    async normalizeStemmer(inputArg: {
      bucket: string;
      indexId: string;
      tokens: readonly string[];
      language: Language;
    }): Promise<NormalizeStemmerResult> {
      const session = requireBucket(inputArg.bucket);
      if (!session.synonym) {
        throw new Error(
          `mock adapter: bucket ${inputArg.bucket} has no synonym session`,
        );
      }
      const { normalized } = synonymNormalizeStemmer(session.synonym, {
        tokens: [...inputArg.tokens],
        language: inputArg.language,
      });
      emit('normalizeStemmer', inputArg.bucket, session, 'synonym.stemmer_normalized', {
        indexId: inputArg.indexId,
        language: inputArg.language,
        inputCount: inputArg.tokens.length,
        normalizedCount: normalized.length,
      });
      return {
        language: inputArg.language,
        inputCount: inputArg.tokens.length,
        normalizedCount: normalized.length,
        normalized,
      };
    },

    async bridgeTypo(inputArg: {
      bucket: string;
      indexId: string;
      query: string;
      dictionary: readonly string[];
      maxDistance?: number;
    }): Promise<BridgeTypoResult> {
      const session = requireBucket(inputArg.bucket);
      if (!session.synonym) {
        throw new Error(
          `mock adapter: bucket ${inputArg.bucket} has no synonym session`,
        );
      }
      const { suggestions } = synonymBridgeTypo(session.synonym, {
        query: inputArg.query,
        dictionary: [...inputArg.dictionary],
        ...(inputArg.maxDistance !== undefined ? { maxDistance: inputArg.maxDistance } : {}),
      });
      emit('bridgeTypo', inputArg.bucket, session, 'synonym.typo_bridged', {
        indexId: inputArg.indexId,
        query: inputArg.query,
        dictionarySize: inputArg.dictionary.length,
        suggestionCount: suggestions.length,
      });
      return {
        query: inputArg.query,
        suggestionCount: suggestions.length,
        suggestions,
      };
    },

    async startIndexMgmtSession(
      inputArg: StartIndexMgmtSessionInput,
    ): Promise<StartIndexMgmtSessionResult> {
      const bucket = inputArg.backend;
      const session = ensureBucket(bucket, inputArg.backend);
      session.indexMgmt = idxStartSession({
        target: mapBackendToTarget(inputArg.backend),
        indexId: inputArg.indexId,
        shardCount: inputArg.shardCount,
        replicaCount: inputArg.replicaCount,
        nodes: [...inputArg.nodes],
      });
      emit('startIndexMgmtSession', bucket, session, 'index.session_started', {
        backend: inputArg.backend,
        indexId: inputArg.indexId,
        shardCount: inputArg.shardCount,
        replicaCount: inputArg.replicaCount,
        nodeCount: inputArg.nodes.length,
      });
      return {
        backend: inputArg.backend,
        indexId: inputArg.indexId,
        shardCount: inputArg.shardCount,
        replicaCount: inputArg.replicaCount,
        nodeCount: inputArg.nodes.length,
      };
    },

    async allocateShards(inputArg: {
      bucket: string;
      indexId: string;
    }): Promise<AllocateShardsResult> {
      const session = requireBucket(inputArg.bucket);
      if (!session.indexMgmt) {
        throw new Error(
          `mock adapter: bucket ${inputArg.bucket} has no index-mgmt session`,
        );
      }
      idxAllocateShards(session.indexMgmt);
      emit('allocateShards', inputArg.bucket, session, 'index.shard_allocated', {
        indexId: inputArg.indexId,
        shardCount: session.indexMgmt.shardCount,
        replicaCount: session.indexMgmt.replicaCount,
        totalAssignments: session.indexMgmt.shards.length,
      });
      return {
        shardCount: session.indexMgmt.shardCount,
        replicaCount: session.indexMgmt.replicaCount,
        totalAssignments: session.indexMgmt.shards.length,
      };
    },

    async promoteReplica(inputArg: {
      bucket: string;
      indexId: string;
      shardId: number;
      failedNode: string;
    }): Promise<PromoteReplicaResult> {
      const session = requireBucket(inputArg.bucket);
      if (!session.indexMgmt) {
        throw new Error(
          `mock adapter: bucket ${inputArg.bucket} has no index-mgmt session`,
        );
      }
      const step = idxPromoteReplica(session.indexMgmt, {
        shardId: inputArg.shardId,
        failedNode: inputArg.failedNode,
      });
      const newPrimaryNode = String(step.metadata['newPrimaryNode'] ?? '');
      emit('promoteReplica', inputArg.bucket, session, 'index.replica_promoted', {
        indexId: inputArg.indexId,
        shardId: inputArg.shardId,
        failedNode: inputArg.failedNode,
        newPrimaryNode,
      });
      return {
        shardId: inputArg.shardId,
        failedNode: inputArg.failedNode,
        newPrimaryNode,
      };
    },

    async advanceRollingReindex(inputArg: {
      bucket: string;
      indexId: string;
      batchPercent: number;
    }): Promise<AdvanceRollingReindexResult> {
      const session = requireBucket(inputArg.bucket);
      if (!session.indexMgmt) {
        throw new Error(
          `mock adapter: bucket ${inputArg.bucket} has no index-mgmt session`,
        );
      }
      const step = idxAdvanceRollingReindex(session.indexMgmt, {
        batchPercent: inputArg.batchPercent,
      });
      const progress = Number(step.metadata['progress'] ?? 0);
      const completed = Boolean(step.metadata['completed']);
      emit('advanceRollingReindex', inputArg.bucket, session, 'index.rolling_reindex_advanced', {
        indexId: inputArg.indexId,
        batchPercent: inputArg.batchPercent,
        progress,
        completed,
      });
      return { batchPercent: inputArg.batchPercent, progress, completed };
    },

    async swapZeroDowntime(inputArg: {
      bucket: string;
      indexId: string;
      newIndexId: string;
    }): Promise<SwapZeroDowntimeResult> {
      const session = requireBucket(inputArg.bucket);
      if (!session.indexMgmt) {
        throw new Error(
          `mock adapter: bucket ${inputArg.bucket} has no index-mgmt session`,
        );
      }
      const step = idxSwapZeroDowntime(session.indexMgmt, {
        newIndexId: inputArg.newIndexId,
      });
      const previousAlias = String(step.metadata['previousAlias'] ?? '');
      const reindexProgress = Number(step.metadata['reindexProgress'] ?? 0);
      emit('swapZeroDowntime', inputArg.bucket, session, 'index.zero_downtime_swapped', {
        indexId: inputArg.indexId,
        newAlias: inputArg.newIndexId,
        previousAlias,
        reindexProgress,
      });
      return {
        previousAlias,
        newAlias: inputArg.newIndexId,
        reindexProgress,
      };
    },

    async emitFidelitySignal(
      inputArg: EmitFidelitySignalInput,
    ): Promise<EmitFidelitySignalResult> {
      const session = buckets.get(inputArg.bucket) ?? null;
      const emittedAt = Date.now();
      emit('emitFidelitySignal', inputArg.bucket, session, 'search.fidelity_signal', {
        signal: inputArg.signal,
        notes: inputArg.notes ?? '',
        emittedAt,
      });
      return { bucket: inputArg.bucket, signal: inputArg.signal, emittedAt };
    },

    async queryOpensearchHealth(inputArg: { bucket: string }): Promise<HealthCheckResult> {
      const session = buckets.get(inputArg.bucket) ?? null;
      const endpoint = 'in-memory://opensearch-oss';
      emit('queryOpensearchHealth', inputArg.bucket, session, 'search.opensearch_health_ok', {
        endpoint,
        healthy: true,
      });
      return { backend: 'opensearch-oss', endpoint, healthy: true };
    },

    async reset(): Promise<void> {
      buckets.clear();
      traceLog.length = 0;
    },

    trace(): TraceEvent[] {
      return traceLog.slice();
    },
  };
}

/**
 * Map an OpenSearchBackend id to the semantics.SearchTarget vocabulary.
 * The mock adapter uses the same identifier space for both, so this is
 * a direct 1:1 map at present.
 */
function mapBackendToTarget(backend: OpenSearchBackend): SearchTarget {
  return backend;
}

/**
 * Best-effort session state label used in trace records — relevance
 * wins if present, synonym is second, indexMgmt is third, and `idle`
 * when none has been started.
 */
function sessionStateLabel(session: BucketSession | null): string {
  if (session === null) return 'idle';
  if (session.relevance) return session.relevance.state;
  if (session.synonym) return session.synonym.state;
  if (session.indexMgmt) return session.indexMgmt.state;
  return 'idle';
}

/**
 * Map a neutral event to its provider-specific dialect. The search v0.3
 * package exposes `providerEventName` in `semantics/types.ts` but the
 * dogfood adapter needs to emit synthetic events (`relevance.session_started`
 * / `synonym.session_started` / `index.session_started` /
 * `synonym.entries_registered` / `relevance.documents_seeded` /
 * `search.fidelity_signal` / `search.opensearch_health_ok`) that fall
 * outside the semantic axis vocabulary, so we prefix locally.
 */
function providerEventFor(target: SearchTarget, neutralEvent: string): string {
  return `${target}.${neutralEvent}`;
}
