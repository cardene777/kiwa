---
title: "@kiwa-lab/email circuit-breaker の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/email</code> <code v-pre>circuit-breaker</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/email/src/circuit-breaker.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>createCircuitBreaker</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/email/src/circuit-breaker.ts#L22) <code v-pre>packages/email/src/circuit-breaker.ts</code>

circuit breaker: failureThreshold 連続 failure で state=open、 resetTimeoutMs 経過後 half-open で 1 回試行、 success で closed 復帰。

```ts
export declare function createCircuitBreaker(client: EmailClient, options?: CircuitBreakerOptions): CircuitBreaker;
```

### 型

#### <code v-pre>CircuitBreaker</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/email/src/circuit-breaker.ts#L11) <code v-pre>packages/email/src/circuit-breaker.ts</code>

```ts
export interface CircuitBreaker {
    state: () => CircuitState;
    send: (msg: EmailMessage) => Promise<EmailSendResult & {
        circuitState: CircuitState;
    }>;
    reset: () => void;
    failureCount: () => number;
}
```

#### <code v-pre>CircuitBreakerOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/email/src/circuit-breaker.ts#L5) <code v-pre>packages/email/src/circuit-breaker.ts</code>

```ts
export interface CircuitBreakerOptions {
    failureThreshold?: number;
    resetTimeoutMs?: number;
    now?: () => number;
}
```

#### <code v-pre>CircuitState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/email/src/circuit-breaker.ts#L3) <code v-pre>packages/email/src/circuit-breaker.ts</code>

```ts
export type CircuitState = 'closed' | 'open' | 'half-open';
```
