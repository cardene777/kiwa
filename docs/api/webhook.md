# @kiwa-lab/webhook API reference

## Overview

`@kiwa-lab/webhook` は Stripe / GitHub / Slack / Twilio 4 provider の webhook 経路を統一 interface で mock する in-process test infra。 signature verify + payload parse + delivery retry を real provider webhook 待ちなしで叩ける。

provider 別 signature format 差 (Stripe = `t=<ts>,v1=<sig>` / GitHub = `sha256=<hex>` / Slack = `v0=<hex>` / Twilio = base64) を吸収した抽象で test 化する。

## Supported providers

| provider | signature format | timestamp tolerance | retry backoff |
|---|---|---|---|
| stripe | `t=<ts>,v1=<hex>` | 300s | exp base 2 |
| github | `sha256=<hex>` | none | exp base 2 |
| slack | `v0=<hex>` (with X-Slack-Request-Timestamp) | 300s | exp base 2 |
| twilio | base64 (with Twilio-Signature) | none | exp base 1.5 |

## Main API

### `createWebhookVerifier(options): WebhookVerifier`

provider 別 verifier を生成、 secret + tolerance を config。 `.verify(incoming)` で `{ valid, provider, deliveredId, event }` を返す。

### `verifyWebhookSignature(payload, signature, secret, provider, options?): SignatureVerifyResult`

provider 別 signature format を判定 + hmac 検証。 timestamp tolerance 内かも同時 chk。

### `parseWebhookPayload(rawEvent: RawWebhookEvent): NormalizedWebhookEvent`

provider 別 event を統一 shape (`type / id / occurredAt / provider / raw`) に正規化。 type は provider の event 名を lowercase snake_case 化。

### `dispatchWithRetry(fn, options: DispatchRetryOptions): Promise<DispatchRetryResult>`

fn の実行を exponential backoff (base + factor + max) で retry、 `{ succeeded, attempts, elapsedMs, lastError? }` を返す。 test では時間を進めて retry 経路を verify する。

## Types

- `WebhookProvider = 'stripe' | 'github' | 'slack' | 'twilio'`
- `IncomingWebhook` = `{ payload: string, signature: string, timestamp?: number, headers?: Record<string,string> }`
- `WebhookVerifyOutcome` = `{ valid: boolean, provider, deliveredId?, event?, reason? }`
- `NormalizedWebhookEvent` = `{ type, id, occurredAt, provider, raw }`
- `DispatchRetryOptions` = `{ maxAttempts, baseMs, factor, maxMs? }`

## Usage examples

### Stripe webhook 受信 → verify → 処理

```typescript
import { createWebhookVerifier, parseWebhookPayload } from '@kiwa-lab/webhook';
import { describe, expect, it } from 'vitest';

describe('stripe checkout completed webhook', () => {
  it('signature 検証 + event parse で order を fulfill', async () => {
    const verifier = createWebhookVerifier({ provider: 'stripe', secret: 'whsec_test' });
    const incoming = mockStripeWebhook({ eventType: 'checkout.session.completed' });
    const outcome = await verifier.verify(incoming);
    expect(outcome.valid).toBe(true);
    const event = parseWebhookPayload({ provider: 'stripe', raw: JSON.parse(incoming.payload) });
    expect(event.type).toBe('checkout_session_completed');
  });
});
```

### Retry with exponential backoff

```typescript
import { dispatchWithRetry } from '@kiwa-lab/webhook';

const result = await dispatchWithRetry(
  async () => sendWebhookTo('https://client.app/webhook', payload),
  { maxAttempts: 5, baseMs: 100, factor: 2, maxMs: 5000 },
);
if (!result.succeeded) {
  console.error(`failed after ${result.attempts} attempts:`, result.lastError);
}
```

## Related skills

- [`/kiwa-webhook`](../skills/kiwa-webhook) — webhook test 生成 skill
- [`/kiwa-email`](../skills/kiwa-email) — email delivery webhook (related pattern)
