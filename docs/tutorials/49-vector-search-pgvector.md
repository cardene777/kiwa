# pgvector + hybrid search — semantic + keyword retrieval in 15 min

## What you'll build

A vitest suite wired to `@kiwa/orm` v0.9 that walks the vector-store axis end-to-end for a pgvector-backed hybrid search on Postgres. You will build an IVFFlat / HNSW index, run a k-NN search with a cosine / L2 / inner-product distance, run a hybrid search that combines vector similarity with a keyword score, and compute raw pairwise distances for telemetry. The exact pattern that `examples/dogfood-vector-search-app` (SvelteKit + kysely + Postgres 16 + pgvector) uses — same `createVectorStoreSession` + `buildIndex` + `knnSearch` + `hybridSearch` + `computeDistance` primitives, same dimension guards, same distance-kind switching. You leave this tutorial with a runnable hybrid search test and a working distance calculator for any pgvector flow you point it at.

## Prerequisites

- Node.js ≥ 20
- `pnpm` (or npm / yarn)
- An empty directory to work in

## Step-by-step build

### 1. Bootstrap the project

```bash
mkdir kiwa-vector-search && cd kiwa-vector-search
pnpm init
pnpm add -D @kiwa/orm@^0.9 vitest typescript @types/node
```

Add the vitest script in `package.json`.

```json
{
  "type": "module",
  "scripts": {
    "test": "vitest run"
  }
}
```

### 2. Open a vector-store session

`tests/vector/session.test.ts` — `createVectorStoreSession` opens a per-store session pinned to a distance kind (`cosine` / `l2` / `inner-product`). It starts at `unindexed` with a null `index` and `searchCount = 0`.

```ts
import { describe, expect, it } from 'vitest';
import { createVectorStoreSession } from '@kiwa/orm';

describe('vector — session ctor', () => {
  it('starts unindexed with the requested distance kind', () => {
    const session = createVectorStoreSession({
      storeId: 'docs',
      provider: 'kysely',
      backend: 'postgres',
      distanceKind: 'cosine',
    });

    expect(session.state).toBe('unindexed');
    expect(session.index).toBeNull();
    expect(session.searchCount).toBe(0);
    expect(session.distanceKind).toBe('cosine');
    expect(session.history).toHaveLength(0);
  });
});
```

The distance kind is fixed at session creation so downstream `computeDistance` calls stay consistent — a session cannot switch from `cosine` to `l2` mid-flight. Postgres backend events are `pgvector.ivfflat_indexed` / `pgvector.knn` / `pgvector.hybrid` / `pgvector.cosine_distance`; MySQL uses `heatwave.*` and SQLite uses `sqlite_vec.*`.

### 3. Build an IVFFlat index

`tests/vector/index-ivfflat.test.ts` — `buildIndex` with `{ kind: 'ivfflat', dimensions, lists }` builds an inverted-file index. Requires positive `dimensions` and positive `lists`; a missing / non-positive `lists` throws so tests catch the common bug of passing HNSW-shaped input to an IVFFlat index.

```ts
import { describe, expect, it } from 'vitest';
import { buildIndex, createVectorStoreSession } from '@kiwa/orm';

describe('vector — build IVFFlat index', () => {
  it('moves unindexed -> indexed with dimensions + lists', () => {
    const session = createVectorStoreSession({
      storeId: 'docs',
      provider: 'kysely',
      backend: 'postgres',
      distanceKind: 'cosine',
    });

    const step = buildIndex(session, {
      name: 'docs_ivfflat',
      kind: 'ivfflat',
      dimensions: 384,
      lists: 100,
    });

    expect(step.neutralEvent).toBe('vector.indexed');
    expect(step.backendEvent).toBe('pgvector.ivfflat_indexed');
    expect(step.state).toBe('indexed');
    expect(session.index?.dimensions).toBe(384);
    expect(session.index?.lists).toBe(100);
  });

  it('throws when ivfflat is missing lists', () => {
    const session = createVectorStoreSession({
      storeId: 'docs',
      provider: 'kysely',
      backend: 'postgres',
      distanceKind: 'cosine',
    });

    expect(() =>
      buildIndex(session, {
        name: 'docs_ivfflat',
        kind: 'ivfflat',
        dimensions: 384,
      }),
    ).toThrow(/ivfflat requires positive `lists`/);
  });
});
```

`dimensions` is the anchor for later query validation — a `knnSearch` with a mismatched query dimension throws at test time, not with a silent Postgres error at production.

### 4. Build an HNSW index

