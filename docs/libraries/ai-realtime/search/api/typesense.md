---
title: "@kiwa-lab/search typesense の API 契約"
---

# <code v-pre>@kiwa-lab/search</code> <code v-pre>typesense</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/search/src/typesense.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>createTypesenseMock</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/search/src/typesense.ts#L10) <code v-pre>packages/search/src/typesense.ts</code>

Typesense mock. Real Typesense: schema-first (typed fields), typo tolerance controllable via `num_typos`. This mock defaults typo tolerance OFF (Typesense's num_typos = 0 is a common production choice for exact-match indices).

```ts
export declare function createTypesenseMock(config?: {
    typoTolerance?: boolean;
}): SearchAdapter;
```


