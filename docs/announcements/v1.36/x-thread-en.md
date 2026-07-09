# kiwa v1.36 x-thread (English)

## Tweet 1 — hook

kiwa v1.36 is out — Search 深化 II land.

@kiwa-lab/search v0.2 → v0.3 minor bump. 8 axis advanced search semantics across 4 provider × 8 axis = 32 cell fidelity grid.

Real driver env-gate (KIWA_MODE=real + MEILI_URL / TYPESENSE_URL / ALGOLIA_APP_ID + ALGOLIA_API_KEY / OPENSEARCH_URL). 3 dogfood app v2 / new (search-vector-app v2 + search-faceted-geo-app v2 + search-opensearch-app new) 全 7 軸 release gate PASS.

Vertical deepening pair pattern 第 8 pair 連続化 with 3 examples of the 3-stage 拡張 pattern (Payment + Observability + Search).

## Tweet 2 — 8 axis advanced search semantics

- Vector search — kNN + HNSW + IVF + flat vector index + hybrid fusion + recall@k
- Semantic search — embedding query understanding + cross encoder rerank + semantic rewrite
- Faceted advanced — nested facet + hierarchical facet + tree traversal facet
- Geo search — bounding box + radius + polygon + isochrone
- Relevance tuning — BM25 + TF-IDF + custom ranking + relevance A/B
- Synonym/stemming advanced — multi-language synonym + phonetic synonym + typo tolerance advanced + stemming advanced
- Index management advanced — sharding + rolling reindex + zero downtime reindex
- Query DSL/aggregation advanced — nested query + histogram aggregation + percentile aggregation

## Tweet 3 — vertical deepening pair pattern 8 pair grid + 3-stage 拡張

Auth / Realtime / Streaming / Database / Payment / Frontend / Observability / Search. Search v1.14 → v1.15 → v1.36 is the 3-stage 拡張 pattern 3 例目.

## Tweet 4 — snippet streak + npm publish

14 milestone 連続 snippet validation streak (v1.23-v1.36) 達成.

`pnpm add -D @kiwa-lab/search` で v0.3.0 が入る. zero breaking changes. migration guide は https://cardene777.github.io/kiwa/migrations/v1.35-to-v1.36
