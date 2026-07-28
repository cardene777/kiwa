---
title: "@kiwa-lab/webhook delivery の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/webhook</code> <code v-pre>delivery</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/webhook/src/delivery.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>dispatchWithRetry</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/webhook/src/delivery.ts#L28) <code v-pre>packages/webhook/src/delivery.ts</code>

exponential backoff で handler を retry する delivery loop。 実 webhook subscriber (Stripe / GitHub の redelivery loop) を再現するための test helper。 sleep は injectable なので test では即 resolve で回せる。

```ts
export declare function dispatchWithRetry(handler: (event: NormalizedWebhookEvent) => Promise<void>, event: NormalizedWebhookEvent, options?: DispatchRetryOptions): Promise<DispatchRetryResult>;
```

### 型

#### <code v-pre>DispatchAttempt</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/webhook/src/delivery.ts#L10) <code v-pre>packages/webhook/src/delivery.ts</code>

```ts
export interface DispatchAttempt {
    attempt: number;
    ok: boolean;
    durationMs: number;
    error?: string;
}
```

#### <code v-pre>DispatchRetryOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/webhook/src/delivery.ts#L3) <code v-pre>packages/webhook/src/delivery.ts</code>

```ts
export interface DispatchRetryOptions {
    maxAttempts?: number;
    initialDelayMs?: number;
    backoffFactor?: number;
    sleep?: (ms: number) => Promise<void>;
}
```

#### <code v-pre>DispatchRetryResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/webhook/src/delivery.ts#L17) <code v-pre>packages/webhook/src/delivery.ts</code>

```ts
export interface DispatchRetryResult {
    delivered: boolean;
    attempts: DispatchAttempt[];
    totalDurationMs: number;
}
```
