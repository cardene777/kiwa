---
title: "@kiwa-lab/upload enhancements の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/upload</code> <code v-pre>enhancements</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/upload/src/enhancements.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>createCircuitBreaker</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/upload/src/enhancements.ts#L153) <code v-pre>packages/upload/src/enhancements.ts</code>

```ts
export declare function createCircuitBreaker(client: UploadClient, options?: CircuitBreakerOptions): CircuitBreaker;
```

#### <code v-pre>createHookRegistry</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/upload/src/enhancements.ts#L106) <code v-pre>packages/upload/src/enhancements.ts</code>

```ts
export declare function createHookRegistry(): HookRegistry;
```

#### <code v-pre>createIdempotencyCache</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/upload/src/enhancements.ts#L64) <code v-pre>packages/upload/src/enhancements.ts</code>

```ts
export declare function createIdempotencyCache(): IdempotencyCache;
```

#### <code v-pre>uploadBatch</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/upload/src/enhancements.ts#L41) <code v-pre>packages/upload/src/enhancements.ts</code>

```ts
export declare function uploadBatch(client: UploadClient, requests: readonly UploadRequest[], concurrency?: number): Promise<BatchUploadResult>;
```

#### <code v-pre>uploadIdempotent</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/upload/src/enhancements.ts#L74) <code v-pre>packages/upload/src/enhancements.ts</code>

```ts
export declare function uploadIdempotent(client: UploadClient, req: UploadRequest, idempotencyKey: string, cache: IdempotencyCache): Promise<UploadResult & {
    cached: boolean;
}>;
```

#### <code v-pre>uploadObservable</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/upload/src/enhancements.ts#L120) <code v-pre>packages/upload/src/enhancements.ts</code>

```ts
export declare function uploadObservable(client: UploadClient, req: UploadRequest, hooks: HookRegistry): Promise<UploadResult>;
```

#### <code v-pre>uploadWithRetry</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/upload/src/enhancements.ts#L14) <code v-pre>packages/upload/src/enhancements.ts</code>

```ts
export declare function uploadWithRetry(client: UploadClient, req: UploadRequest, options?: RetryOptions): Promise<UploadResult & {
    attempts: number;
}>;
```

### 型

#### <code v-pre>BatchUploadResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/upload/src/enhancements.ts#L34) <code v-pre>packages/upload/src/enhancements.ts</code>

```ts
export interface BatchUploadResult {
    total: number;
    succeeded: number;
    failed: number;
    results: UploadResult[];
}
```

#### <code v-pre>CircuitBreaker</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/upload/src/enhancements.ts#L146) <code v-pre>packages/upload/src/enhancements.ts</code>

```ts
export interface CircuitBreaker {
    state: () => CircuitState;
    upload: (req: UploadRequest) => Promise<UploadResult & {
        circuitState: CircuitState;
    }>;
    reset: () => void;
    failureCount: () => number;
}
```

#### <code v-pre>CircuitBreakerOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/upload/src/enhancements.ts#L140) <code v-pre>packages/upload/src/enhancements.ts</code>

```ts
export interface CircuitBreakerOptions {
    failureThreshold?: number;
    resetTimeoutMs?: number;
    now?: () => number;
}
```

#### <code v-pre>CircuitState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/upload/src/enhancements.ts#L138) <code v-pre>packages/upload/src/enhancements.ts</code>

```ts
export type CircuitState = 'closed' | 'open' | 'half-open';
```

#### <code v-pre>HookCallback</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/upload/src/enhancements.ts#L98) <code v-pre>packages/upload/src/enhancements.ts</code>

```ts
export type HookCallback = (ctx: HookContext) => void;
```

#### <code v-pre>HookContext</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/upload/src/enhancements.ts#L90) <code v-pre>packages/upload/src/enhancements.ts</code>

```ts
export interface HookContext {
    event: UploadHookEvent;
    request: UploadRequest;
    result?: UploadResult;
    error?: string;
    durationMs?: number;
}
```

#### <code v-pre>HookRegistry</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/upload/src/enhancements.ts#L100) <code v-pre>packages/upload/src/enhancements.ts</code>

```ts
export interface HookRegistry {
    register: (event: UploadHookEvent, cb: HookCallback) => () => void;
    emit: (event: UploadHookEvent, ctx: HookContext) => void;
    count: (event: UploadHookEvent) => number;
}
```

#### <code v-pre>IdempotencyCache</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/upload/src/enhancements.ts#L57) <code v-pre>packages/upload/src/enhancements.ts</code>

```ts
export interface IdempotencyCache {
    get: (key: string) => UploadResult | undefined;
    set: (key: string, value: UploadResult) => void;
    size: () => number;
    clear: () => void;
}
```

#### <code v-pre>RetryOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/upload/src/enhancements.ts#L8) <code v-pre>packages/upload/src/enhancements.ts</code>

```ts
export interface RetryOptions {
    maxAttempts?: number;
    initialDelayMs?: number;
    onRetry?: (attempt: number, reason: string) => void;
}
```

#### <code v-pre>UploadHookEvent</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/upload/src/enhancements.ts#L88) <code v-pre>packages/upload/src/enhancements.ts</code>

```ts
export type UploadHookEvent = 'before-upload' | 'after-upload' | 'error';
```
