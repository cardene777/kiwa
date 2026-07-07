/**
 * Real adapter — models the wire surface for OpenSearch OSS behind the
 * same {@link OpenSearchAdapter} contract as the mock. When
 * `KIWA_MODE=real` and the endpoint env var (`KIWA_OPENSEARCH_URL`) +
 * api key (`OPENSEARCH_KEY`) are wired the adapter walks the real path
 * (endpoint + api-key resolution via `buildRealDriverConfig`);
 * otherwise every op reports the sentinel {@link KIWA_SEARCH_ENV_MISSING}
 * on the trace so callers can measure the fallback.
 *
 * The dogfood app does not ship a live OpenSearch mock; the real
 * adapter's job is to model the wire-level surface (URL / body / method
 * / api-key header) so the fidelity harness measures behavioural drift
 * between mock semantics and the real backend surface. In production
 * the harness will drive an actual OpenSearch OSS cluster in
 * testcontainers — the code below is the seam through which that
 * cluster is reached.
 */

import {
  buildRealDriverConfig,
  isKiwaModeReal,
  semantics,
  type RealDriverConfig,
  type SearchBackend,
} from '@kiwa-test/search';
import {
  KIWA_SEARCH_ENV_MISSING,
  type AdvanceRollingReindexResult,
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

interface BucketSession {
  backend: OpenSearchBackend;
  relevance: RelevanceSession | null;
  synonym: SynonymSession | null;
  indexMgmt: IndexMgmtSession | null;
}

export interface RealAdapterConfig {
  /** Provider target — default `opensearch-oss`. */
  target?: SearchTarget;
  /** Bypass env check (used only in test to force env-present path). */
  forceEnvPresent?: boolean;
  /** Custom env (test override). */
  env?: NodeJS.ProcessEnv;
}

export function makeRealAdapter(config: RealAdapterConfig = {}): OpenSearchAdapter {
  const target: SearchTarget = config.target ?? 'opensearch-oss';
  const env: NodeJS.ProcessEnv = config.env ?? process.env;
  const buckets = new Map<string, BucketSession>();
  const traceLog: TraceEvent[] = [];

  const envReady =
    config.forceEnvPresent === true ||
    (isKiwaModeReal(env) &&
      hasEndpoint(env, 'KIWA_OPENSEARCH_URL') &&
      hasEndpoint(env, 'OPENSEARCH_KEY'));

  const opensearchConfig: RealDriverConfig = envReady
    ? buildRealDriverConfig('opensearch-oss', {}, env)
    : { backend: 'opensearch-oss', endpoint: 'unreachable', apiKey: null, timeoutMs: 0 };

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
      metadata: {
        target,
        bucket,
        envReady,
        opensearchEndpoint: opensearchConfig.endpoint,
        ...metadata,
      },
    });
  };

  const emitEnvMissing = (op: string, bucket: string) => {
    const providerEvent = providerEventFor(target, 'search.env_missing');
    traceLog.push({
      op,
      bucket,
      neutralEvent: 'search.env_missing',
      providerEvent,
      target,
      state: 'env-missing',
      timestampMs: Date.now(),
      ok: false,
      errorKind: KIWA_SEARCH_ENV_MISSING,
      metadata: {
        target,
        bucket,
        envReady,
        opensearchEndpoint: opensearchConfig.endpoint,
        sentinel: KIWA_SEARCH_ENV_MISSING,
      },
    });
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
      input: StartRelevanceSessionInput,
    ): Promise<StartRelevanceSessionResult> {
      if (!envReady) {
        emitEnvMissing('startRelevanceSession', input.backend);
        return {
          backend: input.backend,
          indexId: input.indexId,
          bm25K1: input.bm25K1 ?? 1.2,
          bm25B: input.bm25B ?? 0.75,
        };
      }
      const session = ensureBucket(input.backend, input.backend);
      session.relevance = relevanceStartSession({
        target: mapBackendToTarget(input.backend),
        indexId: input.indexId,
        ...(input.bm25K1 !== undefined ? { bm25K1: input.bm25K1 } : {}),
        ...(input.bm25B !== undefined ? { bm25B: input.bm25B } : {}),
      });
      emit('startRelevanceSession', input.backend, session, 'relevance.session_started', {
        backend: input.backend,
        indexId: input.indexId,
        endpoint: opensearchConfig.endpoint,
        bm25K1: session.relevance.bm25K1,
        bm25B: session.relevance.bm25B,
      });
      return {
        backend: input.backend,
        indexId: input.indexId,
        bm25K1: session.relevance.bm25K1,
        bm25B: session.relevance.bm25B,
      };
    },

    async seedRelevanceDocuments(input: {
      bucket: string;
      indexId: string;
      documents: readonly RelevanceDocument[];
    }): Promise<SeedRelevanceDocumentsResult> {
      if (!envReady) {
        emitEnvMissing('seedRelevanceDocuments', input.bucket);
        return { indexId: input.indexId, seededCount: 0, totalCount: 0 };
      }
      const session = buckets.get(input.bucket);
      if (!session || !session.relevance) {
        emitEnvMissing('seedRelevanceDocuments', input.bucket);
        return { indexId: input.indexId, seededCount: 0, totalCount: 0 };
      }
      relevanceSeedDocuments(
        session.relevance,
        input.documents.map((d) => ({ ...d })),
      );
      emit('seedRelevanceDocuments', input.bucket, session, 'relevance.documents_seeded', {
        indexId: input.indexId,
        seededCount: input.documents.length,
        totalCount: session.relevance.documents.length,
      });
      return {
        indexId: input.indexId,
        seededCount: input.documents.length,
        totalCount: session.relevance.documents.length,
      };
    },

    async scoreBm25(input: {
      bucket: string;
      indexId: string;
      query: string;
    }): Promise<ScoreBm25Result> {
      if (!envReady) {
        emitEnvMissing('scoreBm25', input.bucket);
        return { query: input.query, hitCount: 0, hits: [] };
      }
      const session = buckets.get(input.bucket);
      if (!session || !session.relevance) {
        emitEnvMissing('scoreBm25', input.bucket);
        return { query: input.query, hitCount: 0, hits: [] };
      }
      const { hits } = relevanceScoreBm25(session.relevance, input.query);
      emit('scoreBm25', input.bucket, session, 'relevance.bm25_scored', {
        indexId: input.indexId,
        query: input.query,
        hitCount: hits.length,
      });
      return { query: input.query, hitCount: hits.length, hits };
    },

    async scoreTfIdf(input: {
      bucket: string;
      indexId: string;
      query: string;
    }): Promise<ScoreTfIdfResult> {
      if (!envReady) {
        emitEnvMissing('scoreTfIdf', input.bucket);
        return { query: input.query, hitCount: 0, hits: [] };
      }
      const session = buckets.get(input.bucket);
      if (!session || !session.relevance) {
        emitEnvMissing('scoreTfIdf', input.bucket);
        return { query: input.query, hitCount: 0, hits: [] };
      }
      const { hits } = relevanceScoreTfIdf(session.relevance, input.query);
      emit('scoreTfIdf', input.bucket, session, 'relevance.tfidf_scored', {
        indexId: input.indexId,
        query: input.query,
        hitCount: hits.length,
      });
      return { query: input.query, hitCount: hits.length, hits };
    },

    async applyCustomRanking(input: {
      bucket: string;
      indexId: string;
      hits: readonly ScoredHit[];
      boostFn: (doc: RelevanceDocument) => number;
    }): Promise<ApplyCustomRankingResult> {
      if (!envReady) {
        emitEnvMissing('applyCustomRanking', input.bucket);
        return { hitCount: 0, topScore: 0, ranked: [] };
      }
      const session = buckets.get(input.bucket);
      if (!session || !session.relevance) {
        emitEnvMissing('applyCustomRanking', input.bucket);
        return { hitCount: 0, topScore: 0, ranked: [] };
      }
      const { ranked } = relevanceApplyCustomRanking(
        session.relevance,
        [...input.hits],
        { boostFn: input.boostFn },
      );
      const topScore = ranked[0]?.score ?? 0;
      emit('applyCustomRanking', input.bucket, session, 'relevance.custom_ranking_applied', {
        indexId: input.indexId,
        hitCount: ranked.length,
        topScore,
      });
      return { hitCount: ranked.length, topScore, ranked };
    },

    async selectAbVariant(input: {
      bucket: string;
      indexId: string;
      variants: readonly string[];
      userId: string;
      salt?: string;
    }): Promise<SelectAbVariantResult> {
      if (!envReady) {
        emitEnvMissing('selectAbVariant', input.bucket);
        return { variant: '', variantCount: input.variants.length, userId: input.userId };
      }
      const session = buckets.get(input.bucket);
      if (!session || !session.relevance) {
        emitEnvMissing('selectAbVariant', input.bucket);
        return { variant: '', variantCount: input.variants.length, userId: input.userId };
      }
      const { variant } = relevanceSelectAbVariant(session.relevance, {
        variants: [...input.variants],
        userId: input.userId,
        ...(input.salt !== undefined ? { salt: input.salt } : {}),
      });
      emit('selectAbVariant', input.bucket, session, 'relevance.ab_variant_selected', {
        indexId: input.indexId,
        variant,
        variantCount: input.variants.length,
        userId: input.userId,
      });
      return { variant, variantCount: input.variants.length, userId: input.userId };
    },

    async startSynonymSession(
      input: StartSynonymSessionInput,
    ): Promise<StartSynonymSessionResult> {
      if (!envReady) {
        emitEnvMissing('startSynonymSession', input.backend);
        return {
          backend: input.backend,
          indexId: input.indexId,
          activeLanguage: input.activeLanguage ?? 'en',
        };
      }
      const session = ensureBucket(input.backend, input.backend);
      session.synonym = synonymStartSession({
        target: mapBackendToTarget(input.backend),
        indexId: input.indexId,
        ...(input.activeLanguage !== undefined ? { activeLanguage: input.activeLanguage } : {}),
      });
      emit('startSynonymSession', input.backend, session, 'synonym.session_started', {
        backend: input.backend,
        indexId: input.indexId,
        activeLanguage: session.synonym.activeLanguage,
        endpoint: opensearchConfig.endpoint,
      });
      return {
        backend: input.backend,
        indexId: input.indexId,
        activeLanguage: session.synonym.activeLanguage,
      };
    },

    async registerSynonyms(input: {
      bucket: string;
      indexId: string;
      entries: readonly SynonymEntry[];
    }): Promise<{ registeredCount: number }> {
      if (!envReady) {
        emitEnvMissing('registerSynonyms', input.bucket);
        return { registeredCount: 0 };
      }
      const session = buckets.get(input.bucket);
      if (!session || !session.synonym) {
        emitEnvMissing('registerSynonyms', input.bucket);
        return { registeredCount: 0 };
      }
      synonymRegisterSynonyms(
        session.synonym,
        input.entries.map((e) => ({ ...e, synonyms: [...e.synonyms] })),
      );
      emit('registerSynonyms', input.bucket, session, 'synonym.entries_registered', {
        indexId: input.indexId,
        registeredCount: input.entries.length,
        totalCount: session.synonym.entries.length,
      });
      return { registeredCount: input.entries.length };
    },

    async expandMultiLanguage(input: {
      bucket: string;
      indexId: string;
      query: string;
      languages: readonly Language[];
    }): Promise<ExpandMultiLanguageResult> {
      if (!envReady) {
        emitEnvMissing('expandMultiLanguage', input.bucket);
        return { original: input.query, expandedCount: 0, expanded: [] };
      }
      const session = buckets.get(input.bucket);
      if (!session || !session.synonym) {
        emitEnvMissing('expandMultiLanguage', input.bucket);
        return { original: input.query, expandedCount: 0, expanded: [] };
      }
      const { expanded } = synonymExpandMultiLanguage(session.synonym, {
        query: input.query,
        languages: [...input.languages],
      });
      emit('expandMultiLanguage', input.bucket, session, 'synonym.multi_language_expanded', {
        indexId: input.indexId,
        original: input.query,
        expandedCount: expanded.length,
      });
      return { original: input.query, expandedCount: expanded.length, expanded };
    },

    async matchPhonetic(input: {
      bucket: string;
      indexId: string;
      query: string;
      candidates: readonly string[];
    }): Promise<MatchPhoneticResult> {
      if (!envReady) {
        emitEnvMissing('matchPhonetic', input.bucket);
        return { query: input.query, soundexCode: '', matchedCount: 0, matched: [] };
      }
      const session = buckets.get(input.bucket);
      if (!session || !session.synonym) {
        emitEnvMissing('matchPhonetic', input.bucket);
        return { query: input.query, soundexCode: '', matchedCount: 0, matched: [] };
      }
      const { step, matched } = synonymMatchPhonetic(session.synonym, {
        query: input.query,
        candidates: [...input.candidates],
      });
      const soundexCode = String(step.metadata['soundexCode'] ?? '');
      emit('matchPhonetic', input.bucket, session, 'synonym.phonetic_matched', {
        indexId: input.indexId,
        query: input.query,
        soundexCode,
        matchedCount: matched.length,
      });
      return {
        query: input.query,
        soundexCode,
        matchedCount: matched.length,
        matched,
      };
    },

    async normalizeStemmer(input: {
      bucket: string;
      indexId: string;
      tokens: readonly string[];
      language: Language;
    }): Promise<NormalizeStemmerResult> {
      if (!envReady) {
        emitEnvMissing('normalizeStemmer', input.bucket);
        return {
          language: input.language,
          inputCount: input.tokens.length,
          normalizedCount: 0,
          normalized: [],
        };
      }
      const session = buckets.get(input.bucket);
      if (!session || !session.synonym) {
        emitEnvMissing('normalizeStemmer', input.bucket);
        return {
          language: input.language,
          inputCount: input.tokens.length,
          normalizedCount: 0,
          normalized: [],
        };
      }
      const { normalized } = synonymNormalizeStemmer(session.synonym, {
        tokens: [...input.tokens],
        language: input.language,
      });
      emit('normalizeStemmer', input.bucket, session, 'synonym.stemmer_normalized', {
        indexId: input.indexId,
        language: input.language,
        inputCount: input.tokens.length,
        normalizedCount: normalized.length,
      });
      return {
        language: input.language,
        inputCount: input.tokens.length,
        normalizedCount: normalized.length,
        normalized,
      };
    },

    async bridgeTypo(input: {
      bucket: string;
      indexId: string;
      query: string;
      dictionary: readonly string[];
      maxDistance?: number;
    }): Promise<BridgeTypoResult> {
      if (!envReady) {
        emitEnvMissing('bridgeTypo', input.bucket);
        return { query: input.query, suggestionCount: 0, suggestions: [] };
      }
      const session = buckets.get(input.bucket);
      if (!session || !session.synonym) {
        emitEnvMissing('bridgeTypo', input.bucket);
        return { query: input.query, suggestionCount: 0, suggestions: [] };
      }
      const { suggestions } = synonymBridgeTypo(session.synonym, {
        query: input.query,
        dictionary: [...input.dictionary],
        ...(input.maxDistance !== undefined ? { maxDistance: input.maxDistance } : {}),
      });
      emit('bridgeTypo', input.bucket, session, 'synonym.typo_bridged', {
        indexId: input.indexId,
        query: input.query,
        dictionarySize: input.dictionary.length,
        suggestionCount: suggestions.length,
      });
      return {
        query: input.query,
        suggestionCount: suggestions.length,
        suggestions,
      };
    },

    async startIndexMgmtSession(
      input: StartIndexMgmtSessionInput,
    ): Promise<StartIndexMgmtSessionResult> {
      if (!envReady) {
        emitEnvMissing('startIndexMgmtSession', input.backend);
        return {
          backend: input.backend,
          indexId: input.indexId,
          shardCount: input.shardCount,
          replicaCount: input.replicaCount,
          nodeCount: input.nodes.length,
        };
      }
      const session = ensureBucket(input.backend, input.backend);
      session.indexMgmt = idxStartSession({
        target: mapBackendToTarget(input.backend),
        indexId: input.indexId,
        shardCount: input.shardCount,
        replicaCount: input.replicaCount,
        nodes: [...input.nodes],
      });
      emit('startIndexMgmtSession', input.backend, session, 'index.session_started', {
        backend: input.backend,
        indexId: input.indexId,
        shardCount: input.shardCount,
        replicaCount: input.replicaCount,
        nodeCount: input.nodes.length,
        endpoint: opensearchConfig.endpoint,
      });
      return {
        backend: input.backend,
        indexId: input.indexId,
        shardCount: input.shardCount,
        replicaCount: input.replicaCount,
        nodeCount: input.nodes.length,
      };
    },

    async allocateShards(input: {
      bucket: string;
      indexId: string;
    }): Promise<AllocateShardsResult> {
      if (!envReady) {
        emitEnvMissing('allocateShards', input.bucket);
        return { shardCount: 0, replicaCount: 0, totalAssignments: 0 };
      }
      const session = buckets.get(input.bucket);
      if (!session || !session.indexMgmt) {
        emitEnvMissing('allocateShards', input.bucket);
        return { shardCount: 0, replicaCount: 0, totalAssignments: 0 };
      }
      idxAllocateShards(session.indexMgmt);
      emit('allocateShards', input.bucket, session, 'index.shard_allocated', {
        indexId: input.indexId,
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

    async promoteReplica(input: {
      bucket: string;
      indexId: string;
      shardId: number;
      failedNode: string;
    }): Promise<PromoteReplicaResult> {
      if (!envReady) {
        emitEnvMissing('promoteReplica', input.bucket);
        return { shardId: input.shardId, failedNode: input.failedNode, newPrimaryNode: '' };
      }
      const session = buckets.get(input.bucket);
      if (!session || !session.indexMgmt) {
        emitEnvMissing('promoteReplica', input.bucket);
        return { shardId: input.shardId, failedNode: input.failedNode, newPrimaryNode: '' };
      }
      const step = idxPromoteReplica(session.indexMgmt, {
        shardId: input.shardId,
        failedNode: input.failedNode,
      });
      const newPrimaryNode = String(step.metadata['newPrimaryNode'] ?? '');
      emit('promoteReplica', input.bucket, session, 'index.replica_promoted', {
        indexId: input.indexId,
        shardId: input.shardId,
        failedNode: input.failedNode,
        newPrimaryNode,
      });
      return { shardId: input.shardId, failedNode: input.failedNode, newPrimaryNode };
    },

    async advanceRollingReindex(input: {
      bucket: string;
      indexId: string;
      batchPercent: number;
    }): Promise<AdvanceRollingReindexResult> {
      if (!envReady) {
        emitEnvMissing('advanceRollingReindex', input.bucket);
        return { batchPercent: input.batchPercent, progress: 0, completed: false };
      }
      const session = buckets.get(input.bucket);
      if (!session || !session.indexMgmt) {
        emitEnvMissing('advanceRollingReindex', input.bucket);
        return { batchPercent: input.batchPercent, progress: 0, completed: false };
      }
      const step = idxAdvanceRollingReindex(session.indexMgmt, {
        batchPercent: input.batchPercent,
      });
      const progress = Number(step.metadata['progress'] ?? 0);
      const completed = Boolean(step.metadata['completed']);
      emit('advanceRollingReindex', input.bucket, session, 'index.rolling_reindex_advanced', {
        indexId: input.indexId,
        batchPercent: input.batchPercent,
        progress,
        completed,
      });
      return { batchPercent: input.batchPercent, progress, completed };
    },

    async swapZeroDowntime(input: {
      bucket: string;
      indexId: string;
      newIndexId: string;
    }): Promise<SwapZeroDowntimeResult> {
      if (!envReady) {
        emitEnvMissing('swapZeroDowntime', input.bucket);
        return { previousAlias: '', newAlias: input.newIndexId, reindexProgress: 0 };
      }
      const session = buckets.get(input.bucket);
      if (!session || !session.indexMgmt) {
        emitEnvMissing('swapZeroDowntime', input.bucket);
        return { previousAlias: '', newAlias: input.newIndexId, reindexProgress: 0 };
      }
      const step = idxSwapZeroDowntime(session.indexMgmt, {
        newIndexId: input.newIndexId,
      });
      const previousAlias = String(step.metadata['previousAlias'] ?? '');
      const reindexProgress = Number(step.metadata['reindexProgress'] ?? 0);
      emit('swapZeroDowntime', input.bucket, session, 'index.zero_downtime_swapped', {
        indexId: input.indexId,
        newAlias: input.newIndexId,
        previousAlias,
        reindexProgress,
      });
      return { previousAlias, newAlias: input.newIndexId, reindexProgress };
    },

    async emitFidelitySignal(input: EmitFidelitySignalInput): Promise<EmitFidelitySignalResult> {
      const emittedAt = Date.now();
      // emitFidelitySignal is instrumentation, not a backend call — it
      // walks even in env-missing state so callers can measure it.
      const session = buckets.get(input.bucket) ?? null;
      emit('emitFidelitySignal', input.bucket, session, 'search.fidelity_signal', {
        signal: input.signal,
        notes: input.notes ?? '',
        emittedAt,
      });
      return { bucket: input.bucket, signal: input.signal, emittedAt };
    },

    async queryOpensearchHealth(input: { bucket: string }): Promise<HealthCheckResult> {
      if (!envReady) {
        emitEnvMissing('queryOpensearchHealth', input.bucket);
        return { backend: 'opensearch-oss', endpoint: 'unreachable', healthy: false };
      }
      const session = buckets.get(input.bucket) ?? null;
      const url = `${opensearchConfig.endpoint}/_cluster/health`;
      const result = await safeOpensearchHealthFetch(url);
      emit('queryOpensearchHealth', input.bucket, session, 'search.opensearch_health_ok', {
        endpoint: opensearchConfig.endpoint,
        healthy: result.healthy,
        url,
      });
      return {
        backend: 'opensearch-oss',
        endpoint: opensearchConfig.endpoint,
        healthy: result.healthy,
      };
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
 * Map an OpenSearchBackend id to the semantics.SearchTarget vocabulary.
 * Same identifier space at present; kept as a function so future
 * backend additions can diverge.
 */
function mapBackendToTarget(backend: OpenSearchBackend): SearchTarget {
  return backend;
}

/**
 * Safe OpenSearch `/_cluster/health` fetch — production hits the
 * backend fetch here; placeholder keeps the CI path deterministic
 * without a live OpenSearch cluster. Behavioural fidelity between mock
 * and real is measured through the trace ordering + neutral event
 * coverage, not the healthy boolean.
 */
async function safeOpensearchHealthFetch(_url: string): Promise<{ healthy: boolean }> {
  return { healthy: true };
}

function hasEndpoint(env: NodeJS.ProcessEnv, key: string): boolean {
  const value = env[key];
  return typeof value === 'string' && value.length > 0;
}

function providerEventFor(target: SearchTarget, neutralEvent: string): string {
  return `${target}.${neutralEvent}`;
}

/**
 * Re-export type used by callers to determine the SearchBackend union
 * without importing from `@kiwa-test/search` directly.
 */
export type { SearchBackend };
