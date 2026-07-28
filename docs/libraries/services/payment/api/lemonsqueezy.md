---
title: "@kiwa-lab/payment lemonsqueezy の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/payment</code> <code v-pre>lemonsqueezy</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/lemonsqueezy.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>createLemonSqueezyMock</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/lemonsqueezy.ts#L10) <code v-pre>packages/payment/src/lemonsqueezy.ts</code>

Lemon Squeezy webhook mock. Real Lemon Squeezy: `X-Signature: hmac_sha256({body})` (no timestamp mixed in — LS signs the raw body only, verified against a webhook secret). The mock still adds a timestamp for freshness checks so tests can exercise stale rejection.

```ts
export declare function createLemonSqueezyMock(config?: {
    secret?: string;
    toleranceMs?: number;
    now?: () => number;
}): PaymentAdapter;
```


