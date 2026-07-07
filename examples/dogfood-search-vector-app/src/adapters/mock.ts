/**
 * Mock adapter — drives `@kiwa-test/search` v0.3 `semantics/vector` +
 * `semantics/semantic` state machines deterministically without any
 * backend. The same app code exercises a full vector index + kNN query
 * + hybrid fusion + semantic understand + intent classify + rerank +
 * embedding cache lifecycle without launching a Meilisearch or Typesense
 * server.
 *
 * State model — one {@link BucketSession} per bucket; sessions are
 * isolated so multi-backend + multi-config harnesses can run
 * meilisearch / typesense side-by-side without state leakage. That
 * mirrors how the real backends keep per-index state in production.
 *
 * The mock adapter piggy-backs on the same neutral event vocabulary
 * that `@kiwa-test/search` v0.3 vector + semantic semantics emit —
 * every op appends the matching neutral event onto the trace so the
 * fidelity harness can assert both adapters produce identical event
 * orderings.
 */

import { semantics } from '@kiwa-test/search';
import {
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
  type RecallAnnInput,
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

/**
 * Per-bucket session state — one vector + semantic session pair per
 * bucket. Buckets isolate backend + hybrid config combinations so the
 * matrix harness can drive N backends x M configs without state
 * leakage.
 */
interface BucketSession {
  backend: HybridSearchBackend;
  vector: VectorSession | null;
  semantic: SemanticSession | null;
  /** Cached recent kNN hits — used to seed hybrid fusion in tests. */
  lastKnnHits: readonly KnnHit[];
}

/**
 * Build a mock hybrid search adapter. `target` selects the provider
 * vocabulary in the emitted trace; the default `meilisearch` gives the
 * fidelity harness a natural label for the mock leg of the diff.
 */
export function makeMockAdapter(
  input: { target?: SearchTarget } = {},
): SearchHybridAdapter {
  const target: SearchTarget = input.target ?? 'meilisearch';
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

    async startVectorIndex(inputArg: StartVectorIndexInput): Promise<StartVectorIndexResult> {
      const bucket = inputArg.backend;
      const session = ensureBucket(bucket, inputArg.backend);
      session.vector = startVectorSession({
        target: mapBackendToTarget(inputArg.backend),
        indexId: inputArg.indexId,
        dimensions: inputArg.dimensions,
        algo: inputArg.algo ?? 'hnsw',
      });
      const algo = session.vector.algo;
      emit('startVectorIndex', bucket, session, 'vector.index_started', {
        backend: inputArg.backend,
        indexId: inputArg.indexId,
        dimensions: inputArg.dimensions,
        algo,
      });
      return {
        backend: inputArg.backend,
        indexId: inputArg.indexId,
        dimensions: inputArg.dimensions,
        algo,
      };
    },

    async addVectors(inputArg: {
      bucket: string;
      indexId: string;
      entries: readonly VectorEntry[];
    }): Promise<AddVectorsResult> {
      const session = requireBucket(inputArg.bucket);
      if (!session.vector) {
        throw new Error(`mock adapter: bucket ${inputArg.bucket} has no vector session`);
      }
      buildVectorIndex(
        session.vector,
        inputArg.entries.map((e) => ({ id: e.id, vector: [...e.vector] })),
      );
      emit('addVectors', inputArg.bucket, session, 'vector.index_built', {
        indexId: inputArg.indexId,
        addedCount: inputArg.entries.length,
        totalCount: session.vector.vectors.size,
      });
      return {
        indexId: inputArg.indexId,
        addedCount: inputArg.entries.length,
        totalCount: session.vector.vectors.size,
      };
    },

    async queryKnn(inputArg: {
      bucket: string;
      indexId: string;
      query: readonly number[];
      k: number;
    }): Promise<KnnQueryResult> {
      const session = requireBucket(inputArg.bucket);
      if (!session.vector) {
        throw new Error(`mock adapter: bucket ${inputArg.bucket} has no vector session`);
      }
      const { hits } = vectorQueryKnn(session.vector, [...inputArg.query], inputArg.k);
      const frozen = Object.freeze(hits.map((h) => ({ id: h.id, score: h.score })));
      session.lastKnnHits = frozen;
      emit('queryKnn', inputArg.bucket, session, 'vector.knn_queried', {
        indexId: inputArg.indexId,
        k: inputArg.k,
        hitCount: frozen.length,
        topScore: frozen[0]?.score ?? 0,
      });
      return {
        indexId: inputArg.indexId,
        k: inputArg.k,
        hits: frozen,
        topScore: frozen[0]?.score ?? 0,
      };
    },

    async startSemanticSession(
      inputArg: StartSemanticSessionInput,
    ): Promise<StartSemanticSessionResult> {
      const bucket = inputArg.backend;
      const session = ensureBucket(bucket, inputArg.backend);
      const created = semanticStartSession({
        target: mapBackendToTarget(inputArg.backend),
        sessionId: inputArg.sessionId,
        ...(inputArg.rerankModel !== undefined ? { rerankModel: inputArg.rerankModel } : {}),
      });
      session.semantic = created;
      emit('startSemanticSession', bucket, session, 'semantic.session_started', {
        backend: inputArg.backend,
        sessionId: inputArg.sessionId,
        rerankModel: created.rerankModel,
      });
      return {
        backend: inputArg.backend,
        sessionId: inputArg.sessionId,
        rerankModel: created.rerankModel,
      };
    },

    async understandQuery(inputArg: {
      bucket: string;
      sessionId: string;
      rawQuery: string;
    }): Promise<UnderstandQueryResult> {
      const session = requireBucket(inputArg.bucket);
      if (!session.semantic) {
        throw new Error(`mock adapter: bucket ${inputArg.bucket} has no semantic session`);
      }
      semanticUnderstandQuery(session.semantic, inputArg.rawQuery);
      emit('understandQuery', inputArg.bucket, session, 'semantic.query_understood', {
        sessionId: inputArg.sessionId,
        length: inputArg.rawQuery.length,
        normalizedLength: session.semantic.normalizedQuery.length,
      });
      return {
        rawQuery: inputArg.rawQuery,
        normalizedQuery: session.semantic.normalizedQuery,
        length: inputArg.rawQuery.length,
      };
    },

    async classifyIntent(inputArg: {
      bucket: string;
      sessionId: string;
    }): Promise<ClassifyIntentResult> {
      const session = requireBucket(inputArg.bucket);
      if (!session.semantic) {
        throw new Error(`mock adapter: bucket ${inputArg.bucket} has no semantic session`);
      }
      semanticClassifyIntent(session.semantic);
      const intent = session.semantic.intent;
      if (intent === null) {
        throw new Error('mock adapter: classifyIntent did not produce an intent');
      }
      emit('classifyIntent', inputArg.bucket, session, 'semantic.intent_classified', {
        sessionId: inputArg.sessionId,
        intent,
        query: session.semantic.normalizedQuery,
      });
      return { intent, query: session.semantic.normalizedQuery };
    },

    async crossEncoderRerank(inputArg: {
      bucket: string;
      sessionId: string;
      candidates: readonly RerankCandidate[];
    }): Promise<CrossEncoderRerankResult> {
      const session = requireBucket(inputArg.bucket);
      if (!session.semantic) {
        throw new Error(`mock adapter: bucket ${inputArg.bucket} has no semantic session`);
      }
      const { reranked } = semanticCrossEncoderRerank(
        session.semantic,
        inputArg.candidates.map((c) => ({ id: c.id, content: c.content, baseScore: c.baseScore })),
      );
      const frozen = Object.freeze(
        reranked.map((r) => ({
          id: r.id,
          crossEncoderScore: r.crossEncoderScore,
          fusedScore: r.fusedScore,
        })),
      );
      emit('crossEncoderRerank', inputArg.bucket, session, 'semantic.cross_encoder_reranked', {
        sessionId: inputArg.sessionId,
        candidateCount: inputArg.candidates.length,
        model: session.semantic.rerankModel,
        topFused: frozen[0]?.fusedScore ?? 0,
      });
      return {
        reranked: frozen,
        candidateCount: inputArg.candidates.length,
        model: session.semantic.rerankModel,
        topFused: frozen[0]?.fusedScore ?? 0,
      };
    },

    async cacheEmbedding(inputArg: {
      bucket: string;
      sessionId: string;
      key: string;
      embedding: readonly number[];
    }): Promise<CacheEmbeddingResult> {
      const session = requireBucket(inputArg.bucket);
      if (!session.semantic) {
        throw new Error(`mock adapter: bucket ${inputArg.bucket} has no semantic session`);
      }
      semanticCacheEmbedding(session.semantic, inputArg.key, [...inputArg.embedding]);
      emit('cacheEmbedding', inputArg.bucket, session, 'semantic.embedding_cached', {
        sessionId: inputArg.sessionId,
        key: inputArg.key,
        dim: inputArg.embedding.length,
        cacheSize: session.semantic.embeddingCache.size,
      });
      return {
        key: inputArg.key,
        dim: inputArg.embedding.length,
        cacheSize: session.semantic.embeddingCache.size,
      };
    },

    async fuseHybrid(inputArg: {
      bucket: string;
      indexId: string;
      vectorHits: readonly KnnHit[];
      keywordHits: readonly KnnHit[];
      weights: HybridWeights;
    }): Promise<FuseHybridResult> {
      const session = requireBucket(inputArg.bucket);
      if (!session.vector) {
        throw new Error(`mock adapter: bucket ${inputArg.bucket} has no vector session`);
      }
      const { fused } = vectorFuseHybrid(session.vector, {
        vectorHits: inputArg.vectorHits.map((h) => ({ id: h.id, score: h.score })),
        keywordHits: inputArg.keywordHits.map((h) => ({ id: h.id, score: h.score })),
        vectorWeight: inputArg.weights.vectorWeight,
        keywordWeight: inputArg.weights.keywordWeight,
      });
      const frozen = Object.freeze(fused.map((h) => ({ id: h.id, score: h.score })));
      emit('fuseHybrid', inputArg.bucket, session, 'vector.hybrid_fused', {
        indexId: inputArg.indexId,
        vectorWeight: inputArg.weights.vectorWeight,
        keywordWeight: inputArg.weights.keywordWeight,
        fusedCount: frozen.length,
      });
      return {
        fused: frozen,
        vectorWeight: inputArg.weights.vectorWeight,
        keywordWeight: inputArg.weights.keywordWeight,
        fusedCount: frozen.length,
      };
    },

    async recallAnn(inputArg: {
      bucket: string;
      indexId: string;
      groundTruth: readonly string[];
      retrieved: readonly string[];
    }): Promise<RecallAnnResult> {
      const session = requireBucket(inputArg.bucket);
      if (!session.vector) {
        throw new Error(`mock adapter: bucket ${inputArg.bucket} has no vector session`);
      }
      const recallInput: RecallAnnInput = {
        groundTruth: inputArg.groundTruth,
        retrieved: inputArg.retrieved,
      };
      const { recall } = vectorRecallAnn(session.vector, {
        groundTruth: [...recallInput.groundTruth],
        retrieved: [...recallInput.retrieved],
      });
      emit('recallAnn', inputArg.bucket, session, 'vector.ann_recalled', {
        indexId: inputArg.indexId,
        recall,
        groundTruthSize: recallInput.groundTruth.length,
        retrievedSize: recallInput.retrieved.length,
      });
      return {
        recall,
        groundTruthSize: recallInput.groundTruth.length,
        retrievedSize: recallInput.retrieved.length,
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

    async queryMeilisearchHealth(inputArg: { bucket: string }): Promise<HealthCheckResult> {
      const session = buckets.get(inputArg.bucket) ?? null;
      const endpoint = 'in-memory://meilisearch';
      emit('queryMeilisearchHealth', inputArg.bucket, session, 'search.meili_health_ok', {
        endpoint,
        healthy: true,
      });
      return { backend: 'meilisearch', endpoint, healthy: true };
    },

    async queryTypesenseHealth(inputArg: { bucket: string }): Promise<HealthCheckResult> {
      const session = buckets.get(inputArg.bucket) ?? null;
      const endpoint = 'in-memory://typesense';
      emit('queryTypesenseHealth', inputArg.bucket, session, 'search.typesense_health_ok', {
        endpoint,
        healthy: true,
      });
      return { backend: 'typesense', endpoint, healthy: true };
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
 * Map a HybridSearchBackend id to the semantics.SearchTarget vocabulary.
 * The mock adapter uses the same identifier space for both, so this is a
 * direct 1:1 map at present.
 */
function mapBackendToTarget(backend: HybridSearchBackend): SearchTarget {
  return backend;
}

/**
 * Best-effort session state label used in trace records — vector session
 * state wins if present, semantic session state is used as fallback, and
 * `idle` when neither has been started.
 */
function sessionStateLabel(session: BucketSession | null): string {
  if (session === null) return 'idle';
  if (session.vector) return session.vector.state;
  if (session.semantic) return session.semantic.state;
  return 'idle';
}

/**
 * Map a neutral event to its provider-specific dialect. The search v0.3
 * package exposes `providerEventName` in `semantics/types.ts` but the
 * dogfood adapter needs to emit synthetic events (`search.fidelity_signal`
 * / `search.meili_health_ok` / `search.typesense_health_ok`) that fall
 * outside the semantic axis vocabulary, so we prefix locally.
 */
function providerEventFor(target: SearchTarget, neutralEvent: string): string {
  return `${target}.${neutralEvent}`;
}
