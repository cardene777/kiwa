/**
 * OpenSearch OSS relevance + synonym + index-management lifecycle
 * flows.
 *
 * `driveRelevanceLifecycle` drives every relevance-axis op
 * (startRelevanceSession → seedRelevanceDocuments → scoreBm25 →
 * scoreTfIdf → applyCustomRanking → selectAbVariant) in the order
 * `@kiwa-test/search` v0.3 relevance semantics expect.
 *
 * `driveSynonymLifecycle` drives every synonym-axis op
 * (startSynonymSession → registerSynonyms → expandMultiLanguage →
 * matchPhonetic → normalizeStemmer → bridgeTypo).
 *
 * `driveIndexMgmtLifecycle` drives every index-management-axis op
 * (startIndexMgmtSession → allocateShards → promoteReplica →
 * advanceRollingReindex x N → swapZeroDowntime).
 *
 * `driveOpenSearchLifecycle` combines all 3 axes and adds the health
 * check op + fidelity signal so a full end-to-end lifecycle exercises
 * every op in `OPENSEARCH_HARNESS_OPS`.
 *
 * `driveFullMatrix` walks 3 fixture sets = 3 lifecycles so the fidelity
 * harness measures behavioural drift across every canonical production
 * combination.
 */

import { DEFAULT_BACKENDS } from '../policies/backends.js';
import {
  ALL_FIXTURES,
  type ClusterStepFixture,
  type FixtureSet,
  type RelevanceQueryFixture,
  type SynonymQueryFixture,
} from '../policies/query-fixtures.js';
import type {
  OpenSearchAdapter,
  OpenSearchBackend,
  RelevanceDocument,
  TraceEvent,
} from '../adapters/interface.js';

/** Full lifecycle input for one (backend, fixture) pair. */
export interface LifecycleInput {
  backend: OpenSearchBackend;
  fixture: FixtureSet;
  indexId: string;
}

/**
 * Drive the relevance-axis lifecycle end-to-end: start a relevance
 * session, seed documents, and walk every canonical relevance query
 * fixture (bm25 / tfidf / custom ranking / A/B variant).
 */
export async function driveRelevanceLifecycle(
  adapter: OpenSearchAdapter,
  input: {
    backend: OpenSearchBackend;
    indexId: string;
    fixture: FixtureSet;
  },
): Promise<void> {
  if (input.fixture.relevanceDocuments.length === 0) {
    return;
  }
  await adapter.startRelevanceSession({
    backend: input.backend,
    indexId: input.indexId,
  });
  await adapter.seedRelevanceDocuments({
    bucket: input.backend,
    indexId: input.indexId,
    documents: input.fixture.relevanceDocuments,
  });
  for (const query of input.fixture.relevanceQueries) {
    await runRelevanceQuery(
      adapter,
      input.backend,
      input.indexId,
      query,
      input.fixture.relevanceDocuments,
    );
  }
}

/**
 * Drive the synonym-axis lifecycle end-to-end: start a synonym session,
 * register synonym entries, and walk every canonical synonym query
 * fixture (expand / phonetic / stemmer / typo).
 */
export async function driveSynonymLifecycle(
  adapter: OpenSearchAdapter,
  input: {
    backend: OpenSearchBackend;
    indexId: string;
    fixture: FixtureSet;
  },
): Promise<void> {
  if (input.fixture.synonymEntries.length === 0 && input.fixture.synonymQueries.length === 0) {
    return;
  }
  await adapter.startSynonymSession({
    backend: input.backend,
    indexId: input.indexId,
  });
  if (input.fixture.synonymEntries.length > 0) {
    await adapter.registerSynonyms({
      bucket: input.backend,
      indexId: input.indexId,
      entries: input.fixture.synonymEntries,
    });
  }
  for (const query of input.fixture.synonymQueries) {
    await runSynonymQuery(adapter, input.backend, input.indexId, query);
  }
}

/**
 * Drive the index-management-axis lifecycle end-to-end: start an
 * index-mgmt session, and walk every canonical cluster step
 * (allocate / promote / reindex / swap).
 */
export async function driveIndexMgmtLifecycle(
  adapter: OpenSearchAdapter,
  input: {
    backend: OpenSearchBackend;
    indexId: string;
    fixture: FixtureSet;
  },
): Promise<void> {
  if (input.fixture.clusterConfig.nodes.length === 0) {
    return;
  }
  await adapter.startIndexMgmtSession({
    backend: input.backend,
    indexId: input.indexId,
    shardCount: input.fixture.clusterConfig.shardCount,
    replicaCount: input.fixture.clusterConfig.replicaCount,
    nodes: input.fixture.clusterConfig.nodes,
  });
  for (const step of input.fixture.clusterSteps) {
    await runClusterStep(adapter, input.backend, input.indexId, step);
  }
}

/**
 * Drive the full OpenSearch lifecycle end-to-end — relevance + synonym
 * + index-mgmt axes + health check + fidelity signal. Emits every op
 * on the 19-op contract at least once so a per-lifecycle trace has a
 * stable event count — the fidelity harness leans on that to detect
 * missing / drifted ops.
 */
export async function driveOpenSearchLifecycle(
  adapter: OpenSearchAdapter,
  input: LifecycleInput,
): Promise<void> {
  await driveRelevanceLifecycle(adapter, input);
  await driveSynonymLifecycle(adapter, input);
  await driveIndexMgmtLifecycle(adapter, input);
  await adapter.emitFidelitySignal({
    bucket: input.backend,
    signal: 'ok',
    notes: `lifecycle ${input.backend}/${input.fixture.id}`,
  });
  await adapter.queryOpensearchHealth({ bucket: input.backend });
}

