---
title: "@kiwa-lab/i18n resilience の API 契約"
---

# <code v-pre>@kiwa-lab/i18n</code> <code v-pre>resilience</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/i18n/src/resilience.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>batchOperate</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/i18n/src/resilience.ts#L111) <code v-pre>packages/i18n/src/resilience.ts</code>

```ts
export declare function batchOperate<TIn, TOut>(items: readonly BatchItem<TIn>[], runner: (item: BatchItem<TIn>) => Promise<TOut>): Promise<BatchResult[]>;
```

#### <code v-pre>withCircuitBreaker</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/i18n/src/resilience.ts#L64) <code v-pre>packages/i18n/src/resilience.ts</code>

```ts
export declare function withCircuitBreaker<T>(fn: () => Promise<T>, options: CircuitBreakerOptions): () => Promise<T>;
```

#### <code v-pre>withIdempotencyKey</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/i18n/src/resilience.ts#L101) <code v-pre>packages/i18n/src/resilience.ts</code>

```ts
export declare function withIdempotencyKey<T>(fn: (key: string) => Promise<T>): (key: string) => Promise<T>;
```

#### <code v-pre>withObservability</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/i18n/src/resilience.ts#L86) <code v-pre>packages/i18n/src/resilience.ts</code>

```ts
export declare function withObservability<T>(name: string, fn: () => Promise<T>, hook: ObservabilityHook): () => Promise<T>;
```

#### <code v-pre>withRateLimit</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/i18n/src/resilience.ts#L50) <code v-pre>packages/i18n/src/resilience.ts</code>

```ts
export declare function withRateLimit<T>(fn: () => Promise<T>, options: RateLimitOptions): () => Promise<T>;
```

#### <code v-pre>withRetry</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/i18n/src/resilience.ts#L20) <code v-pre>packages/i18n/src/resilience.ts</code>

```ts
export declare function withRetry<T>(fn: () => Promise<T>, options: RetryOptions): () => Promise<T>;
```

#### <code v-pre>withTimeout</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/i18n/src/resilience.ts#L40) <code v-pre>packages/i18n/src/resilience.ts</code>

```ts
export declare function withTimeout<T>(fn: () => Promise<T>, options: TimeoutOptions): () => Promise<T>;
```

### 型

#### <code v-pre>BatchItem</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/i18n/src/resilience.ts#L17) <code v-pre>packages/i18n/src/resilience.ts</code>

```ts
export interface BatchItem<TIn = unknown> {
    name: string;
    input: TIn;
}
```

#### <code v-pre>BatchResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/i18n/src/resilience.ts#L18) <code v-pre>packages/i18n/src/resilience.ts</code>

```ts
export interface BatchResult {
    ok: boolean;
    output?: unknown;
    error?: {
        code: string;
        message: string;
    };
}
```

#### <code v-pre>CircuitBreakerOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/i18n/src/resilience.ts#L11) <code v-pre>packages/i18n/src/resilience.ts</code>

```ts
export interface CircuitBreakerOptions {
    failureThreshold: number;
    resetMs: number;
}
```

#### <code v-pre>ObservabilityHook</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/i18n/src/resilience.ts#L12) <code v-pre>packages/i18n/src/resilience.ts</code>

```ts
export interface ObservabilityHook {
    onStart?: (name: string, input?: unknown) => void;
    onSuccess?: (name: string, output: unknown, durationMs: number) => void;
    onError?: (name: string, err: unknown, durationMs: number) => void;
}
```

#### <code v-pre>RateLimitOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/i18n/src/resilience.ts#L10) <code v-pre>packages/i18n/src/resilience.ts</code>

```ts
export interface RateLimitOptions {
    maxRequests: number;
    windowMs: number;
}
```

#### <code v-pre>RetryOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/i18n/src/resilience.ts#L4) <code v-pre>packages/i18n/src/resilience.ts</code>

```ts
export interface RetryOptions {
    maxAttempts: number;
    backoffMs?: number;
    retryOn?: (err: unknown) => boolean;
}
```

#### <code v-pre>TimeoutOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/i18n/src/resilience.ts#L9) <code v-pre>packages/i18n/src/resilience.ts</code>

```ts
export interface TimeoutOptions {
    ms: number;
}
```
