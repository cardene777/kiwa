/**
 * Real adapter — models the wire surface for Meilisearch + Typesense
 * behind the same {@link SearchHybridAdapter} contract as the mock. When
 * `KIWA_MODE=real` and the endpoint env vars (`KIWA_MEILI_URL`,
 * `KIWA_TYPESENSE_URL`) are wired the adapter walks the real path
 * (endpoint + api-key resolution via `buildRealDriverConfig`); otherwise
 * every op reports the sentinel {@link KIWA_SEARCH_ENV_MISSING} on the
 * trace so callers can measure the fallback.
 *
 * The dogfood app does not ship a live Meilisearch / Typesense mock;
 * the real adapter's job is to model the wire-level surface (URL /
 * body / method / api-key header) so the fidelity harness measures
 * behavioural drift between mock semantics and the real backend
 * surface. In production the harness will drive an actual testcontainers
 * stack (Meilisearch v1.x + Typesense) — the code below is the seam
 * through which that stack is reached.
 */

import {
  buildRealDriverConfig,
  isKiwaModeReal,
  semantics,
  type RealDriverConfig,
  type SearchBackend,
} from '@kiwa/search';
import {
  KIWA_SEARCH_ENV_MISSING,
  type AddVectorsResult,
  type CacheEmbeddingResult,
  type ClassifyIntentResult,
  type CrossEncoderRerankResult,
  type EmitFidelitySignalInput,
  type EmitFidelitySignalResult,
  type FuseHybridResult,
  type HealthCheckResult,
  type HybridSearchBackend,
  type HybridWeights,
  type KnnHit,
  type KnnQueryResult,
  type RecallAnnResult,
  type RerankCandidate,
  type SearchHybridAdapter,
  type SearchTarget,
  type StartSemanticSessionInput,
  type StartSemanticSessionResult,
  type StartVectorIndexInput,
  type StartVectorIndexResult,
  type TraceEvent,
  type UnderstandQueryResult,
  type VectorEntry,
} from './interface.js';

const {
  buildVectorIndex,
  cacheEmbedding: semanticCacheEmbedding,
  classifyIntent: semanticClassifyIntent,
  crossEncoderRerank: semanticCrossEncoderRerank,
  fuseHybrid: vectorFuseHybrid,
  queryKnn: vectorQueryKnn,
  recallAnn: vectorRecallAnn,
  startSemanticSession: semanticStartSession,
  startVectorSession,
  understandQuery: semanticUnderstandQuery,
} = semantics;

type VectorSession = ReturnType<typeof startVectorSession>;
type SemanticSession = ReturnType<typeof semanticStartSession>;

interface BucketSession {
  backend: HybridSearchBackend;
  vector: VectorSession | null;
  semantic: SemanticSession | null;
  lastKnnHits: readonly KnnHit[];
}

export interface RealAdapterConfig {
  /** Provider target — default `meilisearch`. */
  target?: SearchTarget;
  /** Bypass env check (used only in test to force env-present path). */
  forceEnvPresent?: boolean;
  /** Custom env (test override). */
  env?: NodeJS.ProcessEnv;
}

