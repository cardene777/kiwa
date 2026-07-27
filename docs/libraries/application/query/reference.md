# @kiwa-lab/query リファレンス

## client と key

`createQueryClient(options)` は `provider`、`defaultStaleMs`、`now` を受け取ります。provider の既定値は `tanstack`、stale 時間の既定値は六十秒です。client は cache、listener、`clear()`、`snapshot()` を持ちます。

`QueryKey` は string または string と number の配列です。string はそのまま、配列は JSON 文字列へ正規化されます。`snapshot()` は現在の `QueryState` の配列を返します。テストでは `now` に自前の clock を渡すと、stale 境界を待機なしで検証できます。`clear()` は cache だけでなく登録済み listener も消すため、複数 case で client を共有する場合は case の終了時だけ呼びます。

## 取得と無効化

`fetchQuery(client, key, queryFn, options)` は cache-first で動きます。`staleMs` はこの呼び出しだけの stale 時間、`force` は cache 状態にかかわらず再取得する指定です。成功時は data、`fromCache`、`fetchCount`、`staleAgeMs` を返し、失敗時は error state を cache に残して例外を投げます。stale でない success state だけが cache hit の対象です。loading、error、存在しない key は、`force` を指定しなくても query function を実行します。

`invalidateQuery(client, key)` は対象 key を消し、登録された listener へ fetch count がゼロの idle state を通知します。結果の `existed` は削除前に cache があったかを示します。

## mutation と subscription

`mutate(client, mutationFn, args, options)` は mutation function の result と、無効化した正規化 key の配列を返します。option の `onSuccess` は成功 result、`onError` は Error を受け取ります。`invalidateKeys` は mutation が成功してから順に処理されます。mutation function が reject したとき、`onError` を呼んだ後に同じ Error を再送出し、指定 key は無効化しません。

`subscribeToQuery(client, key, listener)` は `Subscription` を返します。`key` は正規化後の key、`unsubscribe` は listener を解除します。listener がなくなると client はその key の listener set を削除します。

## 拡張 API

`createInfiniteQuery` は page、next cursor、`fetchNextPage`、`reset` を管理します。生成直後に page はありません。`fetchNextPage()` を呼ぶたびに現在の cursor で一 page を取得し、`nextCursor` がないか `maxPages` に達すると `hasNextPage` は false になります。`reset()` は取得済み page を消し、initial cursor に戻します。

`createOptimisticUpdate` は optimistic value の apply、commit、rollback を提供する独立した state holder です。query client の cache とは自動同期しないため、成功時の invalidation と失敗時の rollback は呼び出し側で組み合わせます。

`prefetchQueries` は string key ごとに fetcher を指定 concurrency で実行し、成功と失敗を集計します。この関数は query client を受け取らず、client cache に値を保存しません。`retryWithBackoff` は既定で三回試し、最後まで失敗しても throw ではなく `ok: false` と最後の error を返します。`withTimeout` は指定時間で Promise を reject しますが、開始済みの処理を cancel はしません。`createObservabilityHook` は任意 event の in-memory 記録だけを提供し、外部 telemetry へ送信しません。

<!-- kiwa-public-api:start -->
## API 契約

