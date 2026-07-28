---
title: "@kiwa-lab/graphql parser の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/graphql</code> <code v-pre>parser</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/graphql/src/parser.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>parseGraphQLOperation</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/graphql/src/parser.ts#L21) <code v-pre>packages/graphql/src/parser.ts</code>

最小 GraphQL parser。 operation type (query/mutation/subscription) + name + selection set + 引数を抜き出す。 fragment / directive / inline union は非対応 (mock 用途では十分)。

```ts
export declare function parseGraphQLOperation(source: string): ParsedOperation;
```

### 型

#### <code v-pre>OperationType</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/graphql/src/parser.ts#L1) <code v-pre>packages/graphql/src/parser.ts</code>

```ts
export type OperationType = 'query' | 'mutation' | 'subscription';
```

#### <code v-pre>ParsedOperation</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/graphql/src/parser.ts#L10) <code v-pre>packages/graphql/src/parser.ts</code>

```ts
export interface ParsedOperation {
    type: OperationType;
    name?: string;
    variableDefs: string[];
    selections: SelectionField[];
}
```

#### <code v-pre>SelectionField</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/graphql/src/parser.ts#L3) <code v-pre>packages/graphql/src/parser.ts</code>

```ts
export interface SelectionField {
    name: string;
    alias?: string;
    arguments: Record<string, string | number | boolean | null>;
    selections: SelectionField[];
}
```
