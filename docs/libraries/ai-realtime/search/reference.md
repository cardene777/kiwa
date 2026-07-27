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
| 'startFacetedSession: indexId must not be empty' | [packages/search/src/semantics/faceted-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/search/src/semantics/faceted-advanced.ts#L34) |
| 'computeNestedFacets: no documents seeded' | [packages/search/src/semantics/faceted-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/search/src/semantics/faceted-advanced.ts#L59) |
| 'filterPolygon: polygon must have at least 3 vertices' | [packages/search/src/semantics/geo.ts](https://github.com/cardene777/kiwa/blob/main/packages/search/src/semantics/geo.ts#L114) |
| 'resolveIsochrone: travelTimeMinutes must be positive' | [packages/search/src/semantics/geo.ts](https://github.com/cardene777/kiwa/blob/main/packages/search/src/semantics/geo.ts#L135) |
| 'startGeoSession: indexId must not be empty' | [packages/search/src/semantics/geo.ts](https://github.com/cardene777/kiwa/blob/main/packages/search/src/semantics/geo.ts#L41) |
| `seedGeoDocuments: invalid lat/lng for ${d.id}` | [packages/search/src/semantics/geo.ts](https://github.com/cardene777/kiwa/blob/main/packages/search/src/semantics/geo.ts#L55) |
| 'filterBoundingBox: sw must be south-west of ne' | [packages/search/src/semantics/geo.ts](https://github.com/cardene777/kiwa/blob/main/packages/search/src/semantics/geo.ts#L66) |
| 'filterRadius: invalid center lat/lng' | [packages/search/src/semantics/geo.ts](https://github.com/cardene777/kiwa/blob/main/packages/search/src/semantics/geo.ts#L89) |
| 'filterRadius: radiusMeters must be positive' | [packages/search/src/semantics/geo.ts](https://github.com/cardene777/kiwa/blob/main/packages/search/src/semantics/geo.ts#L92) |
| `promoteReplica: primary shard ${input.shardId} on ${input.failedNode} not found` | [packages/search/src/semantics/index-management.ts](https://github.com/cardene777/kiwa/blob/main/packages/search/src/semantics/index-management.ts#L102) |
| `promoteReplica: no replica available for shard ${input.shardId}` | [packages/search/src/semantics/index-management.ts](https://github.com/cardene777/kiwa/blob/main/packages/search/src/semantics/index-management.ts#L108) |
| 'advanceRollingReindex: batchPercent must be within (0, 100]' | [packages/search/src/semantics/index-management.ts](https://github.com/cardene777/kiwa/blob/main/packages/search/src/semantics/index-management.ts#L127) |
| 'advanceRollingReindex: reindex already swapped' | [packages/search/src/semantics/index-management.ts](https://github.com/cardene777/kiwa/blob/main/packages/search/src/semantics/index-management.ts#L130) |
| `swapZeroDowntime: session is ${session.state}, expected reindex-completed` | [packages/search/src/semantics/index-management.ts](https://github.com/cardene777/kiwa/blob/main/packages/search/src/semantics/index-management.ts#L147) |
| 'swapZeroDowntime: newIndexId must not be empty' | [packages/search/src/semantics/index-management.ts](https://github.com/cardene777/kiwa/blob/main/packages/search/src/semantics/index-management.ts#L150) |
| 'startIndexMgmtSession: indexId must not be empty' | [packages/search/src/semantics/index-management.ts](https://github.com/cardene777/kiwa/blob/main/packages/search/src/semantics/index-management.ts#L38) |
| 'startIndexMgmtSession: shardCount must be positive' | [packages/search/src/semantics/index-management.ts](https://github.com/cardene777/kiwa/blob/main/packages/search/src/semantics/index-management.ts#L41) |
| 'startIndexMgmtSession: replicaCount must be non-negative' | [packages/search/src/semantics/index-management.ts](https://github.com/cardene777/kiwa/blob/main/packages/search/src/semantics/index-management.ts#L44) |
| 'startIndexMgmtSession: nodes must not be empty' | [packages/search/src/semantics/index-management.ts](https://github.com/cardene777/kiwa/blob/main/packages/search/src/semantics/index-management.ts#L47) |
| `allocateShards: session is ${session.state}, not idle` | [packages/search/src/semantics/index-management.ts](https://github.com/cardene777/kiwa/blob/main/packages/search/src/semantics/index-management.ts#L65) |
| `allocateShards: need at least ${requiredNodes} nodes for ${session.replicaCount} replicas` | [packages/search/src/semantics/index-management.ts](https://github.com/cardene777/kiwa/blob/main/packages/search/src/semantics/index-management.ts#L71) |
| `promoteReplica: session is ${session.state}, expected shard-allocated` | [packages/search/src/semantics/index-management.ts](https://github.com/cardene777/kiwa/blob/main/packages/search/src/semantics/index-management.ts#L96) |
| 'bucketHistogram: interval must be positive' | [packages/search/src/semantics/query-dsl.ts](https://github.com/cardene777/kiwa/blob/main/packages/search/src/semantics/query-dsl.ts#L108) |
| 'computePercentile: percentile must be within [0, 100]' | [packages/search/src/semantics/query-dsl.ts](https://github.com/cardene777/kiwa/blob/main/packages/search/src/semantics/query-dsl.ts#L134) |
| `computePercentile: no numeric values found for field ${input.field}` | [packages/search/src/semantics/query-dsl.ts](https://github.com/cardene777/kiwa/blob/main/packages/search/src/semantics/query-dsl.ts#L142) |
| 'startQueryDslSession: indexId must not be empty' | [packages/search/src/semantics/query-dsl.ts](https://github.com/cardene777/kiwa/blob/main/packages/search/src/semantics/query-dsl.ts#L48) |
| 'scoreTfIdf: query must contain at least one token' | [packages/search/src/semantics/relevance.ts](https://github.com/cardene777/kiwa/blob/main/packages/search/src/semantics/relevance.ts#L115) |
| 'scoreTfIdf: no documents seeded' | [packages/search/src/semantics/relevance.ts](https://github.com/cardene777/kiwa/blob/main/packages/search/src/semantics/relevance.ts#L119) |
| 'selectAbVariant: variants must not be empty' | [packages/search/src/semantics/relevance.ts](https://github.com/cardene777/kiwa/blob/main/packages/search/src/semantics/relevance.ts#L174) |
| 'selectAbVariant: userId must not be empty' | [packages/search/src/semantics/relevance.ts](https://github.com/cardene777/kiwa/blob/main/packages/search/src/semantics/relevance.ts#L177) |
| 'startRelevanceSession: indexId must not be empty' | [packages/search/src/semantics/relevance.ts](https://github.com/cardene777/kiwa/blob/main/packages/search/src/semantics/relevance.ts#L38) |
| 'startRelevanceSession: bm25K1 must be positive' | [packages/search/src/semantics/relevance.ts](https://github.com/cardene777/kiwa/blob/main/packages/search/src/semantics/relevance.ts#L41) |
| 'startRelevanceSession: bm25B must be within 0..1' | [packages/search/src/semantics/relevance.ts](https://github.com/cardene777/kiwa/blob/main/packages/search/src/semantics/relevance.ts#L44) |
| 'scoreBm25: query must contain at least one token' | [packages/search/src/semantics/relevance.ts](https://github.com/cardene777/kiwa/blob/main/packages/search/src/semantics/relevance.ts#L70) |
| 'scoreBm25: no documents seeded' | [packages/search/src/semantics/relevance.ts](https://github.com/cardene777/kiwa/blob/main/packages/search/src/semantics/relevance.ts#L74) |
| 'cacheEmbedding: key must not be empty' | [packages/search/src/semantics/semantic.ts](https://github.com/cardene777/kiwa/blob/main/packages/search/src/semantics/semantic.ts#L122) |
| 'cacheEmbedding: embedding must not be empty' | [packages/search/src/semantics/semantic.ts](https://github.com/cardene777/kiwa/blob/main/packages/search/src/semantics/semantic.ts#L125) |
| 'startSemanticSession: sessionId must not be empty' | [packages/search/src/semantics/semantic.ts](https://github.com/cardene777/kiwa/blob/main/packages/search/src/semantics/semantic.ts#L42) |
| 'understandQuery: rawQuery must not be empty' | [packages/search/src/semantics/semantic.ts](https://github.com/cardene777/kiwa/blob/main/packages/search/src/semantics/semantic.ts#L62) |
| `understandQuery: unexpected state ${session.state}` | [packages/search/src/semantics/semantic.ts](https://github.com/cardene777/kiwa/blob/main/packages/search/src/semantics/semantic.ts#L65) |
| `classifyIntent: session is ${session.state}, not query-understood` | [packages/search/src/semantics/semantic.ts](https://github.com/cardene777/kiwa/blob/main/packages/search/src/semantics/semantic.ts#L78) |
| `crossEncoderRerank: session is ${session.state}, need intent-classified or query-understood` | [packages/search/src/semantics/semantic.ts](https://github.com/cardene777/kiwa/blob/main/packages/search/src/semantics/semantic.ts#L93) |
| 'crossEncoderRerank: candidates must not be empty' | [packages/search/src/semantics/semantic.ts](https://github.com/cardene777/kiwa/blob/main/packages/search/src/semantics/semantic.ts#L96) |
| 'startSynonymSession: indexId must not be empty' | [packages/search/src/semantics/synonym-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/search/src/semantics/synonym-advanced.ts#L33) |
| 'expandMultiLanguage: query must not be empty' | [packages/search/src/semantics/synonym-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/search/src/semantics/synonym-advanced.ts#L56) |
| 'expandMultiLanguage: languages must not be empty' | [packages/search/src/semantics/synonym-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/search/src/semantics/synonym-advanced.ts#L59) |
| `fuseHybrid: session is ${session.state}, not knn-queried` | [packages/search/src/semantics/vector.ts](https://github.com/cardene777/kiwa/blob/main/packages/search/src/semantics/vector.ts#L112) |
| 'fuseHybrid: weights must be non-negative' | [packages/search/src/semantics/vector.ts](https://github.com/cardene777/kiwa/blob/main/packages/search/src/semantics/vector.ts#L115) |
| `recallAnn: session is ${session.state}, expected knn-queried or hybrid-fused` | [packages/search/src/semantics/vector.ts](https://github.com/cardene777/kiwa/blob/main/packages/search/src/semantics/vector.ts#L141) |
| 'recallAnn: groundTruth must not be empty' | [packages/search/src/semantics/vector.ts](https://github.com/cardene777/kiwa/blob/main/packages/search/src/semantics/vector.ts#L144) |
| 'startVectorSession: indexId must not be empty' | [packages/search/src/semantics/vector.ts](https://github.com/cardene777/kiwa/blob/main/packages/search/src/semantics/vector.ts#L34) |
| 'startVectorSession: dimensions must be positive' | [packages/search/src/semantics/vector.ts](https://github.com/cardene777/kiwa/blob/main/packages/search/src/semantics/vector.ts#L37) |
| `buildVectorIndex: session is ${session.state}, cannot rebuild` | [packages/search/src/semantics/vector.ts](https://github.com/cardene777/kiwa/blob/main/packages/search/src/semantics/vector.ts#L55) |
| `buildVectorIndex: vector dim ${entry.vector.length} != index dim ${session.dimensions}` | [packages/search/src/semantics/vector.ts](https://github.com/cardene777/kiwa/blob/main/packages/search/src/semantics/vector.ts#L59) |
| 'queryKnn: index must be built first' | [packages/search/src/semantics/vector.ts](https://github.com/cardene777/kiwa/blob/main/packages/search/src/semantics/vector.ts#L79) |
| `queryKnn: query dim ${query.length} != index dim ${session.dimensions}` | [packages/search/src/semantics/vector.ts](https://github.com/cardene777/kiwa/blob/main/packages/search/src/semantics/vector.ts#L82) |
| 'queryKnn: k must be positive' | [packages/search/src/semantics/vector.ts](https://github.com/cardene777/kiwa/blob/main/packages/search/src/semantics/vector.ts#L85) |

## API 契約

この section は [公開 entry point](https://github.com/cardene777/kiwa/blob/main/packages/search/src/index.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

### 値

#### `apiKeyEnvVar`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/search/src/real-driver.ts#L49) `packages/search/src/real-driver.ts`

```ts
export declare function apiKeyEnvVar(backend: SearchBackend): string;
```

#### `buildRealDriverConfig`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/search/src/real-driver.ts#L77) `packages/search/src/real-driver.ts`

```ts
export declare function buildRealDriverConfig(backend: SearchBackend, overrides?: Partial<Omit<RealDriverConfig, 'backend'>>, env?: NodeJS.ProcessEnv): RealDriverConfig;
```

#### `createAlgoliaMock`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/search/src/algolia.ts#L11) `packages/search/src/algolia.ts`

Algolia mock. Real Algolia: search-only + admin API keys, per-index settings (searchableAttributes / customRanking). Typo tolerance ON by default (Algolia default). Filter syntax on real Algolia is `field:value`; the mock uses the plain object shape shared across the three providers.

```ts
export declare function createAlgoliaMock(config?: {
    typoTolerance?: boolean;
}): SearchAdapter;
```

#### `createMeilisearchMock`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/search/src/meilisearch.ts#L11) `packages/search/src/meilisearch.ts`

Meilisearch mock. Real Meilisearch: HTTP client with settings (rankingRules / stopWords / filterableAttributes). This mock exposes the same 5-op adapter shape so kiwa tests can swap real vs mock. Typo tolerance ON by default (matches Meilisearch's out-of-the-box behaviour with typoTolerance = { enabled: true }).

```ts
export declare function createMeilisearchMock(config?: {
    typoTolerance?: boolean;
}): SearchAdapter;
```

#### `createTypesenseMock`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/search/src/typesense.ts#L10) `packages/search/src/typesense.ts`

Typesense mock. Real Typesense: schema-first (typed fields), typo tolerance controllable via `num_typos`. This mock defaults typo tolerance OFF (Typesense's num_typos = 0 is a common production choice for exact-match indices).

```ts
export declare function createTypesenseMock(config?: {
    typoTolerance?: boolean;
}): SearchAdapter;
```

#### `explicitEnvKey`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/search/src/real-driver.ts#L36) `packages/search/src/real-driver.ts`

```ts
export declare function explicitEnvKey(backend: SearchBackend): string;
```

#### `isKiwaModeReal`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/search/src/real-driver.ts#L19) `packages/search/src/real-driver.ts`

```ts
export declare function isKiwaModeReal(env?: NodeJS.ProcessEnv): boolean;
```

#### `resolveApiKey`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/search/src/real-driver.ts#L62) `packages/search/src/real-driver.ts`

```ts
export declare function resolveApiKey(backend: SearchBackend, env?: NodeJS.ProcessEnv): string | null;
```

#### `resolveSearchEndpoint`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/search/src/real-driver.ts#L23) `packages/search/src/real-driver.ts`

```ts
export declare function resolveSearchEndpoint(backend: SearchBackend, env?: NodeJS.ProcessEnv): string;
```

#### `SearchEngine`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/search/src/engine.ts#L31) `packages/search/src/engine.ts`

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

#### `semantics`

公開 entry point から解決しています。

`"/Users/cardene/Desktop/projects/kiwa/packages/search/src/semantics/index"` を `semantics` として公開しています。

```ts
export type {
  SearchAdapter,
  SearchDocument,
  SearchHit,
  SearchProvider,
  SearchQuery,
  SearchResult,
} from './types.js';
export { SearchEngine, type EngineConfig } from './engine.js';
export { createMeilisearchMock } from './meilisearch.js';
export { createAlgoliaMock } from './algolia.js';
export { createTypesenseMock } from './typesense.js';

export * as semantics from './semantics/index.js';
export {
  apiKeyEnvVar,
  buildRealDriverConfig,
  explicitEnvKey,
  isKiwaModeReal,
  resolveApiKey,
  resolveSearchEndpoint,
  skipUnlessReal,
  type RealDriverConfig,
  type SearchBackend,
} from './real-driver.js';
```

#### `skipUnlessReal`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/search/src/real-driver.ts#L90) `packages/search/src/real-driver.ts`

```ts
export declare function skipUnlessReal(env?: NodeJS.ProcessEnv): {
    skip: boolean;
    reason: string;
};
```

### 型

#### `EngineConfig`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/search/src/engine.ts#L22) `packages/search/src/engine.ts`

Shared search engine. In-memory index with deterministic ranking so fixture tests can assert on top-k order. Not intended to compete with a real search server on performance — the goal is provider-shape parity for tests. Ranking = word-overlap score. For each hit, score = (matching tokens across all string fields) / (total tokens in query). Ties broken by insertion order (stable). Typo tolerance is off by default — providers that support it (Meilisearch / Algolia / Typesense) apply a 1-character substitution allowance when {@link EngineConfig.typoTolerance} is set.

```ts
export interface EngineConfig {
    provider: SearchProvider;
    typoTolerance?: boolean;
}
```

#### `RealDriverConfig`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/search/src/real-driver.ts#L70) `packages/search/src/real-driver.ts`

```ts
export interface RealDriverConfig {
    backend: SearchBackend;
    endpoint: string;
    apiKey: string | null;
    timeoutMs: number;
}
```

#### `SearchAdapter`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/search/src/types.ts#L31) `packages/search/src/types.ts`

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

#### `SearchBackend`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/search/src/real-driver.ts#L10) `packages/search/src/real-driver.ts`

Real driver env-gate for search v0.3. Provides KIWA_MODE=real-based helpers for testing against actual search backends (Meilisearch + Typesense + Algolia + OpenSearch OSS). Consumers gate a describe block on `isKiwaModeReal()`, and use `resolveSearchEndpoint()` to fetch backend URLs. When KIWA_MODE != 'real', tests should skip.

```ts
export type SearchBackend = 'meilisearch' | 'typesense' | 'algolia' | 'opensearch-oss';
```

#### `SearchDocument`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/search/src/types.ts#L3) `packages/search/src/types.ts`

```ts
export interface SearchDocument {
    id: string;
    [field: string]: unknown;
}
```

#### `SearchHit`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/search/src/types.ts#L8) `packages/search/src/types.ts`

```ts
export interface SearchHit<T extends SearchDocument = SearchDocument> {
    document: T;
    score: number;
    matchedFields: string[];
}
```

#### `SearchProvider`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/search/src/types.ts#L1) `packages/search/src/types.ts`

```ts
export type SearchProvider = 'meilisearch' | 'algolia' | 'typesense';
```

#### `SearchQuery`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/search/src/types.ts#L14) `packages/search/src/types.ts`

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

#### `SearchResult`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/search/src/types.ts#L23) `packages/search/src/types.ts`

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
