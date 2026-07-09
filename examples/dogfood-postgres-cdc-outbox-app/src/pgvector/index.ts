/**
 * pgvector flow driver — wraps orm v0.10 `createVectorStoreSession` + 4
 * neutral vector primitives (`buildIndex`, `knnSearch`, `hybridSearch`,
 * `computeDistance`) into a single dogfood run that mirrors the
 * Postgres 16 + pgvector 0.7 IVFFlat / k-NN / hybrid workflow.
 *
 * v1.32-2 scope: 1 IVFFlat index × 3 lists × 8 dimensions × cosine
 * distance. The real driver (v1.32-6) will connect to a running
 * Postgres 16 + pgvector extension via `POSTGRES_BOOTSTRAP` +
 * `PGVECTOR_ENABLED=1`.
 */

import {
  buildIndex,
  computeDistance,
  createVectorStoreSession,
  hybridSearch,
  knnSearch,
  type VectorStoreSession,
} from '@kiwa-lab/orm';
import type { PgvectorObservation } from '../adapters/interface.js';

export interface DrivePgvectorInput {
  readonly storeId?: string;
  readonly indexName?: string;
  readonly dimensions?: number;
  readonly lists?: number;
  readonly k?: number;
  readonly keyword?: string;
  readonly vectorWeight?: number;
}

const DEFAULTS = {
  storeId: 'orders_embeddings',
  indexName: 'orders_embeddings_ivf',
  dimensions: 8,
  lists: 3,
  k: 5,
  keyword: 'order',
  vectorWeight: 0.7,
};

export interface DrivePgvectorResult {
  session: VectorStoreSession;
  observation: PgvectorObservation;
}

/**
 * Deterministic 8-dim probe vectors — pinned so the fidelity harness can
 * assert on the exact cosine distance between them across mock + real
 * runs (Postgres 16 + pgvector returns bit-identical values for these
 * inputs since the ANN index does not perturb raw distance math).
 */
const PROBE_QUERY = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8];
const PROBE_A = [1, 0, 0, 0, 0, 0, 0, 0];
const PROBE_B = [0, 1, 0, 0, 0, 0, 0, 0];

/**
 * Walk build → knn → hybrid → distance. Returns the observation the
 * adapter records into its trace + fidelity harness.
 */
export function drivePgvectorFlow(input: DrivePgvectorInput = {}): DrivePgvectorResult {
  const cfg = { ...DEFAULTS, ...input };

  const session = createVectorStoreSession({
    storeId: cfg.storeId,
    provider: 'drizzle',
    backend: 'postgres',
    distanceKind: 'cosine',
  });

  buildIndex(session, {
    name: cfg.indexName,
    kind: 'ivfflat',
    dimensions: cfg.dimensions,
    lists: cfg.lists,
  });

  knnSearch(session, {
    query: PROBE_QUERY.slice(0, cfg.dimensions),
    k: cfg.k,
  });

  hybridSearch(session, {
    query: PROBE_QUERY.slice(0, cfg.dimensions),
    k: cfg.k,
    keyword: cfg.keyword,
    vectorWeight: cfg.vectorWeight,
  });

  const distanceStep = computeDistance(session, {
    a: PROBE_A.slice(0, cfg.dimensions),
    b: PROBE_B.slice(0, cfg.dimensions),
  });

  const rawDistance = distanceStep.metadata['distance'];
  const distance = typeof rawDistance === 'number' ? rawDistance : Number.NaN;

  const observation: PgvectorObservation = {
    indexKind: 'ivfflat',
    dimensions: cfg.dimensions,
    lists: cfg.lists,
    searchCount: session.searchCount,
    computedDistance: distance,
    bothSearchesRecorded:
      session.history.some((s) => s.neutralEvent === 'vector.knn-searched') &&
      session.history.some((s) => s.neutralEvent === 'vector.hybrid-searched'),
  };

  return { session, observation };
}
