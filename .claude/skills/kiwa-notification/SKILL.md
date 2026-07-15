---
name: kiwa-notification
description: |
  @kiwa-lab/notification (FCM / APNs push + Twilio SMS + AWS SNS + in-app 統一 mock harness) を使った multi-channel notification test 生成 skill。
  `createNotificationClient` + `sendPush` / `sendSMS` / `sendInApp` を統一 interface で叩き、 `parseNotificationEvent` で delivered / opened / clicked / failed の event 正規化を verify できる。
user_invocable: true
context: conversation
agent: general-purpose
allowed-tools: Bash, Read, Glob, Grep, Write, Edit
---

# /kiwa-notification — multi-channel notification test 生成

`@kiwa-lab/notification` の 4 provider (FCM / APNs / Twilio / SNS) 統一 mock を使った notification test を Vitest 形式で生成する。 real device / real phone 不要で push / SMS / in-app / event 追跡の test を書く。

## 目的

order confirmation / password reset / real-time alert 等の user notification で「device token → channel 選択 → send → delivery status」 の complete path を test 化する。 provider 差 (FCM `data`/`notification` field / APNs aps payload / Twilio `MessagingResponse` / SNS topic ARN) を吸収した抽象。

## 前提

- `pnpm add -D @kiwa-lab/notification` install 済
- Vitest 環境
- 対象 module に notification 経路 (order 完了時 send / cron push 配信 等) が存在

## オプション

- `--module {name}` — test 対象 module (order-confirm / password-reset / alert 等)
- `--channel {push|sms|inapp|all}` — 対象 channel (省略時 = all)
- `--output {path}` — 生成 test の path

## 実行フロー

### Step 1: multi-channel send test 生成

`createNotificationClient()` で client、 `sendPush(client, msg)` + `sendSMS(client, msg)` + `sendInApp(client, msg)` を並列 dispatch、 return の `id` / `status: 'queued'` / `channel` を assert。 4 provider を it.each で cover。

### Step 2: delivery event parse test 生成

`parseNotificationEvent(rawEvent)` で正規化 shape (`type`, `notificationId`, `channel`, `timestamp`) を assert。 delivered / opened / clicked / failed の 4 event を it.each、 provider 別 field 差 (FCM `message_status` / APNs `reason` / Twilio `SmsStatus` / SNS `type`) も cover。

### Step 3: error handling test 生成

invalid device token (FCM 404) / SMS opt-out (Twilio 21610) / expired APNs cert 等の failure path で `status: 'failed'` + `reason` field を assert。

## 使用例

```bash
/kiwa-notification --module order-confirm --channel all
/kiwa-notification --module alert --channel push
```
