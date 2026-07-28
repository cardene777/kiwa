---
title: "@kiwa-lab/query extensions の API 契約"
---

# <code v-pre>@kiwa-lab/query</code> <code v-pre>extensions</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/query/src/extensions.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>createInfiniteQuery</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/query/src/extensions.ts#L21) <code v-pre>packages/query/src/extensions.ts</code>

infinite query — TanStack useInfiniteQuery 相当

```ts
export declare function createInfiniteQuery<TData, TCursor>(options: InfiniteQueryOptions<TData, TCursor>): InfiniteQueryState<TData, TCursor>;
```

#### <code v-pre>createObservabilityHook</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/query/src/extensions.ts#L134) <code v-pre>packages/query/src/extensions.ts</code>

```ts
export declare function createObservabilityHook(): ObservabilityHook;
```

#### <code v-pre>createOptimisticUpdate</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/query/src/extensions.ts#L50) <code v-pre>packages/query/src/extensions.ts</code>

optimistic update — server response 前に UI を更新、 失敗時 rollback

```ts
export declare function createOptimisticUpdate<T>(initial: T): OptimisticUpdate<T>;
```

#### <code v-pre>prefetchQueries</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/query/src/extensions.ts#L75) <code v-pre>packages/query/src/extensions.ts</code>

prefetch — 複数 queryKey を並列 fetch して cache に格納

```ts
export declare function prefetchQueries(keys: string[], fetcher: (key: string) => Promise<unknown>, options?: PrefetchOptions): Promise<PrefetchResult>;
```

#### <code v-pre>retryWithBackoff</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/query/src/extensions.ts#L102) <code v-pre>packages/query/src/extensions.ts</code>

```ts
export declare function retryWithBackoff<T>(fn: () => Promise<T>, options?: RetryOptions): Promise<RetryResult<T>>;
```

#### <code v-pre>withTimeout</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/query/src/extensions.ts#L120) <code v-pre>packages/query/src/extensions.ts</code>

```ts
export declare function withTimeout<T>(fn: () => Promise<T>, timeoutMs: number): Promise<T>;
```

### 型

#### <code v-pre>InfiniteQueryOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/query/src/extensions.ts#L7) <code v-pre>packages/query/src/extensions.ts</code>

v2.1 extensions — infinite query, optimistic update, prefetch, plus retry/batch/observability/timeout generics. TanStack Query v5.60+ / SWR v2.3 追随。

```ts
export interface InfiniteQueryOptions<TData, TCursor> {
    initialCursor: TCursor;
    fetchPage: (cursor: TCursor) => Promise<{
        data: TData[];
        nextCursor?: TCursor;
    }>;
    maxPages?: number;
}
```

#### <code v-pre>InfiniteQueryState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/query/src/extensions.ts#L13) <code v-pre>packages/query/src/extensions.ts</code>

```ts
export interface InfiniteQueryState<TData, TCursor> {
    pages: Array<{
        cursor: TCursor;
        data: TData[];
    }>;
    hasNextPage: boolean;
    fetchNextPage: () => Promise<void>;
    reset: () => void;
}
```

#### <code v-pre>ObservabilityHook</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/query/src/extensions.ts#L128) <code v-pre>packages/query/src/extensions.ts</code>

```ts
export interface ObservabilityHook {
    emit: (event: {
        kind: string;
        data: Record<string, unknown>;
    }) => void;
    events: () => Array<{
        kind: string;
        data: Record<string, unknown>;
    }>;
    clear: () => void;
}
```

#### <code v-pre>OptimisticUpdate</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/query/src/extensions.ts#L41) <code v-pre>packages/query/src/extensions.ts</code>

```ts
export interface OptimisticUpdate<T> {
    applyOptimistic: (value: T) => void;
    commit: () => void;
    rollback: () => void;
    current: () => T;
    isPending: () => boolean;
}
```

#### <code v-pre>PrefetchOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/query/src/extensions.ts#L62) <code v-pre>packages/query/src/extensions.ts</code>

```ts
export interface PrefetchOptions {
    concurrency?: number;
    timeoutMs?: number;
}
```

#### <code v-pre>PrefetchResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/query/src/extensions.ts#L67) <code v-pre>packages/query/src/extensions.ts</code>

```ts
export interface PrefetchResult {
    successCount: number;
    failureCount: number;
    prefetched: string[];
    failed: Array<{
        key: string;
        error: unknown;
    }>;
}
```

#### <code v-pre>RetryOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/query/src/extensions.ts#L99) <code v-pre>packages/query/src/extensions.ts</code>

```ts
export interface RetryOptions {
    maxAttempts?: number;
    initialDelayMs?: number;
    backoffFactor?: number;
}
```

#### <code v-pre>RetryResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/query/src/extensions.ts#L100) <code v-pre>packages/query/src/extensions.ts</code>

```ts
export interface RetryResult<T> {
    ok: boolean;
    attempts: number;
    value?: T;
    error?: unknown;
}
```