`tests/vector/index-hnsw.test.ts` — `buildIndex` with `{ kind: 'hnsw', dimensions, m, efConstruction }` builds a hierarchical navigable small-world index. Requires positive `m` and `efConstruction`; missing / non-positive values throw.

```ts
import { describe, expect, it } from 'vitest';
import { buildIndex, createVectorStoreSession } from '@kiwa/orm';

describe('vector — build HNSW index', () => {
  it('moves unindexed -> indexed with m + efConstruction', () => {
    const session = createVectorStoreSession({
      storeId: 'docs',
      provider: 'kysely',
      backend: 'postgres',
      distanceKind: 'l2',
    });

    const step = buildIndex(session, {
      name: 'docs_hnsw',
      kind: 'hnsw',
      dimensions: 768,
      m: 16,
      efConstruction: 64,
    });

    expect(step.state).toBe('indexed');
    expect(session.index?.kind).toBe('hnsw');
    expect(session.index?.m).toBe(16);
    expect(session.index?.efConstruction).toBe(64);
  });

  it('throws when hnsw is missing efConstruction', () => {
    const session = createVectorStoreSession({
      storeId: 'docs',
      provider: 'kysely',
      backend: 'postgres',
      distanceKind: 'l2',
    });

    expect(() =>
      buildIndex(session, {
        name: 'docs_hnsw',
        kind: 'hnsw',
        dimensions: 768,
        m: 16,
      }),
    ).toThrow(/hnsw requires positive `efConstruction`/);
  });
});
```

The mock does not build a real graph — it captures the index parameters on the session and gates later search calls on dimension match. That is enough to catch the two most common bugs (wrong dimension, wrong index shape) without a running Postgres.

### 5. Run a k-NN search

`tests/vector/knn.test.ts` — `knnSearch` requires an index and a query whose length matches `index.dimensions`. Increments `searchCount` and moves the session into `searched`. Returns an `AxisStep<VectorState>` with `metadata.k + dimensions + indexKind` so downstream telemetry can key on either.

```ts
import { describe, expect, it } from 'vitest';
import {
  buildIndex,
  createVectorStoreSession,
  knnSearch,
} from '@kiwa/orm';

describe('vector — knn search', () => {
  it('bumps searchCount and moves to searched', () => {
    const session = createVectorStoreSession({
      storeId: 'docs',
      provider: 'kysely',
      backend: 'postgres',
      distanceKind: 'cosine',
    });
    buildIndex(session, {
      name: 'docs_ivfflat',
      kind: 'ivfflat',
      dimensions: 3,
      lists: 10,
    });

    const step = knnSearch(session, { query: [0.1, 0.2, 0.3], k: 5 });

    expect(step.neutralEvent).toBe('vector.knn-searched');
    expect(step.backendEvent).toBe('pgvector.knn');
    expect(step.state).toBe('searched');
    expect(session.searchCount).toBe(1);
    expect(step.metadata.k).toBe(5);
    expect(step.metadata.dimensions).toBe(3);
  });

  it('throws on a mismatched query dimension', () => {
    const session = createVectorStoreSession({
      storeId: 'docs',
      provider: 'kysely',
      backend: 'postgres',
      distanceKind: 'cosine',
    });
    buildIndex(session, {
      name: 'docs_ivfflat',
      kind: 'ivfflat',
      dimensions: 3,
      lists: 10,
    });

    expect(() => knnSearch(session, { query: [0.1, 0.2], k: 5 })).toThrow(
      /query dim 2 != index dim 3/,
    );
  });

  it('throws when no index is built', () => {
    const session = createVectorStoreSession({
      storeId: 'docs',
      provider: 'kysely',
      backend: 'postgres',
      distanceKind: 'cosine',
    });

    expect(() => knnSearch(session, { query: [0.1, 0.2, 0.3], k: 5 })).toThrow(/no index built/);
  });
});
```

The dimension guard is what makes the mock trustworthy at the app-integration layer. A dogfood app that swaps the embedding model from 384-dim to 768-dim without rebuilding the index gets a test failure at CI, not a Postgres error under load.

### 6. Run a hybrid search

`tests/vector/hybrid.test.ts` — `hybridSearch` combines vector similarity with a keyword / BM25 score. Requires (a) an index, (b) a query whose dimension matches, (c) `vectorWeight` in `[0, 1]`, and (d) a non-empty `keyword`. Returns an `AxisStep<VectorState>` with `metadata.k + keyword + vectorWeight`.

