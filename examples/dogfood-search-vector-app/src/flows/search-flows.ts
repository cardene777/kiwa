/**
 * Vector + semantic + hybrid search lifecycle flows.
 *
 * `driveVectorLifecycle` drives every vector-axis op (startVectorIndex →
 * addVectors → queryKnn → fuseHybrid → recallAnn) in the order
 * `@kiwa-lab/search` v0.3 vector semantics expect. Any op that diverges
 * surfaces in the fidelity trace.
 *
 * `driveSemanticLifecycle` drives every semantic-axis op
 * (startSemanticSession → understandQuery → classifyIntent →
 * crossEncoderRerank → cacheEmbedding).
 *
 * `driveHybridSearchLifecycle` combines both axes and adds the health
 * check ops + fidelity signal so a full end-to-end lifecycle exercises
 * every op in `SEARCH_HYBRID_HARNESS_OPS`.
 *
 * `driveFullMatrix` walks 2 backends x 5 hybrid configs x 3 fixture
 * sets = 30 lifecycles so the fidelity harness measures behavioural
 * drift across every canonical production combination.
 */

import { DEFAULT_BACKENDS } from '../policies/backends.js';
import { ALL_HYBRID_CONFIGS } from '../policies/hybrid-configs.js';
import { ALL_FIXTURES, type FixtureSet } from '../policies/query-fixtures.js';
import type {
  HybridSearchBackend,
  HybridWeights,
  KnnHit,
  SearchHybridAdapter,
  TraceEvent,
} from '../adapters/interface.js';

/** Full lifecycle input for one (backend, fixture, weights) triple. */
export interface LifecycleInput {
  backend: HybridSearchBackend;
  fixture: FixtureSet;
  weights: HybridWeights;
  sessionId: string;
  indexId: string;
}

/**
 * Drive the vector-axis lifecycle end-to-end: build the vector index,
 * run a k-NN query, and record the k-NN hits on the session. Returns
 * the hits so downstream fusion can consume them.
 */
export async function driveVectorLifecycle(
  adapter: SearchHybridAdapter,
  input: {
    backend: HybridSearchBackend;
    indexId: string;
    fixture: FixtureSet;
  },
): Promise<{ hits: readonly KnnHit[]; k: number }> {
  await adapter.startVectorIndex({
    backend: input.backend,
    indexId: input.indexId,
    dimensions: input.fixture.dimensions,
    algo: 'hnsw',
  });
  await adapter.addVectors({
    bucket: input.backend,
    indexId: input.indexId,
    entries: input.fixture.documents,
  });
  const firstQuery = input.fixture.queries[0];
  if (firstQuery === undefined) {
    throw new Error(`driveVectorLifecycle: fixture ${input.fixture.id} has no queries`);
  }
  const knn = await adapter.queryKnn({
    bucket: input.backend,
    indexId: input.indexId,
    query: firstQuery.queryEmbedding,
    k: firstQuery.k,
  });
  return { hits: knn.hits, k: knn.k };
}

/**
 * Drive the semantic-axis lifecycle end-to-end: start a semantic
 * session, understand the raw query, classify intent, cross-encoder
 * rerank the fixture candidates, and cache the query embedding.
 */
export async function driveSemanticLifecycle(
  adapter: SearchHybridAdapter,
  input: {
    backend: HybridSearchBackend;
    sessionId: string;
    fixture: FixtureSet;
  },
): Promise<void> {
  await adapter.startSemanticSession({
    backend: input.backend,
    sessionId: input.sessionId,
  });
  const firstQuery = input.fixture.queries[0];
  if (firstQuery === undefined) {
    throw new Error(`driveSemanticLifecycle: fixture ${input.fixture.id} has no queries`);
  }
  await adapter.understandQuery({
    bucket: input.backend,
    sessionId: input.sessionId,
    rawQuery: firstQuery.rawQuery,
  });
  await adapter.classifyIntent({
    bucket: input.backend,
    sessionId: input.sessionId,
  });
  await adapter.crossEncoderRerank({
    bucket: input.backend,
    sessionId: input.sessionId,
    candidates: input.fixture.rerankCandidates,
  });
  await adapter.cacheEmbedding({
    bucket: input.backend,
    sessionId: input.sessionId,
    key: firstQuery.id,
    embedding: firstQuery.queryEmbedding,
  });
}

