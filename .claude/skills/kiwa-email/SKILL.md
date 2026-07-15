---
name: kiwa-email
description: |
  @kiwa-lab/email (Resend / SendGrid / Postmark / AWS SES 統一 mock harness) を使った transactional email 経路の test 生成 skill。
  `createEmailClient` で provider mock を立て、 `verifyWebhookSignature` + `parseDeliveryEvent` で delivery webhook の署名検証 + event 正規化を in-process で叩ける。 real provider SDK 差替なしで send → template render → webhook 受信 → delivered/bounced/opened/clicked 全 event path の test を書く。
user_invocable: true
context: conversation
agent: general-purpose
allowed-tools: Bash, Read, Glob, Grep, Write, Edit
---

# /kiwa-email — email transactional test 生成

`@kiwa-lab/email` の 4 provider (Resend / SendGrid / Postmark / SES) 統一 mock を使った email test を Vitest 形式で生成する。 実 provider SDK を叩かず in-process で send / template render / signature verify / event parse を verify する経路。

## 目的

transactional email (login mail / receipt / reset password 等) を送る app で「provider を差し替えても同じ挙動を担保する」 test を書く。 provider 別 signature format (Resend/Postmark = sha256 hex、 SendGrid = sha256 base64、 SES = sha1) + event field 差異 (Resend `type` / SendGrid `event` / Postmark `RecordType` / SES `eventType`) を吸収した抽象で test 化する。

## 前提

- `pnpm add -D @kiwa-lab/email` install 済
- Vitest 環境 (`vitest run` が走る)
- 対象 module に email send 経路 (transactional / marketing / template based) が存在

## オプション

- `--module {name}` — test 対象 module (login / receipt / reset-password 等、 1 起動 = 1 module)
- `--provider {resend|sendgrid|postmark|ses}` — 主要 provider (省略時 = 4 provider 全対応 test 生成)
- `--output {path}` — 生成 test の path (省略時 = `tests/integration/{module}.email.test.ts`)

## 実行フロー

### Step 1: send workflow test 生成

`createEmailClient({ provider })` で mock client を立て、 `client.send({ from, to, subject, text })` の返却 `id` / `status: 'queued'` を assert。 4 provider を it.each で回して provider 差 (id prefix `re-` / `sg-` / `pm-` / `ses-`) も cover。

### Step 2: template render test 生成

`createEmailClient({ templates: { welcome: '<h1>{{name}}</h1>' } })` で template 登録、 `send({ templateId, templateData })` の後 `listSent()[0].renderedHtml` を expect で検証。 missing key / undefined data の error path も追加。

### Step 3: webhook signature + delivery event test 生成

`verifyWebhookSignature(payload, sig, secret, provider)` で真偽検証、 `parseDeliveryEvent({ provider, raw })` で正規化 shape (`type`, `emailId`, `timestamp`, `recipient`) を assert。 delivered / bounced / opened / clicked / complained の 5 event type + invalid signature の failure path を it.each で網羅。

## 使用例

```bash
/kiwa-email --module login --output tests/integration/login.email.test.ts
/kiwa-email --module receipt --provider sendgrid
```
