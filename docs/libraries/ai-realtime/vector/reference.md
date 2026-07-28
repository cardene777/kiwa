# Vector リファレンス

`@kiwa-lab/vector` はプロバイダー共通のベクトル操作を提供します。実装上、`queryNearest` は非同期ではなく同期関数です。

## 公開 API

`createVectorClient` は provider、namespace、dimension を持つ in-memory client を作ります。`upsertVectors` と `deleteVectors` は record を追加または削除し、`queryNearest` は指定した metric で近傍を返します。`cosineSimilarity`、`euclideanDistance`、`dotProduct` は ranking の計算を単独で検証するときに使う distance primitive です。

## 設定

client 作成時に `provider`、`namespace`、`dimension` を指定します。`queryNearest(client, query, options)` には query vector、`topK`、`metric` を渡します。`dimension` は `upsert` する record の長さを検証します。

`dimension` を省略すると upsert 時の長さは検証しませんが、query 時の metric 関数は query と record の長さが違えば throw します。`failOn` を指定した client は一致する record で provider rejection を throw します。

`upsertWithRetry`、idempotency、hook、batch、circuit breaker の helper は upsert の上位経路です。基礎 client は retry、transaction、real provider request を行いません。

## 後始末

テストデータは `deleteVectors` で削除できます。完全に分離するなら client を作り直します。

<!-- kiwa-public-api:start -->
## エラー診断

次の一覧は、公開 entry point から到達する実装が明示的に送出する Error と TypeError です。template literal の値は実行時の入力で置き換わります。

| 送出する message | 発生箇所 |
| --- | --- |
| <code v-pre>provider rejected id=$&#123;rec.id&#125;</code> | [packages/vector/src/client.ts](https://github.com/cardene777/kiwa/blob/main/packages/vector/src/client.ts#L57) |
| <code v-pre>dimension mismatch: expected $&#123;dimension&#125;, got $&#123;rec.values.length&#125;</code> | [packages/vector/src/client.ts](https://github.com/cardene777/kiwa/blob/main/packages/vector/src/client.ts#L60) |
| <code v-pre>dimension mismatch: $&#123;a.length&#125; vs $&#123;b.length&#125;</code> | [packages/vector/src/distance.ts](https://github.com/cardene777/kiwa/blob/main/packages/vector/src/distance.ts#L16) |
| <code v-pre>dimension mismatch: $&#123;a.length&#125; vs $&#123;b.length&#125;</code> | [packages/vector/src/distance.ts](https://github.com/cardene777/kiwa/blob/main/packages/vector/src/distance.ts#L26) |
| <code v-pre>dimension mismatch: $&#123;a.length&#125; vs $&#123;b.length&#125;</code> | [packages/vector/src/distance.ts](https://github.com/cardene777/kiwa/blob/main/packages/vector/src/distance.ts#L7) |

## API 契約

