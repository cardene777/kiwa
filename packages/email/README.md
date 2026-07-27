# @kiwa-lab/email

Email provider mock harness for kiwa — Resend / SendGrid / Postmark / AWS SES を統一 interface で in-process 実行する test infra。

## Installation

```bash
pnpm add -D @kiwa-lab/email
# or
npm install -D @kiwa-lab/email
# or
yarn add -D @kiwa-lab/email
```

## Supported providers

| Provider | Status | Signature algo | ID prefix |
|---|---|---|---|
| Resend | ✅ | HMAC-SHA256 (hex) | `re-` |
| SendGrid | ✅ | HMAC-SHA256 (base64) | `sg-` |
| Postmark | ✅ | HMAC-SHA256 (hex) | `pm-` |
| AWS SES | ✅ | HMAC-SHA1 (hex) | `ses-` |

## Quick start

```ts
import { createEmailClient, verifyWebhookSignature, parseDeliveryEvent } from '@kiwa-lab/email';
import { createHmac } from 'node:crypto';

const client = createEmailClient({
  provider: 'resend',
  templates: { welcome: '<h1>hello {{name}}</h1>' },
});

const result = await client.send({
  from: 'a@x', to: 'b@x', subject: 'w',
  templateId: 'welcome', templateData: { name: 'kiwa' },
});
// result = { id: 're-1', provider: 'resend', status: 'queued', acceptedAt: ... }

const secret = 'whsec_test';
const payload = JSON.stringify({ type: 'email.delivered', email_id: result.id, timestamp: 1 });
const signature = createHmac('sha256', secret).update(payload).digest('hex');
const verify = verifyWebhookSignature(payload, signature, secret, 'resend');
const event = parseDeliveryEvent({ provider: 'resend', raw: JSON.parse(payload) });
```

## API reference

- `createEmailClient(options?: CreateEmailClientOptions): EmailClient` — provider mock を生成
- `EmailClient.send(msg: EmailMessage): Promise<EmailSendResult>` — email を queued として記録
- `EmailClient.renderTemplate(templateId: string, data: EmailTemplateContext): string` — 事前登録 template を interpolate
- `verifyWebhookSignature(payload, signature, secret, provider): SignatureVerifyResult` — provider 別 HMAC 検証
- `parseDeliveryEvent(rawEvent: RawDeliveryEvent): NormalizedDeliveryEvent` — 4 provider 別 event payload を統一 shape に正規化
- `renderTemplate(template: string, data: EmailTemplateContext): TemplateRenderResult` — mustache-lite `{{key}}` interpolation

## Test integration

```ts
import { describe, expect, it } from 'vitest';
import { createEmailClient } from '@kiwa-lab/email';

describe('user signup email', () => {
  it('welcome mail が queued', async () => {
    const client = createEmailClient({ provider: 'resend' });
    const res = await client.send({ from: 'noreply@x', to: 'new@x', subject: 'welcome', text: 'hi' });
    expect(res.status).toBe('queued');
    expect(client.listSent()).toHaveLength(1);
  });
});
```

`/kiwa-email` skill を起動すると Layer 1 spec から `send / verify / parse` の 3 経路を含む test を生成できる。

<!-- kiwa-docs:start -->
## Documentation

公開ドキュメントを正本として管理しています。

- [概要](https://cardene777.github.io/kiwa/libraries/services/email/)
- [はじめる](https://cardene777.github.io/kiwa/libraries/services/email/quickstart)
- [使い方](https://cardene777.github.io/kiwa/libraries/services/email/how-to)
- [リファレンス](https://cardene777.github.io/kiwa/libraries/services/email/reference)

編集元は [docs/libraries/services/email](../../docs/libraries/services/email/) です。
<!-- kiwa-docs:end -->

## License

UNLICENSED — see [cardene777/kiwa](https://github.com/cardene777/kiwa) for repo terms.
