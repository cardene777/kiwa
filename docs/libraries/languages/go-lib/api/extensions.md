---
title: "@kiwa-lab/go-lib extensions の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/go-lib</code> <code v-pre>extensions</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/go-lib/src/extensions.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>batchDispatch</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/go-lib/src/extensions.ts#L66) <code v-pre>packages/go-lib/src/extensions.ts</code>

batch handler dispatch — 並列/直列両対応

```ts
export declare function batchDispatch<T>(handlers: Array<() => Promise<T>>, options?: BatchDispatchOptions): Promise<BatchDispatchResult<T>>;
```

#### <code v-pre>composeMiddleware</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/go-lib/src/extensions.ts#L272) <code v-pre>packages/go-lib/src/extensions.ts</code>

middleware compose helper — 複数 middleware を 1 chain に連結

```ts
export declare function composeMiddleware(...middlewares: MiddlewareFn[]): MiddlewareFn;
```

#### <code v-pre>createCancelToken</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/go-lib/src/extensions.ts#L250) <code v-pre>packages/go-lib/src/extensions.ts</code>

context.WithCancel simulation — Go の context 相当

```ts
export declare function createCancelToken(): CancelToken;
```

#### <code v-pre>createCircuitBreaker</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/go-lib/src/extensions.ts#L206) <code v-pre>packages/go-lib/src/extensions.ts</code>

circuit breaker — 失敗閾値超えで open、 resetTimeout 経過で half-open

```ts
export declare function createCircuitBreaker(options: CircuitBreakerOptions): CircuitBreaker;
```

#### <code v-pre>createObservabilityHook</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/go-lib/src/extensions.ts#L111) <code v-pre>packages/go-lib/src/extensions.ts</code>

observability hook — request 一覧を蓄積

```ts
export declare function createObservabilityHook(): ObservabilityHook;
```

#### <code v-pre>createRateLimiter</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/go-lib/src/extensions.ts#L164) <code v-pre>packages/go-lib/src/extensions.ts</code>

token bucket rate limiter

```ts
export declare function createRateLimiter(options: RateLimitOptions): RateLimiter;
```

#### <code v-pre>createRouteGroup</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/go-lib/src/extensions.ts#L299) <code v-pre>packages/go-lib/src/extensions.ts</code>

route group + subrouter helper — gin.Group / echo.Group / fiber.Group / chi.Route を統一

```ts
export declare function createRouteGroup(options: RouteGroupOptions): RouteGroup;
```

#### <code v-pre>retryWithBackoff</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/go-lib/src/extensions.ts#L26) <code v-pre>packages/go-lib/src/extensions.ts</code>

exponential backoff retry — echo/gin middleware に組み込む想定

```ts
export declare function retryWithBackoff<T>(fn: () => Promise<T>, options?: RetryOptions): Promise<RetryResult<T>>;
```

#### <code v-pre>withTimeout</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/go-lib/src/extensions.ts#L132) <code v-pre>packages/go-lib/src/extensions.ts</code>

handler timeout — timeoutMs 経過で reject

```ts
export declare function withTimeout<T>(fn: () => Promise<T>, options: TimeoutOptions): Promise<T>;
```

### 型

#### <code v-pre>BatchDispatchOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/go-lib/src/extensions.ts#L54) <code v-pre>packages/go-lib/src/extensions.ts</code>

```ts
export interface BatchDispatchOptions {
    concurrency?: number;
    stopOnError?: boolean;
}
```

#### <code v-pre>BatchDispatchResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/go-lib/src/extensions.ts#L59) <code v-pre>packages/go-lib/src/extensions.ts</code>

```ts
export interface BatchDispatchResult<T> {
    results: Array<{
        index: number;
        ok: boolean;
        value?: T;
        error?: unknown;
    }>;
    successCount: number;
    failureCount: number;
}
```

#### <code v-pre>CancelToken</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/go-lib/src/extensions.ts#L243) <code v-pre>packages/go-lib/src/extensions.ts</code>

```ts
export interface CancelToken {
    cancelled: () => boolean;
    cancel: () => void;
    onCancel: (fn: () => void) => void;
}
```

