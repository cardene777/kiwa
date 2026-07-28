---
title: "@kiwa-lab/webhook payload の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/webhook</code> <code v-pre>payload</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/webhook/src/payload.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>parseWebhookPayload</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/webhook/src/payload.ts#L34) <code v-pre>packages/webhook/src/payload.ts</code>

provider 別 event payload を統一 shape に正規化。 field 名の違い (Stripe = type / GitHub = X-GitHub-Event header header → raw.event / Slack = event.type / Twilio = MessageStatus) を吸収する。

```ts
export declare function parseWebhookPayload(rawEvent: RawWebhookEvent): NormalizedWebhookEvent;
```

### 型

#### <code v-pre>NormalizedWebhookEvent</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/webhook/src/payload.ts#L21) <code v-pre>packages/webhook/src/payload.ts</code>

```ts
export interface NormalizedWebhookEvent {
    type: WebhookEventType;
    provider: WebhookProvider;
    eventId: string;
    occurredAt: number;
    resource?: string;
}
```

#### <code v-pre>RawWebhookEvent</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/webhook/src/payload.ts#L16) <code v-pre>packages/webhook/src/payload.ts</code>

```ts
export interface RawWebhookEvent {
    provider: WebhookProvider;
    raw: Record<string, unknown>;
}
```

#### <code v-pre>WebhookEventType</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/webhook/src/payload.ts#L3) <code v-pre>packages/webhook/src/payload.ts</code>

```ts
export type WebhookEventType = 'payment.succeeded' | 'payment.failed' | 'subscription.updated' | 'push' | 'pull_request' | 'issues' | 'message' | 'app_mention' | 'sms.delivered' | 'sms.failed' | 'unknown';
```
