---
title: "@kiwa-lab/react-native extensions の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/react-native</code> <code v-pre>extensions</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/react-native/src/extensions.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>batchAsync</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/react-native/src/extensions.ts#L228) <code v-pre>packages/react-native/src/extensions.ts</code>

```ts
export declare function batchAsync<T>(fns: Array<() => Promise<T>>, options?: BatchOptions): Promise<BatchResult<T>>;
```

#### <code v-pre>createCircuitBreaker</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/react-native/src/extensions.ts#L192) <code v-pre>packages/react-native/src/extensions.ts</code>

```ts
export declare function createCircuitBreaker(options: CircuitBreakerOptions): CircuitBreaker;
```

#### <code v-pre>createNotificationPermissionMock</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/react-native/src/extensions.ts#L92) <code v-pre>packages/react-native/src/extensions.ts</code>

notification permission mock — iOS/Android 統一

```ts
export declare function createNotificationPermissionMock(initial?: NotificationPermission): NotificationPermissionMock;
```

#### <code v-pre>createObservabilityHook</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/react-native/src/extensions.ts#L120) <code v-pre>packages/react-native/src/extensions.ts</code>

```ts
export declare function createObservabilityHook(): ObservabilityHook;
```

#### <code v-pre>createRateLimiter</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/react-native/src/extensions.ts#L159) <code v-pre>packages/react-native/src/extensions.ts</code>

```ts
export declare function createRateLimiter(options: RateLimitOptions): RateLimiter;
```

#### <code v-pre>matchDeepLink</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/react-native/src/extensions.ts#L58) <code v-pre>packages/react-native/src/extensions.ts</code>

deep link URL を pattern に対して match、 param 抽出

```ts
export declare function matchDeepLink(url: string, patterns: DeepLinkPattern[]): DeepLinkMatch;
```

#### <code v-pre>retryWithBackoff</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/react-native/src/extensions.ts#L21) <code v-pre>packages/react-native/src/extensions.ts</code>

```ts
export declare function retryWithBackoff<T>(fn: () => Promise<T>, options?: RetryOptions): Promise<RetryResult<T>>;
```

#### <code v-pre>withTimeout</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/react-native/src/extensions.ts#L134) <code v-pre>packages/react-native/src/extensions.ts</code>

```ts
export declare function withTimeout<T>(fn: () => Promise<T>, options: TimeoutOptions): Promise<T>;
```

### 型

#### <code v-pre>BatchOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/react-native/src/extensions.ts#L218) <code v-pre>packages/react-native/src/extensions.ts</code>

```ts
export interface BatchOptions {
    concurrency?: number;
}
```

#### <code v-pre>BatchResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/react-native/src/extensions.ts#L222) <code v-pre>packages/react-native/src/extensions.ts</code>

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

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/react-native/src/extensions.ts#L186) <code v-pre>packages/react-native/src/extensions.ts</code>

```ts
export interface CircuitBreaker {
    state: () => CircuitState;
    execute: <T>(fn: () => Promise<T>) => Promise<T>;
    reset: () => void;
}
```

#### <code v-pre>CircuitBreakerOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/react-native/src/extensions.ts#L181) <code v-pre>packages/react-native/src/extensions.ts</code>

```ts
export interface CircuitBreakerOptions {
    failureThreshold: number;
    resetTimeoutMs: number;
}
```

#### <code v-pre>CircuitState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/react-native/src/extensions.ts#L179) <code v-pre>packages/react-native/src/extensions.ts</code>

```ts
export type CircuitState = 'closed' | 'open' | 'half-open';
```

#### <code v-pre>DeepLinkMatch</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/react-native/src/extensions.ts#L49) <code v-pre>packages/react-native/src/extensions.ts</code>

```ts
export interface DeepLinkMatch {
    matched: boolean;
    scheme: string;
    host?: string;
    path?: string;
    params?: Record<string, string>;
}
```

#### <code v-pre>DeepLinkPattern</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/react-native/src/extensions.ts#L43) <code v-pre>packages/react-native/src/extensions.ts</code>

```ts
export interface DeepLinkPattern {
    scheme: string;
    host?: string;
    pathPattern?: RegExp;
}
```

#### <code v-pre>NotificationPermission</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/react-native/src/extensions.ts#L83) <code v-pre>packages/react-native/src/extensions.ts</code>

```ts
export type NotificationPermission = 'granted' | 'denied' | 'undetermined';
```

#### <code v-pre>NotificationPermissionMock</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/react-native/src/extensions.ts#L85) <code v-pre>packages/react-native/src/extensions.ts</code>

```ts
export interface NotificationPermissionMock {
    status: () => NotificationPermission;
    request: () => Promise<NotificationPermission>;
    set: (status: NotificationPermission) => void;
}
```

#### <code v-pre>ObservabilityEvent</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/react-native/src/extensions.ts#L108) <code v-pre>packages/react-native/src/extensions.ts</code>

```ts
export interface ObservabilityEvent {
    kind: string;
    data: Record<string, unknown>;
    timestamp: number;
}
```

#### <code v-pre>ObservabilityHook</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/react-native/src/extensions.ts#L114) <code v-pre>packages/react-native/src/extensions.ts</code>

```ts
export interface ObservabilityHook {
    emit: (event: ObservabilityEvent) => void;
    events: () => ObservabilityEvent[];
    clear: () => void;
}
```

#### <code v-pre>RateLimiter</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/react-native/src/extensions.ts#L153) <code v-pre>packages/react-native/src/extensions.ts</code>

```ts
export interface RateLimiter {
    tryAcquire: () => boolean;
    reset: () => void;
    remaining: () => number;
}
```

#### <code v-pre>RateLimitOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/react-native/src/extensions.ts#L148) <code v-pre>packages/react-native/src/extensions.ts</code>

```ts
export interface RateLimitOptions {
    requestsPerSecond: number;
    burst?: number;
}
```

#### <code v-pre>RetryOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/react-native/src/extensions.ts#L7) <code v-pre>packages/react-native/src/extensions.ts</code>

v2.1 extensions — deep link handling, notification permission, retry, batch, observability, timeout, rate limit, circuit breaker for React Native app tests. RN 0.75+ new architecture 追随。

```ts
export interface RetryOptions {
    maxAttempts?: number;
    initialDelayMs?: number;
    backoffFactor?: number;
    onRetry?: (attempt: number, error: unknown) => void;
}
```

#### <code v-pre>RetryResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/react-native/src/extensions.ts#L14) <code v-pre>packages/react-native/src/extensions.ts</code>

```ts
export interface RetryResult<T> {
    ok: boolean;
    attempts: number;
    value?: T;
    error?: unknown;
}
```

#### <code v-pre>TimeoutOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/react-native/src/extensions.ts#L129) <code v-pre>packages/react-native/src/extensions.ts</code>

```ts
export interface TimeoutOptions {
    timeoutMs: number;
    onTimeout?: () => void;
}
```
