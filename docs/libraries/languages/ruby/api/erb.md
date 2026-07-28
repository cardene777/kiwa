---
title: "@kiwa-lab/ruby erb の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/ruby</code> <code v-pre>erb</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/ruby/src/erb.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>renderERB</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ruby/src/erb.ts#L13) <code v-pre>packages/ruby/src/erb.ts</code>

ERB `&lt;%= name %&gt;` interpolation の minimal mock。 実 ERB engine の control flow (`&lt;% if %&gt;` 等) は未対応、 pure variable substitution のみ。

```ts
export declare function renderERB(template: string, locals: ERBLocals): ERBRenderResult;
```

### 型

#### <code v-pre>ERBLocals</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ruby/src/erb.ts#L1) <code v-pre>packages/ruby/src/erb.ts</code>

```ts
export type ERBLocals = Record<string, string | number | boolean>;
```

#### <code v-pre>ERBRenderResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ruby/src/erb.ts#L3) <code v-pre>packages/ruby/src/erb.ts</code>

```ts
export interface ERBRenderResult {
    html: string;
    variables: string[];
    missing: string[];
}
```
