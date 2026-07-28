---
title: "@kiwa-lab/expo extensions の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/expo</code> <code v-pre>extensions</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/expo/src/extensions.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>batchAsync</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/expo/src/extensions.ts#L113) <code v-pre>packages/expo/src/extensions.ts</code>

```ts
export declare function batchAsync<T>(fns: Array<() => Promise<T>>, concurrency?: number): Promise<BatchResult<T>>;
```

#### <code v-pre>createCircuitBreaker</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/expo/src/extensions.ts#L173) <code v-pre>packages/expo/src/extensions.ts</code>

```ts
export declare function createCircuitBreaker(failureThreshold: number, resetTimeoutMs: number): CircuitBreaker;
```

#### <code v-pre>createObservabilityHook</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/expo/src/extensions.ts#L132) <code v-pre>packages/expo/src/extensions.ts</code>

```ts
export declare function createObservabilityHook(): ObservabilityHook;
```

#### <code v-pre>createRateLimiter</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/expo/src/extensions.ts#L151) <code v-pre>packages/expo/src/extensions.ts</code>

```ts
export declare function createRateLimiter(rps: number, burst?: number): RateLimiter;
```

#### <code v-pre>mockEASUpdate</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/expo/src/extensions.ts#L23) <code v-pre>packages/expo/src/extensions.ts</code>

EAS Update API mock — expo-updates 相当

```ts
export declare function mockEASUpdate(initial?: EASUpdateManifest[]): EASUpdateMock;
```

#### <code v-pre>mockModal</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/expo/src/extensions.ts#L66) <code v-pre>packages/expo/src/extensions.ts</code>

Modal presentation mock

```ts
export declare function mockModal(): ModalMock;
```

#### <code v-pre>retryWithBackoff</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/expo/src/extensions.ts#L93) <code v-pre>packages/expo/src/extensions.ts</code>

```ts
export declare function retryWithBackoff<T>(fn: () => Promise<T>, options?: RetryOptions): Promise<RetryResult<T>>;
```

#### <code v-pre>withTimeout</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/expo/src/extensions.ts#L141) <code v-pre>packages/expo/src/extensions.ts</code>

```ts
export declare function withTimeout<T>(fn: () => Promise<T>, timeoutMs: number): Promise<T>;
```

### 型

#### <code v-pre>BatchResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/expo/src/extensions.ts#L111) <code v-pre>packages/expo/src/extensions.ts</code>

```ts
export interface BatchResult<T> {
    successCount: number;
    failureCount: number;
    results: Array<{
        ok: boolean;
        value?: T;
        error?: unknown;
    }>;
}
```

#### <code v-pre>CircuitBreaker</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/expo/src/extensions.ts#L171) <code v-pre>packages/expo/src/extensions.ts</code>

```ts
export interface CircuitBreaker {
    state: () => CircuitState;
    execute: <T>(fn: () => Promise<T>) => Promise<T>;
    reset: () => void;
}
```

#### <code v-pre>CircuitState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/expo/src/extensions.ts#L169) <code v-pre>packages/expo/src/extensions.ts</code>

```ts
export type CircuitState = 'closed' | 'open' | 'half-open';
```

#### <code v-pre>EASUpdateManifest</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/expo/src/extensions.ts#L6) <code v-pre>packages/expo/src/extensions.ts</code>

v2.1 extensions — EAS Update API mock, Modal presentation, retry, batch, observability, timeout, rate limit, circuit breaker for Expo SDK 52+.

```ts
export interface EASUpdateManifest {
    id: string;
    runtimeVersion: string;
    createdAt: number;
    isEnabled: boolean;
    channel: string;
}
```

#### <code v-pre>EASUpdateMock</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/expo/src/extensions.ts#L14) <code v-pre>packages/expo/src/extensions.ts</code>

```ts
export interface EASUpdateMock {
    checkForUpdateAsync: () => Promise<{
        isAvailable: boolean;
        manifest?: EASUpdateManifest;
    }>;
    fetchUpdateAsync: () => Promise<{
        isNew: boolean;
        manifest?: EASUpdateManifest;
    }>;
    reloadAsync: () => Promise<void>;
    addListener: (fn: (event: {
        type: string;
        manifest?: EASUpdateManifest;
    }) => void) => () => void;
    publishUpdate: (manifest: EASUpdateManifest) => void;
}
```

#### <code v-pre>ModalMock</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/expo/src/extensions.ts#L58) <code v-pre>packages/expo/src/extensions.ts</code>

```ts
export interface ModalMock {
    present: (options?: ModalOptions) => void;
    dismiss: () => void;
    isVisible: () => boolean;
    history: () => Array<{
        action: 'present' | 'dismiss';
        options?: ModalOptions;
        at: number;
    }>;
}
```

#### <code v-pre>ModalOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/expo/src/extensions.ts#L52) <code v-pre>packages/expo/src/extensions.ts</code>

```ts
export interface ModalOptions {
    animation?: 'slide' | 'fade' | 'none';
    presentationStyle?: 'fullScreen' | 'pageSheet' | 'formSheet' | 'overFullScreen';
    transparent?: boolean;
}
```

#### <code v-pre>ObservabilityHook</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/expo/src/extensions.ts#L126) <code v-pre>packages/expo/src/extensions.ts</code>

```ts
export interface ObservabilityHook {
    emit: (event: {
        kind: string;
        data: Record<string, unknown>;
        timestamp: number;
    }) => void;
    events: () => Array<{
        kind: string;
        data: Record<string, unknown>;
        timestamp: number;
    }>;
    clear: () => void;
}
```

#### <code v-pre>RateLimiter</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/expo/src/extensions.ts#L149) <code v-pre>packages/expo/src/extensions.ts</code>

```ts
export interface RateLimiter {
    tryAcquire: () => boolean;
    reset: () => void;
    remaining: () => number;
}
```

#### <code v-pre>RetryOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/expo/src/extensions.ts#L85) <code v-pre>packages/expo/src/extensions.ts</code>

```ts
export interface RetryOptions {
    maxAttempts?: number;
    initialDelayMs?: number;
    backoffFactor?: number;
}
```

#### <code v-pre>RetryResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/expo/src/extensions.ts#L91) <code v-pre>packages/expo/src/extensions.ts</code>

```ts
export interface RetryResult<T> {
    ok: boolean;
    attempts: number;
    value?: T;
    error?: unknown;
}
```