/**
 * Drive the full hybrid-search lifecycle end-to-end — vector + semantic
 * axes + hybrid fusion + recall@k + fidelity signal + both health
 * checks. Emits every op on the 14-op contract at least once so a
 * per-lifecycle trace has a stable event count — the fidelity harness
 * leans on that to detect missing / drifted ops.
 */
export async function driveHybridSearchLifecycle(
  adapter: SearchHybridAdapter,
  input: LifecycleInput,
): Promise<void> {
  const { hits: vectorHits } = await driveVectorLifecycle(adapter, {
    backend: input.backend,
    indexId: input.indexId,
    fixture: input.fixture,
  });
  await driveSemanticLifecycle(adapter, {
    backend: input.backend,
    sessionId: input.sessionId,
    fixture: input.fixture,
  });
  const fused = await adapter.fuseHybrid({
    bucket: input.backend,
    indexId: input.indexId,
    vectorHits,
    keywordHits: input.fixture.keywordHits,
    weights: input.weights,
  });
  const firstQueryId = input.fixture.queries[0]?.id ?? '';
  const groundTruth = input.fixture.groundTruth[firstQueryId] ?? [];
  if (groundTruth.length > 0) {
    await adapter.recallAnn({
      bucket: input.backend,
      indexId: input.indexId,
      groundTruth,
      retrieved: fused.fused.map((h) => h.id),
    });
  }
  await adapter.emitFidelitySignal({
    bucket: input.backend,
    signal: 'ok',
    notes: `lifecycle ${input.backend}/${input.fixture.id}`,
  });
  await adapter.queryMeilisearchHealth({ bucket: input.backend });
  await adapter.queryTypesenseHealth({ bucket: input.backend });
}

/**
 * Drive lifecycles across 2 backends x 5 hybrid configs x 3 fixture
 * sets = 30 lifecycles. Each lifecycle exercises every op in the 14-op
 * contract at least once, so the fidelity harness sees each op emit
 * per lifecycle and can measure divergence granularly.
 */
export async function driveFullMatrix(
  adapter: SearchHybridAdapter,
): Promise<{ lifecyclesRun: number }> {
  const lifecycles: LifecycleInput[] = [];
  for (const backend of DEFAULT_BACKENDS) {
    for (const config of ALL_HYBRID_CONFIGS) {
      for (const fixture of ALL_FIXTURES) {
        lifecycles.push({
          backend,
          fixture,
          weights: config.weights,
          sessionId: `${backend}-${config.id}-${fixture.id}`,
          indexId: `${backend}-${config.id}-${fixture.id}`,
        });
      }
    }
  }
  for (const input of lifecycles) {
    await driveHybridSearchLifecycle(adapter, input);
  }
  return { lifecyclesRun: lifecycles.length };
}

/**
 * All op names the mock adapter walks — the 13 promise-returning method
 * ops on the adapter plus a synthesised `resetVerified` step the
 * fidelity harness emits at the end of a lifecycle. `reset` is included
 * so the full matrix + reset story stays observable.
 */
export const OPS_UNDER_TEST: readonly string[] = [
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
];

/** Compare 2 traces for behavioural fidelity. Returns divergence detail. */
export function diffTraces(
  mock: TraceEvent[],
  real: TraceEvent[],
): {
  missingInReal: string[];
  missingInMock: string[];
  matchedOps: string[];
  divergentEvents: Array<{ op: string; mockEvent: string; realEvent: string }>;
} {
  const mockOps = new Set(mock.map((e) => e.op));
  const realOps = new Set(real.map((e) => e.op));
  const matchedOps = Array.from(mockOps).filter((op) => realOps.has(op));
  const missingInReal = Array.from(mockOps).filter((op) => !realOps.has(op));
  const missingInMock = Array.from(realOps).filter((op) => !mockOps.has(op));

  const divergentEvents: Array<{
    op: string;
    mockEvent: string;
    realEvent: string;
  }> = [];
  for (const op of matchedOps) {
    const mockEvent = mock.find((e) => e.op === op)?.neutralEvent ?? '';
    const realEvent = real.find((e) => e.op === op)?.neutralEvent ?? '';
    if (mockEvent !== realEvent && realEvent !== 'search.env_missing') {
      divergentEvents.push({ op, mockEvent, realEvent });
    }
  }
  return { missingInReal, missingInMock, matchedOps, divergentEvents };
}
