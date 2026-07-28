---
title: "@kiwa-lab/payment engine の API 契約"
---

# <code v-pre>@kiwa-lab/payment</code> <code v-pre>engine</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/engine.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>PaymentEngine</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/engine.ts#L29) <code v-pre>packages/payment/src/engine.ts</code>

```ts
export declare class PaymentEngine implements PaymentAdapter {
    readonly provider: PaymentProvider;
    constructor(config: EngineConfig);
    signWebhook(input: {
        type: string;
        amountCents: number;
        currency?: string;
        customerId: string;
        timestamp?: number;
    }): {
        rawBody: string;
        signature: string;
        event: PaymentWebhookEvent;
    };
    verifyWebhook(input: {
        rawBody: string;
        signature: string;
        toleranceMs?: number;
    }): WebhookVerifyResult;
    onWebhook(handler: (event: PaymentWebhookEvent) => void | Promise<void>): () => void;
    emit(event: PaymentWebhookEvent): Promise<void>;
}
```

### 型

#### <code v-pre>EngineConfig</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/engine.ts#L20) <code v-pre>packages/payment/src/engine.ts</code>

Shared engine used by all 3 provider adapters. Handles the HMAC signing + verify + registered handler dispatch. Provider-specific bits (signature scheme, timestamp format, event id prefix, payload shape) are injected via the {@link EngineConfig}. All 3 real providers use HMAC-SHA256 over some canonical serialization of `{timestamp}.{body}` — Stripe's `Stripe-Signature` header is the canonical example, Paddle uses `Paddle-Signature`, Lemon Squeezy uses `X-Signature`. The mock exercises the same bytes.

```ts
export interface EngineConfig {
    provider: PaymentProvider;
    secret: string;
    idPrefix: string;
    toleranceMs: number;
    now(): number;
    buildRawBody(event: PaymentWebhookEvent): string;
}
```
