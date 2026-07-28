---
title: "@kiwa-lab/payment types の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/payment</code> <code v-pre>types</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/types.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>PAYMENT&#95;PROVIDERS</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/types.ts#L16) <code v-pre>packages/payment/src/types.ts</code>

Runtime tuple of every payment provider, kept in sync with the `PaymentProvider` union above via `satisfies`. Downstream consumers use this to iterate provider ids at runtime (release-gate axis dispatch, fixture registration) without duplicating the string literals or reaching for reflection.

```ts
export declare const PAYMENT_PROVIDERS: readonly ["stripe", "paddle", "lemonsqueezy"];
```

### 型

#### <code v-pre>PaymentAdapter</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/types.ts#L58) <code v-pre>packages/payment/src/types.ts</code>

Adapter contract every provider mock implements. The 3 ops are the intersection kiwa tests actually assert on: - `signWebhook` — build a raw payload + signature pair (fixture) - `verifyWebhook` — verify signature + parse (mock server) - `emit` — synchronous fake webhook dispatch to registered handlers

```ts
export interface PaymentAdapter {
    readonly provider: PaymentProvider;
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

#### <code v-pre>PaymentProvider</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/types.ts#L7) <code v-pre>packages/payment/src/types.ts</code>

Payment provider identifier — provider prefix used by release-gate to dispatch axis evaluation. All

```ts
export type PaymentProvider = 'stripe' | 'paddle' | 'lemonsqueezy';
```

#### <code v-pre>PaymentWebhookEvent</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/types.ts#L28) <code v-pre>packages/payment/src/types.ts</code>

A canonical webhook event shape shared across the three providers. Real providers emit slightly different payloads (Stripe uses `data.object`, Paddle uses `data.attributes`, Lemon Squeezy nests under `data.attributes` too but with different keys). This shape captures the intersection that kiwa mocks assert on — id, event type, amount + currency, customer, and a timestamp. The provider-specific `raw` field carries the exact raw webhook body a real client would sign, so signature verify tests exercise the actual bytes.

```ts
export interface PaymentWebhookEvent {
    provider: PaymentProvider;
    id: string;
    type: string;
    amountCents: number;
    currency: string;
    customerId: string;
    timestamp: number;
    raw: string;
}
```

#### <code v-pre>WebhookVerifyResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/types.ts#L45) <code v-pre>packages/payment/src/types.ts</code>

Signature verify result — returned by every provider's `verifyWebhook`. Includes the parsed event on success and a reason string on failure so kiwa tests can assert on specific rejection paths without string-matching the whole error message.

```ts
export interface WebhookVerifyResult {
    ok: boolean;
    event: PaymentWebhookEvent | null;
    reason: 'ok' | 'bad-signature' | 'stale-timestamp' | 'malformed-body';
}
```
