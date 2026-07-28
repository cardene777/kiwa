---
title: "@kiwa-lab/notification sms の API 契約"
---

# <code v-pre>@kiwa-lab/notification</code> <code v-pre>sms</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/notification/src/sms.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>sendSMS</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/notification/src/sms.ts#L8) <code v-pre>packages/notification/src/sms.ts</code>

```ts
export declare function sendSMS(client: NotificationClient, msg: SmsMessage, _config?: SmsDeliveryConfig): Promise<NotificationSendResult>;
```

### 型

#### <code v-pre>SmsDeliveryConfig</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/notification/src/sms.ts#L3) <code v-pre>packages/notification/src/sms.ts</code>

```ts
export interface SmsDeliveryConfig {
    statusCallback?: string;
    maxPrice?: number;
}
```
