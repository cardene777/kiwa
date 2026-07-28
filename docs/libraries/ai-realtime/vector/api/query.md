---
title: "@kiwa-lab/vector query の API 契約"
---

# <code v-pre>@kiwa-lab/vector</code> <code v-pre>query</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/vector/src/query.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>deleteVectors</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/vector/src/query.ts#L68) <code v-pre>packages/vector/src/query.ts</code>

```ts
export declare function deleteVectors(client: VectorClient, ids: string[]): Promise<DeleteResult>;
```

#### <code v-pre>queryNearest</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/vector/src/query.ts#L36) <code v-pre>packages/vector/src/query.ts</code>

similarity search — provider に応じた metric (cosine default) で topK match を返す。 cosine / dot = 高いほど近い、 euclidean = 小さいほど近い、 の semantics に合わせて sort。

```ts
export declare function queryNearest(client: VectorClient, query: number[], options?: QueryOptions): QueryResult;
```

### 型

#### <code v-pre>DeleteResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/vector/src/query.ts#L26) <code v-pre>packages/vector/src/query.ts</code>

```ts
export interface DeleteResult {
    deletedCount: number;
    requestedCount: number;
    namespace: string;
}
```

#### <code v-pre>DistanceMetric</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/vector/src/query.ts#L4) <code v-pre>packages/vector/src/query.ts</code>

```ts
export type DistanceMetric = 'cosine' | 'euclidean' | 'dot';
```

#### <code v-pre>QueryMatch</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/vector/src/query.ts#L13) <code v-pre>packages/vector/src/query.ts</code>

```ts
export interface QueryMatch {
    id: string;
    score: number;
    metadata?: VectorMetadata;
    values?: number[];
}
```

#### <code v-pre>QueryOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/vector/src/query.ts#L6) <code v-pre>packages/vector/src/query.ts</code>

```ts
export interface QueryOptions {
    topK?: number;
    metric?: DistanceMetric;
    filter?: (metadata: VectorMetadata | undefined) => boolean;
    includeValues?: boolean;
}
```

#### <code v-pre>QueryResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/vector/src/query.ts#L20) <code v-pre>packages/vector/src/query.ts</code>

```ts
export interface QueryResult {
    matches: QueryMatch[];
    namespace: string;
    metric: DistanceMetric;
}
```
