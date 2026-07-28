---
title: "@kiwa-lab/search meilisearch の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/search</code> <code v-pre>meilisearch</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/search/src/meilisearch.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>createMeilisearchMock</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/search/src/meilisearch.ts#L11) <code v-pre>packages/search/src/meilisearch.ts</code>

Meilisearch mock. Real Meilisearch: HTTP client with settings (rankingRules / stopWords / filterableAttributes). This mock exposes the same 5-op adapter shape so kiwa tests can swap real vs mock. Typo tolerance ON by default (matches Meilisearch's out-of-the-box behaviour with typoTolerance = { enabled: true }).

```ts
export declare function createMeilisearchMock(config?: {
    typoTolerance?: boolean;
}): SearchAdapter;
```