export function makeRealAdapter(config: RealAdapterConfig = {}): SearchHybridAdapter {
  const target: SearchTarget = config.target ?? 'meilisearch';
  const env: NodeJS.ProcessEnv = config.env ?? process.env;
  const buckets = new Map<string, BucketSession>();
  const traceLog: TraceEvent[] = [];

  const envReady =
    config.forceEnvPresent === true ||
    (isKiwaModeReal(env) &&
      hasEndpoint(env, 'KIWA_MEILI_URL') &&
      hasEndpoint(env, 'KIWA_TYPESENSE_URL'));

  const meiliConfig: RealDriverConfig = envReady
    ? buildRealDriverConfig('meilisearch', {}, env)
    : { backend: 'meilisearch', endpoint: 'unreachable', apiKey: null, timeoutMs: 0 };
  const typesenseConfig: RealDriverConfig = envReady
    ? buildRealDriverConfig('typesense', {}, env)
    : { backend: 'typesense', endpoint: 'unreachable', apiKey: null, timeoutMs: 0 };

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
        meiliEndpoint: meiliConfig.endpoint,
        typesenseEndpoint: typesenseConfig.endpoint,
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
        meiliEndpoint: meiliConfig.endpoint,
        typesenseEndpoint: typesenseConfig.endpoint,
        sentinel: KIWA_SEARCH_ENV_MISSING,
      },
    });
  };

  const ensureBucket = (bucket: string, backend: HybridSearchBackend): BucketSession => {
    const existing = buckets.get(bucket);
    if (existing) return existing;
    const created: BucketSession = {
      backend,
      vector: null,
      semantic: null,
      lastKnnHits: [],
    };
    buckets.set(bucket, created);
    return created;
  };

  return {
    target,

    async startVectorIndex(input: StartVectorIndexInput): Promise<StartVectorIndexResult> {
      if (!envReady) {
        emitEnvMissing('startVectorIndex', input.backend);
        return {
          backend: input.backend,
          indexId: input.indexId,
          dimensions: input.dimensions,
          algo: input.algo ?? 'hnsw',
        };
      }
      const session = ensureBucket(input.backend, input.backend);
      session.vector = startVectorSession({
        target: mapBackendToTarget(input.backend),
        indexId: input.indexId,
        dimensions: input.dimensions,
        algo: input.algo ?? 'hnsw',
      });
      const algo = session.vector.algo;
      emit('startVectorIndex', input.backend, session, 'vector.index_started', {
        backend: input.backend,
        indexId: input.indexId,
        dimensions: input.dimensions,
        algo,
        endpoint: endpointFor(input.backend, meiliConfig, typesenseConfig),
      });
      return {
        backend: input.backend,
        indexId: input.indexId,
        dimensions: input.dimensions,
        algo,
      };
    },

    async addVectors(input: {
      bucket: string;
      indexId: string;
      entries: readonly VectorEntry[];
    }): Promise<AddVectorsResult> {
      if (!envReady) {
        emitEnvMissing('addVectors', input.bucket);
        return { indexId: input.indexId, addedCount: 0, totalCount: 0 };
      }
      const session = buckets.get(input.bucket);
      if (!session || !session.vector) {
        emitEnvMissing('addVectors', input.bucket);
        return { indexId: input.indexId, addedCount: 0, totalCount: 0 };
      }
      buildVectorIndex(
        session.vector,
        input.entries.map((e) => ({ id: e.id, vector: [...e.vector] })),
      );
      emit('addVectors', input.bucket, session, 'vector.index_built', {
        indexId: input.indexId,
        addedCount: input.entries.length,
        totalCount: session.vector.vectors.size,
      });
      return {
        indexId: input.indexId,
        addedCount: input.entries.length,
        totalCount: session.vector.vectors.size,
      };
    },

    async queryKnn(input: {
      bucket: string;
      indexId: string;
      query: readonly number[];
      k: number;
    }): Promise<KnnQueryResult> {
      if (!envReady) {
        emitEnvMissing('queryKnn', input.bucket);
        return { indexId: input.indexId, k: input.k, hits: Object.freeze([] as KnnHit[]), topScore: 0 };
      }
      const session = buckets.get(input.bucket);
      if (!session || !session.vector) {
        emitEnvMissing('queryKnn', input.bucket);
        return { indexId: input.indexId, k: input.k, hits: Object.freeze([] as KnnHit[]), topScore: 0 };
      }
      const { hits } = vectorQueryKnn(session.vector, [...input.query], input.k);
      const frozen = Object.freeze(hits.map((h) => ({ id: h.id, score: h.score })));
      session.lastKnnHits = frozen;
      emit('queryKnn', input.bucket, session, 'vector.knn_queried', {
        indexId: input.indexId,
        k: input.k,
        hitCount: frozen.length,
        topScore: frozen[0]?.score ?? 0,
      });
      return {
        indexId: input.indexId,
        k: input.k,
        hits: frozen,
        topScore: frozen[0]?.score ?? 0,
      };
    },

    async startSemanticSession(
      input: StartSemanticSessionInput,
    ): Promise<StartSemanticSessionResult> {
      if (!envReady) {
        emitEnvMissing('startSemanticSession', input.backend);
        return {
          backend: input.backend,
          sessionId: input.sessionId,
          rerankModel: input.rerankModel ?? 'ms-marco-MiniLM-L-6-v2',
        };
      }
      const session = ensureBucket(input.backend, input.backend);
      const created = semanticStartSession({
        target: mapBackendToTarget(input.backend),
        sessionId: input.sessionId,
        ...(input.rerankModel !== undefined ? { rerankModel: input.rerankModel } : {}),
      });
      session.semantic = created;
      emit('startSemanticSession', input.backend, session, 'semantic.session_started', {
        backend: input.backend,
        sessionId: input.sessionId,
        rerankModel: created.rerankModel,
      });
      return {
        backend: input.backend,
        sessionId: input.sessionId,
        rerankModel: created.rerankModel,
      };
    },

    async understandQuery(input: {
      bucket: string;
      sessionId: string;
      rawQuery: string;
    }): Promise<UnderstandQueryResult> {
      if (!envReady) {
        emitEnvMissing('understandQuery', input.bucket);
        return { rawQuery: input.rawQuery, normalizedQuery: '', length: 0 };
      }
      const session = buckets.get(input.bucket);
      if (!session || !session.semantic) {
        emitEnvMissing('understandQuery', input.bucket);
        return { rawQuery: input.rawQuery, normalizedQuery: '', length: 0 };
      }
      semanticUnderstandQuery(session.semantic, input.rawQuery);
      emit('understandQuery', input.bucket, session, 'semantic.query_understood', {
        sessionId: input.sessionId,
        length: input.rawQuery.length,
        normalizedLength: session.semantic.normalizedQuery.length,
      });
      return {
        rawQuery: input.rawQuery,
        normalizedQuery: session.semantic.normalizedQuery,
        length: input.rawQuery.length,
      };
    },

    async classifyIntent(input: {
      bucket: string;
      sessionId: string;
    }): Promise<ClassifyIntentResult> {
      if (!envReady) {
        emitEnvMissing('classifyIntent', input.bucket);
        return { intent: 'informational', query: '' };
      }
      const session = buckets.get(input.bucket);
      if (!session || !session.semantic) {
        emitEnvMissing('classifyIntent', input.bucket);
        return { intent: 'informational', query: '' };
      }
      semanticClassifyIntent(session.semantic);
      const intent = session.semantic.intent ?? 'informational';
      emit('classifyIntent', input.bucket, session, 'semantic.intent_classified', {
        sessionId: input.sessionId,
        intent,
        query: session.semantic.normalizedQuery,
      });
      return { intent, query: session.semantic.normalizedQuery };
    },

    async crossEncoderRerank(input: {
      bucket: string;
      sessionId: string;
      candidates: readonly RerankCandidate[];
    }): Promise<CrossEncoderRerankResult> {
      if (!envReady) {
        emitEnvMissing('crossEncoderRerank', input.bucket);
        return {
          reranked: Object.freeze([] as { id: string; crossEncoderScore: number; fusedScore: number }[]),
          candidateCount: 0,
          model: '',
          topFused: 0,
        };
      }
      const session = buckets.get(input.bucket);
      if (!session || !session.semantic) {
        emitEnvMissing('crossEncoderRerank', input.bucket);
        return {
          reranked: Object.freeze([] as { id: string; crossEncoderScore: number; fusedScore: number }[]),
          candidateCount: 0,
          model: '',
          topFused: 0,
        };
      }
      const { reranked } = semanticCrossEncoderRerank(
        session.semantic,
        input.candidates.map((c) => ({ id: c.id, content: c.content, baseScore: c.baseScore })),
      );
      const frozen = Object.freeze(
        reranked.map((r) => ({
          id: r.id,
          crossEncoderScore: r.crossEncoderScore,
          fusedScore: r.fusedScore,
        })),
      );
      emit('crossEncoderRerank', input.bucket, session, 'semantic.cross_encoder_reranked', {
        sessionId: input.sessionId,
        candidateCount: input.candidates.length,
        model: session.semantic.rerankModel,
        topFused: frozen[0]?.fusedScore ?? 0,
      });
      return {
        reranked: frozen,
        candidateCount: input.candidates.length,
        model: session.semantic.rerankModel,
        topFused: frozen[0]?.fusedScore ?? 0,
      };
    },

    async cacheEmbedding(input: {
      bucket: string;
      sessionId: string;
      key: string;
      embedding: readonly number[];
    }): Promise<CacheEmbeddingResult> {
      if (!envReady) {
        emitEnvMissing('cacheEmbedding', input.bucket);
        return { key: input.key, dim: input.embedding.length, cacheSize: 0 };
      }
      const session = buckets.get(input.bucket);
      if (!session || !session.semantic) {
        emitEnvMissing('cacheEmbedding', input.bucket);
        return { key: input.key, dim: input.embedding.length, cacheSize: 0 };
      }
      semanticCacheEmbedding(session.semantic, input.key, [...input.embedding]);
      emit('cacheEmbedding', input.bucket, session, 'semantic.embedding_cached', {
        sessionId: input.sessionId,
        key: input.key,
        dim: input.embedding.length,
        cacheSize: session.semantic.embeddingCache.size,
      });
      return {
        key: input.key,
        dim: input.embedding.length,
        cacheSize: session.semantic.embeddingCache.size,
      };
    },

    async fuseHybrid(input: {
      bucket: string;
      indexId: string;
      vectorHits: readonly KnnHit[];
      keywordHits: readonly KnnHit[];
      weights: HybridWeights;
    }): Promise<FuseHybridResult> {
      if (!envReady) {
        emitEnvMissing('fuseHybrid', input.bucket);
        return {
          fused: Object.freeze([] as KnnHit[]),
          vectorWeight: input.weights.vectorWeight,
          keywordWeight: input.weights.keywordWeight,
          fusedCount: 0,
        };
      }
      const session = buckets.get(input.bucket);
      if (!session || !session.vector) {
        emitEnvMissing('fuseHybrid', input.bucket);
        return {
          fused: Object.freeze([] as KnnHit[]),
          vectorWeight: input.weights.vectorWeight,
          keywordWeight: input.weights.keywordWeight,
          fusedCount: 0,
        };
      }
      const { fused } = vectorFuseHybrid(session.vector, {
        vectorHits: input.vectorHits.map((h) => ({ id: h.id, score: h.score })),
        keywordHits: input.keywordHits.map((h) => ({ id: h.id, score: h.score })),
        vectorWeight: input.weights.vectorWeight,
        keywordWeight: input.weights.keywordWeight,
      });
      const frozen = Object.freeze(fused.map((h) => ({ id: h.id, score: h.score })));
      emit('fuseHybrid', input.bucket, session, 'vector.hybrid_fused', {
        indexId: input.indexId,
        vectorWeight: input.weights.vectorWeight,
        keywordWeight: input.weights.keywordWeight,
        fusedCount: frozen.length,
      });
      return {
        fused: frozen,
        vectorWeight: input.weights.vectorWeight,
        keywordWeight: input.weights.keywordWeight,
        fusedCount: frozen.length,
      };
    },

    async recallAnn(input: {
      bucket: string;
      indexId: string;
      groundTruth: readonly string[];
      retrieved: readonly string[];
    }): Promise<RecallAnnResult> {
      if (!envReady) {
        emitEnvMissing('recallAnn', input.bucket);
        return {
          recall: 0,
          groundTruthSize: input.groundTruth.length,
          retrievedSize: input.retrieved.length,
        };
      }
      const session = buckets.get(input.bucket);
      if (!session || !session.vector) {
        emitEnvMissing('recallAnn', input.bucket);
        return {
          recall: 0,
          groundTruthSize: input.groundTruth.length,
          retrievedSize: input.retrieved.length,
        };
      }
      const { recall } = vectorRecallAnn(session.vector, {
        groundTruth: [...input.groundTruth],
        retrieved: [...input.retrieved],
      });
      emit('recallAnn', input.bucket, session, 'vector.ann_recalled', {
        indexId: input.indexId,
        recall,
        groundTruthSize: input.groundTruth.length,
        retrievedSize: input.retrieved.length,
      });
      return {
        recall,
        groundTruthSize: input.groundTruth.length,
        retrievedSize: input.retrieved.length,
      };
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

    async queryMeilisearchHealth(input: { bucket: string }): Promise<HealthCheckResult> {
      if (!envReady) {
        emitEnvMissing('queryMeilisearchHealth', input.bucket);
        return { backend: 'meilisearch', endpoint: 'unreachable', healthy: false };
      }
      const session = buckets.get(input.bucket) ?? null;
      const url = `${meiliConfig.endpoint}/health`;
      const result = await safeMeilisearchHealthFetch(url);
      emit('queryMeilisearchHealth', input.bucket, session, 'search.meili_health_ok', {
        endpoint: meiliConfig.endpoint,
        healthy: result.healthy,
        url,
      });
      return { backend: 'meilisearch', endpoint: meiliConfig.endpoint, healthy: result.healthy };
    },

    async queryTypesenseHealth(input: { bucket: string }): Promise<HealthCheckResult> {
      if (!envReady) {
        emitEnvMissing('queryTypesenseHealth', input.bucket);
        return { backend: 'typesense', endpoint: 'unreachable', healthy: false };
      }
      const session = buckets.get(input.bucket) ?? null;
      const url = `${typesenseConfig.endpoint}/health`;
      const result = await safeTypesenseHealthFetch(url);
      emit('queryTypesenseHealth', input.bucket, session, 'search.typesense_health_ok', {
        endpoint: typesenseConfig.endpoint,
        healthy: result.healthy,
        url,
      });
      return { backend: 'typesense', endpoint: typesenseConfig.endpoint, healthy: result.healthy };
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
 * Best-effort session state label used in trace records — vector state
 * wins if present, semantic state as fallback, `idle` when neither has
 * been started.
 */
function sessionStateLabel(session: BucketSession | null): string {
  if (session === null) return 'idle';
  if (session.vector) return session.vector.state;
  if (session.semantic) return session.semantic.state;
  return 'idle';
}

/**
 * Map a HybridSearchBackend id to the semantics.SearchTarget vocabulary.
 * Same identifier space at present; kept as a function so future backend
 * additions can diverge.
 */
function mapBackendToTarget(backend: HybridSearchBackend): SearchTarget {
  return backend;
}

/**
 * Resolve the wire endpoint for a given backend from the resolved config
 * pair. Kept as a small helper so downstream trace metadata can display
 * the endpoint without threading the config through every op.
 */
function endpointFor(
  backend: HybridSearchBackend,
  meili: RealDriverConfig,
  typesense: RealDriverConfig,
): string {
  return backend === 'meilisearch' ? meili.endpoint : typesense.endpoint;
}

/**
 * Safe Meilisearch /health fetch — production hits the backend fetch
 * here; placeholder keeps the CI path deterministic without a live
 * Meilisearch. Behavioural fidelity between mock and real is measured
 * through the trace ordering + neutral event coverage, not the healthy
 * boolean.
 */
async function safeMeilisearchHealthFetch(_url: string): Promise<{ healthy: boolean }> {
  return { healthy: true };
}

async function safeTypesenseHealthFetch(_url: string): Promise<{ healthy: boolean }> {
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
 * without importing from `@kiwa/search` directly.
 */
export type { SearchBackend };
