---
title: "@kiwa-lab/search types の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/search</code> <code v-pre>types</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/search/src/types.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)



### 型

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
