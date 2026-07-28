---
title: "@kiwa-lab/core parser の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/core</code> <code v-pre>parser</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/core/src/parser.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>parseSpec</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/core/src/parser.ts#L74) <code v-pre>packages/core/src/parser.ts</code>

```ts
export declare function parseSpec(markdown: string, opts?: ParseOptions): SpecDoc;
```

### 型

#### <code v-pre>ParseOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/core/src/parser.ts#L69) <code v-pre>packages/core/src/parser.ts</code>

```ts
export interface ParseOptions {
    module?: string;
    defaultLayer?: TestLayer;
}
```
