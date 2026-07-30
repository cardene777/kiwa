---
name: kiwa-notification
description: |
  @kiwa-lab/notification を使って push、SMS、in-app の application-level test を作る skill。
  channel ごとの送信結果、provider 拒否、重複防止、delivery event の正規化を確認する。
user_invocable: true
context: conversation
agent: general-purpose
allowed-tools: Bash, Read, Glob, Grep, Write, Edit
---

# /kiwa-notification notification test を作る

`@kiwa-lab/notification` は Firebase、APNs、Twilio、SNS や端末へ接続しない。application がどの channel と provider を選び、送信結果をどう扱うかを process 内で test する harness である。

## 入力と出力

`--module` は対象名、`--channel` は `push`、`sms`、`in-app`、`all` のいずれか、`--output` は test file の path を指定する。出力先を省略したときは `tests/{module}.notification.test.ts` を使う。message の key、必須 channel、idempotency key、失敗時の product behavior を application の source と requirement から使う。

## 生成する test

multi-channel workflow は `createNotificationClient` と `dispatch` を使い、requested channel の順、provider、status を確認する。single channel は `sendPush`、`sendSMS`、`sendInApp` を使う。`queued` は端末到達を意味しない。

provider 拒否は `failOn` で再現し、`failed` と reason を assertion する。同じ event の二重送信は `createIdempotencyCache` と `sendPushIdempotent` で確認する。delivery event は `parseNotificationEvent` で normal form にし、送信済み notification id と関連付ける。event の署名検証はこの library の外側で行う。

## 実行と確認

生成した output を読み、必須 channel の欠落、provider の選択、失敗時の product behavior、resource cleanup が要件と一致することを確認する。次に output だけを実行する。

```bash
pnpm exec vitest run {output}
```

provider sandbox では端末 token、SMS format、rate limit、delivery receipt、webhook 署名、再送を別に確認する。

## 実行例

```text
/kiwa:kiwa-notification --module order-confirm --channel all --output tests/order-confirm.notification.test.ts
/kiwa:kiwa-notification --module password-reset --channel sms --output tests/password-reset.notification.test.ts
```
