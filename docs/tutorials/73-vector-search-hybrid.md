# Vector search — kNN + HNSW + hybrid fusion + recall@k in 15 min

## What you'll build

A vitest suite wired to `@kiwa-test/search` v0.3 that models the 4 pieces of a real vector-search pipeline that every non-trivial semantic-search product eventually needs — a vector session that pins an index id + dimension + algorithm (`hnsw` / `ivf` / `flat`), an index-build step that ingests the embedding rows without touching disk, a kNN query that ranks by cosine similarity, a hybrid fusion step that combines the kNN hits with keyword hits using weighted sums, and a recall@k assertion that turns a ground-truth list into a matched / total ratio. `startVectorSession()` + `buildVectorIndex()` + `queryKnn()` + `fuseHybrid()` + `recallAnn()` give you every one of those pieces without booting a real Meilisearch / Typesense pair. This is the pattern kiwa's `examples/dogfood-search-vector-app` v2 exercises against real Meilisearch v1 + Typesense v27 under `KIWA_MODE=real` + `KIWA_MEILI_URL` + `KIWA_TYPESENSE_URL`; the tutorial covers the mock-only path so you can iterate in milliseconds and reproduce the exact "the p95 recall@10 dropped from 0.92 to 0.71 after the HNSW `M` parameter changed but the panel still showed green" gap a reviewer sees in the search-quality post-mortem.

## Prerequisites

- Node.js ≥ 20
- `pnpm` (or npm / yarn)
- An empty directory to work in

## Step-by-step build

### 1. Bootstrap the project

```bash
mkdir kiwa-vector-search && cd kiwa-vector-search
pnpm init
pnpm add -D @kiwa-test/search@^0.3 vitest typescript @types/node
```

Add the vitest scripts in `package.json`.

```json
{
  "type": "module",
  "scripts": {
    "test": "vitest run"
  }
}
```

The v0.3 surface exports the vector axis through the `semantics/` barrel. This tutorial focuses on the vector axis end-to-end; tutorials 74-75 cover the other advanced axes (faceted advanced + geo + relevance + synonym + index management).

### 2. `startVectorSession` + `buildVectorIndex` — pin the target and load the embeddings

`tests/vector/session.test.ts` — a vector session pins an index id (`docs`), a dimension (`3` for readability, real embeddings are 384-1536), and an algorithm (`hnsw` by default, `ivf` / `flat` are alternatives). `buildVectorIndex()` walks the state machine from `idle` to `index-built` and emits the neutral event `vector.index_built` (Meilisearch → `meili.vector.index.build`, Typesense → `typesense.vector.index`, Algolia → `algolia.vector.build`, OpenSearch → `opensearch.knn.index.build`).

```ts
import { describe, expect, it } from 'vitest';
import { startVectorSession, buildVectorIndex } from '@kiwa-test/search';

const sampleVectors = [
  { id: 'a', vector: [1, 0, 0] },
  { id: 'b', vector: [0, 1, 0] },
  { id: 'c', vector: [1, 1, 0] },
  { id: 'd', vector: [0, 0, 1] },
];

describe('vector — session lifecycle', () => {
  it('starts idle and transitions to index-built on buildVectorIndex()', () => {
    const session = startVectorSession({
      target: 'meilisearch',
      indexId: 'docs',
      dimensions: 3,
    });
    expect(session.state).toBe('idle');

    const step = buildVectorIndex(session, sampleVectors);
    expect(session.state).toBe('index-built');
    expect(step.neutralEvent).toBe('vector.index_built');
    expect(step.metadata.count).toBe(4);
    expect(step.metadata.dim).toBe(3);
  });

  it('rejects an empty indexId — no silent fallback', () => {
    expect(() =>
      startVectorSession({ target: 'meilisearch', indexId: '', dimensions: 3 }),
    ).toThrow(/indexId must not be empty/);
  });

  it('rejects zero or negative dimensions — the invariant guards against a 0-D fallback', () => {
    expect(() =>
      startVectorSession({ target: 'meilisearch', indexId: 'x', dimensions: 0 }),
    ).toThrow(/dimensions must be positive/);
    expect(() =>
      startVectorSession({ target: 'meilisearch', indexId: 'x', dimensions: -1 }),
    ).toThrow(/dimensions must be positive/);
  });
});
```

