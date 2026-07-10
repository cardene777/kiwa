# pgvector Vector Search + Hybrid Ranking + Embedding Cache — Quality Report (v1.26-4)

Dogfood: [`examples/dogfood-vector-search-app`](../../../examples/dogfood-vector-search-app/).
Package under exercise: [`@kiwa-lab/orm`](../../../packages/orm/) (v0.9)
vector-store axis.

## Scope

The dogfood exercises the 4 SvelteKit + Kysely + Postgres 16 + pgvector
+ Redis patterns the orm package promises in v0.9:

1. **IVFFlat / HNSW index build with dimension guard** — every write
   through the store captures the first embedding's dimensionality and
   enforces it on every subsequent upsert (`src/document/index.ts`);
   the vector index gate (`src/index-store/index.ts`) wraps
   `@kiwa-lab/orm`'s `createVectorStoreSession` / `buildIndex` and
   transitions the session to `indexed` after mount.
2. **k-NN semantic search with cosine + L2 distance** — the adapter
   drives `knnSearch` through the gate and computes deterministic
   per-document distances so the ranked list is stable across mock and
   real. Distance kind (`cosine` / `l2`) is captured in the observation
   so the fidelity harness can assert on the axis.
3. **Hybrid semantic + BM25 keyword search** — the adapter drives
   `hybridSearch` with a `vectorWeight` in `[0, 1]` and fuses the
   cosine / L2 similarity with a BM25-shaped keyword score
   (`bm25Score` in `src/document/index.ts`); ties break on document id
   ascending so ranking is deterministic.
4. **Embedding cache with on-demand re-index** — a bounded in-memory
   embedding cache (`src/cache/index.ts`) tracks hit + miss counts;
   `driveCacheHitRate` runs a 2-pass `get → set → get` sequence and
   optionally invalidates every key so the fidelity harness observes
   cache-hit recovery after re-index.

All 4 patterns are driven end-to-end through a provider-neutral adapter
(`src/adapters/interface.ts`) with mock (`src/adapters/mock.ts`) and
real (`src/adapters/real.ts`) implementations.

## Release gate — 7 axis verdict (mock trace)

Snapshot from `examples/dogfood-vector-search-app/quality-report/fidelity-latest.md`, which is generated locally by `pnpm -F dogfood-vector-search-app test` and is not tracked in the repository (see #1395).

| axis | value | gate |
|---|---|---|
| coverage — line | 92.00% | PASS |
| coverage — branch | 88.00% | PASS |
| coverage — function | 95.00% | PASS |
| test count — total | 35 (behavior 25 + integration 6 + e2e 4) | PASS |
| fidelity — ratio | 100% mock covered (5/5) | PASS |
| perf — p95 | < 1ms per op | PASS |
| mutation — killRate | 73.33% (22/30) | PASS |
| **release gate verdict** | **PASS** | 7 axes evaluated |

## Real vs mock fidelity

The 5-op adapter surface reports 5 behavioral divergences under the
default `VECTOR_KEY=` unset configuration — every real op returns
`VECTOR_ENV_MISSING` while the mock op succeeds. These are well-defined
divergences: the fidelity harness records them without failing the
release gate because the real adapter is scope-boxed to aliveness in
v1.26-4. A future v1.26-6 publish milestone can extend
`makeConnectedRealAdapter` with an actual `pg` + Kysely + pgvector
migration runner once the harness is proved on mock.

When `VECTOR_KEY` is set (e.g.
`postgres://user:pass@localhost:5432/kiwa`), the adapter runs a DSN
aliveness probe and records `probe.ok=true`, then falls back to
`REAL_ADAPTER_NOT_IMPLEMENTED` for higher-level ops.

## Test map

| suite | file | count |
|---|---|---|
| document + index gate contract | `tests/semantic-search-e2e.spec.ts` | 10 (T-DVS-001..010) |
| hybrid ranking + BM25 fusion | `tests/hybrid-ranking-e2e.spec.ts` | 6 (T-DVH-001..006) |
| cache hit rate + invalidation | `tests/cache-hit-rate-e2e.spec.ts` | 9 (T-DVC-001..009) |
| 5-op mock E2E | `tests/e2e-mock-mode.test.ts` | 7 (T-DVE-M-001..007) |
| fidelity harness | `tests/fidelity-report.test.ts` | 3 (T-DVF-001..003) |
| fidelity emit | `tests/emit-fidelity-report.test.ts` | 1 (T-DVE-EM-001) |
| real env-gated probe | `tests/real-adapter-probe.test.ts` | 5 (T-DVR-ENV-001..005) |
| 3-layer perf | `tests/perf/dogfood-vector-search-app.perf.ts` | 1 |

## Extension roadmap

- v1.26-6 publish milestone — extend `makeConnectedRealAdapter` with a
  real `pg` + Kysely + pgvector migration runner so the fidelity gap
  closes and behavioural divergences drop below 5.
- follow-up — add testcontainers Postgres 16 + pgvector + Redis 7
  harness under a `VECTOR_KEY` env-gate so KIWA_MODE=real can spin up
  a broker in CI without a pre-provisioned instance.
- follow-up — swap the FNV-folded cache key hash for a real
  hash function (e.g. xxhash64) with a size-bounded lookup table so the
  cache is production-ready under adversarial keys.
- follow-up — replace the placeholder BM25 with an actual token-frequency
  + document-frequency scorer so hybrid ranking approximates a
  production tsvector + `ts_rank_cd` fusion.
