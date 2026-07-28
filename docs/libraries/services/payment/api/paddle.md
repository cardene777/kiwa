---
title: "@kiwa-lab/payment paddle の API 契約"
---

# <code v-pre>@kiwa-lab/payment</code> <code v-pre>paddle</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/paddle.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>createPaddleMock</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/paddle.ts#L10) <code v-pre>packages/payment/src/paddle.ts</code>

Paddle Billing (Paddle v2) webhook mock. Real Paddle: `Paddle-Signature: ts=...;h1=...` over `{ts}:{body}` with HMAC-SHA256, notification secret. Shape difference vs Stripe: Paddle uses `data.attributes.*` instead of `data.object.*`.

```ts
export declare function createPaddleMock(config?: {
    secret?: string;
    toleranceMs?: number;
    now?: () => number;
}): PaymentAdapter;
```


