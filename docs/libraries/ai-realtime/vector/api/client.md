---
title: "@kiwa-lab/vector client の API 契約"
---

# <code v-pre>@kiwa-lab/vector</code> <code v-pre>client</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/vector/src/client.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>createVectorClient</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/vector/src/client.ts#L42) <code v-pre>packages/vector/src/client.ts</code>

provider 別 mock client。 実 Pinecone / Weaviate / Qdrant / pgvector の SDK を差替えても 同じ signature で呼べる想定 (upsert / query / delete)。 mock 内部は Map で保持。

```ts
export declare function createVectorClient(options?: CreateVectorClientOptions): VectorClient;
```

### 型

#### <code v-pre>CreateVectorClientOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/vector/src/client.ts#L17) <code v-pre>packages/vector/src/client.ts</code>

```ts
export interface CreateVectorClientOptions {
    provider?: VectorProvider;
    namespace?: string;
    dimension?: number;
    failOn?: (record: VectorRecord) => boolean;
}
```

#### <code v-pre>UpsertResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/vector/src/client.ts#L11) <code v-pre>packages/vector/src/client.ts</code>

```ts
export interface UpsertResult {
    upsertedCount: number;
    provider: VectorProvider;
    namespace: string;
}
```

#### <code v-pre>VectorClient</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/vector/src/client.ts#L24) <code v-pre>packages/vector/src/client.ts</code>

```ts
export interface VectorClient {
    provider: VectorProvider;
    namespace: string;
    dimension: number | null;
    upsert: (records: VectorRecord[]) => Promise<UpsertResult>;
    fetch: (id: string) => Promise<VectorRecord | null>;
    list: () => VectorRecord[];
    size: () => number;
    clear: () => void;
    /** internal helper for query.ts / delete */
    _delete: (ids: string[]) => number;
    _failOn?: (record: VectorRecord) => boolean;
}
```

#### <code v-pre>VectorMetadata</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/vector/src/client.ts#L3) <code v-pre>packages/vector/src/client.ts</code>

```ts
export type VectorMetadata = Record<string, string | number | boolean>;
```

#### <code v-pre>VectorProvider</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/vector/src/client.ts#L1) <code v-pre>packages/vector/src/client.ts</code>

```ts
export type VectorProvider = 'pinecone' | 'weaviate' | 'qdrant' | 'pgvector';
```

#### <code v-pre>VectorRecord</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/vector/src/client.ts#L5) <code v-pre>packages/vector/src/client.ts</code>

```ts
export interface VectorRecord {
    id: string;
    values: number[];
    metadata?: VectorMetadata;
}
```
