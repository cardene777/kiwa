# dogfood-vector-search-app

Dogfood app for v1.26-4 — a SvelteKit + Kysely + Postgres 16 + pgvector
+ Redis embedding-cache app that exercises the 4 patterns
`@kiwa-test/orm` (v0.9) promises for pgvector semantic search:

1. **IVFFlat / HNSW index build with dimension guard** — every write
   through the store captures the first embedding's dimensionality and
   enforces it on every subsequent upsert (mirrors what a pgvector
   `vector(N)` column check does at INSERT time). Building the index
   transitions the vector-store session to `indexed`.
2. **k-NN semantic search with cosine + L2 distance** — the adapter
   runs a top-`k` query through `@kiwa-test/orm`'s `knnSearch` op,
   computes deterministic per-document distances, and returns the
   ranked document ids.
3. **Hybrid semantic + BM25 keyword search** — the adapter fuses the
   cosine / L2 similarity with a BM25-shaped keyword score using a
   caller-supplied `vectorWeight` in `[0, 1]`; ties break on document
   id ascending so the ranking is deterministic across mock and real.
4. **Embedding cache with on-demand re-index** — a bounded in-memory
   embedding cache tracks hit + miss counts per key; the adapter's
   `reindex` op invalidates every key so the next lookup pass repopulates
   the cache (mirrors the `/api/embedding` reindex endpoint).

All 4 patterns are driven end-to-end through a provider-neutral adapter
(`src/adapters/interface.ts`) with mock (`src/adapters/mock.ts`) and
real (`src/adapters/real.ts`) implementations. The real adapter is
`VECTOR_KEY`-gated so `KIWA_MODE=real` can hand off to a testcontainers
Postgres 16 + pgvector + Redis 7 broker without breaking CI mock runs.

## Layout

```
src/
  adapters/
    interface.ts         # VectorSearchAdapter contract (index / knn / hybrid / cache / fidelity)
    mock.ts              # makeMockAdapter — @kiwa-test/orm vector-store + in-memory store + cache
    real.ts              # makeRealAdapter — Postgres 16 pgvector + Redis 7 probe (env-gated by VECTOR_KEY)
  document/
    index.ts             # DocumentStore + BM25 keyword score
  index-store/
    index.ts             # VectorIndexGate (@kiwa-test/orm vector-store wrapper) + ivfFlatIndex / hnswIndex helpers
  cache/
    index.ts             # EmbeddingCache (LRU-ish + hit-rate metrics)
  flows/
    vector-flows.ts      # 5-op flow wrappers driven by both tests + fidelity harness
    fidelity.ts          # Trace diff + @kiwa-test/quality-metrics report assembly
tests/
  semantic-search-e2e.spec.ts   # T-DVS-* — document store + index gate + cosine / L2 correctness
  hybrid-ranking-e2e.spec.ts    # T-DVH-* — semantic + BM25 fusion + tie-breaking
  cache-hit-rate-e2e.spec.ts    # T-DVC-* — cacheKey stability + hit-rate + on-demand re-index
  e2e-mock-mode.test.ts         # T-DVE-M-* — 5-op surface end-to-end + metrics accumulation
  fidelity-report.test.ts       # T-DVF-* — mock ↔ real ↔ shadow-mock divergence collapse
  emit-fidelity-report.test.ts  # T-DVE-EM-001 — emits JSON + markdown quality-report on disk
  real-adapter-probe.test.ts    # T-DVR-ENV-* — VECTOR_KEY env-gate + probe + REAL_ADAPTER_NOT_IMPLEMENTED
  perf/
    dogfood-vector-search-app.perf.ts   # 3-layer perf for the 4 non-fidelity ops
```

## Running

```sh
pnpm test          # vitest (mock always, real skipped when VECTOR_KEY unset)
pnpm test:perf     # perf-harness 3-layer perf
pnpm typecheck     # tsc --noEmit
```

## Fidelity axes

Each of the 5 ops is compared per-`op`; a divergence is any `mockOk !==
realOk` outcome. Under the default `VECTOR_KEY` unset configuration the
real adapter emits `VECTOR_ENV_MISSING` for every op — the fidelity
harness records 5 well-defined divergences without failing the release
gate because the real adapter is scope-boxed to aliveness in v1.26-4.
A future v1.26-6 publish milestone can extend `makeConnectedRealAdapter`
with an actual `pg` + Kysely + pgvector migration runner so the fidelity
gap closes.

## Release gate

`tests/emit-fidelity-report.test.ts` writes
`quality-report/fidelity-latest.{json,md}` — the 7 axis release-gate
verdict feeds `docs/quality-reports/db/vector-search-app.md`.
