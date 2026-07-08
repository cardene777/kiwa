# Search real-driver testing — 8 axis × 4 provider = 32 cell grid + real-driver env-gate (SSOT)

kiwa's v1.13-4 search work covered the **4 base axes** (query mock / index mock / search mock / facet mock) as unified mocks for Meilisearch + Algolia + Typesense — the `docs/concepts/search-testing.md` doc is the SSOT for those 4 axes. v1.36 adds **8 advanced axes on top of that base** — the ones production search stacks hit once their mock-only Meilisearch suite is green but real Algolia sandbox rankings, real Typesense hybrid endpoints, real OpenSearch OSS synonym files, and real rolling reindex operations start showing up in customer-facing "no results found" post-mortems. This concept doc is the SSOT for those 8 axes; the tutorials (73-75) and dogfood app new / v2 (v1.36-2/3/4) are the concrete implementations.

## The 8-axis grid

The 8 advanced axes are cover-oriented — each one names a real-world failure surface every non-trivial production search stack hits within the first quarter.

| Axis | Real-world failure it catches | v0.3 API |
|---|---|---|
| Vector | "The semantic recall@10 dropped from 0.92 to 0.71 after the HNSW `efConstruction` param changed but the panel still showed green because the mock never exercised the ANN recall assertion" (no state machine, no recall guard) | `startVectorSession` / `buildVectorIndex` / `queryKnn` / `fuseHybrid` / `recallAnn` |
| Semantic | "The intent classifier tagged a support-ticket query as a product-catalog query and the cross-encoder rerank amplified the wrong result because the embedding cache leaked a stale intent tag" (no intent enumeration, no rerank stability) | `startSemanticSession` / `classifyIntent` / `understandQuery` / `cacheEmbedding` / `crossEncoderRerank` |
| Faceted advanced | "The restaurant panel showed 42 hits under Italian > Pizza but the real Algolia counted 39 because the sibling Neapolitan was double-counted in the parent aggregation" (no parent-child invariant, no distinct-count guard) | `startFacetedSession` / `seedFacetedDocuments` / `computeNestedFacets` / `countDistinct` / `applyRefinedFilter` / `traverseHierarchy` |
| Geo | "The 'restaurants within 5 km' filter returned Sapporo (900 km away) because the mock's distance was in km but the real Algolia returned meters and the client didn't check units" (no unit invariant, no shape guard) | `startGeoSession` / `seedGeoDocuments` / `filterBoundingBox` / `filterRadius` / `filterPolygon` / `resolveIsochrone` |
| Relevance | "The p95 nDCG@10 dropped from 0.83 to 0.71 after the BM25 `k1` was retuned but nobody caught it until a customer replied 'no results for shirt'" (no BM25 param flow-through, no per-query score assertion) | `startRelevanceSession` / `seedRelevanceDocuments` / `scoreBm25` / `scoreTfIdf` / `applyCustomRanking` / `selectAbVariant` |
| Synonym advanced | "The synonym file registered `shirt → t-shirt` unidirectionally so a search for `t-shirt` missed the base document and the customer's cart abandoned" (no bidirectional expansion, no phonetic / stemmer / typo safety net) | `startSynonymSession` / `registerSynonyms` / `expandMultiLanguage` / `matchPhonetic` / `normalizeStemmer` / `bridgeTypo` |
| Index management | "The rolling reindex flipped the alias 2 seconds before the new index was fully built and 1 % of readers hit `index not found` on that window" (no alias-flip atomicity, no batch-progress invariant) | `startIndexMgmtSession` / `allocateShards` / `promoteReplica` / `advanceRollingReindex` / `swapZeroDowntime` |
| Query DSL | "The nested-query panel bucket boundary changed from 100 / 500 / 1000 to 100 / 500 / 1500 after a config rewrite and the p99 percentile line silently drifted" (no bucket contract, no boolean-tree assertion) | `startQueryDslSession` / `seedQueryDslDocuments` / `evaluateBooleanTree` / `resolveNestedQuery` / `bucketHistogram` / `computePercentile` |