/**
 * Drive lifecycles across 1 backend x 3 fixture sets = 3 lifecycles.
 * Each lifecycle exercises every op in the 19-op contract at least
 * once (subject to fixture data availability — the articles fixture
 * has no synonym / cluster data so those axes are skipped in that
 * lifecycle by design), so the fidelity harness sees each op emit per
 * lifecycle and can measure divergence granularly.
 */
export async function driveFullMatrix(
  adapter: OpenSearchAdapter,
): Promise<{ lifecyclesRun: number }> {
  const lifecycles: LifecycleInput[] = [];
  for (const backend of DEFAULT_BACKENDS) {
    for (const fixture of ALL_FIXTURES) {
      lifecycles.push({
        backend,
        fixture,
        indexId: `${backend}-${fixture.id}`,
      });
    }
  }
  for (const input of lifecycles) {
    await driveOpenSearchLifecycle(adapter, input);
  }
  return { lifecyclesRun: lifecycles.length };
}

/**
 * All op names the mock adapter walks — the 17 promise-returning
 * method ops on the adapter plus a synthesised `resetVerified` step
 * the fidelity harness emits at the end of a lifecycle. `reset` is
 * included so the full matrix + reset story stays observable.
 */
export const OPS_UNDER_TEST: readonly string[] = [
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

async function runRelevanceQuery(
  adapter: OpenSearchAdapter,
  backend: OpenSearchBackend,
  indexId: string,
  query: RelevanceQueryFixture,
  documents: readonly RelevanceDocument[],
): Promise<void> {
  switch (query.kind) {
    case 'bm25': {
      if (query.query === undefined) {
        throw new Error(`bm25 relevance query ${query.id} missing query`);
      }
      const bm25Result = await adapter.scoreBm25({
        bucket: backend,
        indexId,
        query: query.query,
      });
      // If we ran BM25, chain custom ranking so the ranking axis is
      // exercised on every relevance lifecycle.
      const boostFn = (doc: RelevanceDocument): number => doc.boostSignal ?? 1;
      await adapter.applyCustomRanking({
        bucket: backend,
        indexId,
        hits: bm25Result.hits,
        boostFn,
      });
      return;
    }
    case 'tfidf': {
      if (query.query === undefined) {
        throw new Error(`tfidf relevance query ${query.id} missing query`);
      }
      await adapter.scoreTfIdf({
        bucket: backend,
        indexId,
        query: query.query,
      });
      return;
    }
    case 'ab-variant': {
      if (query.variants === undefined || query.userId === undefined) {
        throw new Error(
          `ab-variant relevance query ${query.id} missing variants / userId`,
        );
      }
      // Silence unused-parameter lint when documents is only relevant
      // for boostFn on the bm25 branch.
      void documents;
      await adapter.selectAbVariant({
        bucket: backend,
        indexId,
        variants: query.variants,
        userId: query.userId,
        ...(query.salt !== undefined ? { salt: query.salt } : {}),
      });
      return;
    }
  }
}

async function runSynonymQuery(
  adapter: OpenSearchAdapter,
  backend: OpenSearchBackend,
  indexId: string,
  query: SynonymQueryFixture,
): Promise<void> {
  switch (query.kind) {
    case 'expand': {
      if (query.query === undefined || query.languages === undefined) {
        throw new Error(`expand synonym query ${query.id} missing query / languages`);
      }
      await adapter.expandMultiLanguage({
        bucket: backend,
        indexId,
        query: query.query,
        languages: query.languages,
      });
      return;
    }
    case 'phonetic': {
      if (query.query === undefined || query.candidates === undefined) {
        throw new Error(`phonetic synonym query ${query.id} missing query / candidates`);
      }
      await adapter.matchPhonetic({
        bucket: backend,
        indexId,
        query: query.query,
        candidates: query.candidates,
      });
      return;
    }
    case 'stemmer': {
      if (query.tokens === undefined || query.language === undefined) {
        throw new Error(`stemmer synonym query ${query.id} missing tokens / language`);
      }
      await adapter.normalizeStemmer({
        bucket: backend,
        indexId,
        tokens: query.tokens,
        language: query.language,
      });
      return;
    }
    case 'typo': {
      if (query.query === undefined || query.dictionary === undefined) {
        throw new Error(`typo synonym query ${query.id} missing query / dictionary`);
      }
      await adapter.bridgeTypo({
        bucket: backend,
        indexId,
        query: query.query,
        dictionary: query.dictionary,
        ...(query.maxDistance !== undefined ? { maxDistance: query.maxDistance } : {}),
      });
      return;
    }
  }
}

async function runClusterStep(
  adapter: OpenSearchAdapter,
  backend: OpenSearchBackend,
  indexId: string,
  step: ClusterStepFixture,
): Promise<void> {
  switch (step.kind) {
    case 'allocate': {
      await adapter.allocateShards({ bucket: backend, indexId });
      return;
    }
    case 'promote': {
      if (step.shardId === undefined || step.failedNode === undefined) {
        throw new Error(`promote step ${step.id} missing shardId / failedNode`);
      }
      await adapter.promoteReplica({
        bucket: backend,
        indexId,
        shardId: step.shardId,
        failedNode: step.failedNode,
      });
      return;
    }
    case 'reindex': {
      if (step.batchPercent === undefined) {
        throw new Error(`reindex step ${step.id} missing batchPercent`);
      }
      await adapter.advanceRollingReindex({
        bucket: backend,
        indexId,
        batchPercent: step.batchPercent,
      });
      return;
    }
    case 'swap': {
      if (step.newIndexId === undefined) {
        throw new Error(`swap step ${step.id} missing newIndexId`);
      }
      await adapter.swapZeroDowntime({
        bucket: backend,
        indexId,
        newIndexId: step.newIndexId,
      });
      return;
    }
  }
}
