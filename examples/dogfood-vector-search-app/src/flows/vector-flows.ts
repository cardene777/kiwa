/**
 * Higher-level flows that compose the adapter ops. Both the mock-mode
 * tests and the fidelity harness drive these functions so the trace
 * comparison runs against identical call sequences.
 */

import type {
  DocumentRow,
  SearchQuery,
  VectorDistanceKind,
  VectorIndex,
  VectorSearchAdapter,
} from '../adapters/interface.js';

export async function driveIndexBuildFlow(
  adapter: VectorSearchAdapter,
  input: { docs: readonly DocumentRow[]; index: VectorIndex },
): Promise<{ indexKind: string; dimensions: number; indexed: boolean; documents: number }> {
  const out = await adapter.driveIndexBuild(input);
  return {
    indexKind: out.indexKind,
    dimensions: out.dimensions,
    indexed: out.indexed,
    documents: out.documentsIndexed,
  };
}

export async function driveSemanticSearchFlow(
  adapter: VectorSearchAdapter,
  input: {
    docs: readonly DocumentRow[];
    query: SearchQuery;
    index: VectorIndex;
    distanceKind: VectorDistanceKind;
  },
): Promise<{ rankedIds: readonly string[]; distanceKind: string; returned: number }> {
  const out = await adapter.driveSemanticSearch(input);
  return {
    rankedIds: out.rankedIds,
    distanceKind: out.distanceKind,
    returned: out.rankedIds.length,
  };
}

export async function driveHybridSearchFlow(
  adapter: VectorSearchAdapter,
  input: {
    docs: readonly DocumentRow[];
    query: SearchQuery;
    index: VectorIndex;
    distanceKind: VectorDistanceKind;
    vectorWeight: number;
  },
): Promise<{
  rankedIds: readonly string[];
  vectorWeight: number;
  keywordWeight: number;
  returned: number;
}> {
  const out = await adapter.driveHybridSearch(input);
  return {
    rankedIds: out.rankedIds,
    vectorWeight: out.vectorWeight,
    keywordWeight: out.keywordWeight,
    returned: out.rankedIds.length,
  };
}

export async function driveCacheHitRateFlow(
  adapter: VectorSearchAdapter,
  input: {
    docs: readonly DocumentRow[];
    lookups: readonly { key: string; expectedEmbedding: readonly number[] }[];
    reindex?: boolean;
  },
): Promise<{
  totalLookups: number;
  hits: number;
  misses: number;
  hitRate: number;
  reindexed: boolean;
}> {
  const out = await adapter.driveCacheHitRate(input);
  return {
    totalLookups: out.totalLookups,
    hits: out.hits,
    misses: out.misses,
    hitRate: out.hitRate,
    reindexed: out.reindexed,
  };
}

export async function driveFidelityFlow(adapter: VectorSearchAdapter): Promise<void> {
  await adapter.emitFidelity();
}
