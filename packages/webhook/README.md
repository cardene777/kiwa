# @kiwa-lab/webhook

Webhook provider mock harness for kiwa — Stripe / GitHub / Slack / Twilio の hmac 署名検証 + payload parse + delivery retry を統一 interface で叩く in-process mock。

## API

- `createWebhookVerifier(options)` = provider mock verifier (verify / dispatch / listDelivered)
- `verifyWebhookSignature(payload, signature, secret, provider, opts?)` = provider 別 hmac 署名検証
- `parseWebhookPayload(rawEvent, provider)` = provider 別 event を正規化 shape (type / eventId / occurredAt / resource) に変換
- `dispatchWithRetry(handler, event, opts?)` = exponential backoff で handler を retry する delivery loop
