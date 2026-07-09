/**
 * Mock adapter — spins up 1 vector index gate per session, 1 document
 * store, and 1 embedding cache against `@kiwa-lab/orm`'s vector-store
 * semantics. Every op appends 1 latency sample and 1 trace event so the
 * fidelity harness never reads as 0-sample.
 *
 * The mock is drivable from tests deterministically — cosine / L2
 * distances are pure functions of their input, hybrid ranking is a
 * deterministic weighted sort, and no wall-clock scheduling is used.
 */

import { bm25Score, createDocumentStore, type DocumentStore } from '../document/index.js';
import {
  cacheKey,
  createEmbeddingCache,
  type EmbeddingCache,
} from '../cache/index.js';
import {
  createVectorIndexGate,
  type VectorIndexGate,
} from '../index-store/index.js';
import type {
  AdapterMetrics,
  CacheHitRateObservation,
  HybridSearchObservation,
  IndexBuildObservation,
  SemanticSearchObservation,
  TraceEvent,
  VectorSearchAdapter,
} from './interface.js';
import { OPS_UNDER_TEST } from './interface.js';

export interface MockAdapterOptions {
  readonly storeId?: string;
  readonly cacheMaxEntries?: number;
  readonly embeddingModel?: string;
}

/**
 * Build the mock adapter. Defaults match the v1.26-4 AC — 1 storeId,
 * 1 cache with 1024 entries, 1 embedding model name (fed into cache
 * keys so a model swap invalidates the cache).
 */
