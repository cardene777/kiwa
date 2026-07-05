import { backendEventName, type AxisStep, type OrmBackend, type OrmProvider } from './types.js';

/**
 * Vector store — build an approximate nearest neighbour index (IVFFlat or
 * HNSW), run k-NN queries with cosine / L2 distance, run hybrid searches
 * combining vector + full-text scoring, and record the raw distance
 * computation for telemetry. Postgres has pgvector; MySQL HeatWave has
 * native vector types; SQLite has sqlite-vec / sqlite-vss extensions. The
 * mock exposes the same 4 neutral events for all 3 backends.
 *
 * State transitions:
 *   created              → 'unindexed'
 *   buildIndex           → 'indexed'
 *   knnSearch            → 'searched'
 *   hybridSearch         → 'searched'
 *   computeDistance      → (state unchanged, distance is passive)
 */
export type VectorState = 'unindexed' | 'indexed' | 'searched';

export type VectorIndexKind = 'ivfflat' | 'hnsw';

export type VectorDistanceKind = 'cosine' | 'l2' | 'inner-product';

export interface VectorIndex {
  name: string;
  kind: VectorIndexKind;
  dimensions: number;
  lists?: number; // IVFFlat lists
  m?: number; // HNSW graph degree
  efConstruction?: number; // HNSW ef_construction
}

export interface VectorStoreSession {
  storeId: string;
  provider: OrmProvider;
  backend: OrmBackend;
  state: VectorState;
  index: VectorIndex | null;
  distanceKind: VectorDistanceKind;
  searchCount: number;
  history: AxisStep<VectorState>[];
}

function record(
  session: VectorStoreSession,
  step: AxisStep<VectorState>,
): AxisStep<VectorState> {
  session.history.push(step);
  return step;
}

/**
 * Create a vector store session. State starts at 'unindexed' with no
 * index. Caller picks the distance kind (cosine / L2 / inner product).
 */
export function createVectorStoreSession(input: {
  storeId: string;
  provider: OrmProvider;
  backend: OrmBackend;
  distanceKind: VectorDistanceKind;
}): VectorStoreSession {
  return {
    storeId: input.storeId,
    provider: input.provider,
    backend: input.backend,
    state: 'unindexed',
    index: null,
    distanceKind: input.distanceKind,
    searchCount: 0,
    history: [],
  };
}

/**
 * Build an ANN index. IVFFlat requires `lists`; HNSW requires `m` +
 * `efConstruction`. Emits `vector.indexed`.
 */
export function buildIndex(
  session: VectorStoreSession,
  input: VectorIndex,
): AxisStep<VectorState> {
  if (input.dimensions <= 0) {
    throw new Error('buildIndex: dimensions must be positive');
  }
  if (input.kind === 'ivfflat') {
    if (!input.lists || input.lists <= 0) {
      throw new Error('buildIndex: ivfflat requires positive `lists`');
    }
  } else {
    if (!input.m || input.m <= 0) {
      throw new Error('buildIndex: hnsw requires positive `m`');
    }
    if (!input.efConstruction || input.efConstruction <= 0) {
      throw new Error('buildIndex: hnsw requires positive `efConstruction`');
    }
  }
  session.index = { ...input };
  session.state = 'indexed';
  return record(session, {
    neutralEvent: 'vector.indexed',
    backendEvent: backendEventName(session.backend, 'vector.indexed', session.provider),
    state: session.state,
    provider: session.provider,
    backend: session.backend,
    metadata: {
      name: input.name,
      kind: input.kind,
      dimensions: input.dimensions,
    },
  });
}

/**
 * Run a k-NN search over the built index. Requires an index and a query
 * whose dimension matches the index. Emits `vector.knn-searched` and bumps
 * `searchCount`.
 */
