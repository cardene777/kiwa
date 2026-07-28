---
title: "@kiwa-lab/workflow index の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/workflow</code> <code v-pre>index</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/workflow/src/index.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)



### 型

#### <code v-pre>ResilienceRetryOptions</code>

公開 entry point から解決しています。

<code v-pre>RetryOptions</code> を <code v-pre>ResilienceRetryOptions</code> として公開しています。

```ts
export {
  withRetry,
  withTimeout,
  withRateLimit,
  withCircuitBreaker,
  withObservability,
  withIdempotencyKey,
  batchOperate,
  type RetryOptions as ResilienceRetryOptions,
  type TimeoutOptions,
  type RateLimitOptions,
  type CircuitBreakerOptions,
  type ObservabilityHook,
  type BatchItem,
  type BatchResult,
} from './resilience.js';
```
