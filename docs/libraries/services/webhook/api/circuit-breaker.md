---
title: "@kiwa-lab/webhook circuit-breaker の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/webhook</code> <code v-pre>circuit-breaker</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/webhook/src/circuit-breaker.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>createCircuitBreaker</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/webhook/src/circuit-breaker.ts#L19) <code v-pre>packages/webhook/src/circuit-breaker.ts</code>

circuit breaker: rejectionThreshold 連続 rejection で open、 resetTimeoutMs 後 half-open。

```ts
export declare function createCircuitBreaker(verifier: WebhookVerifier, options?: CircuitBreakerOptions): CircuitBreaker;
```

### 型

#### <code v-pre>CircuitBreaker</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/webhook/src/circuit-breaker.ts#L11) <code v-pre>packages/webhook/src/circuit-breaker.ts</code>

```ts
export interface CircuitBreaker {
    state: () => CircuitState;
    verify: (incoming: IncomingWebhook) => WebhookVerifyOutcome & {
        circuitState: CircuitState;
    };
    reset: () => void;
    rejectionCount: () => number;
}
```

#### <code v-pre>CircuitBreakerOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/webhook/src/circuit-breaker.ts#L5) <code v-pre>packages/webhook/src/circuit-breaker.ts</code>

```ts
export interface CircuitBreakerOptions {
    rejectionThreshold?: number;
    resetTimeoutMs?: number;
    now?: () => number;
}
```

#### <code v-pre>CircuitState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/webhook/src/circuit-breaker.ts#L3) <code v-pre>packages/webhook/src/circuit-breaker.ts</code>

```ts
export type CircuitState = 'closed' | 'open' | 'half-open';
```
