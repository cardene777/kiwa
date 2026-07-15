# @kiwa-lab/notification

Multi-channel notification mock harness for kiwa — FCM / APNs push + Twilio SMS + AWS SNS + in-app を統一 interface で叩く test infra。

## Installation

```bash
pnpm add -D @kiwa-lab/notification
# or
npm install -D @kiwa-lab/notification
# or
yarn add -D @kiwa-lab/notification
```

## Supported providers

| Channel | Provider | Status |
|---|---|---|
| push | FCM (Firebase) | ✅ |
| push | APNs (Apple) | ✅ |
| sms | Twilio | ✅ |
| sms | AWS SNS | ✅ |
| in-app | native | ✅ |

## Quick start

```ts
import { createNotificationClient, parseNotificationEvent } from '@kiwa-lab/notification';

const client = createNotificationClient({ pushProvider: 'fcm', smsProvider: 'twilio' });

const push = await client.sendPush({ deviceToken: 'tok', title: 'Hi', body: 'You have a new msg' });
const sms = await client.sendSMS({ to: '+1555', from: '+1666', body: 'code 1234' });
const inApp = await client.sendInApp({ userId: 'u1', title: 'Update', body: 'new feature' });

const dispatched = await client.dispatch(['push', 'sms'], {
  push: { deviceToken: 'tok', title: 'x', body: 'y' },
  sms: { to: '+1555', from: '+1666', body: 'x' },
});

const event = parseNotificationEvent({ provider: 'fcm', raw: { messageType: 'delivered' } });
```

## API reference

- `createNotificationClient(options?): NotificationClient` — 3 channel 統合 mock client 生成
- `NotificationClient.sendPush(msg: PushMessage): Promise<NotificationSendResult>` — FCM / APNs
- `NotificationClient.sendSMS(msg: SmsMessage): Promise<NotificationSendResult>` — Twilio / SNS
- `NotificationClient.sendInApp(msg: InAppMessage): Promise<NotificationSendResult>` — in-app
- `NotificationClient.dispatch(channels, payload): Promise<NotificationSendResult[]>` — multi-channel 同時送信
- `parseNotificationEvent(raw): NormalizedNotificationEvent` — delivered / opened / clicked / failed 正規化

## Test integration

```ts
import { describe, expect, it } from 'vitest';
import { createNotificationClient } from '@kiwa-lab/notification';

describe('order notification', () => {
  it('push + sms を両方 dispatch', async () => {
    const c = createNotificationClient();
    const [p, s] = await c.dispatch(['push', 'sms'], {
      push: { deviceToken: 't', title: 'Order', body: 'shipped' },
      sms: { to: '+1', from: '+2', body: 'shipped' },
    });
    expect(p.status).toBe('queued');
    expect(s.status).toBe('queued');
  });
});
```

`/kiwa-notification` skill を起動すると push + SMS + in-app + 統合 dispatch の test を生成できる。

## License

UNLICENSED — see [cardene777/kiwa](https://github.com/cardene777/kiwa) for repo terms.
