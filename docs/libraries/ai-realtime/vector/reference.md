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
| `provider rejected id=${rec.id}` | [packages/vector/src/client.ts](https://github.com/cardene777/kiwa/blob/main/packages/vector/src/client.ts#L57) |
| `dimension mismatch: expected ${dimension}, got ${rec.values.length}` | [packages/vector/src/client.ts](https://github.com/cardene777/kiwa/blob/main/packages/vector/src/client.ts#L60) |
| `dimension mismatch: ${a.length} vs ${b.length}` | [packages/vector/src/distance.ts](https://github.com/cardene777/kiwa/blob/main/packages/vector/src/distance.ts#L16) |
| `dimension mismatch: ${a.length} vs ${b.length}` | [packages/vector/src/distance.ts](https://github.com/cardene777/kiwa/blob/main/packages/vector/src/distance.ts#L26) |
| `dimension mismatch: ${a.length} vs ${b.length}` | [packages/vector/src/distance.ts](https://github.com/cardene777/kiwa/blob/main/packages/vector/src/distance.ts#L7) |

## API 契約

この section は [公開 entry point](https://github.com/cardene777/kiwa/blob/main/packages/vector/src/index.ts) から同期しています。各項目は公開名、実際の TypeScript 宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

### 値

#### `cosineSimilarity`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/vector/src/distance.ts#L25) `packages/vector/src/distance.ts`

```ts
export function cosineSimilarity(a: readonly number[], b: readonly number[]): number;
```

#### `createCircuitBreaker`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/vector/src/enhancements.ts#L156) `packages/vector/src/enhancements.ts`

```ts
export function createCircuitBreaker(
  client: VectorClient,
  options: CircuitBreakerOptions = {},
): CircuitBreaker;
```

#### `createHookRegistry`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/vector/src/enhancements.ts#L110) `packages/vector/src/enhancements.ts`

```ts
export function createHookRegistry(): HookRegistry;
```

#### `createIdempotencyCache`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/vector/src/enhancements.ts#L69) `packages/vector/src/enhancements.ts`

```ts
export function createIdempotencyCache(): IdempotencyCache;
```

#### `createVectorClient`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/vector/src/client.ts#L42) `packages/vector/src/client.ts`

provider 別 mock client。 実 Pinecone / Weaviate / Qdrant / pgvector の SDK を差替えても 同じ signature で呼べる想定 (upsert / query / delete)。 mock 内部は Map で保持。

```ts
export function createVectorClient(options: CreateVectorClientOptions = {}): VectorClient;
```

#### `deleteVectors`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/vector/src/query.ts#L68) `packages/vector/src/query.ts`

```ts
export async function deleteVectors(client: VectorClient, ids: string[]): Promise<DeleteResult>;
```

#### `dotProduct`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/vector/src/distance.ts#L6) `packages/vector/src/distance.ts`

Vector distance primitives — real Pinecone / Weaviate / Qdrant / pgvector と同じ 距離計算式で similarity score を再現。 caller が metric を切替えても同じ結果を得られる。

```ts
export function dotProduct(a: readonly number[], b: readonly number[]): number;
```

#### `euclideanDistance`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/vector/src/distance.ts#L15) `packages/vector/src/distance.ts`

```ts
export function euclideanDistance(a: readonly number[], b: readonly number[]): number;
```

#### `queryNearest`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/vector/src/query.ts#L36) `packages/vector/src/query.ts`

similarity search — provider に応じた metric (cosine default) で topK match を返す。 cosine / dot = 高いほど近い、 euclidean = 小さいほど近い、 の semantics に合わせて sort。

```ts
export function queryNearest(
  client: VectorClient,
  query: number[],
  options: QueryOptions = {},
): QueryResult;
```

#### `upsertBatch`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/vector/src/enhancements.ts#L44) `packages/vector/src/enhancements.ts`

```ts
export async function upsertBatch(
  client: VectorClient,
  records: VectorRecord[],
  batchSize = 100,
): Promise<BatchUpsertResult>;
```

#### `upsertIdempotent`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/vector/src/enhancements.ts#L79) `packages/vector/src/enhancements.ts`

```ts
export async function upsertIdempotent(
  client: VectorClient,
  records: VectorRecord[],
  idempotencyKey: string,
  cache: IdempotencyCache,
): Promise<UpsertResult & { cached: boolean }>;
```

#### `upsertObservable`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/vector/src/enhancements.ts#L124) `packages/vector/src/enhancements.ts`

```ts
export async function upsertObservable(
  client: VectorClient,
  records: VectorRecord[],
  hooks: HookRegistry,
): Promise<UpsertResult>;
```

#### `upsertVectors`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/vector/src/upsert.ts#L12) `packages/vector/src/upsert.ts`

batch upsert helper — 大量 record を chunk に分けて upsert し、 合計結果を返す。 real provider (Pinecone / Weaviate / Qdrant) の batch size 制限 (100 前後) を再現。

```ts
export async function upsertVectors(
  client: VectorClient,
  vectors: VectorRecord[],
  options: { batchSize?: number } = {},
): Promise<UpsertVectorsResult>;
```

#### `upsertWithRetry`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/vector/src/enhancements.ts#L13) `packages/vector/src/enhancements.ts`

```ts
export async function upsertWithRetry(
  client: VectorClient,
  records: VectorRecord[],
  options: RetryOptions = {},
): Promise<UpsertResult & { attempts: number }>;
```

### 型

#### `BatchUpsertResult`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/vector/src/enhancements.ts#L37) `packages/vector/src/enhancements.ts`

```ts
export interface BatchUpsertResult {
  totalRecords: number;
  batchCount: number;
  totalUpserted: number;
  results: UpsertResult[];
}
```

#### `CircuitBreaker`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/vector/src/enhancements.ts#L149) `packages/vector/src/enhancements.ts`

```ts
export interface CircuitBreaker {
  state: () => CircuitState;
  upsert: (records: VectorRecord[]) => Promise<UpsertResult & { circuitState: CircuitState }>;
  reset: () => void;
  failureCount: () => number;
}
```

#### `CircuitBreakerOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/vector/src/enhancements.ts#L143) `packages/vector/src/enhancements.ts`

```ts
export interface CircuitBreakerOptions {
  failureThreshold?: number;
  resetTimeoutMs?: number;
  now?: () => number;
}
```

#### `CircuitState`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/vector/src/enhancements.ts#L141) `packages/vector/src/enhancements.ts`

```ts
export type CircuitState = 'closed' | 'open' | 'half-open';
```

#### `CreateVectorClientOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/vector/src/client.ts#L17) `packages/vector/src/client.ts`

```ts
export interface CreateVectorClientOptions {
  provider?: VectorProvider;
  namespace?: string;
  dimension?: number;
  failOn?: (record: VectorRecord) => boolean;
}
```

#### `DeleteResult`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/vector/src/query.ts#L26) `packages/vector/src/query.ts`

```ts
export interface DeleteResult {
  deletedCount: number;
  requestedCount: number;
  namespace: string;
}
```

#### `DistanceMetric`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/vector/src/query.ts#L4) `packages/vector/src/query.ts`

```ts
export type DistanceMetric = 'cosine' | 'euclidean' | 'dot';
```

#### `HookCallback`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/vector/src/enhancements.ts#L102) `packages/vector/src/enhancements.ts`

```ts
export type HookCallback = (ctx: HookContext) => void;
```

#### `HookContext`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/vector/src/enhancements.ts#L95) `packages/vector/src/enhancements.ts`

```ts
export interface HookContext {
  event: UpsertHookEvent;
  records: VectorRecord[];
  result?: UpsertResult;
  error?: string;
}
```

#### `HookRegistry`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/vector/src/enhancements.ts#L104) `packages/vector/src/enhancements.ts`

```ts
export interface HookRegistry {
  register: (event: UpsertHookEvent, cb: HookCallback) => () => void;
  emit: (event: UpsertHookEvent, ctx: HookContext) => void;
  count: (event: UpsertHookEvent) => number;
}
```

#### `IdempotencyCache`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/vector/src/enhancements.ts#L62) `packages/vector/src/enhancements.ts`

```ts
export interface IdempotencyCache {
  get: (key: string) => UpsertResult | undefined;
  set: (key: string, value: UpsertResult) => void;
  size: () => number;
  clear: () => void;
}
```

#### `QueryMatch`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/vector/src/query.ts#L13) `packages/vector/src/query.ts`

```ts
export interface QueryMatch {
  id: string;
  score: number;
  metadata?: VectorMetadata;
  values?: number[];
}
```

#### `QueryOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/vector/src/query.ts#L6) `packages/vector/src/query.ts`

```ts
export interface QueryOptions {
  topK?: number;
  metric?: DistanceMetric;
  filter?: (metadata: VectorMetadata | undefined) => boolean;
  includeValues?: boolean;
}
```

#### `QueryResult`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/vector/src/query.ts#L20) `packages/vector/src/query.ts`

```ts
export interface QueryResult {
  matches: QueryMatch[];
  namespace: string;
  metric: DistanceMetric;
}
```

#### `RetryOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/vector/src/enhancements.ts#L7) `packages/vector/src/enhancements.ts`

```ts
export interface RetryOptions {
  maxAttempts?: number;
  initialDelayMs?: number;
  onRetry?: (attempt: number) => void;
}
```

#### `UpsertHookEvent`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/vector/src/enhancements.ts#L93) `packages/vector/src/enhancements.ts`

```ts
export type UpsertHookEvent = 'before-upsert' | 'after-upsert' | 'error';
```

#### `UpsertResult`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/vector/src/client.ts#L11) `packages/vector/src/client.ts`

```ts
export interface UpsertResult {
  upsertedCount: number;
  provider: VectorProvider;
  namespace: string;
}
```

#### `UpsertVectorsResult`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/vector/src/upsert.ts#L3) `packages/vector/src/upsert.ts`

```ts
export interface UpsertVectorsResult extends UpsertResult {
  batchCount: number;
  attempted: number;
}
```

#### `VectorClient`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/vector/src/client.ts#L24) `packages/vector/src/client.ts`

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

#### `VectorMetadata`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/vector/src/client.ts#L3) `packages/vector/src/client.ts`

```ts
export type VectorMetadata = Record<string, string | number | boolean>;
```

#### `VectorProvider`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/vector/src/client.ts#L1) `packages/vector/src/client.ts`

```ts
export type VectorProvider = 'pinecone' | 'weaviate' | 'qdrant' | 'pgvector';
```

#### `VectorRecord`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/vector/src/client.ts#L5) `packages/vector/src/client.ts`

```ts
export interface VectorRecord {
  id: string;
  values: number[];
  metadata?: VectorMetadata;
}
```
<!-- kiwa-public-api:end -->