この section は [公開 entry point](https://github.com/cardene777/kiwa/blob/main/packages/vector/src/index.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

### 値

#### <code v-pre>cosineSimilarity</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/vector/src/distance.ts#L25) <code v-pre>packages/vector/src/distance.ts</code>

```ts
export declare function cosineSimilarity(a: readonly number[], b: readonly number[]): number;
```

#### <code v-pre>createCircuitBreaker</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/vector/src/enhancements.ts#L156) <code v-pre>packages/vector/src/enhancements.ts</code>

```ts
export declare function createCircuitBreaker(client: VectorClient, options?: CircuitBreakerOptions): CircuitBreaker;
```

#### <code v-pre>createHookRegistry</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/vector/src/enhancements.ts#L110) <code v-pre>packages/vector/src/enhancements.ts</code>

```ts
export declare function createHookRegistry(): HookRegistry;
```

#### <code v-pre>createIdempotencyCache</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/vector/src/enhancements.ts#L69) <code v-pre>packages/vector/src/enhancements.ts</code>

```ts
export declare function createIdempotencyCache(): IdempotencyCache;
```

#### <code v-pre>createVectorClient</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/vector/src/client.ts#L42) <code v-pre>packages/vector/src/client.ts</code>

provider 別 mock client。 実 Pinecone / Weaviate / Qdrant / pgvector の SDK を差替えても 同じ signature で呼べる想定 (upsert / query / delete)。 mock 内部は Map で保持。

```ts
export declare function createVectorClient(options?: CreateVectorClientOptions): VectorClient;
```

#### <code v-pre>deleteVectors</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/vector/src/query.ts#L68) <code v-pre>packages/vector/src/query.ts</code>

```ts
export declare function deleteVectors(client: VectorClient, ids: string[]): Promise<DeleteResult>;
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

#### <code v-pre>queryNearest</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/vector/src/query.ts#L36) <code v-pre>packages/vector/src/query.ts</code>

similarity search — provider に応じた metric (cosine default) で topK match を返す。 cosine / dot = 高いほど近い、 euclidean = 小さいほど近い、 の semantics に合わせて sort。

```ts
export declare function queryNearest(client: VectorClient, query: number[], options?: QueryOptions): QueryResult;
```

#### <code v-pre>upsertBatch</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/vector/src/enhancements.ts#L44) <code v-pre>packages/vector/src/enhancements.ts</code>

```ts
export declare function upsertBatch(client: VectorClient, records: VectorRecord[], batchSize?: number): Promise<BatchUpsertResult>;
```

#### <code v-pre>upsertIdempotent</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/vector/src/enhancements.ts#L79) <code v-pre>packages/vector/src/enhancements.ts</code>

```ts
export declare function upsertIdempotent(client: VectorClient, records: VectorRecord[], idempotencyKey: string, cache: IdempotencyCache): Promise<UpsertResult & {
    cached: boolean;
}>;
```

#### <code v-pre>upsertObservable</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/vector/src/enhancements.ts#L124) <code v-pre>packages/vector/src/enhancements.ts</code>

```ts
export declare function upsertObservable(client: VectorClient, records: VectorRecord[], hooks: HookRegistry): Promise<UpsertResult>;
```

#### <code v-pre>upsertVectors</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/vector/src/upsert.ts#L12) <code v-pre>packages/vector/src/upsert.ts</code>

batch upsert helper — 大量 record を chunk に分けて upsert し、 合計結果を返す。 real provider (Pinecone / Weaviate / Qdrant) の batch size 制限 (100 前後) を再現。

```ts
export declare function upsertVectors(client: VectorClient, vectors: VectorRecord[], options?: {
    batchSize?: number;
}): Promise<UpsertVectorsResult>;
```

#### <code v-pre>upsertWithRetry</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/vector/src/enhancements.ts#L13) <code v-pre>packages/vector/src/enhancements.ts</code>

```ts
export declare function upsertWithRetry(client: VectorClient, records: VectorRecord[], options?: RetryOptions): Promise<UpsertResult & {
    attempts: number;
}>;
```

### 型

#### <code v-pre>BatchUpsertResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/vector/src/enhancements.ts#L37) <code v-pre>packages/vector/src/enhancements.ts</code>

```ts
export interface BatchUpsertResult {
    totalRecords: number;
    batchCount: number;
    totalUpserted: number;
    results: UpsertResult[];
}
```

#### <code v-pre>CircuitBreaker</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/vector/src/enhancements.ts#L149) <code v-pre>packages/vector/src/enhancements.ts</code>

```ts
export interface CircuitBreaker {
    state: () => CircuitState;
    upsert: (records: VectorRecord[]) => Promise<UpsertResult & {
        circuitState: CircuitState;
    }>;
    reset: () => void;
    failureCount: () => number;
}
```

#### <code v-pre>CircuitBreakerOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/vector/src/enhancements.ts#L143) <code v-pre>packages/vector/src/enhancements.ts</code>

```ts
export interface CircuitBreakerOptions {
    failureThreshold?: number;
    resetTimeoutMs?: number;
    now?: () => number;
}
```

#### <code v-pre>CircuitState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/vector/src/enhancements.ts#L141) <code v-pre>packages/vector/src/enhancements.ts</code>

```ts
export type CircuitState = 'closed' | 'open' | 'half-open';
```

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

#### <code v-pre>HookCallback</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/vector/src/enhancements.ts#L102) <code v-pre>packages/vector/src/enhancements.ts</code>

```ts
export type HookCallback = (ctx: HookContext) => void;
```

#### <code v-pre>HookContext</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/vector/src/enhancements.ts#L95) <code v-pre>packages/vector/src/enhancements.ts</code>

```ts
export interface HookContext {
    event: UpsertHookEvent;
    records: VectorRecord[];
    result?: UpsertResult;
    error?: string;
}
```

#### <code v-pre>HookRegistry</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/vector/src/enhancements.ts#L104) <code v-pre>packages/vector/src/enhancements.ts</code>

```ts
export interface HookRegistry {
    register: (event: UpsertHookEvent, cb: HookCallback) => () => void;
    emit: (event: UpsertHookEvent, ctx: HookContext) => void;
    count: (event: UpsertHookEvent) => number;
}
```

#### <code v-pre>IdempotencyCache</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/vector/src/enhancements.ts#L62) <code v-pre>packages/vector/src/enhancements.ts</code>

```ts
export interface IdempotencyCache {
    get: (key: string) => UpsertResult | undefined;
    set: (key: string, value: UpsertResult) => void;
    size: () => number;
    clear: () => void;
}
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

#### <code v-pre>RetryOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/vector/src/enhancements.ts#L7) <code v-pre>packages/vector/src/enhancements.ts</code>

```ts
export interface RetryOptions {
    maxAttempts?: number;
    initialDelayMs?: number;
    onRetry?: (attempt: number) => void;
}
```

#### <code v-pre>UpsertHookEvent</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/vector/src/enhancements.ts#L93) <code v-pre>packages/vector/src/enhancements.ts</code>

```ts
export type UpsertHookEvent = 'before-upsert' | 'after-upsert' | 'error';
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

#### <code v-pre>UpsertVectorsResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/vector/src/upsert.ts#L3) <code v-pre>packages/vector/src/upsert.ts</code>

```ts
export interface UpsertVectorsResult extends UpsertResult {
    batchCount: number;
    attempted: number;
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
<!-- kiwa-public-api:end -->