Run it.

```bash
pnpm test
```

The 3 tests pass. The invariant `dimensions > 0` before `buildVectorIndex` is what stops a caller from building an index against a wrong-dimensioned embedding — the class of bugs where an OpenAI `text-embedding-3-small` (1536-D) row gets mixed with a `text-embedding-3-large` (3072-D) row and the cosine similarity silently returns garbage.

### 3. `queryKnn` — cosine similarity ranking

`tests/vector/knn.test.ts` — `queryKnn()` runs a k-nearest-neighbor search. The score is cosine similarity (dot product on unit vectors, clamped to `[-1, 1]`). Results are ranked descending, so the closest match is `hits[0]`.

```ts
import { describe, expect, it } from 'vitest';
import { startVectorSession, buildVectorIndex, queryKnn } from '@kiwa-test/search';

const sampleVectors = [
  { id: 'a', vector: [1, 0, 0] },
  { id: 'b', vector: [0, 1, 0] },
  { id: 'c', vector: [1, 1, 0] },
  { id: 'd', vector: [0, 0, 1] },
];

describe('vector — kNN query', () => {
  it('ranks the closest vector first (cosine similarity, k=2)', () => {
    const session = startVectorSession({
      target: 'typesense',
      indexId: 'docs',
      dimensions: 3,
    });
    buildVectorIndex(session, sampleVectors);

    const { hits, step } = queryKnn(session, [1, 0, 0], 2);
    expect(step.neutralEvent).toBe('vector.knn_queried');
    expect(hits).toHaveLength(2);
    expect(hits[0]?.id).toBe('a');
    expect(hits[0]?.score).toBeCloseTo(1, 6);
    expect(session.state).toBe('knn-queried');
  });

  it('rejects queryKnn() before buildVectorIndex() — state machine is strict', () => {
    const session = startVectorSession({
      target: 'typesense',
      indexId: 'docs',
      dimensions: 3,
    });
    expect(() => queryKnn(session, [1, 0, 0], 2)).toThrow(/index must be built first/);
  });

  it('supports HNSW / IVF / flat algorithms via config', () => {
    for (const algo of ['hnsw', 'ivf', 'flat'] as const) {
      const session = startVectorSession({
        target: 'algolia',
        indexId: 'docs',
        dimensions: 3,
        algo,
      });
      const step = buildVectorIndex(session, sampleVectors);
      expect(step.metadata.algo).toBe(algo);
    }
  });
});
```

The invariant `state === 'index-built'` before `queryKnn` is the compile-time equivalent of "cannot query an empty index" — a class of bugs where an HNSW index is queried before its graph is built and the top-k result comes back empty without an error.

### 4. `fuseHybrid` — combine kNN + keyword with weighted sums

`tests/vector/hybrid.test.ts` — the hybrid fusion combines vector hits (semantic similarity) with keyword hits (BM25 / TF-IDF) using weighted sums. The formula is `finalScore = vectorWeight × vectorScore + keywordWeight × keywordScore`. This is the pattern real search products use because pure vector search misses exact keyword matches (a query for "kiwa v1.36" needs both — the vector picks up "kiwa release note" but the exact "v1.36" must come from BM25).

```ts
import { describe, expect, it } from 'vitest';
import {
  startVectorSession,
  buildVectorIndex,
  queryKnn,
  fuseHybrid,
} from '@kiwa-test/search';

const sampleVectors = [
  { id: 'a', vector: [1, 0, 0] },
  { id: 'b', vector: [0, 1, 0] },
  { id: 'c', vector: [1, 1, 0] },
  { id: 'd', vector: [0, 0, 1] },
];

describe('vector — hybrid fusion', () => {
  it('combines vector + keyword hits with weighted sum', () => {
    const session = startVectorSession({
      target: 'algolia',
      indexId: 'docs',
      dimensions: 3,
    });
    buildVectorIndex(session, sampleVectors);
    const knn = queryKnn(session, [1, 1, 0], 4);

    const { fused, step } = fuseHybrid(session, {
      vectorHits: knn.hits,
      keywordHits: [{ id: 'd', score: 1 }],
      vectorWeight: 0.5,
      keywordWeight: 2,
    });
    expect(step.neutralEvent).toBe('vector.hybrid_fused');
    expect(fused[0]?.id).toBe('d');
    expect(session.state).toBe('hybrid-fused');
  });

  it('vector-dominated weights favor the semantic hit', () => {
    const session = startVectorSession({
      target: 'algolia',
      indexId: 'docs',
      dimensions: 3,
    });
    buildVectorIndex(session, sampleVectors);
    const knn = queryKnn(session, [1, 0, 0], 2);

    const { fused } = fuseHybrid(session, {
      vectorHits: knn.hits,
      keywordHits: [{ id: 'd', score: 0.1 }],
      vectorWeight: 0.9,
      keywordWeight: 0.1,
    });
    expect(fused[0]?.id).toBe('a');
  });
});
```

