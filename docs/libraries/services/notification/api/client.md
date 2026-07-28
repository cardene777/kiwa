---
title: "@kiwa-lab/notification client の API 契約"
---

# <code v-pre>@kiwa-lab/notification</code> <code v-pre>client</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/notification/src/client.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>createNotificationClient</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/notification/src/client.ts#L70) <code v-pre>packages/notification/src/client.ts</code>

provider 別のみ id prefix + status label に mock 差を出しつつ、 全 channel を共通 interface で 叩ける。 実 SDK (Firebase Admin / apns2 / twilio /

```ts
export declare function createNotificationClient(options?: CreateNotificationClientOptions): NotificationClient;
```

### 型

#### <code v-pre>InAppMessage</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/notification/src/client.ts#L22) <code v-pre>packages/notification/src/client.ts</code>

```ts
export interface InAppMessage {
    userId: string;
    title: string;
    body: string;
    category?: string;
    metadata?: Record<string, string | number | boolean>;
}
```

#### <code v-pre>NotificationChannel</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/notification/src/client.ts#L4) <code v-pre>packages/notification/src/client.ts</code>

```ts
export type NotificationChannel = 'push' | 'sms' | 'in-app';
```

#### <code v-pre>NotificationClient</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/notification/src/client.ts#L43) <code v-pre>packages/notification/src/client.ts</code>

```ts
export interface NotificationClient {
    pushProvider: PushProvider;
    smsProvider: SmsProvider;
    sendPush: (msg: PushMessage) => Promise<NotificationSendResult>;
    sendSMS: (msg: SmsMessage) => Promise<NotificationSendResult>;
    sendInApp: (msg: InAppMessage) => Promise<NotificationSendResult>;
    dispatch: (channels: NotificationChannel[], payload: {
        push?: PushMessage;
        sms?: SmsMessage;
        inApp?: InAppMessage;
    }) => Promise<NotificationSendResult[]>;
    listSent: () => SentNotificationRecord[];
    clear: () => void;
}
```

#### <code v-pre>NotificationProvider</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/notification/src/client.ts#L3) <code v-pre>packages/notification/src/client.ts</code>

```ts
export type NotificationProvider = PushProvider | SmsProvider | 'in-app';
```

#### <code v-pre>NotificationSendResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/notification/src/client.ts#L30) <code v-pre>packages/notification/src/client.ts</code>

```ts
export interface NotificationSendResult {
    id: string;
    channel: NotificationChannel;
    provider: NotificationProvider;
    status: 'queued' | 'sent' | 'failed';
    acceptedAt: number;
    reason?: string;
}
```

#### <code v-pre>PushMessage</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/notification/src/client.ts#L6) <code v-pre>packages/notification/src/client.ts</code>

```ts
export interface PushMessage {
    deviceToken: string;
    title: string;
    body: string;
    data?: Record<string, string>;
    badge?: number;
    sound?: string;
}
```

#### <code v-pre>PushProvider</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/notification/src/client.ts#L1) <code v-pre>packages/notification/src/client.ts</code>

```ts
export type PushProvider = 'fcm' | 'apns';
```

#### <code v-pre>SentNotificationRecord</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/notification/src/client.ts#L39) <code v-pre>packages/notification/src/client.ts</code>

```ts
export interface SentNotificationRecord extends NotificationSendResult {
    message: PushMessage | SmsMessage | InAppMessage;
}
```

#### <code v-pre>SmsMessage</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/notification/src/client.ts#L15) <code v-pre>packages/notification/src/client.ts</code>

```ts
export interface SmsMessage {
    to: string;
    from: string;
    body: string;
    mediaUrl?: string;
}
```

#### <code v-pre>SmsProvider</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/notification/src/client.ts#L2) <code v-pre>packages/notification/src/client.ts</code>

```ts
export type SmsProvider = 'twilio' | 'sns';
```
