# @kiwa-lab/email API reference

## Overview

`@kiwa-lab/email` は Resend / SendGrid / Postmark / AWS SES 4 provider を統一 interface で mock する in-process test infra。 send / template render / signature verify / delivery event parse までを real provider SDK 差替なしで叩ける。

kiwa test 経路では send workflow + template render + webhook delivery + failure path を統一 signature で verify する。 SaaS app 開発で email 経路は必須だが、 real provider に依存すると test が flaky になる。 本 lib は provider 別差 (id prefix / signature encoding / event key 名) を吸収した抽象で test を安定化する。

## Supported providers

| provider | id prefix | signature (algorithm / encoding) | event key |
|---|---|---|---|
| resend | `re-` | HMAC-SHA256 / hex | `type` |
| sendgrid | `sg-` | HMAC-SHA256 / base64 | `event` |
| postmark | `pm-` | HMAC-SHA256 / hex | `RecordType` |
| ses | `ses-` | HMAC-SHA1 / hex | `eventType` |

## Main API

### `createEmailClient(options?: CreateEmailClientOptions): EmailClient`

Provider 別 mock client を生成。 `options.provider` で 4 provider 切替、 `options.templates` で `{{name}}` interpolation template を登録、 `options.failOn(msg)` で条件付き失敗 mock。

### `EmailClient.send(msg: EmailMessage): Promise<EmailSendResult>`

`from / to / subject / html / text / templateId / templateData / headers / cc / bcc / replyTo` を受け取り、 `id / provider / status / acceptedAt / reason?` を返す。 template 指定時は render 済 html を `SentEmailRecord.renderedHtml` に格納。

### `EmailClient.listSent(): SentEmailRecord[]`

send 済 record 全件返却、 assertion で「N 件 send された」「特定 recipient 宛て送信済み」 を verify する主経路。

### `verifyWebhookSignature(payload, signature, secret, provider): SignatureVerifyResult`

provider 別 hmac 検証 (SES = SHA1 / 他 = SHA256、 SendGrid = base64 / 他 = hex)。 `{ valid, provider, algorithm, reason? }` を返す。 timingSafeEqual で digest 比較。

### `parseDeliveryEvent(rawEvent: RawDeliveryEvent): NormalizedDeliveryEvent`

provider 別 event payload を統一 shape (`type / provider / emailId / timestamp / recipient? / reason?`) に正規化。 type = `delivered | bounced | opened | clicked | complained | unknown`。

### `renderTemplate(template, data): TemplateRenderResult`

`{{key}}` placeholder を data で置換、 `{ html, variables, missing }` を返す。 missing key は空文字置換 + missing array に記録。

## Types

- `EmailProvider = 'resend' | 'sendgrid' | 'postmark' | 'ses'`
- `EmailMessage` = `{ from, to, subject, html?, text?, templateId?, templateData?, headers?, cc?, bcc?, replyTo? }`
- `EmailSendResult` = `{ id, provider, status: 'queued'|'sent'|'failed', acceptedAt, reason? }`
- `SentEmailRecord extends EmailSendResult` = `{ message, renderedHtml?, renderedText? }`
- `DeliveryEventType = 'delivered' | 'bounced' | 'opened' | 'clicked' | 'complained' | 'unknown'`

## Usage examples

### Transactional send + listSent 検証

```typescript
import { createEmailClient } from '@kiwa-lab/email';
import { describe, expect, it } from 'vitest';

describe('order confirmation email', () => {
  it('order commit 後に customer 宛て 1 件送信される', async () => {
    const client = createEmailClient({ provider: 'resend' });
    await commitOrder({ id: 'o-1', customerEmail: 'a@x' }, { email: client });
    const sent = client.listSent();
    expect(sent).toHaveLength(1);
    expect(sent[0].message.to).toBe('a@x');
    expect(sent[0].message.subject).toContain('Order confirmed');
  });
});
```

### Webhook signature verify + delivery event parse

```typescript
import { verifyWebhookSignature, parseDeliveryEvent } from '@kiwa-lab/email';
import { createHmac } from 'node:crypto';

const secret = process.env.RESEND_WEBHOOK_SECRET!;
const payload = JSON.stringify({ type: 'email.delivered', email_id: 're-1', timestamp: 1 });
const sig = createHmac('sha256', secret).update(payload).digest('hex');

const verify = verifyWebhookSignature(payload, sig, secret, 'resend');
if (!verify.valid) throw new Error(`invalid signature: ${verify.reason}`);
const event = parseDeliveryEvent({ provider: 'resend', raw: JSON.parse(payload) });
console.log(event.type, event.emailId); // delivered re-1
```

## Related skills

- [`/kiwa-email`](../skills/kiwa-email) — email test 生成 skill
