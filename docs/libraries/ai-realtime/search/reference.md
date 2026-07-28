# Search リファレンス

`@kiwa-lab/search` は検索アダプターをインメモリで提供します。

## 公開 API

`createMeilisearchMock`、`createAlgoliaMock`、`createTypesenseMock` は provider 名を設定した adapter を返します。provider の違いを意識せず index を操作したい場合は `SearchEngine` を作ります。いずれも `SearchAdapter` の `addDocuments`、`updateDocuments`、`deleteDocuments`、`search`、`clearIndex` を実装します。

## 設定

各 factory が返すアダプターに対して `addDocuments`、`updateDocuments`、`deleteDocuments`、`search`、`clearIndex` を呼びます。

`addDocuments` の inserted は新規 ID だけを数え、同じ ID は置換します。search の既定 limit は20、offset は0です。`processingTimeMs` は in-memory 処理時間で、backend latency の測定ではありません。

real driver helper は endpoint と API key の設定を作るだけで検索要求を送信しません。backend ごとの URL は `KIWA_MEILI_URL`、`KIWA_TYPESENSE_URL`、`KIWA_ALGOLIA_URL`、`KIWA_OPENSEARCH_URL` で上書きでき、key は対応する環境変数から読みます。

## 後始末

テスト間で文書を分離するには、factory をテストごとに作り直すか `clearIndex` を呼びます。

<!-- kiwa-public-api:start -->
## エラー診断

次の一覧は、公開 entry point から到達する実装が明示的に送出する Error と TypeError です。template literal の値は実行時の入力で置き換わります。

