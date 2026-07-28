---
title: "@kiwa-lab/feature-flag circuit-breaker の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/feature-flag</code> <code v-pre>circuit-breaker</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/feature-flag/src/circuit-breaker.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>createCircuitBreaker</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/feature-flag/src/circuit-breaker.ts#L20) <code v-pre>packages/feature-flag/src/circuit-breaker.ts</code>

```ts
export declare function createCircuitBreaker(options?: CircuitBreakerOptions): CircuitBreaker;
```

### 型

#### <code v-pre>CircuitBreaker</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/feature-flag/src/circuit-breaker.ts#L13) <code v-pre>packages/feature-flag/src/circuit-breaker.ts</code>

```ts
export interface CircuitBreaker {
    state: () => CircuitState;
    evaluate: (client: FlagClient, key: string, user: FlagUser) => EvaluateFlagResult & {
        circuitState: CircuitState;
    };
    reset: () => void;
    errorCount: () => number;
}
```

#### <code v-pre>CircuitBreakerOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/feature-flag/src/circuit-breaker.ts#L6) <code v-pre>packages/feature-flag/src/circuit-breaker.ts</code>

```ts
export interface CircuitBreakerOptions {
    errorThreshold?: number;
    resetTimeoutMs?: number;
    fallbackValue?: unknown;
    now?: () => number;
}
```

#### <code v-pre>CircuitState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/feature-flag/src/circuit-breaker.ts#L4) <code v-pre>packages/feature-flag/src/circuit-breaker.ts</code>

```ts
export type CircuitState = 'closed' | 'open' | 'half-open';
```
