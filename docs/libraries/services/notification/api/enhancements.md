---
title: "@kiwa-lab/notification enhancements の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/notification</code> <code v-pre>enhancements</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/notification/src/enhancements.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>createCircuitBreaker</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/notification/src/enhancements.ts#L150) <code v-pre>packages/notification/src/enhancements.ts</code>

```ts
export declare function createCircuitBreaker(client: NotificationClient, options?: CircuitBreakerOptions): CircuitBreaker;
```

#### <code v-pre>createHookRegistry</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/notification/src/enhancements.ts#L104) <code v-pre>packages/notification/src/enhancements.ts</code>

```ts
export declare function createHookRegistry(): HookRegistry;
```

#### <code v-pre>createIdempotencyCache</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/notification/src/enhancements.ts#L63) <code v-pre>packages/notification/src/enhancements.ts</code>

```ts
export declare function createIdempotencyCache(): IdempotencyCache;
```

#### <code v-pre>sendPushBatch</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/notification/src/enhancements.ts#L41) <code v-pre>packages/notification/src/enhancements.ts</code>

```ts
export declare function sendPushBatch(client: NotificationClient, messages: readonly PushMessage[], concurrency?: number): Promise<BatchSendResult>;
```

#### <code v-pre>sendPushIdempotent</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/notification/src/enhancements.ts#L73) <code v-pre>packages/notification/src/enhancements.ts</code>

```ts
export declare function sendPushIdempotent(client: NotificationClient, msg: PushMessage, idempotencyKey: string, cache: IdempotencyCache): Promise<NotificationSendResult & {
    cached: boolean;
}>;
```

#### <code v-pre>sendPushObservable</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/notification/src/enhancements.ts#L118) <code v-pre>packages/notification/src/enhancements.ts</code>

```ts
export declare function sendPushObservable(client: NotificationClient, msg: PushMessage, hooks: HookRegistry): Promise<NotificationSendResult>;
```

#### <code v-pre>sendPushWithRetry</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/notification/src/enhancements.ts#L14) <code v-pre>packages/notification/src/enhancements.ts</code>

```ts
export declare function sendPushWithRetry(client: NotificationClient, msg: PushMessage, options?: RetryOptions): Promise<NotificationSendResult & {
    attempts: number;
}>;
```

### 型

#### <code v-pre>BatchSendResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/notification/src/enhancements.ts#L34) <code v-pre>packages/notification/src/enhancements.ts</code>

```ts
export interface BatchSendResult {
    total: number;
    succeeded: number;
    failed: number;
    results: NotificationSendResult[];
}
```

#### <code v-pre>CircuitBreaker</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/notification/src/enhancements.ts#L143) <code v-pre>packages/notification/src/enhancements.ts</code>

```ts
export interface CircuitBreaker {
    state: () => CircuitState;
    sendPush: (msg: PushMessage) => Promise<NotificationSendResult & {
        circuitState: CircuitState;
    }>;
    reset: () => void;
    failureCount: () => number;
}
```

#### <code v-pre>CircuitBreakerOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/notification/src/enhancements.ts#L137) <code v-pre>packages/notification/src/enhancements.ts</code>

```ts
export interface CircuitBreakerOptions {
    failureThreshold?: number;
    resetTimeoutMs?: number;
    now?: () => number;
}
```

#### <code v-pre>CircuitState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/notification/src/enhancements.ts#L135) <code v-pre>packages/notification/src/enhancements.ts</code>

```ts
export type CircuitState = 'closed' | 'open' | 'half-open';
```

#### <code v-pre>HookCallback</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/notification/src/enhancements.ts#L96) <code v-pre>packages/notification/src/enhancements.ts</code>

```ts
export type HookCallback = (ctx: HookContext) => void;
```

#### <code v-pre>HookContext</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/notification/src/enhancements.ts#L89) <code v-pre>packages/notification/src/enhancements.ts</code>

```ts
export interface HookContext {
    event: SendHookEvent;
    message: PushMessage;
    result?: NotificationSendResult;
    error?: string;
}
```

#### <code v-pre>HookRegistry</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/notification/src/enhancements.ts#L98) <code v-pre>packages/notification/src/enhancements.ts</code>

```ts
export interface HookRegistry {
    register: (event: SendHookEvent, cb: HookCallback) => () => void;
    emit: (event: SendHookEvent, ctx: HookContext) => void;
    count: (event: SendHookEvent) => number;
}
```

#### <code v-pre>IdempotencyCache</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/notification/src/enhancements.ts#L56) <code v-pre>packages/notification/src/enhancements.ts</code>

```ts
export interface IdempotencyCache {
    get: (key: string) => NotificationSendResult | undefined;
    set: (key: string, value: NotificationSendResult) => void;
    size: () => number;
    clear: () => void;
}
```

#### <code v-pre>RetryOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/notification/src/enhancements.ts#L8) <code v-pre>packages/notification/src/enhancements.ts</code>

```ts
export interface RetryOptions {
    maxAttempts?: number;
    initialDelayMs?: number;
    onRetry?: (attempt: number) => void;
}
```

#### <code v-pre>SendHookEvent</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/notification/src/enhancements.ts#L87) <code v-pre>packages/notification/src/enhancements.ts</code>

```ts
export type SendHookEvent = 'before-send' | 'after-send' | 'error';
```
