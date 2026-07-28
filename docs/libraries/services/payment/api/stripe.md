---
title: "@kiwa-lab/payment stripe の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/payment</code> <code v-pre>stripe</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/stripe.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>createStripeMock</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/stripe.ts#L10) <code v-pre>packages/payment/src/stripe.ts</code>

Stripe webhook mock. Real Stripe: `Stripe-Signature: t={ts},v1={sig}` over `{ts}.{body}`, secret from `whsec_*`. This mock exercises the same HMAC-SHA256 signing so tests that verify with the real Stripe SDK can run against this fixture.

```ts
export declare function createStripeMock(config?: {
    secret?: string;
    toleranceMs?: number;
    now?: () => number;
}): PaymentAdapter;
```