| 送出する message | 発生箇所 |
| --- | --- |
| <code v-pre>startFacetedSession: indexId must not be empty</code> | [packages/search/src/semantics/faceted-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/search/src/semantics/faceted-advanced.ts#L34) |
| <code v-pre>computeNestedFacets: no documents seeded</code> | [packages/search/src/semantics/faceted-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/search/src/semantics/faceted-advanced.ts#L59) |
| <code v-pre>filterPolygon: polygon must have at least 3 vertices</code> | [packages/search/src/semantics/geo.ts](https://github.com/cardene777/kiwa/blob/main/packages/search/src/semantics/geo.ts#L114) |
| <code v-pre>resolveIsochrone: travelTimeMinutes must be positive</code> | [packages/search/src/semantics/geo.ts](https://github.com/cardene777/kiwa/blob/main/packages/search/src/semantics/geo.ts#L135) |
| <code v-pre>startGeoSession: indexId must not be empty</code> | [packages/search/src/semantics/geo.ts](https://github.com/cardene777/kiwa/blob/main/packages/search/src/semantics/geo.ts#L41) |
| <code v-pre>seedGeoDocuments: invalid lat/lng for $&#123;d.id&#125;</code> | [packages/search/src/semantics/geo.ts](https://github.com/cardene777/kiwa/blob/main/packages/search/src/semantics/geo.ts#L55) |
| <code v-pre>filterBoundingBox: sw must be south-west of ne</code> | [packages/search/src/semantics/geo.ts](https://github.com/cardene777/kiwa/blob/main/packages/search/src/semantics/geo.ts#L66) |
| <code v-pre>filterRadius: invalid center lat/lng</code> | [packages/search/src/semantics/geo.ts](https://github.com/cardene777/kiwa/blob/main/packages/search/src/semantics/geo.ts#L89) |
| <code v-pre>filterRadius: radiusMeters must be positive</code> | [packages/search/src/semantics/geo.ts](https://github.com/cardene777/kiwa/blob/main/packages/search/src/semantics/geo.ts#L92) |
| <code v-pre>promoteReplica: primary shard $&#123;input.shardId&#125; on $&#123;input.failedNode&#125; not found</code> | [packages/search/src/semantics/index-management.ts](https://github.com/cardene777/kiwa/blob/main/packages/search/src/semantics/index-management.ts#L102) |
| <code v-pre>promoteReplica: no replica available for shard $&#123;input.shardId&#125;</code> | [packages/search/src/semantics/index-management.ts](https://github.com/cardene777/kiwa/blob/main/packages/search/src/semantics/index-management.ts#L108) |
| <code v-pre>advanceRollingReindex: batchPercent must be within (0, 100&#93;</code> | [packages/search/src/semantics/index-management.ts](https://github.com/cardene777/kiwa/blob/main/packages/search/src/semantics/index-management.ts#L127) |
| <code v-pre>advanceRollingReindex: reindex already swapped</code> | [packages/search/src/semantics/index-management.ts](https://github.com/cardene777/kiwa/blob/main/packages/search/src/semantics/index-management.ts#L130) |
| <code v-pre>swapZeroDowntime: session is $&#123;session.state&#125;, expected reindex-completed</code> | [packages/search/src/semantics/index-management.ts](https://github.com/cardene777/kiwa/blob/main/packages/search/src/semantics/index-management.ts#L147) |
| <code v-pre>swapZeroDowntime: newIndexId must not be empty</code> | [packages/search/src/semantics/index-management.ts](https://github.com/cardene777/kiwa/blob/main/packages/search/src/semantics/index-management.ts#L150) |
| <code v-pre>startIndexMgmtSession: indexId must not be empty</code> | [packages/search/src/semantics/index-management.ts](https://github.com/cardene777/kiwa/blob/main/packages/search/src/semantics/index-management.ts#L38) |
| <code v-pre>startIndexMgmtSession: shardCount must be positive</code> | [packages/search/src/semantics/index-management.ts](https://github.com/cardene777/kiwa/blob/main/packages/search/src/semantics/index-management.ts#L41) |
| <code v-pre>startIndexMgmtSession: replicaCount must be non-negative</code> | [packages/search/src/semantics/index-management.ts](https://github.com/cardene777/kiwa/blob/main/packages/search/src/semantics/index-management.ts#L44) |
| <code v-pre>startIndexMgmtSession: nodes must not be empty</code> | [packages/search/src/semantics/index-management.ts](https://github.com/cardene777/kiwa/blob/main/packages/search/src/semantics/index-management.ts#L47) |
| <code v-pre>allocateShards: session is $&#123;session.state&#125;, not idle</code> | [packages/search/src/semantics/index-management.ts](https://github.com/cardene777/kiwa/blob/main/packages/search/src/semantics/index-management.ts#L65) |
| <code v-pre>allocateShards: need at least $&#123;requiredNodes&#125; nodes for $&#123;session.replicaCount&#125; replicas</code> | [packages/search/src/semantics/index-management.ts](https://github.com/cardene777/kiwa/blob/main/packages/search/src/semantics/index-management.ts#L71) |
| <code v-pre>promoteReplica: session is $&#123;session.state&#125;, expected shard-allocated</code> | [packages/search/src/semantics/index-management.ts](https://github.com/cardene777/kiwa/blob/main/packages/search/src/semantics/index-management.ts#L96) |
| <code v-pre>bucketHistogram: interval must be positive</code> | [packages/search/src/semantics/query-dsl.ts](https://github.com/cardene777/kiwa/blob/main/packages/search/src/semantics/query-dsl.ts#L108) |
| <code v-pre>computePercentile: percentile must be within &#91;0, 100&#93;</code> | [packages/search/src/semantics/query-dsl.ts](https://github.com/cardene777/kiwa/blob/main/packages/search/src/semantics/query-dsl.ts#L134) |
| <code v-pre>computePercentile: no numeric values found for field $&#123;input.field&#125;</code> | [packages/search/src/semantics/query-dsl.ts](https://github.com/cardene777/kiwa/blob/main/packages/search/src/semantics/query-dsl.ts#L142) |
| <code v-pre>startQueryDslSession: indexId must not be empty</code> | [packages/search/src/semantics/query-dsl.ts](https://github.com/cardene777/kiwa/blob/main/packages/search/src/semantics/query-dsl.ts#L48) |
| <code v-pre>scoreTfIdf: query must contain at least one token</code> | [packages/search/src/semantics/relevance.ts](https://github.com/cardene777/kiwa/blob/main/packages/search/src/semantics/relevance.ts#L115) |
| <code v-pre>scoreTfIdf: no documents seeded</code> | [packages/search/src/semantics/relevance.ts](https://github.com/cardene777/kiwa/blob/main/packages/search/src/semantics/relevance.ts#L119) |
| <code v-pre>selectAbVariant: variants must not be empty</code> | [packages/search/src/semantics/relevance.ts](https://github.com/cardene777/kiwa/blob/main/packages/search/src/semantics/relevance.ts#L174) |
| <code v-pre>selectAbVariant: userId must not be empty</code> | [packages/search/src/semantics/relevance.ts](https://github.com/cardene777/kiwa/blob/main/packages/search/src/semantics/relevance.ts#L177) |
| <code v-pre>startRelevanceSession: indexId must not be empty</code> | [packages/search/src/semantics/relevance.ts](https://github.com/cardene777/kiwa/blob/main/packages/search/src/semantics/relevance.ts#L38) |
| <code v-pre>startRelevanceSession: bm25K1 must be positive</code> | [packages/search/src/semantics/relevance.ts](https://github.com/cardene777/kiwa/blob/main/packages/search/src/semantics/relevance.ts#L41) |
| <code v-pre>startRelevanceSession: bm25B must be within 0..1</code> | [packages/search/src/semantics/relevance.ts](https://github.com/cardene777/kiwa/blob/main/packages/search/src/semantics/relevance.ts#L44) |
| <code v-pre>scoreBm25: query must contain at least one token</code> | [packages/search/src/semantics/relevance.ts](https://github.com/cardene777/kiwa/blob/main/packages/search/src/semantics/relevance.ts#L70) |
| <code v-pre>scoreBm25: no documents seeded</code> | [packages/search/src/semantics/relevance.ts](https://github.com/cardene777/kiwa/blob/main/packages/search/src/semantics/relevance.ts#L74) |
| <code v-pre>cacheEmbedding: key must not be empty</code> | [packages/search/src/semantics/semantic.ts](https://github.com/cardene777/kiwa/blob/main/packages/search/src/semantics/semantic.ts#L122) |
| <code v-pre>cacheEmbedding: embedding must not be empty</code> | [packages/search/src/semantics/semantic.ts](https://github.com/cardene777/kiwa/blob/main/packages/search/src/semantics/semantic.ts#L125) |
| <code v-pre>startSemanticSession: sessionId must not be empty</code> | [packages/search/src/semantics/semantic.ts](https://github.com/cardene777/kiwa/blob/main/packages/search/src/semantics/semantic.ts#L42) |
| <code v-pre>understandQuery: rawQuery must not be empty</code> | [packages/search/src/semantics/semantic.ts](https://github.com/cardene777/kiwa/blob/main/packages/search/src/semantics/semantic.ts#L62) |
| <code v-pre>understandQuery: unexpected state $&#123;session.state&#125;</code> | [packages/search/src/semantics/semantic.ts](https://github.com/cardene777/kiwa/blob/main/packages/search/src/semantics/semantic.ts#L65) |
| <code v-pre>classifyIntent: session is $&#123;session.state&#125;, not query-understood</code> | [packages/search/src/semantics/semantic.ts](https://github.com/cardene777/kiwa/blob/main/packages/search/src/semantics/semantic.ts#L78) |
| <code v-pre>crossEncoderRerank: session is $&#123;session.state&#125;, need intent-classified or query-understood</code> | [packages/search/src/semantics/semantic.ts](https://github.com/cardene777/kiwa/blob/main/packages/search/src/semantics/semantic.ts#L93) |
| <code v-pre>crossEncoderRerank: candidates must not be empty</code> | [packages/search/src/semantics/semantic.ts](https://github.com/cardene777/kiwa/blob/main/packages/search/src/semantics/semantic.ts#L96) |
| <code v-pre>startSynonymSession: indexId must not be empty</code> | [packages/search/src/semantics/synonym-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/search/src/semantics/synonym-advanced.ts#L33) |
| <code v-pre>expandMultiLanguage: query must not be empty</code> | [packages/search/src/semantics/synonym-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/search/src/semantics/synonym-advanced.ts#L56) |
| <code v-pre>expandMultiLanguage: languages must not be empty</code> | [packages/search/src/semantics/synonym-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/search/src/semantics/synonym-advanced.ts#L59) |
| <code v-pre>fuseHybrid: session is $&#123;session.state&#125;, not knn-queried</code> | [packages/search/src/semantics/vector.ts](https://github.com/cardene777/kiwa/blob/main/packages/search/src/semantics/vector.ts#L112) |
| <code v-pre>fuseHybrid: weights must be non-negative</code> | [packages/search/src/semantics/vector.ts](https://github.com/cardene777/kiwa/blob/main/packages/search/src/semantics/vector.ts#L115) |
| <code v-pre>recallAnn: session is $&#123;session.state&#125;, expected knn-queried or hybrid-fused</code> | [packages/search/src/semantics/vector.ts](https://github.com/cardene777/kiwa/blob/main/packages/search/src/semantics/vector.ts#L141) |
| <code v-pre>recallAnn: groundTruth must not be empty</code> | [packages/search/src/semantics/vector.ts](https://github.com/cardene777/kiwa/blob/main/packages/search/src/semantics/vector.ts#L144) |
| <code v-pre>startVectorSession: indexId must not be empty</code> | [packages/search/src/semantics/vector.ts](https://github.com/cardene777/kiwa/blob/main/packages/search/src/semantics/vector.ts#L34) |
| <code v-pre>startVectorSession: dimensions must be positive</code> | [packages/search/src/semantics/vector.ts](https://github.com/cardene777/kiwa/blob/main/packages/search/src/semantics/vector.ts#L37) |
| <code v-pre>buildVectorIndex: session is $&#123;session.state&#125;, cannot rebuild</code> | [packages/search/src/semantics/vector.ts](https://github.com/cardene777/kiwa/blob/main/packages/search/src/semantics/vector.ts#L55) |
| <code v-pre>buildVectorIndex: vector dim $&#123;entry.vector.length&#125; != index dim $&#123;session.dimensions&#125;</code> | [packages/search/src/semantics/vector.ts](https://github.com/cardene777/kiwa/blob/main/packages/search/src/semantics/vector.ts#L59) |
| <code v-pre>queryKnn: index must be built first</code> | [packages/search/src/semantics/vector.ts](https://github.com/cardene777/kiwa/blob/main/packages/search/src/semantics/vector.ts#L79) |
| <code v-pre>queryKnn: query dim $&#123;query.length&#125; != index dim $&#123;session.dimensions&#125;</code> | [packages/search/src/semantics/vector.ts](https://github.com/cardene777/kiwa/blob/main/packages/search/src/semantics/vector.ts#L82) |
| <code v-pre>queryKnn: k must be positive</code> | [packages/search/src/semantics/vector.ts](https://github.com/cardene777/kiwa/blob/main/packages/search/src/semantics/vector.ts#L85) |

## API 契約

この section は [公開 entry point](https://github.com/cardene777/kiwa/blob/main/packages/search/src/index.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

### 値

#### <code v-pre>apiKeyEnvVar</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/search/src/real-driver.ts#L49) <code v-pre>packages/search/src/real-driver.ts</code>

```ts
export declare function apiKeyEnvVar(backend: SearchBackend): string;
```

#### <code v-pre>buildRealDriverConfig</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/search/src/real-driver.ts#L77) <code v-pre>packages/search/src/real-driver.ts</code>

```ts
export declare function buildRealDriverConfig(backend: SearchBackend, overrides?: Partial<Omit<RealDriverConfig, 'backend'>>, env?: NodeJS.ProcessEnv): RealDriverConfig;
```

#### <code v-pre>createAlgoliaMock</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/search/src/algolia.ts#L11) <code v-pre>packages/search/src/algolia.ts</code>

Algolia mock. Real Algolia: search-only + admin API keys, per-index settings (searchableAttributes / customRanking). Typo tolerance ON by default (Algolia default). Filter syntax on real Algolia is `field:value`; the mock uses the plain object shape shared across the three providers.

```ts
export declare function createAlgoliaMock(config?: {
    typoTolerance?: boolean;
}): SearchAdapter;
```

#### <code v-pre>createMeilisearchMock</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/search/src/meilisearch.ts#L11) <code v-pre>packages/search/src/meilisearch.ts</code>

Meilisearch mock. Real Meilisearch: HTTP client with settings (rankingRules / stopWords / filterableAttributes). This mock exposes the same 5-op adapter shape so kiwa tests can swap real vs mock. Typo tolerance ON by default (matches Meilisearch's out-of-the-box behaviour with typoTolerance = { enabled: true }).

```ts
export declare function createMeilisearchMock(config?: {
    typoTolerance?: boolean;
}): SearchAdapter;
```

#### <code v-pre>createTypesenseMock</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/search/src/typesense.ts#L10) <code v-pre>packages/search/src/typesense.ts</code>

Typesense mock. Real Typesense: schema-first (typed fields), typo tolerance controllable via `num_typos`. This mock defaults typo tolerance OFF (Typesense's num_typos = 0 is a common production choice for exact-match indices).

```ts
export declare function createTypesenseMock(config?: {
    typoTolerance?: boolean;
}): SearchAdapter;
```

#### <code v-pre>explicitEnvKey</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/search/src/real-driver.ts#L36) <code v-pre>packages/search/src/real-driver.ts</code>

```ts
export declare function explicitEnvKey(backend: SearchBackend): string;
```

#### <code v-pre>isKiwaModeReal</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/search/src/real-driver.ts#L19) <code v-pre>packages/search/src/real-driver.ts</code>

```ts
export declare function isKiwaModeReal(env?: NodeJS.ProcessEnv): boolean;
```

#### <code v-pre>resolveApiKey</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/search/src/real-driver.ts#L62) <code v-pre>packages/search/src/real-driver.ts</code>

```ts
export declare function resolveApiKey(backend: SearchBackend, env?: NodeJS.ProcessEnv): string | null;
```

#### <code v-pre>resolveSearchEndpoint</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/search/src/real-driver.ts#L23) <code v-pre>packages/search/src/real-driver.ts</code>

```ts
export declare function resolveSearchEndpoint(backend: SearchBackend, env?: NodeJS.ProcessEnv): string;
```

#### <code v-pre>SearchEngine</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/search/src/engine.ts#L31) <code v-pre>packages/search/src/engine.ts</code>

```ts
export declare class SearchEngine implements SearchAdapter {
    readonly provider: SearchProvider;
    constructor(config: EngineConfig);
    addDocuments<T extends SearchDocument>(index: string, docs: T[]): Promise<{
        inserted: number;
    }>;
    updateDocuments<T extends SearchDocument>(index: string, docs: T[]): Promise<{
        updated: number;
    }>;
    deleteDocuments(index: string, ids: string[]): Promise<{
        deleted: number;
    }>;
    search<T extends SearchDocument = SearchDocument>(index: string, query: SearchQuery): Promise<SearchResult<T>>;
    clearIndex(index: string): Promise<void>;
    getIndexStats(index: string): {
        docCount: number;
    };
}
```

#### <code v-pre>semantics</code>

公開 entry point から解決しています。

```ts
export * as semantics from './semantics/index.js';
```

#### <code v-pre>skipUnlessReal</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/search/src/real-driver.ts#L90) <code v-pre>packages/search/src/real-driver.ts</code>

```ts
export declare function skipUnlessReal(env?: NodeJS.ProcessEnv): {
    skip: boolean;
    reason: string;
};
```

### 型

#### <code v-pre>EngineConfig</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/search/src/engine.ts#L22) <code v-pre>packages/search/src/engine.ts</code>

Shared search engine. In-memory index with deterministic ranking so fixture tests can assert on top-k order. Not intended to compete with a real search server on performance — the goal is provider-shape parity for tests. Ranking = word-overlap score. For each hit, score = (matching tokens across all string fields) / (total tokens in query). Ties broken by insertion order (stable). Typo tolerance is off by default — providers that support it (Meilisearch / Algolia / Typesense) apply a 1-character substitution allowance when {@link EngineConfig.typoTolerance} is set.

```ts
export interface EngineConfig {
    provider: SearchProvider;
    typoTolerance?: boolean;
}
```

#### <code v-pre>RealDriverConfig</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/search/src/real-driver.ts#L70) <code v-pre>packages/search/src/real-driver.ts</code>

```ts
export interface RealDriverConfig {
    backend: SearchBackend;
    endpoint: string;
    apiKey: string | null;
    timeoutMs: number;
}
```

#### <code v-pre>SearchAdapter</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/search/src/types.ts#L31) <code v-pre>packages/search/src/types.ts</code>

```ts
export interface SearchAdapter {
    readonly provider: SearchProvider;
    addDocuments<T extends SearchDocument>(index: string, docs: T[]): Promise<{
        inserted: number;
    }>;
    updateDocuments<T extends SearchDocument>(index: string, docs: T[]): Promise<{
        updated: number;
    }>;
    deleteDocuments(index: string, ids: string[]): Promise<{
        deleted: number;
    }>;
    search<T extends SearchDocument = SearchDocument>(index: string, query: SearchQuery): Promise<SearchResult<T>>;
    clearIndex(index: string): Promise<void>;
    getIndexStats(index: string): {
        docCount: number;
    };
}
```

#### <code v-pre>SearchBackend</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/search/src/real-driver.ts#L10) <code v-pre>packages/search/src/real-driver.ts</code>

Real driver env-gate for search v0.3. Provides KIWA_MODE=real-based helpers for testing against actual search backends (Meilisearch + Typesense + Algolia + OpenSearch OSS). Consumers gate a describe block on `isKiwaModeReal()`, and use `resolveSearchEndpoint()` to fetch backend URLs. When KIWA_MODE != 'real', tests should skip.

```ts
export type SearchBackend = 'meilisearch' | 'typesense' | 'algolia' | 'opensearch-oss';
```

#### <code v-pre>SearchDocument</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/search/src/types.ts#L3) <code v-pre>packages/search/src/types.ts</code>

```ts
export interface SearchDocument {
    id: string;
    [field: string]: unknown;
}
```

#### <code v-pre>SearchHit</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/search/src/types.ts#L8) <code v-pre>packages/search/src/types.ts</code>

```ts
export interface SearchHit<T extends SearchDocument = SearchDocument> {
    document: T;
    score: number;
    matchedFields: string[];
}
```

#### <code v-pre>SearchProvider</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/search/src/types.ts#L1) <code v-pre>packages/search/src/types.ts</code>

```ts
export type SearchProvider = 'meilisearch' | 'algolia' | 'typesense';
```

#### <code v-pre>SearchQuery</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/search/src/types.ts#L14) <code v-pre>packages/search/src/types.ts</code>

```ts
export interface SearchQuery {
    q: string;
    filter?: Record<string, unknown>;
    facets?: string[];
    limit?: number;
    offset?: number;
    sort?: string[];
}
```

#### <code v-pre>SearchResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/search/src/types.ts#L23) <code v-pre>packages/search/src/types.ts</code>

```ts
export interface SearchResult<T extends SearchDocument = SearchDocument> {
    hits: SearchHit<T>[];
    totalHits: number;
    facetDistribution: Record<string, Record<string, number>>;
    processingTimeMs: number;
    query: string;
}
```
<!-- kiwa-public-api:end -->
