/**
 * Vector index gate — wraps `@kiwa-test/orm`'s vector-store semantics
 * into a small helper that models the production Kysely + pgvector
 * layer:
 *
 *   1. `mountIndex`   installs an IVFFlat or HNSW index on session
 *                     bring-up (equivalent to `CREATE INDEX ... USING
 *                     ivfflat (embedding vector_cosine_ops) WITH (lists
 *                     = 100)` in pgvector).
 *   2. `knn`          runs a k-NN query with the session's distance
 *                     kind (cosine / L2). Requires an index.
 *   3. `hybrid`       runs a hybrid vector + keyword query with a
 *                     tunable weight in [0, 1] on the vector side.
 *   4. `distance`     computes a raw distance between 2 vectors — the
 *                     side-effect-free telemetry op.
 *
 * The gate never touches the database — it drives the mock's neutral
 * vector event stream so tests can assert on `vector.indexed` /
 * `vector.knn-searched` / `vector.hybrid-searched` /
 * `vector.distance-computed` regardless of backend.
 */

import {
  buildIndex,
  computeDistance,
  createVectorStoreSession,
  hybridSearch,
  knnSearch,
  type VectorDistanceKind,
  type VectorIndex,
  type VectorIndexKind,
  type VectorStoreSession,
} from '@kiwa-test/orm';

export interface VectorIndexGate {
  readonly session: VectorStoreSession;
  readonly mountIndex: (input: VectorIndex) => void;
  readonly knn: (input: { query: number[]; k: number }) => void;
  readonly hybrid: (input: {
    query: number[];
    k: number;
    keyword: string;
    vectorWeight: number;
  }) => void;
  readonly distance: (input: { a: number[]; b: number[] }) => number;
}

/**
 * Build a vector index gate bound to a store id. `mountIndex` must be
 * called via the gate before any search assertion; searches without an
 * index throw so the fidelity harness reports the missing state.
 */
export function createVectorIndexGate(input: {
  storeId: string;
  distanceKind: VectorDistanceKind;
}): VectorIndexGate {
  const session = createVectorStoreSession({
    storeId: input.storeId,
    provider: 'kysely',
    backend: 'postgres',
    distanceKind: input.distanceKind,
  });

  function requireIndex(): void {
    if (!session.index) {
      throw new Error('VectorIndexGate: no index mounted — call mountIndex before searching');
    }
  }

  return {
    session,
    mountIndex(input: VectorIndex): void {
      buildIndex(session, input);
    },
    knn(input): void {
      requireIndex();
      knnSearch(session, input);
    },
    hybrid(input): void {
      requireIndex();
      hybridSearch(session, input);
    },
    distance(input): number {
      const step = computeDistance(session, input);
      return step.metadata.distance as number;
    },
  };
}

/**
 * Public IVFFlat + HNSW factory helpers so tests + adapter agree on the
 * `VectorIndex` shape (matches pgvector's `CREATE INDEX ... USING
 * ivfflat|hnsw` options 1:1).
 */
export function ivfFlatIndex(input: {
  name: string;
  dimensions: number;
  lists: number;
}): VectorIndex {
  return { name: input.name, kind: 'ivfflat', dimensions: input.dimensions, lists: input.lists };
}

export function hnswIndex(input: {
  name: string;
  dimensions: number;
  m: number;
  efConstruction: number;
}): VectorIndex {
  return {
    name: input.name,
    kind: 'hnsw',
    dimensions: input.dimensions,
    m: input.m,
    efConstruction: input.efConstruction,
  };
}

export type { VectorDistanceKind, VectorIndex, VectorIndexKind };