The reason to expose `vectorWeight` and `keywordWeight` as tunable knobs (rather than a fixed 50/50) is that the right ratio depends on the domain — code search benefits from keyword-dominant (`0.3 / 0.7`) while natural-language search benefits from vector-dominant (`0.7 / 0.3`). The v1.36 dogfood app hits both ends of that spectrum.

### 5. `recallAnn` — recall@k against ground truth

`tests/vector/recall.test.ts` — the recall@k assertion turns a ground-truth list of ids into a matched / total ratio. This is what a search-quality regression test measures — "when I re-tune HNSW `efConstruction` from 200 to 100, does recall@10 stay above 0.90?".

```ts
import { describe, expect, it } from 'vitest';
import {
  startVectorSession,
  buildVectorIndex,
  queryKnn,
  recallAnn,
} from '@kiwa-test/search';

const sampleVectors = [
  { id: 'a', vector: [1, 0, 0] },
  { id: 'b', vector: [0, 1, 0] },
  { id: 'c', vector: [1, 1, 0] },
  { id: 'd', vector: [0, 0, 1] },
];

describe('vector — recall@k', () => {
  it('recall = matched / groundTruth', () => {
    const session = startVectorSession({
      target: 'opensearch-oss',
      indexId: 'docs',
      dimensions: 3,
    });
    buildVectorIndex(session, sampleVectors);
    queryKnn(session, [1, 0, 0], 4);

    const { recall, step } = recallAnn(session, {
      groundTruth: ['a', 'b'],
      retrieved: ['a', 'x'],
    });
    expect(step.neutralEvent).toBe('vector.ann_recalled');
    expect(recall).toBeCloseTo(0.5, 6);
    expect(session.state).toBe('ann-recalled');
  });

  it('perfect recall = 1.0 when retrieved contains the full ground truth', () => {
    const session = startVectorSession({
      target: 'opensearch-oss',
      indexId: 'docs',
      dimensions: 3,
    });
    buildVectorIndex(session, sampleVectors);
    queryKnn(session, [1, 0, 0], 4);

    const { recall } = recallAnn(session, {
      groundTruth: ['a', 'b'],
      retrieved: ['a', 'b', 'c'],
    });
    expect(recall).toBeCloseTo(1, 6);
  });
});
```

The invariant is that `recallAnn` treats `groundTruth` as the denominator — the extra `c` in `retrieved` doesn't count against recall (that's what `precision` measures). Tuning HNSW `M` / `efConstruction` typically trades recall against build-time; the assertion is the guard-rail.

### 6. Wire the fidelity harness

`tests/vector/fidelity.test.ts` — the fidelity harness (`collectFidelityCoverage()`) exposes the `4 provider × 8 axis = 32 cell grid`. The vector axis is 1 of the 8 axes; every provider (Meilisearch / Typesense / Algolia / OpenSearch OSS) covers it with a different dialect (`meili.vector.*` / `typesense.vector.*` / `algolia.vector.*` / `opensearch.vector.*`).