#### <code v-pre>CircuitBreaker</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/go-lib/src/extensions.ts#L199) <code v-pre>packages/go-lib/src/extensions.ts</code>

```ts
export interface CircuitBreaker {
    state: () => CircuitState;
    execute: <T>(fn: () => Promise<T>) => Promise<T>;
    reset: () => void;
}
```

#### <code v-pre>CircuitBreakerOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/go-lib/src/extensions.ts#L194) <code v-pre>packages/go-lib/src/extensions.ts</code>

```ts
export interface CircuitBreakerOptions {
    failureThreshold: number;
    resetTimeoutMs: number;
}
```

#### <code v-pre>CircuitState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/go-lib/src/extensions.ts#L192) <code v-pre>packages/go-lib/src/extensions.ts</code>

```ts
export type CircuitState = 'closed' | 'open' | 'half-open';
```

#### <code v-pre>MiddlewareFn</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/go-lib/src/extensions.ts#L269) <code v-pre>packages/go-lib/src/extensions.ts</code>

```ts
export type MiddlewareFn = (req: GoRequest, next: () => Promise<GoResponse>) => Promise<GoResponse>;
```

#### <code v-pre>ObservabilityEvent</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/go-lib/src/extensions.ts#L95) <code v-pre>packages/go-lib/src/extensions.ts</code>

```ts
export interface ObservabilityEvent {
    framework: GoFramework;
    method: string;
    path: string;
    status: number;
    durationMs: number;
    timestamp: number;
}
```

#### <code v-pre>ObservabilityHook</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/go-lib/src/extensions.ts#L104) <code v-pre>packages/go-lib/src/extensions.ts</code>

```ts
export interface ObservabilityHook {
    onRequest: (event: ObservabilityEvent) => void;
    events: () => ObservabilityEvent[];
    clear: () => void;
}
```

#### <code v-pre>RateLimiter</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/go-lib/src/extensions.ts#L157) <code v-pre>packages/go-lib/src/extensions.ts</code>

```ts
export interface RateLimiter {
    tryAcquire: () => boolean;
    reset: () => void;
    remaining: () => number;
}
```

#### <code v-pre>RateLimitOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/go-lib/src/extensions.ts#L152) <code v-pre>packages/go-lib/src/extensions.ts</code>

```ts
export interface RateLimitOptions {
    requestsPerSecond: number;
    burst?: number;
}
```

#### <code v-pre>RetryOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/go-lib/src/extensions.ts#L11) <code v-pre>packages/go-lib/src/extensions.ts</code>

```ts
export interface RetryOptions {
    maxAttempts?: number;
    initialDelayMs?: number;
    backoffFactor?: number;
    onRetry?: (attempt: number, error: unknown) => void;
}
```

#### <code v-pre>RetryResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/go-lib/src/extensions.ts#L18) <code v-pre>packages/go-lib/src/extensions.ts</code>

```ts
export interface RetryResult<T> {
    ok: boolean;
    attempts: number;
    value?: T;
    error?: unknown;
}
```

#### <code v-pre>RouteGroup</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/go-lib/src/extensions.ts#L290) <code v-pre>packages/go-lib/src/extensions.ts</code>

```ts
export interface RouteGroup {
    prefix: string;
    framework: GoFramework;
    routes: Array<{
        method: string;
        fullPath: string;
        handlerName: string;
    }>;
    addRoute: (method: string, subpath: string, handlerName: string) => void;
    subgroup: (childPrefix: string) => RouteGroup;
}
```

#### <code v-pre>RouteGroupOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/go-lib/src/extensions.ts#L285) <code v-pre>packages/go-lib/src/extensions.ts</code>

```ts
export interface RouteGroupOptions {
    prefix: string;
    framework: GoFramework;
}
```

#### <code v-pre>TimeoutOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/go-lib/src/extensions.ts#L126) <code v-pre>packages/go-lib/src/extensions.ts</code>

```ts
export interface TimeoutOptions {
    timeoutMs: number;
    onTimeout?: () => void;
}
```
