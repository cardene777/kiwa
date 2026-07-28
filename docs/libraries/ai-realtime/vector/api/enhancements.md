---
title: "@kiwa-lab/vector enhancements の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/vector</code> <code v-pre>enhancements</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/vector/src/enhancements.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

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
