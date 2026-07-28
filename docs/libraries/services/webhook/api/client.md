---
title: "@kiwa-lab/webhook client の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/webhook</code> <code v-pre>client</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/webhook/src/client.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>createWebhookVerifier</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/webhook/src/client.ts#L47) <code v-pre>packages/webhook/src/client.ts</code>

provider 別 verifier を作成。 verify() 呼出で signature + payload parse + record を atomic に実行し、 listDelivered() で受信ログを取り出せる in-process mock。 実 provider (Stripe Events API / GitHub webhook / Slack Events API / Twilio) の signature 検証と event shape を同じ signature で再現する。

```ts
export declare function createWebhookVerifier(options: CreateWebhookVerifierOptions): WebhookVerifier;
```

### 型

#### <code v-pre>DeliveredWebhookRecord</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/webhook/src/client.ts#L21) <code v-pre>packages/webhook/src/client.ts</code>

```ts
export interface DeliveredWebhookRecord extends WebhookVerifyOutcome {
    raw: IncomingWebhook;
    signatureResult: SignatureVerifyResult;
}
```

#### <code v-pre>IncomingWebhook</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/webhook/src/client.ts#L6) <code v-pre>packages/webhook/src/client.ts</code>

```ts
export interface IncomingWebhook {
    payload: string;
    signature: string;
    headers?: Record<string, string>;
}
```

#### <code v-pre>WebhookProvider</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/webhook/src/client.ts#L4) <code v-pre>packages/webhook/src/client.ts</code>

```ts
export type WebhookProvider = 'stripe' | 'github' | 'slack' | 'twilio';
```

#### <code v-pre>WebhookVerifier</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/webhook/src/client.ts#L26) <code v-pre>packages/webhook/src/client.ts</code>

```ts
export interface WebhookVerifier {
    provider: WebhookProvider;
    verify: (incoming: IncomingWebhook) => WebhookVerifyOutcome;
    listDelivered: () => DeliveredWebhookRecord[];
    clear: () => void;
}
```

#### <code v-pre>WebhookVerifyOutcome</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/webhook/src/client.ts#L12) <code v-pre>packages/webhook/src/client.ts</code>

```ts
export interface WebhookVerifyOutcome {
    id: string;
    provider: WebhookProvider;
    status: 'verified' | 'rejected';
    reason?: string;
    event?: NormalizedWebhookEvent;
    receivedAt: number;
}
```
