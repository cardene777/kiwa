---
title: "@kiwa-lab/payment semantics-webhook-idempotency の API 契約"
---

# <code v-pre>@kiwa-lab/payment</code> <code v-pre>semantics-webhook-idempotency</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/webhook-idempotency.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>deliver</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/webhook-idempotency.ts#L70) <code v-pre>packages/payment/src/semantics/webhook-idempotency.ts</code>

Attempt to deliver an event to the handler. Returns true if the caller should invoke the handler; false if the event was deduped, replay-blocked, or already poisoned.

```ts
export declare function deliver(adapter: PaymentAdapter, session: WebhookIdempotencySession, event: PaymentWebhookEvent): Promise<{
    deliver: boolean;
    step: AxisStep<WebhookState>;
}>;
```

#### <code v-pre>reportFailure</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/webhook-idempotency.ts#L125) <code v-pre>packages/payment/src/semantics/webhook-idempotency.ts</code>

Report handler failure — bumps the failure counter and eventually transitions to poison state.

```ts
export declare function reportFailure(session: WebhookIdempotencySession, event: PaymentWebhookEvent): number;
```

#### <code v-pre>rotateSignature</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/webhook-idempotency.ts#L139) <code v-pre>packages/payment/src/semantics/webhook-idempotency.ts</code>

Rotate the signing secret. Emits `webhook.signature_rotated` so downstream consumers know to refresh their cached secret.

```ts
export declare function rotateSignature(adapter: PaymentAdapter, session: WebhookIdempotencySession): Promise<AxisStep<WebhookState>>;
```

#### <code v-pre>startIdempotency</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/webhook-idempotency.ts#L50) <code v-pre>packages/payment/src/semantics/webhook-idempotency.ts</code>

Start an idempotency session tied to a specific handler. Handler names scope the dedup table so different handlers can process the same event without interference.

```ts
export declare function startIdempotency(input: {
    handlerName: string;
    config?: WebhookIdempotencyConfig;
}): WebhookIdempotencySession;
```

### 型

#### <code v-pre>WebhookIdempotencyConfig</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/webhook-idempotency.ts#L20) <code v-pre>packages/payment/src/semantics/webhook-idempotency.ts</code>

```ts
export interface WebhookIdempotencyConfig {
    /** ms window for dedup lookups (event ids older than this are pruned) */
    dedupWindowMs?: number;
    /** max redelivery attempts before poison-queue */
    maxDeliveryAttempts?: number;
    /** ms window for replay protection (timestamp tolerance) */
    replayToleranceMs?: number;
}
```

#### <code v-pre>WebhookIdempotencySession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/webhook-idempotency.ts#L29) <code v-pre>packages/payment/src/semantics/webhook-idempotency.ts</code>

```ts
export interface WebhookIdempotencySession {
    handlerName: string;
    config: Required<WebhookIdempotencyConfig>;
    seenIds: Map<string, number>;
    signatureVersion: number;
    deliveryFailures: Map<string, number>;
    state: WebhookState;
    history: AxisStep<WebhookState>[];
}
```

#### <code v-pre>WebhookState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/webhook-idempotency.ts#L13) <code v-pre>packages/payment/src/semantics/webhook-idempotency.ts</code>

Webhook idempotency advanced axis — dedup key + replay protection + signature rotation + poison queue. Real payment webhooks routinely duplicate (retry storms, at-least-once delivery), replay attackers can capture and resubmit a valid signed body inside the tolerance window, providers rotate signing secrets during incident response, and repeatedly failing handlers need to be sidelined into a poison queue so successful traffic isn't blocked.

```ts
export type WebhookState = 'idle' | 'dedup-hit' | 'replay-blocked' | 'rotated' | 'poisoned';
```
