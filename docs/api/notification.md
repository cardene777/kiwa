# @kiwa-lab/notification API reference

## Overview

`@kiwa-lab/notification` は FCM (push) / APNs (push) / Twilio (SMS) / AWS SNS / in-app 5 channel を統一 interface で mock する multi-channel notification test infra。 send + delivery event 正規化を統一 shape で扱う。

## Supported providers / channels

| channel | provider | delivery event |
|---|---|---|
| push | fcm | delivered / opened / clicked / failed |
| push | apns | delivered / opened / clicked / failed |
| sms | twilio | queued / sent / delivered / failed |
| push+sms | sns | delivered / failed |
| inapp | (in-process) | delivered / read |

## Main API

### `createNotificationClient(options): NotificationClient`

provider + channel 別 mock client、 `sendPush` / `sendSMS` / `sendInApp` の統一 API を持つ。

### `sendPush(client, msg: PushMessage, config?: PushDeliveryConfig): Promise<NotificationSendResult>`

FCM / APNs / SNS への push 送信 mock、 `{ id, provider, channel: 'push', status, acceptedAt }` を返す。

### `sendSMS(client, msg: SmsMessage, config?: SmsDeliveryConfig): Promise<NotificationSendResult>`

Twilio / SNS SMS 送信 mock。 `msg.to` + `msg.body` + `msg.from?`。

### `sendInApp(client, msg: InAppMessage, config?: InAppDispatchConfig): Promise<NotificationSendResult>`

in-app notification (unread badge + push panel) mock。 recipient user context で send。

### `parseNotificationEvent(rawEvent: RawNotificationEvent): NormalizedNotificationEvent`

provider 別 delivery event を統一 shape (`type / channel / provider / notificationId / timestamp / recipient?`) に正規化。

## Types

- `NotificationProvider = 'fcm' | 'apns' | 'twilio' | 'sns' | 'inapp'`
- `NotificationChannel = 'push' | 'sms' | 'inapp'`
- `PushMessage` = `{ token, title, body, data?, ttl? }`
- `SmsMessage` = `{ to, body, from? }`
- `NotificationSendResult` = `{ id, provider, channel, status, acceptedAt, reason? }`

## Usage examples

### Multi-channel send (push + SMS)

```typescript
import { createNotificationClient, sendPush, sendSMS } from '@kiwa-lab/notification';

const client = createNotificationClient({
  push: { provider: 'fcm', serverKey: 'fcm_test' },
  sms: { provider: 'twilio', sid: 'AC_test', authToken: 'tok_test' },
});
await sendPush(client, { token: 'device-1', title: 'Order ready', body: 'Pickup soon' });
await sendSMS(client, { to: '+81-90-1234-5678', body: 'Order 1234 is ready' });
const sent = client.listSent();
expect(sent.map((s) => s.channel)).toEqual(['push', 'sms']);
```

### Delivery event parse

```typescript
import { parseNotificationEvent } from '@kiwa-lab/notification';

const event = parseNotificationEvent({
  provider: 'fcm',
  channel: 'push',
  raw: { message_type: 'delivered', message_id: 'fcm-1', timestamp: 1_720_000_000 },
});
console.log(event.type, event.notificationId); // delivered fcm-1
```

## Related skills

- [`/kiwa-notification`](../skills/kiwa-notification) — notification test 生成 skill
