---
title: "@kiwa-lab/email signature の API 契約"
---

# <code v-pre>@kiwa-lab/email</code> <code v-pre>signature</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/email/src/signature.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>verifyWebhookSignature</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/email/src/signature.ts#L15) <code v-pre>packages/email/src/signature.ts</code>

provider 別 webhook 署名を検証。 real provider (Resend / SendGrid / Postmark / SES) が 実際に送る signature format (sha256 hex / base64) を再現。

```ts
export declare function verifyWebhookSignature(payload: string, signature: string, secret: string, provider: EmailProvider): SignatureVerifyResult;
```

### 型

#### <code v-pre>SignatureVerifyResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/email/src/signature.ts#L4) <code v-pre>packages/email/src/signature.ts</code>

```ts
export interface SignatureVerifyResult {
    valid: boolean;
    provider: EmailProvider;
    algorithm: string;
    reason?: string;
}
```
