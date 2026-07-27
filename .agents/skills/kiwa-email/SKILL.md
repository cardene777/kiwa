---
name: kiwa-email
description: |
  @kiwa-lab/email を使って transactional email の application-level test を作る skill。
  template render、queued result、Webhook signature、delivery event、retry、idempotency を確認する。
user_invocable: true
context: conversation
agent: general-purpose
allowed-tools: Bash, Read, Glob, Grep, Write, Edit
---

# /kiwa-email email test を作る

`@kiwa-lab/email` は Resend、SendGrid、Postmark、SES の実 API や inbox を起動しない。application が送る message、template、Webhook の検証順、delivery state を test する harness である。

## 入力と出力

`--module` は対象名、`--provider` は `resend`、`sendgrid`、`postmark`、`ses` のいずれか、`--output` は test file の path を指定する。出力先を省略したときは `tests/{module}.email.test.ts` を使う。実 application の sender、template id、recipient、domain event id、webhook provider を input として使う。

## 生成する test

send workflow は `createEmailClient` と `client.send` を使い、status、provider、recipient、送信履歴を確認する。template mail は `templates` に template を登録し、`renderedHtml` と未登録 template の failed result を確認する。`queued` は inbox 到達を意味しない。

Webhook は raw payload を `verifyWebhookSignature` で先に検証し、成功時だけ `parseDeliveryEvent` に渡す。signature の encoding は provider ごとに異なる。retry は `sendWithRetry`、同じ domain event の重複は `createIdempotencyCache` と `sendIdempotent` で扱う。

## 実行と確認

生成後は output file を読み、template id、signature provider、event key、retry する失敗、idempotency key が application の契約と一致することを確認する。次に output だけを実行する。

```bash
pnpm exec vitest run {output}
```

provider credential、suppression list、DNS、inbox rendering、delivery rate、実 webhook retry は provider sandbox を使う integration test で確認する。

## 実行例

```text
/kiwa:kiwa-email --module welcome --provider resend --output tests/welcome.email.test.ts
/kiwa:kiwa-email --module receipt --provider sendgrid --output tests/receipt.email.test.ts
```
