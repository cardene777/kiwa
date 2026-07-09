# kiwa v1.36 x-thread (日本語)

## Tweet 1 — hook

kiwa v1.36 リリース — Search 深化 II が land.

@kiwa-lab/search v0.2 → v0.3 minor bump. 4 provider (Meilisearch + Typesense + Algolia + OpenSearch) 上に advanced search semantics 8 axis を追加.

real driver env-gate (KIWA_MODE=real + MEILI_URL / TYPESENSE_URL / ALGOLIA_APP_ID + ALGOLIA_API_KEY / OPENSEARCH_URL) で opt-in production fidelity 走査. dogfood 3 app v2 / 新規 (search-vector-app v2 + search-faceted-geo-app v2 + search-opensearch-app 新規) 全 7 軸 release gate PASS.

## Tweet 2 — 8 axis advanced search semantics

Vector search / Semantic search / Faceted advanced / Geo search / Relevance tuning / Synonym-stemming advanced / Index management advanced / Query DSL-aggregation advanced.

## Tweet 3 — 縦深化 pair pattern 8 pair grid + 3-stage 拡張

Search v1.14 → v1.15 → v1.36 は Payment + Observability に続く 3-stage 拡張 pattern 3 例目.

## Tweet 4 — snippet streak + npm publish

14 milestone 連続 snippet validation streak (v1.23-v1.36) 達成.

`pnpm add -D @kiwa-lab/search` で v0.3.0 が入る. breaking change なし. migration guide は https://cardene777.github.io/kiwa/migrations/v1.35-to-v1.36
