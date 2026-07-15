# @kiwa-lab/notification

Notification provider mock harness for kiwa — FCM / APNs (push) / Twilio (SMS) / AWS SNS を統一 interface で invoke する in-process mock。

## API

- `createNotificationClient(options)` = provider mock client (sendPush / sendSMS / sendInApp / dispatch / listSent)
- `sendPush(client, msg)` = FCM / APNs push notification 送信
- `sendSMS(client, msg)` = Twilio SMS 送信
- `sendInApp(client, msg)` = in-app notification (websocket / poll payload) 生成
- `parseNotificationEvent(rawEvent)` = delivered / opened / clicked / failed event 正規化
