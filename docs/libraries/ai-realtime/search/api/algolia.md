---
title: "@kiwa-lab/search algolia の API 契約"
---

# <code v-pre>@kiwa-lab/search</code> <code v-pre>algolia</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/search/src/algolia.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>createAlgoliaMock</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/search/src/algolia.ts#L11) <code v-pre>packages/search/src/algolia.ts</code>

Algolia mock. Real Algolia: search-only + admin API keys, per-index settings (searchableAttributes / customRanking). Typo tolerance ON by default (Algolia default). Filter syntax on real Algolia is `field:value`; the mock uses the plain object shape shared across the three providers.

```ts
export declare function createAlgoliaMock(config?: {
    typoTolerance?: boolean;
}): SearchAdapter;
```


