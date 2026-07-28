---
title: "@kiwa-lab/payment semantics-retry の API 契約"
---

# <code v-pre>@kiwa-lab/payment</code> <code v-pre>semantics-retry</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/retry.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>retryBackoffMs</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/retry.ts#L38) <code v-pre>packages/payment/src/semantics/retry.ts</code>

Compute the deterministic delay for attempt N (1-indexed). Attempt 1 has no backoff (fires immediately), attempt N &gt; 1 waits baseBackoffMs * 2^(N-2).

```ts
export declare function retryBackoffMs(attempt: number, baseBackoffMs: number): number;
```

#### <code v-pre>retryDeliver</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/retry.ts#L72) <code v-pre>packages/payment/src/semantics/retry.ts</code>

Attempt to deliver the event. If `succeed: true` the event is emitted through the adapter and the session terminates in `delivered`. If `succeed: false` and attempts remain, emits `retry.scheduled` and returns with the next delay. Once maxAttempts is reached without success, the session terminates in `abandoned`.

```ts
export declare function retryDeliver(adapter: PaymentAdapter, session: RetrySession, input: {
    succeed: boolean;
}): Promise<AxisStep<RetryState>>;
```

#### <code v-pre>startRetry</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/retry.ts#L50) <code v-pre>packages/payment/src/semantics/retry.ts</code>

Start a retry session for a given webhook event. The event is not emitted yet — call {@link retryDeliver} with `succeed: true` to emit and mark delivered, or `succeed: false` to schedule the next backoff. The idempotencyKey defaults to `event.id` so downstream consumers can dedupe repeated deliveries of the same event.

```ts
export declare function startRetry(input: {
    event: PaymentWebhookEvent;
    idempotencyKey?: string;
    config?: RetryConfig;
}): RetrySession;
```

### 型

#### <code v-pre>RetryConfig</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/retry.ts#L14) <code v-pre>packages/payment/src/semantics/retry.ts</code>

```ts
export interface RetryConfig {
    maxAttempts?: number;
    /** milliseconds between attempt N and N+1 = baseBackoffMs * 2^(N-1) */
    baseBackoffMs?: number;
}
```

#### <code v-pre>RetrySession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/retry.ts#L20) <code v-pre>packages/payment/src/semantics/retry.ts</code>

```ts
export interface RetrySession {
    idempotencyKey: string;
    event: PaymentWebhookEvent;
    attempt: number;
    state: RetryState;
    config: Required<RetryConfig>;
    history: AxisStep<RetryState>[];
}
```

#### <code v-pre>RetryState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/retry.ts#L12) <code v-pre>packages/payment/src/semantics/retry.ts</code>

Webhook delivery retry semantics. All 3 real providers retry undelivered webhooks with exponential backoff until a configured max attempt count (Stripe = 3 days at increasing intervals, Paddle = 3 attempts at 5s / 5m / 10m, Lemon Squeezy = up to 3 attempts). The mock reproduces the observable envelope: an idempotency key per event, backoff schedule, and a max-attempt abandon terminal state.

```ts
export type RetryState = 'scheduled' | 'delivered' | 'abandoned';
```
