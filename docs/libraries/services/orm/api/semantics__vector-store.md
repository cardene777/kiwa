---
title: "@kiwa-lab/orm semantics__vector-store の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/orm</code> <code v-pre>semantics&#95;&#95;vector-store</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/vector-store.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>buildIndex</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/vector-store.ts#L78) <code v-pre>packages/orm/src/semantics/vector-store.ts</code>

Build an ANN index. IVFFlat requires `lists`; HNSW requires `m` + `efConstruction`. Emits `vector.indexed`.

```ts
export declare function buildIndex(session: VectorStoreSession, input: VectorIndex): AxisStep<VectorState>;
```

#### <code v-pre>computeDistance</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/vector-store.ts#L198) <code v-pre>packages/orm/src/semantics/vector-store.ts</code>

Compute the raw distance between two vectors using the session's distance kind. Deterministic, side-effect free. Emits `vector.distance-computed` for telemetry and returns the distance in metadata.

```ts
export declare function computeDistance(session: VectorStoreSession, input: {
    a: number[];
    b: number[];
}): AxisStep<VectorState>;
```

#### <code v-pre>createVectorStoreSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/vector-store.ts#L56) <code v-pre>packages/orm/src/semantics/vector-store.ts</code>

Create a vector store session. State starts at 'unindexed' with no index. Caller picks the distance kind (cosine / L2 / inner product).

```ts
export declare function createVectorStoreSession(input: {
    storeId: string;
    provider: OrmProvider;
    backend: OrmBackend;
    distanceKind: VectorDistanceKind;
}): VectorStoreSession;
```

#### <code v-pre>hybridSearch</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/vector-store.ts#L155) <code v-pre>packages/orm/src/semantics/vector-store.ts</code>

Run a hybrid search — combine vector similarity + a keyword / full-text score with a weight in [0, 1]. Requires an index. Emits `vector.hybrid-searched`.

```ts
export declare function hybridSearch(session: VectorStoreSession, input: {
    query: number[];
    k: number;
    keyword: string;
    vectorWeight: number;
}): AxisStep<VectorState>;
```

#### <code v-pre>knnSearch</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/vector-store.ts#L118) <code v-pre>packages/orm/src/semantics/vector-store.ts</code>

Run a k-NN search over the built index. Requires an index and a query whose dimension matches the index. Emits `vector.knn-searched` and bumps `searchCount`.

```ts
export declare function knnSearch(session: VectorStoreSession, input: {
    query: number[];
    k: number;
}): AxisStep<VectorState>;
```

### 型

#### <code v-pre>VectorDistanceKind</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/vector-store.ts#L22) <code v-pre>packages/orm/src/semantics/vector-store.ts</code>

```ts
export type VectorDistanceKind = 'cosine' | 'l2' | 'inner-product';
```

#### <code v-pre>VectorIndex</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/vector-store.ts#L24) <code v-pre>packages/orm/src/semantics/vector-store.ts</code>

```ts
export interface VectorIndex {
    name: string;
    kind: VectorIndexKind;
    dimensions: number;
    lists?: number;
    m?: number;
    efConstruction?: number;
}
```

#### <code v-pre>VectorIndexKind</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/vector-store.ts#L20) <code v-pre>packages/orm/src/semantics/vector-store.ts</code>

```ts
export type VectorIndexKind = 'ivfflat' | 'hnsw';
```

#### <code v-pre>VectorState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/vector-store.ts#L18) <code v-pre>packages/orm/src/semantics/vector-store.ts</code>

Vector store — build an approximate nearest neighbour index (IVFFlat or HNSW), run k-NN queries with cosine / L2 distance, run hybrid searches combining vector + full-text scoring, and record the raw distance computation for telemetry. Postgres has pgvector; MySQL HeatWave has native vector types; SQLite has sqlite-vec / sqlite-vss extensions. The mock exposes the same 4 neutral events for all 3 backends. State transitions: created → 'unindexed' buildIndex → 'indexed' knnSearch → 'searched' hybridSearch → 'searched' computeDistance → (state unchanged, distance is passive)

```ts
export type VectorState = 'unindexed' | 'indexed' | 'searched';
```

#### <code v-pre>VectorStoreSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/vector-store.ts#L33) <code v-pre>packages/orm/src/semantics/vector-store.ts</code>

```ts
export interface VectorStoreSession {
    storeId: string;
    provider: OrmProvider;
    backend: OrmBackend;
    state: VectorState;
    index: VectorIndex | null;
    distanceKind: VectorDistanceKind;
    searchCount: number;
    history: AxisStep<VectorState>[];
}
```
