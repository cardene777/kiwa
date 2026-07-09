# dogfood-search-vector-app v1.36-2

Dogfood application that exercises `@kiwa-lab/search` v0.3 vector +
semantic axes through a provider-neutral 14-op contract satisfied by
both a deterministic mock adapter and a `KIWA_MODE=real`
Meilisearch + Typesense wire-surface real adapter.

## Purpose

Prove v0.3 vector + semantic + hybrid semantics track the real
Meilisearch + Typesense HTTP APIs closely enough that consumers can
trust the mock in unit tests. The fidelity harness diffs mock vs real
traces across 2 backends x 5 hybrid weight configs (vector-heavy 0.8/0.2
/ keyword-heavy 0.2/0.8 / balanced 0.5/0.5 / vector-only / keyword-only)
x 3 query fixture sets (vector-recall / semantic-intent / hybrid-fusion)
and feeds the divergence count into `@kiwa-lab/quality-metrics` 13-axis
release gate.

## Surface — 14 ops

`SearchHybridAdapter` — `SEARCH_HYBRID_HARNESS_OPS`:

1. `startVectorIndex` — start a vector session (target / indexId / dim / algo).
2. `addVectors` — bulk add vectors to the index.
3. `queryKnn` — k-NN search returning KnnHit[].
4. `startSemanticSession` — start a semantic session.
5. `understandQuery` — parse query intent + entities.
6. `classifyIntent` — categorical intent from query.
7. `crossEncoderRerank` — rerank via cross-encoder score.
8. `cacheEmbedding` — cache lookup / store for query embedding.
9. `fuseHybrid` — combine vector + keyword hits with weights.
10. `recallAnn` — recall@k on ground truth.
11. `emitFidelitySignal` — emit a synthesised fidelity marker.
12. `queryMeilisearchHealth` — health check (real: HTTP GET; mock: ok).
13. `queryTypesenseHealth` — health check (real: HTTP GET; mock: ok).
14. `reset` — drop all state.

## Real driver env-gate

The real adapter reads `KIWA_MODE`, `KIWA_MEILI_URL`, `KIWA_TYPESENSE_URL`.
When `KIWA_MODE=real` and both endpoints are wired, the adapter walks the
real path; otherwise every op emits the sentinel `KIWA_SEARCH_ENV_MISSING`.
Tests bypass the check with `forceEnvPresent: true`.

## Testing

```bash
pnpm test
```

The suite runs 5 test files (68 tests):

- `vector-lifecycle.test.ts` — vector index / knn / hybrid / recall.
- `semantic-lifecycle.test.ts` — understand / intent / rerank / cache.
- `hybrid-search-e2e.test.ts` — 2 backends x 5 configs matrix.
- `real-driver-env-gate.test.ts` — KIWA_MODE=real gate coverage.
- `emit-fidelity-report.test.ts` — fidelity report + release gate.