Each axis has 3 shapes — a mock-only path (fast inner loop, ms scale), a real-driver path (`KIWA_MODE=real` + real Meilisearch v1 / Typesense v27 / Algolia sandbox / OpenSearch OSS 2.x, seconds scale), and a fidelity assertion that the two produce the same output. Tutorial 73 covers the vector axis end-to-end (build → knn → hybrid → recall), tutorial 74 covers the faceted-advanced + geo axes (nested facet + distinct + bounding box + radius + polygon + isochrone), tutorial 75 covers the relevance + synonym-advanced + index-management axes (BM25 + TF-IDF + custom ranking + A/B + phonetic + stemmer + typo + rolling reindex + zero-downtime swap).

## The 4-provider × 8-axis = 32 cell grid

Every provider covers every axis. The mock shapes are provider-neutral (the API surface is the same across Meilisearch + Typesense + Algolia + OpenSearch OSS), the emitted event dialects are provider-specific (`meili.vector.index.build` vs `typesense.vector.index` vs `algolia.vector.build` vs `opensearch.knn.index.build`), and the fidelity harness reports the coverage explicitly.

| Provider | Vector | Semantic | Faceted | Geo | Relevance | Synonym | Index mgmt | Query DSL |
|---|---|---|---|---|---|---|---|---|
| Meilisearch | implemented | implemented | implemented | implemented | implemented | implemented | implemented | implemented |
| Typesense | implemented | implemented | implemented | implemented | implemented | implemented | implemented | implemented |
| Algolia | implemented | implemented | implemented | implemented | implemented | implemented | implemented | implemented |
| OpenSearch OSS | implemented | implemented | implemented | implemented | implemented | implemented | implemented | implemented |

The v1.36 search grid is fully covered — every provider implements every axis because the semantics are runtime-agnostic. That is what makes cross-provider reuse (a session that runs under Meilisearch + Typesense + Algolia + OpenSearch OSS without change) even possible.

### Why the search grid is fully covered

Meilisearch + Typesense + Algolia + OpenSearch OSS converged on the same neutral events at the "index a document, run a query, aggregate a facet" primitive — the "search a term across an inverted index with an optional vector embedding" shape is the same across all 4 providers, even though the wire encodings differ (JSON REST vs. gRPC-like binary vs. HTTP + Algolia batch). The `providerEventName(target, neutralEvent)` mapping table is the single point where the 4 dialects diverge; everything upstream stays neutral. The v1.36 fidelity grid at 32/32 = 100 % implemented reflects that convergence at the "search primitive" level.

## The `KIWA_MODE=real` env-gate contract

`skipUnlessReal(env)` returns `{ skip: false, reason: 'KIWA_MODE=real detected' }` when `env.KIWA_MODE === 'real'` and `{ skip: true, reason: 'KIWA_MODE!=real — skip real-driver tests (mock semantics apply)' }` otherwise. A test that respects the contract combines the gate with a required-env presence check — the dogfood apps use this at each `describe.skipIf(gate.skip || envMissing.length > 0)` block.

Per-axis env mapping.

- **Vector + Semantic dogfood** → `KIWA_MEILI_URL` + `KIWA_TYPESENSE_URL` (real Meilisearch v1 + Typesense v27 reachable for hybrid + kNN query)
- **Faceted + Geo dogfood** → `KIWA_ALGOLIA_URL` + `ALGOLIA_KEY` (real Algolia sandbox reachable for nested facet + bounding box + radius + polygon queries)
- **Relevance + Synonym + Index mgmt dogfood** → `KIWA_OPENSEARCH_URL` + `OPENSEARCH_KEY` (real OpenSearch OSS 2.x testcontainer reachable for BM25 + synonym file + alias swap)
- **Query DSL** → provider-agnostic (mock-only in v1.36, no dogfood app)

A test that respects the contract runs the mock path unconditionally and the real-driver path only when both `KIWA_MODE=real` and the required env are present. That means CI stays cheap by default (mock only, ms scale), the nightly job flips `KIWA_MODE=real` + the required `_URL` / `_KEY` envs, and the fidelity harness ties the two together.

Absent env means silently fall back to mock mode — the test still runs, the real-driver assertions get skipped. Absent `KIWA_MODE` means fall back to mock. An invalid `KIWA_MODE` value (anything other than `real`) also falls back to mock so a typo does not break tests.

## The dogfood app new / v2 pattern

