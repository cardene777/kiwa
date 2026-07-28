---
title: "@kiwa-lab/notification delivery の API 契約"
---

# <code v-pre>@kiwa-lab/notification</code> <code v-pre>delivery</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/notification/src/delivery.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>parseNotificationEvent</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/notification/src/delivery.ts#L24) <code v-pre>packages/notification/src/delivery.ts</code>

provider 別 event payload を統一 shape に正規化。 fcm=notification_id / apns=apns-id / twilio=MessageSid / sns=MessageId / in-app=id の field 差を吸収。

```ts
export declare function parseNotificationEvent(rawEvent: RawNotificationEvent): NormalizedNotificationEvent;
```

### 型

#### <code v-pre>NormalizedNotificationEvent</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/notification/src/delivery.ts#L10) <code v-pre>packages/notification/src/delivery.ts</code>

```ts
export interface NormalizedNotificationEvent {
    type: NotificationEventType;
    provider: NotificationProvider;
    channel: NotificationChannel;
    notificationId: string;
    timestamp: number;
    recipient?: string;
    reason?: string;
}
```

#### <code v-pre>NotificationEventType</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/notification/src/delivery.ts#L3) <code v-pre>packages/notification/src/delivery.ts</code>

```ts
export type NotificationEventType = 'delivered' | 'opened' | 'clicked' | 'failed' | 'unknown';
```

#### <code v-pre>RawNotificationEvent</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/notification/src/delivery.ts#L5) <code v-pre>packages/notification/src/delivery.ts</code>

```ts
export interface RawNotificationEvent {
    provider: NotificationProvider;
    raw: Record<string, unknown>;
}
```
