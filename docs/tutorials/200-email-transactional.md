# Tutorial 26 — Transactional email flow (Resend + template + webhook)

## 目的

`@kiwa-lab/email` を使って order confirmation email 経路を end-to-end で test する。 send workflow + template render + delivery webhook signature verify + event parse の 4 stage を real Resend 接続なしで verify する。

## 前提

- `pnpm add -D @kiwa-lab/email vitest`
- Node.js >= 20
- 対象 app に `sendOrderConfirmation(order, { email })` 関数がある想定 (or 本 tutorial 内で mock 実装)

## Step 1 — Client setup

`createEmailClient({ provider: 'resend' })` で mock client を立てる。 real Resend API 経由の SDK と同じ signature、 provider 切替は `provider: 'sendgrid' | 'postmark' | 'ses'` で 1 引数変更。

```typescript
import { createEmailClient } from '@kiwa-lab/email';
import { describe, expect, it, beforeEach } from 'vitest';

describe('order confirmation flow', () => {
  let client: ReturnType<typeof createEmailClient>;

  beforeEach(() => {
    client = createEmailClient({
      provider: 'resend',
      templates: {
        'order-confirmed': `<h1>Thanks for order #{{orderId}}!</h1>
<p>Total: ¥{{total}}</p>
<p>Shipped to: {{shippingAddress}}</p>`,
      },
    });
  });
});
```

## Step 2 — 単発 send test

`client.send({ from, to, subject, text })` で最小送信、 `client.listSent()` で assertion。

```typescript
it('sendOrderConfirmation で customer 宛て 1 件送信', async () => {
  const order = { id: 'o-1', total: 1500, customerEmail: 'a@x', shippingAddress: 'Tokyo, JP' };
  await sendOrderConfirmation(order, { email: client });
  const sent = client.listSent();
  expect(sent).toHaveLength(1);
  expect(sent[0].message.to).toBe('a@x');
  expect(sent[0].message.subject).toContain('Order confirmed');
  expect(sent[0].id.startsWith('re-')).toBe(true);
});
```

## Step 3 — Template render test

template 経由 send で renderedHtml が正しく展開されるか verify。 missing key は空文字置換 + missing[] に記録される。

```typescript
it('template で order 内容が展開される', async () => {
  const order = { id: 'o-1', total: 1500, customerEmail: 'a@x', shippingAddress: 'Tokyo, JP' };
  await client.send({
    from: 'shop@x',
    to: order.customerEmail,
    subject: `Order confirmed: ${order.id}`,
    templateId: 'order-confirmed',
    templateData: { orderId: order.id, total: order.total, shippingAddress: order.shippingAddress },
  });
  const sent = client.listSent();
  expect(sent[0].renderedHtml).toContain('order #o-1');
  expect(sent[0].renderedHtml).toContain('¥1500');
  expect(sent[0].renderedHtml).toContain('Tokyo, JP');
});
```

## Step 4 — Failure path test

`failOn` callback で条件付き失敗 mock、 downstream の retry / dead letter 経路を verify。

```typescript
import { createEmailClient } from '@kiwa-lab/email';

it('block リスト宛は failed status を返す', async () => {
  const blockedClient = createEmailClient({
    provider: 'resend',
    failOn: (msg) => msg.to === 'blocked@x',
  });
  const result = await blockedClient.send({ from: 's@x', to: 'blocked@x', subject: 's' });
  expect(result.status).toBe('failed');
  expect(result.reason).toContain('provider rejected');
});
```

## Step 5 — Webhook signature verify

Resend の delivery webhook を signature 込みで受信、 `verifyWebhookSignature` で HMAC-SHA256 検証 (SendGrid = base64、 SES = SHA1 で自動切替)。

```typescript
import { verifyWebhookSignature } from '@kiwa-lab/email';
import { createHmac } from 'node:crypto';

it('resend webhook を signature 検証', () => {
  const secret = 'whsec_test';
  const payload = JSON.stringify({
    type: 'email.delivered',
    email_id: 're-1',
    timestamp: 1_720_000_000,
    recipient: 'a@x',
  });
  const sig = createHmac('sha256', secret).update(payload).digest('hex');
  const result = verifyWebhookSignature(payload, sig, secret, 'resend');
  expect(result.valid).toBe(true);
  expect(result.provider).toBe('resend');
  expect(result.algorithm).toBe('sha256');
});

it('改竄された payload は verify で reject', () => {
  const secret = 'whsec_test';
  const original = JSON.stringify({ type: 'email.delivered', email_id: 're-1' });
  const sig = createHmac('sha256', secret).update(original).digest('hex');
  const tampered = JSON.stringify({ type: 'email.delivered', email_id: 'ATTACKER' });
  const result = verifyWebhookSignature(tampered, sig, secret, 'resend');
  expect(result.valid).toBe(false);
  expect(result.reason).toContain('digest mismatch');
});
```

## Step 6 — Delivery event parse

verify 済 payload を `parseDeliveryEvent` で正規化。 provider 別 event key 差 (Resend = `type`、 SendGrid = `event`、 Postmark = `RecordType`、 SES = `eventType`) が吸収される。

```typescript
import { parseDeliveryEvent } from '@kiwa-lab/email';

it('delivered event が正規化 shape で受信できる', () => {
  const raw = { type: 'email.delivered', email_id: 're-1', timestamp: 1_720_000_000, recipient: 'a@x' };
  const event = parseDeliveryEvent({ provider: 'resend', raw });
  expect(event.type).toBe('delivered');
  expect(event.emailId).toBe('re-1');
  expect(event.recipient).toBe('a@x');
});

it('bounced event を parse', () => {
  const raw = { RecordType: 'Bounce', MessageID: 'pm-1', Recipient: 'b@x', Details: 'hard-bounce' };
  const event = parseDeliveryEvent({ provider: 'postmark', raw });
  expect(event.type).toBe('bounced');
  expect(event.reason).toBe('hard-bounce');
});
```

## Step 7 — End-to-end pipeline test

send → webhook signature verify → event parse → status update までを 1 test で通す。 real Resend への依存を 100% 排除。

```typescript
it('send → delivered webhook → status update', async () => {
  const secret = 'whsec_test';
  const { id } = await client.send({ from: 's@x', to: 'a@x', subject: 'confirmed' });

  // Resend からの webhook 到着を simulate
  const payload = JSON.stringify({ type: 'email.delivered', email_id: id, timestamp: 1, recipient: 'a@x' });
  const sig = createHmac('sha256', secret).update(payload).digest('hex');
  const verify = verifyWebhookSignature(payload, sig, secret, 'resend');
  expect(verify.valid).toBe(true);

  const event = parseDeliveryEvent({ provider: 'resend', raw: JSON.parse(payload) });
  expect(event.type).toBe('delivered');

  // downstream の status update
  const order = await updateOrderStatusFromEvent(event);
  expect(order.emailStatus).toBe('delivered');
});
```

## 期待結果

- `pnpm test` で全 7 assertion PASS
- real Resend API に 1 度も接続せず delivery workflow を verify
- provider 切替 test は `provider: 'sendgrid'` で同じ test を再走可能 (signature encoding 差は lib 内で吸収)

## 関連

- API reference: [`/api/email`](../api/email)
- Skill: [`/kiwa-email`](../skills/kiwa-email)
- Related pattern: [`/tutorials/201-crypto-jwt-flow`](./201-crypto-jwt-flow)