```ts
import { describe, expect, it } from 'vitest';
import {
  buildIndex,
  createVectorStoreSession,
  hybridSearch,
} from '@kiwa/orm';

describe('vector — hybrid search', () => {
  it('records k + keyword + weight and moves to searched', () => {
    const session = createVectorStoreSession({
      storeId: 'docs',
      provider: 'kysely',
      backend: 'postgres',
      distanceKind: 'cosine',
    });
    buildIndex(session, {
      name: 'docs_hnsw',
      kind: 'hnsw',
      dimensions: 3,
      m: 16,
      efConstruction: 64,
    });

    const step = hybridSearch(session, {
      query: [0.1, 0.2, 0.3],
      k: 10,
      keyword: 'kiwa vector search',
      vectorWeight: 0.7,
    });

    expect(step.neutralEvent).toBe('vector.hybrid-searched');
    expect(step.backendEvent).toBe('pgvector.hybrid');
    expect(step.state).toBe('searched');
    expect(step.metadata.keyword).toBe('kiwa vector search');
    expect(step.metadata.vectorWeight).toBe(0.7);
  });

  it('throws on a vector weight outside [0, 1]', () => {
    const session = createVectorStoreSession({
      storeId: 'docs',
      provider: 'kysely',
      backend: 'postgres',
      distanceKind: 'cosine',
    });
    buildIndex(session, {
      name: 'docs_hnsw',
      kind: 'hnsw',
      dimensions: 3,
      m: 16,
      efConstruction: 64,
    });

    expect(() =>
      hybridSearch(session, {
        query: [0.1, 0.2, 0.3],
        k: 5,
        keyword: 'foo',
        vectorWeight: 1.5,
      }),
    ).toThrow(/vectorWeight must be in \[0, 1\]/);
  });
});
```

`vectorWeight = 1.0` is pure vector similarity; `vectorWeight = 0.0` is pure keyword. A hybrid ranker in the dogfood app blends the two scores; the mock captures the intent without evaluating the blend.

### 7. Compute a raw distance

`tests/vector/distance.test.ts` — `computeDistance` returns a raw pairwise distance under the session's distance kind. Deterministic and side-effect free (state stays unchanged). Useful for verifying the ranker's math without a running Postgres.

```ts
import { describe, expect, it } from 'vitest';
import {
  computeDistance,
  createVectorStoreSession,
} from '@kiwa/orm';

describe('vector — compute distance', () => {
  it('returns 0 for identical cosine vectors', () => {
    const session = createVectorStoreSession({
      storeId: 'docs',
      provider: 'kysely',
      backend: 'postgres',
      distanceKind: 'cosine',
    });

    const step = computeDistance(session, {
      a: [1, 0, 0],
      b: [1, 0, 0],
    });

    expect(step.neutralEvent).toBe('vector.distance-computed');
    expect(step.metadata.distance).toBeCloseTo(0);
    expect(step.metadata.distanceKind).toBe('cosine');
  });

  it('returns the Euclidean distance for l2 kind', () => {
    const session = createVectorStoreSession({
      storeId: 'docs',
      provider: 'kysely',
      backend: 'postgres',
      distanceKind: 'l2',
    });

    const step = computeDistance(session, {
      a: [0, 0, 0],
      b: [3, 4, 0],
    });

    expect(step.metadata.distance).toBeCloseTo(5);
    expect(step.metadata.distanceKind).toBe('l2');
  });

  it('rejects vector length mismatch', () => {
    const session = createVectorStoreSession({
      storeId: 'docs',
      provider: 'kysely',
      backend: 'postgres',
      distanceKind: 'cosine',
    });

    expect(() => computeDistance(session, { a: [1, 0], b: [1, 0, 0] })).toThrow(
      /vector length mismatch/,
    );
  });
});
```

`computeDistance` does not require a built index — it's a raw math primitive for tests. The state stays wherever it was (`unindexed` / `indexed` / `searched`) because distance calculation is passive.

### 8. Run it

```bash
pnpm test
```

Every step above returns an `AxisStep<VectorState>` envelope so downstream tests can assert on either the state machine outcome (`step.state === 'searched'`) or the emitted event (`step.neutralEvent === 'vector.hybrid-searched'`). The full end-to-end pattern lives in `packages/orm/tests/docs-tutorial-v1.26.test.ts` — the snippet validation test that guarantees every code sample in this tutorial keeps matching the real `@kiwa/orm` v0.9 API.

## Where to next

- [Tutorial 47 — Postgres CDC + outbox (cdc axis)](./47-postgres-cdc-outbox)
- [Tutorial 48 — MySQL RLS + multi-tenant (rls + connection-pool axes)](./48-mysql-rls-tenant)
- [Concept — Db advanced testing SSOT (8 axis + provider × backend fidelity table)](../concepts/db-advanced-testing)
- [Migration guide — v1.25 → v1.26](../migrations/v1.25-to-v1.26)
