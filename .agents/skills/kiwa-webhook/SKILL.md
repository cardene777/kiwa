---
name: kiwa-webhook
description: |
  @kiwa-lab/webhook (Stripe / GitHub / Slack / Twilio 統一 mock harness) を使った webhook 受信経路の test 生成 skill。
  `createWebhookVerifier` + `verifyWebhookSignature` で provider 別 hmac 署名検証、 `parseWebhookPayload` で event 正規化、 `dispatchWithRetry` で exponential backoff 経路を in-process で叩ける。 real provider の webhook を待たず provider signature format 差 (Stripe = `t=<ts>,v1=<sig>` / GitHub = `sha256=<hex>` / Slack = `v0=<hex>` / Twilio = base64) を吸収した抽象で test 化する。
user_invocable: true
context: conversation
agent: general-purpose
allowed-tools: Bash, Read, Glob, Grep, Write, Edit
---

# /kiwa-webhook — webhook 受信 + retry test 生成

`@kiwa-lab/webhook` の 4 provider (Stripe / GitHub / Slack / Twilio) 統一 mock を使った webhook test を Vitest 形式で生成する。 実 provider から webhook を受けずに hmac 署名検証 + payload parse + retry delivery を verify する経路。

## 目的

Stripe payment_intent.succeeded / GitHub push / Slack event / Twilio SMS delivery status 等の webhook を受ける endpoint で、 「不正 signature を reject + 正常 signature を parse + 失敗時 backoff retry」 の test を書く。 provider 別 signature format と event field 差異を吸収した抽象で test 化。

## 前提

- `pnpm add -D @kiwa-lab/webhook` install 済
- Vitest 環境
- 対象 module に webhook endpoint (Stripe listener / GitHub app / Slack event / Twilio callback 等) が存在

## オプション

- `--module {name}` — test 対象 module (payment-webhook / repo-hook / slack-event 等)
- `--provider {stripe|github|slack|twilio}` — 主要 provider (省略時 = 4 provider 全対応)
- `--output {path}` — 生成 test の path

## 実行フロー

### signature verify test を生成する

`createWebhookVerifier({ provider, secret })` で verifier を立て、 `verifyWebhookSignature(payload, sig, secret, provider)` の真偽を assert。 valid + invalid + timestamp expired (Stripe の `tolerance` 5 分超過) の 3 path を cover。

### payload parse test を生成する

`parseWebhookPayload({ provider, raw })` で正規化 shape (`type`, `eventId`, `occurredAt`, `resource`) を assert。 provider 別 event type (Stripe = `payment_intent.succeeded` / GitHub = `push` / Slack = `message` / Twilio = `SmsStatus`) を it.each で網羅。

### retry delivery test を生成する

`dispatchWithRetry(handler, event, { maxAttempts: 3, initialDelayMs: 100, sleep })` で handler が 2 回 throw してから 3 回目に成功する scenario を assertion します。test では `sleep: async () => undefined` を渡して待機をなくし、全 attempt が失敗する path も確認します。

## 使用例

```bash
/kiwa-webhook --module payment-webhook --provider stripe
/kiwa-webhook --module repo-hook --output tests/integration/repo-hook.webhook.test.ts
```
