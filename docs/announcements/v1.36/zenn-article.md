# kiwa v1.36 released — Search 深化 II (@kiwa-lab/search v0.3.0 + 8 axis advanced search + 縦深化 pair 第 8 pair 連続化 + 3-stage 拡張 pattern 3 例目)

## TL;DR

- **kiwa v1.36 released** — Search 深化 II milestone
- **`@kiwa-lab/search` v0.2.0 → v0.3.0 minor bump** — 8 axis advanced search semantics + real driver env-gate + 4 provider × 8 axis neutral state machine 追加
- **8 axis semantics** = Vector search + Semantic search + Faceted advanced + Geo search + Relevance tuning + Synonym/stemming advanced + Index management advanced + Query DSL/aggregation advanced
- **3 dogfood app v2 / 新規** — search-vector-app v2 + search-faceted-geo-app v2 + search-opensearch-app 新規
- **縦深化 pair pattern 第 8 pair 連続化** — Search pair (v1.14→v1.15→v1.36)
- **14 milestone 連続 snippet validation streak** (v1.23-v1.36)
- v1.11 以降 26 milestone 連続完遂

## v1.36 が解決したい問題 — Search production semantics の testing gap

v1.14 で `@kiwa-lab/search` v0.1 (Meilisearch / Algolia / Typesense の 3 provider を統一 mock として提供する in-memory search envelope) を land、 v1.15 で search v0.2 に拡張した時点で、 kiwa は query / index / search / facet / typo tolerance の base semantics までは cover していた.

v1.36 は vector retrieval、 semantic rerank、 nested and hierarchical facet、 geo polygon / isochrone、 BM25 / TF-IDF / custom ranking、 synonym and stemming、 sharding and rolling reindex、 nested query and aggregation を 8 axis advanced search semantics として追加する深化 milestone.

## v1.36 で追加した 8 axis advanced search semantics

### 1. Vector search

kNN + HNSW + IVF + flat vector index + hybrid fusion + reciprocal rank fusion + weighted fusion + recall@k.

### 2. Semantic search

embedding query understanding + cross encoder rerank + semantic rewrite + query expansion.

### 3. Faceted advanced

nested facet + hierarchical facet + tree traversal facet + facet count stability.

### 4. Geo search

geo bounding box + radius + polygon + isochrone.

### 5. Relevance tuning

BM25 + TF-IDF + custom ranking + relevance A/B.

### 6. Synonym and stemming advanced

multi-language synonym + phonetic synonym + typo tolerance advanced + stemming advanced.

### 7. Index management advanced

sharding + rolling reindex + zero downtime reindex + alias swap guard.

### 8. Query DSL and aggregation advanced

nested query + histogram aggregation + percentile aggregation + aggregation explain.

## 3 dogfood search app v2 / 新規

### `dogfood-search-vector-app` v2

Vector kNN + HNSW + hybrid fusion + reciprocal rank fusion + recall@k walkthrough.

### `dogfood-search-faceted-geo-app` v2

Nested facet + hierarchical facet + bounding box + radius + polygon + isochrone walkthrough.

### `dogfood-search-opensearch-app` 新規

OpenSearch relevance tuning + BM25 + TF-IDF + custom ranking + synonym advanced + rolling reindex walkthrough.

## Try it

```bash
pnpm add -D @kiwa-lab/search
```

Migration guide (additive-only、 breaking change なし):

- [v1.35 → v1.36 migration guide](https://cardene777.github.io/kiwa/migrations/v1.35-to-v1.36)
- [Search real-driver testing SSOT concept doc](https://cardene777.github.io/kiwa/concepts/search-real-driver-testing)