この section は [公開 entry point](https://github.com/cardene777/kiwa/blob/main/packages/query/src/index.ts) から同期しています。各項目は公開名、実際の TypeScript 宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

### 値

#### `createInfiniteQuery`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/query/src/extensions.ts#L21) `packages/query/src/extensions.ts`

infinite query — TanStack useInfiniteQuery 相当

```ts
export function createInfiniteQuery<TData, TCursor>(options: InfiniteQueryOptions<TData, TCursor>): InfiniteQueryState<TData, TCursor>;
```

#### `createObservabilityHook`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/query/src/extensions.ts#L134) `packages/query/src/extensions.ts`

```ts
export function createObservabilityHook(): ObservabilityHook;
```

#### `createOptimisticUpdate`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/query/src/extensions.ts#L50) `packages/query/src/extensions.ts`

optimistic update — server response 前に UI を更新、 失敗時 rollback

```ts
export function createOptimisticUpdate<T>(initial: T): OptimisticUpdate<T>;
```

#### `createQueryClient`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/query/src/client.ts#L36) `packages/query/src/client.ts`

provider 差 (tanstack = infinite scroll / swr = revalidateOnFocus / urql = exchange chain / apollo = normalized cache) は abstract、 4 provider 共通の cache + fetchCount 挙動を mock する。

```ts
export function createQueryClient(options: CreateQueryClientOptions = {}): QueryClient;
```

#### `fetchQuery`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/query/src/fetch.ts#L21) `packages/query/src/fetch.ts`

cache-first fetch。 staleMs 内なら cache hit で queryFn を呼ばず、 force=true or stale なら queryFn 実行 + cache 更新。

```ts
export async function fetchQuery<T>(
  client: QueryClient,
  key: QueryKey,
  queryFn: QueryFn<T>,
  options: FetchQueryOptions = {},
): Promise<FetchQueryResult<T>>;
```

#### `invalidateQuery`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/query/src/invalidate.ts#L12) `packages/query/src/invalidate.ts`

cache から key を削除、 listener に invalidation を通知。 TanStack Query の queryClient.invalidateQueries 相当。

```ts
export function invalidateQuery(client: QueryClient, key: QueryKey): InvalidateResult;
```

#### `mutate`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/query/src/mutation.ts#L21) `packages/query/src/mutation.ts`

mutationFn 実行 + 成功時に invalidateKeys を全 invalidate、 失敗時は onError 発火。 TanStack Query の useMutation.mutateAsync 相当。

```ts
export async function mutate<TArgs, TResult>(
  client: QueryClient,
  mutationFn: MutationFn<TArgs, TResult>,
  args: TArgs,
  options: MutateOptions<TResult> = {},
): Promise<MutateResult<TResult>>;
```

#### `prefetchQueries`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/query/src/extensions.ts#L75) `packages/query/src/extensions.ts`

prefetch — 複数 queryKey を並列 fetch して cache に格納

```ts
export async function prefetchQueries(
  keys: string[],
  fetcher: (key: string) => Promise<unknown>,
  options: PrefetchOptions = {},
): Promise<PrefetchResult>;
```

#### `retryWithBackoff`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/query/src/extensions.ts#L102) `packages/query/src/extensions.ts`

```ts
export async function retryWithBackoff<T>(fn: () => Promise<T>, options: RetryOptions = {}): Promise<RetryResult<T>>;
```

#### `subscribeToQuery`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/query/src/subscription.ts#L14) `packages/query/src/subscription.ts`

key に state 変更を subscribe。 fetchQuery / invalidateQuery が触ると listener に通知。 SWR の subscribe / TanStack Query の queryClient.getQueryCache().subscribe 相当。

```ts
export function subscribeToQuery(
  client: QueryClient,
  key: QueryKey,
  listener: QueryListener,
): Subscription;
```

#### `withTimeout`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/query/src/extensions.ts#L120) `packages/query/src/extensions.ts`

```ts
export async function withTimeout<T>(fn: () => Promise<T>, timeoutMs: number): Promise<T>;
```

### 型

#### `CreateQueryClientOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/query/src/client.ts#L16) `packages/query/src/client.ts`

```ts
export interface CreateQueryClientOptions {
  provider?: QueryProvider;
  defaultStaleMs?: number;
  now?: () => number;
}
```

#### `FetchQueryOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/query/src/fetch.ts#L5) `packages/query/src/fetch.ts`

```ts
export interface FetchQueryOptions {
  staleMs?: number;
  force?: boolean;
}
```

#### `FetchQueryResult`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/query/src/fetch.ts#L10) `packages/query/src/fetch.ts`

```ts
export interface FetchQueryResult<T> {
  data: T;
  fromCache: boolean;
  fetchCount: number;
  staleAgeMs: number;
}
```

#### `InfiniteQueryOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/query/src/extensions.ts#L7) `packages/query/src/extensions.ts`

v2.1 extensions — infinite query, optimistic update, prefetch, plus retry/batch/observability/timeout generics. TanStack Query v5.60+ / SWR v2.3 追随。

```ts
export interface InfiniteQueryOptions<TData, TCursor> {
  initialCursor: TCursor;
  fetchPage: (cursor: TCursor) => Promise<{ data: TData[]; nextCursor?: TCursor }>;
  maxPages?: number;
}
```

#### `InfiniteQueryState`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/query/src/extensions.ts#L13) `packages/query/src/extensions.ts`

```ts
export interface InfiniteQueryState<TData, TCursor> {
  pages: Array<{ cursor: TCursor; data: TData[] }>;
  hasNextPage: boolean;
  fetchNextPage: () => Promise<void>;
  reset: () => void;
}
```

#### `InvalidateResult`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/query/src/invalidate.ts#L3) `packages/query/src/invalidate.ts`

```ts
export interface InvalidateResult {
  key: string;
  existed: boolean;
}
```

#### `MutateOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/query/src/mutation.ts#L6) `packages/query/src/mutation.ts`

```ts
export interface MutateOptions<TResult> {
  invalidateKeys?: QueryKey[];
  onSuccess?: (result: TResult) => void;
  onError?: (err: Error) => void;
}
```

#### `MutateResult`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/query/src/mutation.ts#L12) `packages/query/src/mutation.ts`

```ts
export interface MutateResult<TResult> {
  result: TResult;
  invalidated: string[];
}
```

#### `MutationFn`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/query/src/mutation.ts#L4) `packages/query/src/mutation.ts`

```ts
export type MutationFn<TArgs, TResult> = (args: TArgs) => Promise<TResult>;
```

#### `ObservabilityHook`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/query/src/extensions.ts#L128) `packages/query/src/extensions.ts`

```ts
export interface ObservabilityHook {
  emit: (event: { kind: string; data: Record<string, unknown> }) => void;
  events: () => Array<{ kind: string; data: Record<string, unknown> }>;
  clear: () => void;
}
```

#### `OptimisticUpdate`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/query/src/extensions.ts#L41) `packages/query/src/extensions.ts`

```ts
export interface OptimisticUpdate<T> {
  applyOptimistic: (value: T) => void;
  commit: () => void;
  rollback: () => void;
  current: () => T;
  isPending: () => boolean;
}
```

#### `PrefetchOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/query/src/extensions.ts#L62) `packages/query/src/extensions.ts`

```ts
export interface PrefetchOptions {
  concurrency?: number;
  timeoutMs?: number;
}
```

#### `PrefetchResult`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/query/src/extensions.ts#L67) `packages/query/src/extensions.ts`

```ts
export interface PrefetchResult {
  successCount: number;
  failureCount: number;
  prefetched: string[];
  failed: Array<{ key: string; error: unknown }>;
}
```

#### `QueryClient`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/query/src/client.ts#L22) `packages/query/src/client.ts`

```ts
export interface QueryClient {
  provider: QueryProvider;
  cache: Map<string, QueryState>;
  defaultStaleMs: number;
  now: () => number;
  listeners: Map<string, Set<(state: QueryState) => void>>;
  clear: () => void;
  snapshot: () => QueryState[];
}
```

#### `QueryFn`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/query/src/fetch.ts#L3) `packages/query/src/fetch.ts`

```ts
export type QueryFn<T> = () => Promise<T>;
```

#### `QueryKey`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/query/src/client.ts#L3) `packages/query/src/client.ts`

```ts
export type QueryKey = string | readonly (string | number)[];
```

#### `QueryListener`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/query/src/subscription.ts#L3) `packages/query/src/subscription.ts`

```ts
export type QueryListener = (state: QueryState) => void;
```

#### `QueryProvider`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/query/src/client.ts#L1) `packages/query/src/client.ts`

```ts
export type QueryProvider = 'tanstack' | 'swr' | 'urql' | 'apollo';
```

#### `QueryState`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/query/src/client.ts#L7) `packages/query/src/client.ts`

```ts
export interface QueryState<T = unknown> {
  key: string;
  status: QueryStatus;
  data?: T;
  error?: Error;
  updatedAt: number;
  fetchCount: number;
}
```

#### `QueryStatus`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/query/src/client.ts#L5) `packages/query/src/client.ts`

```ts
export type QueryStatus = 'idle' | 'loading' | 'success' | 'error';
```

#### `RetryOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/query/src/extensions.ts#L99) `packages/query/src/extensions.ts`

```ts
export interface RetryOptions { maxAttempts?: number; initialDelayMs?: number; backoffFactor?: number; }
```

#### `RetryResult`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/query/src/extensions.ts#L100) `packages/query/src/extensions.ts`

```ts
export interface RetryResult<T> { ok: boolean; attempts: number; value?: T; error?: unknown; }
```

#### `Subscription`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/query/src/subscription.ts#L5) `packages/query/src/subscription.ts`

```ts
export interface Subscription {
  unsubscribe: () => void;
  key: string;
}
```
<!-- kiwa-public-api:end -->
