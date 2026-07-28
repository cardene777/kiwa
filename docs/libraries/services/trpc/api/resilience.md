---
title: "@kiwa-lab/trpc resilience の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/trpc</code> <code v-pre>resilience</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/trpc/src/resilience.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>batchInvoke</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/trpc/src/resilience.ts#L151) <code v-pre>packages/trpc/src/resilience.ts</code>

batchInvoke — 複数 procedure を Promise.all で並列 invoke、 各結果を BatchInvokeResult shape で正規化 (individual failure が全体 fail しない)。

```ts
export declare function batchInvoke(router: Router, items: BatchInvokeItem[], ctx?: ProcedureContext): Promise<BatchInvokeResult[]>;
```

#### <code v-pre>withCircuitBreaker</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/trpc/src/resilience.ts#L103) <code v-pre>packages/trpc/src/resilience.ts</code>

withCircuitBreaker — 連続失敗が failureThreshold 超で「open」 状態に切替、 resetMs 経過で half-open で 1 attempt allow、 成功で closed 復帰。

```ts
export declare function withCircuitBreaker<T>(handler: ProcedureHandler<unknown, T>, options: CircuitBreakerOptions): ProcedureHandler<unknown, T>;
```

#### <code v-pre>withIdempotencyKey</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/trpc/src/resilience.ts#L171) <code v-pre>packages/trpc/src/resilience.ts</code>

withIdempotencyKey — 同一 key の重複 invoke で cached result を返す。 downstream への 副作用を防ぐ (payment / charge / booking 系で重要)。

```ts
export declare function withIdempotencyKey<T>(handler: ProcedureHandler<unknown, T>): ProcedureHandler<unknown, T>;
```

#### <code v-pre>withObservability</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/trpc/src/resilience.ts#L132) <code v-pre>packages/trpc/src/resilience.ts</code>

withObservability — handler の start / success / error / duration を hook 通知。 tracing / metrics / logging の統合を統一 interface で実現。

```ts
export declare function withObservability<T>(name: string, handler: ProcedureHandler<unknown, T>, hook: ObservabilityHook): ProcedureHandler<unknown, T>;
```

#### <code v-pre>withRateLimit</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/trpc/src/resilience.ts#L85) <code v-pre>packages/trpc/src/resilience.ts</code>

withRateLimit — sliding window rate limiter。 window 内 request 数が maxRequests 超で throw。

```ts
export declare function withRateLimit<T>(handler: ProcedureHandler<unknown, T>, options: RateLimitOptions): ProcedureHandler<unknown, T>;
```

#### <code v-pre>withRetry</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/trpc/src/resilience.ts#L46) <code v-pre>packages/trpc/src/resilience.ts</code>

withRetry — procedure handler を retry policy でラップ。 exponential backoff (backoffMs * 2^(attempt-1)) を default で適用、 retryOn callback で条件付き retry も可能。

```ts
export declare function withRetry<T>(handler: ProcedureHandler<unknown, T>, options: RetryOptions): ProcedureHandler<unknown, T>;
```

#### <code v-pre>withTimeout</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/trpc/src/resilience.ts#L70) <code v-pre>packages/trpc/src/resilience.ts</code>

withTimeout — handler を timeout でラップ。 ms 経過で Promise.race で timeout error throw。

```ts
export declare function withTimeout<T>(handler: ProcedureHandler<unknown, T>, options: TimeoutOptions): ProcedureHandler<unknown, T>;
```

### 型

#### <code v-pre>BatchInvokeItem</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/trpc/src/resilience.ts#L31) <code v-pre>packages/trpc/src/resilience.ts</code>

```ts
export interface BatchInvokeItem<TInput = unknown> {
    procedureName: string;
    input: TInput;
}
```

#### <code v-pre>BatchInvokeResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/trpc/src/resilience.ts#L36) <code v-pre>packages/trpc/src/resilience.ts</code>

```ts
export interface BatchInvokeResult {
    ok: boolean;
    output?: unknown;
    error?: {
        code: string;
        message: string;
    };
}
```

#### <code v-pre>CircuitBreakerOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/trpc/src/resilience.ts#L20) <code v-pre>packages/trpc/src/resilience.ts</code>

```ts
export interface CircuitBreakerOptions {
    failureThreshold: number;
    resetMs: number;
}
```

#### <code v-pre>ObservabilityHook</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/trpc/src/resilience.ts#L25) <code v-pre>packages/trpc/src/resilience.ts</code>

```ts
export interface ObservabilityHook {
    onStart?: (name: string, input: unknown) => void;
    onSuccess?: (name: string, output: unknown, durationMs: number) => void;
    onError?: (name: string, err: unknown, durationMs: number) => void;
}
```

#### <code v-pre>RateLimitOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/trpc/src/resilience.ts#L15) <code v-pre>packages/trpc/src/resilience.ts</code>

```ts
export interface RateLimitOptions {
    maxRequests: number;
    windowMs: number;
}
```

#### <code v-pre>RetryOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/trpc/src/resilience.ts#L5) <code v-pre>packages/trpc/src/resilience.ts</code>

```ts
export interface RetryOptions {
    maxAttempts: number;
    backoffMs?: number;
    retryOn?: (err: unknown) => boolean;
}
```

#### <code v-pre>TimeoutOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/trpc/src/resilience.ts#L11) <code v-pre>packages/trpc/src/resilience.ts</code>

```ts
export interface TimeoutOptions {
    ms: number;
}
```
