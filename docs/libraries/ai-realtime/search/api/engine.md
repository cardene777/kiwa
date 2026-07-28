---
title: "@kiwa-lab/search engine の API 契約"
---

# <code v-pre>@kiwa-lab/search</code> <code v-pre>engine</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/search/src/engine.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

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
