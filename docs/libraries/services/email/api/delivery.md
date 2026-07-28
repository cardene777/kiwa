---
title: "@kiwa-lab/email delivery の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/email</code> <code v-pre>delivery</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/email/src/delivery.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>parseDeliveryEvent</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/email/src/delivery.ts#L23) <code v-pre>packages/email/src/delivery.ts</code>

provider 別 event payload を統一 shape に正規化。 実 provider が返す field 名の違い (Resend = type / SendGrid = event / Postmark = RecordType / SES = eventType) を吸収。

```ts
export declare function parseDeliveryEvent(rawEvent: RawDeliveryEvent): NormalizedDeliveryEvent;
```

### 型

#### <code v-pre>DeliveryEventType</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/email/src/delivery.ts#L3) <code v-pre>packages/email/src/delivery.ts</code>

```ts
export type DeliveryEventType = 'delivered' | 'bounced' | 'opened' | 'clicked' | 'complained' | 'unknown';
```

#### <code v-pre>NormalizedDeliveryEvent</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/email/src/delivery.ts#L10) <code v-pre>packages/email/src/delivery.ts</code>

```ts
export interface NormalizedDeliveryEvent {
    type: DeliveryEventType;
    provider: EmailProvider;
    emailId: string;
    timestamp: number;
    recipient?: string;
    reason?: string;
}
```

#### <code v-pre>RawDeliveryEvent</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/email/src/delivery.ts#L5) <code v-pre>packages/email/src/delivery.ts</code>

```ts
export interface RawDeliveryEvent {
    provider: EmailProvider;
    raw: Record<string, unknown>;
}
```