export function makeMockAdapter(opts: MockAdapterOptions = {}): VectorSearchAdapter {
  const config = {
    storeId: opts.storeId ?? 'documents',
    cacheMaxEntries: opts.cacheMaxEntries ?? 1024,
    embeddingModel: opts.embeddingModel ?? 'kiwa-mock-embed-v1',
  };

  const trace: TraceEvent[] = [];
  const metricsAgg: AdapterMetrics = {
    latencySamplesMs: [],
    documentsIndexed: 0,
    semanticSearches: 0,
    hybridSearches: 0,
    cacheLookups: 0,
    cacheHits: 0,
  };

  let store: DocumentStore | null = null;
  let cache: EmbeddingCache | null = null;
  // Gates cache by (distanceKind, indexKey) so different distance kinds
  // do not stomp on each other's state — every driveSemanticSearch /
  // driveHybridSearch call spins up its own gate.
  const gates = new Map<string, VectorIndexGate>();

  function ensureStore(): DocumentStore {
    if (store) return store;
    store = createDocumentStore();
    return store;
  }

  function ensureCache(): EmbeddingCache {
    if (cache) return cache;
    cache = createEmbeddingCache({ maxEntries: config.cacheMaxEntries });
    return cache;
  }

  function record(op: string, ok: boolean, extra?: Partial<TraceEvent>): void {
    const entry: TraceEvent = { op, ok };
    if (extra?.errorKind !== undefined) entry.errorKind = extra.errorKind;
    if (extra?.detail !== undefined) entry.detail = extra.detail;
    trace.push(entry);
  }

  async function timed<T>(op: string, run: () => T | Promise<T>): Promise<T> {
    const start = performance.now();
    try {
      const result = await run();
      metricsAgg.latencySamplesMs.push(performance.now() - start);
      return result;
    } catch (err) {
      metricsAgg.latencySamplesMs.push(performance.now() - start);
      record(op, false, {
        errorKind: 'VECTOR_MOCK_ERROR',
        detail: { message: err instanceof Error ? err.message : String(err) },
      });
      throw err;
    }
  }

  return {
    mode: 'mock',
    traces: () => [...trace],

    async driveIndexBuild(input): Promise<IndexBuildObservation> {
      return timed('driveIndexBuild', async () => {
        const s = ensureStore();
        for (const doc of input.docs) {
          s.upsert(doc);
        }
        const distanceKind = 'cosine';
        const gate = createVectorIndexGate({
          storeId: config.storeId,
          distanceKind,
        });
        gate.mountIndex(input.index);
        gates.set(`${distanceKind}::${input.index.name}`, gate);
        metricsAgg.documentsIndexed += input.docs.length;
        const observation: IndexBuildObservation = {
          indexKind: input.index.kind,
          dimensions: input.index.dimensions,
          indexed: gate.session.state === 'indexed',
          documentsIndexed: input.docs.length,
        };
        record('driveIndexBuild', true, {
          detail: {
            indexKind: observation.indexKind,
            documents: observation.documentsIndexed,
          },
        });
        return observation;
      });
    },

    async driveSemanticSearch(input): Promise<SemanticSearchObservation> {
      return timed('driveSemanticSearch', async () => {
        const s = ensureStore();
        for (const doc of input.docs) s.upsert(doc);
        const gateKey = `${input.distanceKind}::${input.index.name}`;
        let gate = gates.get(gateKey);
        if (!gate) {
          gate = createVectorIndexGate({
            storeId: config.storeId,
            distanceKind: input.distanceKind,
          });
          gate.mountIndex(input.index);
          gates.set(gateKey, gate);
        }
        // knn emits the neutral event; the actual ranking is done in
        // JavaScript so the mock has an observable ranked list.
        gate.knn({ query: [...input.query.embedding], k: input.query.topK });
        const scored = s.all().map((doc) => ({
          doc,
          distance: gate!.distance({
            a: [...input.query.embedding],
            b: [...doc.embedding],
          }),
        }));
        scored.sort((a, b) => a.distance - b.distance);
        const top = scored.slice(0, input.query.topK);
        metricsAgg.semanticSearches += 1;
        const observation: SemanticSearchObservation = {
          rankedIds: top.map((t) => t.doc.documentId),
          distances: top.map((t) => t.distance),
          distanceKind: input.distanceKind,
        };
        record('driveSemanticSearch', true, {
          detail: {
            topK: input.query.topK,
            distanceKind: input.distanceKind,
            returned: observation.rankedIds.length,
          },
        });
        return observation;
      });
    },

    async driveHybridSearch(input): Promise<HybridSearchObservation> {
      return timed('driveHybridSearch', async () => {
        if (input.vectorWeight < 0 || input.vectorWeight > 1) {
          throw new Error(
            `driveHybridSearch: vectorWeight ${input.vectorWeight} must be in [0, 1]`,
          );
        }
        const s = ensureStore();
        for (const doc of input.docs) s.upsert(doc);
        const gateKey = `${input.distanceKind}::${input.index.name}`;
        let gate = gates.get(gateKey);
        if (!gate) {
          gate = createVectorIndexGate({
            storeId: config.storeId,
            distanceKind: input.distanceKind,
          });
          gate.mountIndex(input.index);
          gates.set(gateKey, gate);
        }
        gate.hybrid({
          query: [...input.query.embedding],
          k: input.query.topK,
          keyword: input.query.keyword,
          vectorWeight: input.vectorWeight,
        });
        const keywordWeight = 1 - input.vectorWeight;
        const scored = s.all().map((doc) => {
          const distance = gate!.distance({
            a: [...input.query.embedding],
            b: [...doc.embedding],
          });
          // Convert distance to a similarity in [0, 1] so vector + BM25
          // scores are combinable. For cosine + L2 the smaller the
          // distance the closer, and both are non-negative in the mock's
          // range, so `1 / (1 + distance)` is a monotonically decreasing
          // similarity that stays bounded in (0, 1].
          const similarity = 1 / (1 + distance);
          const keywordScore = bm25Score(doc.body, input.query.keyword);
          const fused =
            input.vectorWeight * similarity + keywordWeight * keywordScore;
          return { doc, score: fused };
        });
        // Sort by descending fused score; ties break on doc id ascending
        // to keep the ranking deterministic.
        scored.sort((a, b) => {
          if (b.score !== a.score) return b.score - a.score;
          return a.doc.documentId.localeCompare(b.doc.documentId);
        });
        const top = scored.slice(0, input.query.topK);
        metricsAgg.hybridSearches += 1;
        const observation: HybridSearchObservation = {
          rankedIds: top.map((t) => t.doc.documentId),
          scores: top.map((t) => t.score),
          vectorWeight: input.vectorWeight,
          keywordWeight,
        };
        record('driveHybridSearch', true, {
          detail: {
            topK: input.query.topK,
            vectorWeight: input.vectorWeight,
            returned: observation.rankedIds.length,
          },
        });
        return observation;
      });
    },

    async driveCacheHitRate(input): Promise<CacheHitRateObservation> {
      return timed('driveCacheHitRate', async () => {
        const c = ensureCache();
        const s = ensureStore();
        for (const doc of input.docs) s.upsert(doc);
        // First pass — every lookup misses and populates the cache. The
        // key is stable across the two passes so the second pass yields
        // hits.
        for (const lookup of input.lookups) {
          const key = cacheKey({ body: lookup.key, model: config.embeddingModel });
          const cached = c.get(key);
          if (cached === undefined) {
            c.set(key, lookup.expectedEmbedding);
          }
        }
        // On-demand re-index — invalidate every entry so the next
        // lookup pass misses again. Mirrors the /api/embedding reindex
        // endpoint.
        if (input.reindex) {
          for (const lookup of input.lookups) {
            const key = cacheKey({ body: lookup.key, model: config.embeddingModel });
            c.delete(key);
          }
        }
        // Second pass — hit rate depends on whether we invalidated. This
        // pass is the one whose metrics are surfaced.
        c.reset();
        for (const lookup of input.lookups) {
          const key = cacheKey({ body: lookup.key, model: config.embeddingModel });
          c.get(key);
          c.set(key, lookup.expectedEmbedding);
          c.get(key);
        }
        const m = c.metrics();
        metricsAgg.cacheLookups += m.hits + m.misses;
        metricsAgg.cacheHits += m.hits;
        const observation: CacheHitRateObservation = {
          totalLookups: m.hits + m.misses,
          hits: m.hits,
          misses: m.misses,
          hitRate: m.hitRate,
          reindexed: input.reindex ?? false,
        };
        record('driveCacheHitRate', true, {
          detail: {
            hits: observation.hits,
            misses: observation.misses,
            reindexed: observation.reindexed,
          },
        });
        return observation;
      });
    },

    async emitFidelity(): Promise<void> {
      return timed('emitFidelity', async () => {
        record('emitFidelity', true, {
          detail: { opsUnderTest: OPS_UNDER_TEST.length },
        });
      });
    },

    metrics(): AdapterMetrics {
      return { ...metricsAgg, latencySamplesMs: [...metricsAgg.latencySamplesMs] };
    },

    async reset(): Promise<void> {
      trace.length = 0;
      metricsAgg.latencySamplesMs.length = 0;
      metricsAgg.documentsIndexed = 0;
      metricsAgg.semanticSearches = 0;
      metricsAgg.hybridSearches = 0;
      metricsAgg.cacheLookups = 0;
      metricsAgg.cacheHits = 0;
      store?.reset();
      store = null;
      cache?.reset();
      cache = null;
      gates.clear();
    },
  };
}
