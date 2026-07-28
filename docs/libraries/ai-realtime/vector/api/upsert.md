---
title: "@kiwa-lab/vector upsert の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/vector</code> <code v-pre>upsert</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/vector/src/upsert.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>upsertVectors</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/vector/src/upsert.ts#L12) <code v-pre>packages/vector/src/upsert.ts</code>

batch upsert helper — 大量 record を chunk に分けて upsert し、 合計結果を返す。 real provider (Pinecone / Weaviate / Qdrant) の batch size 制限 (100 前後) を再現。

```ts
export declare function upsertVectors(client: VectorClient, vectors: VectorRecord[], options?: {
    batchSize?: number;
}): Promise<UpsertVectorsResult>;
```

### 型

#### <code v-pre>UpsertVectorsResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/vector/src/upsert.ts#L3) <code v-pre>packages/vector/src/upsert.ts</code>

```ts
export interface UpsertVectorsResult extends UpsertResult {
    batchCount: number;
    attempted: number;
}
```