export function knnSearch(
  session: VectorStoreSession,
  input: { query: number[]; k: number },
): AxisStep<VectorState> {
  if (!session.index) {
    throw new Error('knnSearch: no index built');
  }
  if (input.query.length !== session.index.dimensions) {
    throw new Error(
      `knnSearch: query dim ${input.query.length} != index dim ${session.index.dimensions}`,
    );
  }
  if (input.k <= 0) {
    throw new Error('knnSearch: k must be positive');
  }
  session.searchCount += 1;
  session.state = 'searched';
  return record(session, {
    neutralEvent: 'vector.knn-searched',
    backendEvent: backendEventName(session.backend, 'vector.knn-searched', session.provider),
    state: session.state,
    provider: session.provider,
    backend: session.backend,
    metadata: {
      k: input.k,
      dimensions: session.index.dimensions,
      indexKind: session.index.kind,
      searchCount: session.searchCount,
    },
  });
}

/**
 * Run a hybrid search — combine vector similarity + a keyword / full-text
 * score with a weight in [0, 1]. Requires an index. Emits
 * `vector.hybrid-searched`.
 */
export function hybridSearch(
  session: VectorStoreSession,
  input: { query: number[]; k: number; keyword: string; vectorWeight: number },
): AxisStep<VectorState> {
  if (!session.index) {
    throw new Error('hybridSearch: no index built');
  }
  if (input.query.length !== session.index.dimensions) {
    throw new Error(
      `hybridSearch: query dim ${input.query.length} != index dim ${session.index.dimensions}`,
    );
  }
  if (input.k <= 0) {
    throw new Error('hybridSearch: k must be positive');
  }
  if (input.vectorWeight < 0 || input.vectorWeight > 1) {
    throw new Error('hybridSearch: vectorWeight must be in [0, 1]');
  }
  if (input.keyword.length === 0) {
    throw new Error('hybridSearch: keyword required');
  }
  session.searchCount += 1;
  session.state = 'searched';
  return record(session, {
    neutralEvent: 'vector.hybrid-searched',
    backendEvent: backendEventName(session.backend, 'vector.hybrid-searched', session.provider),
    state: session.state,
    provider: session.provider,
    backend: session.backend,
    metadata: {
      k: input.k,
      keyword: input.keyword,
      vectorWeight: input.vectorWeight,
      searchCount: session.searchCount,
    },
  });
}

/**
 * Compute the raw distance between two vectors using the session's distance
 * kind. Deterministic, side-effect free. Emits `vector.distance-computed`
 * for telemetry and returns the distance in metadata.
 */
export function computeDistance(
  session: VectorStoreSession,
  input: { a: number[]; b: number[] },
): AxisStep<VectorState> {
  if (input.a.length !== input.b.length) {
    throw new Error('computeDistance: vector length mismatch');
  }
  if (input.a.length === 0) {
    throw new Error('computeDistance: empty vectors');
  }
  let distance: number;
  if (session.distanceKind === 'l2') {
    let sum = 0;
    for (let i = 0; i < input.a.length; i++) {
      const d = input.a[i]! - input.b[i]!;
      sum += d * d;
    }
    distance = Math.sqrt(sum);
  } else if (session.distanceKind === 'inner-product') {
    let dot = 0;
    for (let i = 0; i < input.a.length; i++) {
      dot += input.a[i]! * input.b[i]!;
    }
    distance = -dot; // convention: smaller is closer, negate inner product
  } else {
    // cosine
    let dot = 0;
    let na = 0;
    let nb = 0;
    for (let i = 0; i < input.a.length; i++) {
      dot += input.a[i]! * input.b[i]!;
      na += input.a[i]! * input.a[i]!;
      nb += input.b[i]! * input.b[i]!;
    }
    const denom = Math.sqrt(na) * Math.sqrt(nb);
    distance = denom === 0 ? 1 : 1 - dot / denom;
  }
  return record(session, {
    neutralEvent: 'vector.distance-computed',
    backendEvent: backendEventName(session.backend, 'vector.distance-computed', session.provider),
    state: session.state,
    provider: session.provider,
    backend: session.backend,
    metadata: {
      distance,
      distanceKind: session.distanceKind,
      dimensions: input.a.length,
    },
  });
}
