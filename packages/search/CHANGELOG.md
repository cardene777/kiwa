# @kiwa-test/search

## 0.3.0

### Minor Changes

- feat: v0.3 advanced 8-axis search semantics (縦深化 pair 第 8 pair 連続化)。 追加 axis = vector (embedding + kNN + HNSW + IVF + hybrid) / semantic (cross-encoder rerank + query understanding + intent classification) / faceted-advanced (nested + hierarchy + distinct + refined) / geo (bbox + radius + polygon + isochrone) / relevance (BM25 + TF-IDF + custom ranking + A/B testing) / synonym-advanced (multi-language + phonetic + stemmer + typo bridge) / index-management (shard + replica + rolling reindex + zero-downtime swap) / query-dsl (boolean tree + nested + histogram + percentile)。
  - 4 provider target (Meilisearch / Typesense / Algolia / OpenSearch OSS) x 8 axis = 32 grid fidelity harness (`semantics.collectFidelityCoverage()`)。
  - Provider-neutral event 名 (`vector.knn_queried` 等) と provider-specific dialect (`meili.vector.knn.query` / `typesense.vector.knn` / `algolia.vector.knn` / `opensearch.knn.query`) を `providerEventName()` で切替、 テストは neutral 名で assert、 実配線は dialect で観測。
  - Real driver env-gate (`isKiwaModeReal()` + `resolveSearchEndpoint()` + `resolveApiKey()` + `skipUnlessReal()`) が KIWA_MODE=real 時に Meilisearch / Typesense / Algolia / OpenSearch backend endpoint + API key を解決。 KIWA_MODE≠real 時は skip=true を返して mock semantics に fallback。
  - namespaced export ... `semantics/*` は `import { semantics } from '@kiwa-test/search'` 経由、 v0.2 の `SearchEngine` / `createMeilisearchMock` / `createAlgoliaMock` / `createTypesenseMock` と非競合。
  - v0.2 の既存 API (SearchEngine + 3 provider mock + ranking + facet + filter + sort + typo tolerance) は無変更。
  - Refs #1074 (v1.36-1、 CAR-810)、 #1073 (v1.36 parent)、 縦深化 pair 第 8 pair 連続化。

## 0.2.0

### Minor Changes

- Initial release. Meilisearch + Algolia + Typesense in-memory search mock with deterministic word-overlap ranking, filter / facet / sort / pagination, and 1-edit-distance typo tolerance (per-provider default = Meili/Algolia ON, Typesense OFF).

### Patch Changes

- Updated dependencies [797e5ea]
  - @kiwa-test/quality-metrics@0.2.0

## 0.1.0 — 2026-07-03

Initial release. Meilisearch + Algolia + Typesense in-memory search mock with deterministic ranking, filter / facet / sort / pagination, and 1-edit-distance typo tolerance.