The 3 dogfood apps (v1.36-2/3/4) each expose a `pnpm test` command that keeps the mock-only path green sub-second, and are wired for `pnpm test:real` follow-up phases when the required envs are present.

- `examples/dogfood-search-vector-app` v2 — Meilisearch v1 + Typesense v27 stack + real hybrid + kNN + HNSW recall + docker-compose backend + `pnpm test:real` that walks the vector chain (start session → build index → kNN query → hybrid fuse → recall@k) against real Meilisearch + Typesense endpoints. 68 test.
- `examples/dogfood-search-faceted-geo-app` v2 — Algolia sandbox + faceted-advanced + geo bounding-box / radius / polygon / isochrone + `pnpm test:real` that walks the faceted + geo flow (nested facet → distinct count → refine → bounding box → radius) against a real Algolia sandbox. 58 test.
- `examples/dogfood-search-opensearch-app` new — OpenSearch OSS 2.x testcontainer + relevance-tuning + BM25 + synonym advanced + rolling reindex + `pnpm test:real` that walks the relevance + synonym + index-management flow (BM25 → synonym expand → rolling reindex → zero-downtime swap) against a real OpenSearch cluster. 73 test.

The pattern each new / v2 app follows.

1. Keep the mock-only path (`pnpm test`) green — the fast inner loop stays sub-second.
2. Add a `pnpm test:e2e` command that spins the docker-compose stack (Meilisearch + Typesense + Algolia mock + OpenSearch OSS, subset per app) and walks the real query flow.
3. Add a `pnpm test:real` command that requires the axis-specific `_URL` / `_KEY` env(s) and routes through the real provider endpoint.
4. Run the same fidelity-harness assertions against the real driver; failure means "the mock diverged from real provider behavior" — the mock gets the fix.
5. Emit a `quality-report/fidelity-latest.md` + `.json` that the v1.29 3-layer defensive structure (release-invariants + docs-e2e + release-smoke) picks up on merge.

## The `not-implemented` failure mode

If the fidelity harness has a `planned` cell, the corresponding tutorial + dogfood + snippet-validation-test trio does not exist yet. The 32-cell grid at v1.36 has 0 `planned` cells — every intended cell is `implemented`. When a future milestone adds a 9th axis (e.g., `learned-sparse-vector` or `neural-reranker`), it will start as `planned` for all 4 providers, then transition to `implemented` for the ones that cover it as the milestone lands its tutorial + dogfood + snippet test.

## How this ties into the 13-axis release gate

v1.36 does not add a 14th release-gate axis. The 8 advanced search axes gate the search package's own tests (via `pnpm --filter @kiwa/search test`) but do not surface as a per-package `@kiwa/quality-metrics` axis. The reasoning — the fidelity harness is provider-shape-specific, and a package that does not export to Meilisearch / Typesense / Algolia / OpenSearch OSS has nothing to assert on. When a future milestone adds a `search.fidelity` axis that describes "which search providers this package's tests hit," it will slot into the 13-axis release gate as the 14th; v1.36 keeps the axis count at 13.

## SSOT boundaries

- The 4 base search axes (query / index / search / facet) live in `docs/concepts/search-testing.md`. v1.36 does not modify that doc.
- The 8 advanced search axes live in this doc. Tutorials 73-75 and the migration guide (v1.35 → v1.36) link back here for the axis SSOT.
- The 4-provider × 8-axis grid is the harness's data structure. The `collectFidelityCoverage()` implementation in `packages/search/src/semantics/fidelity.ts` is the code SSOT — this doc's grid table is derived from that code.
- The `KIWA_MODE=real` env-gate contract is shared with the v1.22 real-driver testing tutorial (auth adapters + Keycloak), the v1.31 streaming real-driver concept doc, the v1.32 database real-driver concept doc, the v1.33 payment real-driver concept doc, the v1.34 frontend real-driver concept doc, and the v1.35 observability real-driver concept doc. All six use the same `skipUnlessReal(env)` pattern; the search axes just add provider `_URL` + `_KEY` envs (`KIWA_MEILI_URL` / `KIWA_TYPESENSE_URL` / `KIWA_ALGOLIA_URL` / `ALGOLIA_KEY` / `KIWA_OPENSEARCH_URL` / `OPENSEARCH_KEY`) instead of provider-specific `_URL`-only envs.
