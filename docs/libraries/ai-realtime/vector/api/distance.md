---
title: "@kiwa-lab/vector distance の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/vector</code> <code v-pre>distance</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/vector/src/distance.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>cosineSimilarity</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/vector/src/distance.ts#L25) <code v-pre>packages/vector/src/distance.ts</code>

```ts
export declare function cosineSimilarity(a: readonly number[], b: readonly number[]): number;
```

#### <code v-pre>dotProduct</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/vector/src/distance.ts#L6) <code v-pre>packages/vector/src/distance.ts</code>

Vector distance primitives — real Pinecone / Weaviate / Qdrant / pgvector と同じ 距離計算式で similarity score を再現。 caller が metric を切替えても同じ結果を得られる。

```ts
export declare function dotProduct(a: readonly number[], b: readonly number[]): number;
```

#### <code v-pre>euclideanDistance</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/vector/src/distance.ts#L15) <code v-pre>packages/vector/src/distance.ts</code>

```ts
export declare function euclideanDistance(a: readonly number[], b: readonly number[]): number;
```


