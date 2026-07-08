# kiwa v1.36 released — Search 深化 II (@kiwa/search v0.3.0 + 8 axis advanced search + 3 dogfood app + 縦深化 pair 第 8 pair 連続化 + 14 milestone snippet streak)

v1.36 is out. v1.14 (search v0.1 3 provider mock: Meilisearch / Algolia / Typesense) → v1.15 (search v0.2) → **v1.36 (search v0.3 advanced 8 axis + 4 provider × 8 axis fidelity harness + real driver env-gate)** の **3 段深化拡張 pattern** (Payment + Observability + Search の 3 例目、 縦深化 pair pattern 第 8 pair 連続化). v1.30 quality gate maximum grid (13 axis) を search real driver に適用、 kiwa の縦深化戦略 SSOT を search production layer に拡張した milestone.

## What shipped

- **`@kiwa/search` v0.2.0 → v0.3.0 minor bump**. v0.2 API は完全維持 (additive-only 契約). v1.13+ single publish surface pattern に沿う single-surface bump.
- **v1.36-1 search v0.3 8 axis advanced semantics** (Issue #1075). Vector search / Semantic search / Faceted advanced / Geo search / Relevance tuning / Synonym and stemming advanced / Index management advanced / Query DSL and aggregation advanced の 8 axis を統一実装、 4 provider (Meilisearch / Typesense / Algolia / OpenSearch) × 8 axis = 32 cell fidelity grid を確立.
- **v1.36-2 dogfood-search-vector-app v2** (Issue #1081). Vector kNN + HNSW + hybrid fusion + reciprocal rank fusion + recall@k walkthrough.
- **v1.36-3 dogfood-search-faceted-geo-app v2** (Issue #1082). Nested facet + hierarchical facet + bounding box + radius + polygon + isochrone walkthrough.
- **v1.36-4 dogfood-search-opensearch-app 新規** (Issue #1083). OpenSearch relevance tuning + BM25 + TF-IDF + custom ranking + synonym advanced + rolling reindex walkthrough.
- **v1.36-5 docs 補強** (Issue #1084). `docs/tutorials/73-vector-search-hybrid.md` + `docs/tutorials/74-faceted-geo-search.md` + `docs/tutorials/75-opensearch-relevance-tuning.md` + `docs/migrations/v1.35-to-v1.36.md` + `docs/concepts/search-real-driver-testing.md` + `packages/search/tests/docs-tutorial-v1.36.test.ts` snippet validation で **14 milestone 連続 snippet validation pattern** (v1.23-v1.36) 達成.
- **v1.36-6 publish** (Issue #1080, this PR). `.claude-plugin/plugin.json` 1.35.0 → 1.36.0 + description v1.36 marker + search keywords + Roadmap ✅ v1.36 row + announcement 4 file + release-smoke `v1-36-publish.test.ts` + release script filter に `@kiwa/search` 存在確認 (11 度目の適用).

## Numbers

- **6 sub-Issues resolved** (#1075 / #1081 / #1082 / #1083 / #1084 / #1080)
- **1 npm minor bump** (`@kiwa/search` v0.2.0 → v0.3.0)
- **8 axis advanced search semantics** (Vector + Semantic + Faceted advanced + Geo + Relevance tuning + Synonym/stemming advanced + Index management advanced + Query DSL/aggregation advanced)
- **32 cell fidelity grid** (4 provider × 8 axis = 32 cell)
- **3 dogfood search app** (search-vector-app v2 + search-faceted-geo-app v2 + search-opensearch-app 新規)
- **14 milestone 連続 snippet validation streak** (v1.23-v1.36)

## Why 縦深化 pair pattern 第 8 pair 連続化

Search は v1.14 → v1.15 → v1.36 の **3 段深化拡張 pattern 3 例目**. Auth / Realtime / Streaming / Database / Payment / Frontend / Observability / Search で 8 pair 連続化.

## Try it

```bash
pnpm add -D @kiwa/search
```

See the migration guide at https://cardene777.github.io/kiwa/migrations/v1.35-to-v1.36. Zero breaking changes.
