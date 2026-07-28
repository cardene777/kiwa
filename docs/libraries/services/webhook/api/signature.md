---
title: "@kiwa-lab/webhook signature の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/webhook</code> <code v-pre>signature</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/webhook/src/signature.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>verifyWebhookSignature</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/webhook/src/signature.ts#L24) <code v-pre>packages/webhook/src/signature.ts</code>

provider 別 webhook 署名を検証。 実 provider が送る signature format を再現。 - stripe = `t=&lt;ts&gt;,v1=&lt;hex&gt;` 形式、 sha256 hex、 toleranceSec 内のみ valid - github = `sha256=&lt;hex&gt;` 形式、 sha256 hex - slack = `v0=&lt;hex&gt;` 形式 (`v0:&lt;ts&gt;:&lt;body&gt;` を base string に)、 sha256 hex - twilio = base64、 sha1 (URL + form params) - mock では payload そのままを署名対象にする

```ts
export declare function verifyWebhookSignature(payload: string, signature: string, secret: string, provider: WebhookProvider, options?: VerifySignatureOptions): SignatureVerifyResult;
```

### 型

#### <code v-pre>SignatureVerifyResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/webhook/src/signature.ts#L4) <code v-pre>packages/webhook/src/signature.ts</code>

```ts
export interface SignatureVerifyResult {
    valid: boolean;
    provider: WebhookProvider;
    algorithm: string;
    reason?: string;
}
```

#### <code v-pre>VerifySignatureOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/webhook/src/signature.ts#L11) <code v-pre>packages/webhook/src/signature.ts</code>

```ts
export interface VerifySignatureOptions {
    toleranceSec?: number;
    now?: () => number;
}
```
