---
title: "@kiwa-lab/payment fixture の API 契約"
---

# <code v-pre>@kiwa-lab/payment</code> <code v-pre>fixture</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/fixture.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>checkoutCompleted</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/fixture.ts#L12) <code v-pre>packages/payment/src/fixture.ts</code>

Common fixture builders for the 3 provider mocks. Each fixture returns an already-signed webhook (rawBody + signature + parsed event) so tests can either pass the rawBody + signature into `verifyWebhook` or hand the event directly to `emit`. Only high-frequency event types are covered here — for provider-specific event types, call `signWebhook({ type: '...', ... })` directly.

```ts
export declare const checkoutCompleted: (adapter: PaymentAdapter, input: {
    amountCents: number;
    currency?: string;
    customerId: string;
}) => {
    rawBody: string;
    signature: string;
    event: PaymentWebhookEvent;
};
```

#### <code v-pre>paymentFailed</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/fixture.ts#L34) <code v-pre>packages/payment/src/fixture.ts</code>

```ts
export declare const paymentFailed: (adapter: PaymentAdapter, input: {
    amountCents: number;
    currency?: string;
    customerId: string;
}) => {
    rawBody: string;
    signature: string;
    event: PaymentWebhookEvent;
};
```

#### <code v-pre>refunded</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/fixture.ts#L45) <code v-pre>packages/payment/src/fixture.ts</code>

```ts
export declare const refunded: (adapter: PaymentAdapter, input: {
    amountCents: number;
    currency?: string;
    customerId: string;
}) => {
    rawBody: string;
    signature: string;
    event: PaymentWebhookEvent;
};
```

#### <code v-pre>subscriptionCreated</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/fixture.ts#L23) <code v-pre>packages/payment/src/fixture.ts</code>

```ts
export declare const subscriptionCreated: (adapter: PaymentAdapter, input: {
    amountCents: number;
    currency?: string;
    customerId: string;
}) => {
    rawBody: string;
    signature: string;
    event: PaymentWebhookEvent;
};
```