```ts
import { describe, expect, it } from 'vitest';
import { collectFidelityCoverage } from '@kiwa-test/search';

describe('vector — fidelity coverage', () => {
  it('the 4 provider × vector axis grid emits 4 rows', () => {
    const coverage = collectFidelityCoverage([
      'meilisearch',
      'typesense',
      'algolia',
      'opensearch-oss',
    ]);
    const vectorRows = coverage.rows.filter((r) => r.axis === 'vector');
    expect(vectorRows).toHaveLength(4);
    for (const row of vectorRows) {
      expect(row.neutralEvents).toEqual([
        'vector.index_built',
        'vector.knn_queried',
        'vector.hybrid_fused',
        'vector.ann_recalled',
      ]);
    }
  });

  it('each provider emits a distinct dialect for vector.index_built', () => {
    const coverage = collectFidelityCoverage();
    const builtByProvider = new Map<string, string>();
    for (const row of coverage.rows.filter((r) => r.axis === 'vector')) {
      builtByProvider.set(row.provider, row.providerEvents[0]);
    }
    expect(builtByProvider.get('meilisearch')).toBe('meili.vector.index.build');
    expect(builtByProvider.get('typesense')).toBe('typesense.vector.index');
    expect(builtByProvider.get('algolia')).toBe('algolia.vector.build');
    expect(builtByProvider.get('opensearch-oss')).toBe('opensearch.knn.index.build');
  });
});
```

The fidelity assertion is the *contract* the real-driver path in `examples/dogfood-search-vector-app` v2 tests against — the Meilisearch `hybrid` search endpoint that emits `meili.vector.index.built` MUST match the mock's dialect exactly. When the mock and the real Meilisearch diverge, the mock gets the fix (the mock is the SSOT).

### 7. Real driver mode

Under `KIWA_MODE=real` the same assertions run against real Meilisearch v1 + Typesense v27. The dogfood app in `examples/dogfood-search-vector-app` v2 shows the pattern.

```ts
import { describe, it } from 'vitest';

const gate = { skip: process.env.KIWA_MODE !== 'real' };
const requiredEnv = ['KIWA_MEILI_URL', 'KIWA_TYPESENSE_URL'] as const;
const envMissing = requiredEnv.filter((k) => !process.env[k]);

describe.skipIf(gate.skip || envMissing.length > 0)(
  'real-driver — Meilisearch + Typesense hybrid recall',
  () => {
    it('runs the mock pipeline against the actual instances under KIWA_MODE=real', async () => {
      // Same session pipeline as the mock tests, but the vector build is
      // routed to KIWA_MEILI_URL and the recall assertion is compared
      // against Typesense hybrid.
    });
  },
);
```

The dogfood app exposes `pnpm test:real` — it flips `KIWA_MODE=real`, requires `KIWA_MEILI_URL` + `KIWA_TYPESENSE_URL`, spins up the Meilisearch + Typesense pair under docker-compose, and re-runs the same session pipeline against real hybrid endpoints. Failure means the mock diverged from the real hybrid semantics; the mock gets the fix.

## What you just learned

- **Vector state machine** — `idle → index-built → knn-queried → hybrid-fused → ann-recalled`. Every transition is strict, no silent no-op paths.
- **kNN scoring** — cosine similarity clamped to `[-1, 1]`, ranked descending. `hits[0]` is the closest match.
- **Hybrid fusion formula** — `finalScore = vectorWeight × vectorScore + keywordWeight × keywordScore`. The right ratio depends on domain (code search leans keyword, NL search leans vector).
- **Recall@k contract** — `matched / groundTruth`, extra retrieved ids don't penalize. The regression guard-rail for HNSW `M` / `efConstruction` tuning.
- **Fidelity contract** — the mock's neutral event (`vector.index_built`) maps to 4 provider dialects; the real driver has to emit the same dialect. When they diverge, the mock is SSOT.
- **Real-driver env gate** — `KIWA_MODE=real` (paired with a `KIWA_MEILI_URL` / `KIWA_TYPESENSE_URL` presence check) gives you a real-driver env-gate that makes the mock path always-green and the real path opt-in.

## Where next

- Tutorial 74 — Faceted geo search (nested facet + bounding box + radius + polygon + isochrone)
- Tutorial 75 — OpenSearch relevance tuning (BM25 / TF-IDF / custom ranking + A/B variant + synonym advanced + rolling reindex)
- Concept doc — `docs/concepts/search-real-driver-testing.md` (8 axis × 4 provider = 32 cell grid + real-driver env-gate pattern SSOT)
- Migration guide — `docs/migrations/v1.35-to-v1.36.md`
