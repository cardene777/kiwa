# @kiwa-lab/email

Email provider mock harness for kiwa — Resend / SendGrid / Postmark / AWS SES を統一 interface で invoke する in-process mock。

## API

- `createEmailClient(options)` = provider mock client (send / renderTemplate / listSent)
- `verifyWebhookSignature(payload, signature, secret, provider)` = provider 別 webhook 署名検証
- `parseDeliveryEvent(rawEvent, provider)` = delivered / bounced / opened / clicked event 正規化
