# @kiwa-lab/webhook

Webhook provider mock harness for kiwa — Stripe / GitHub / Slack / Twilio の signature 検証 + payload parse + retry dispatch を in-process で叩く test infra。

## Installation

```bash
pnpm add -D @kiwa-lab/webhook
# or
npm install -D @kiwa-lab/webhook
# or
yarn add -D @kiwa-lab/webhook
```

## Supported providers

| Provider | Status | Signature format |
|---|---|---|
| Stripe | ✅ | `t=<ts>,v1=<hex>` (HMAC-SHA256) |
| GitHub | ✅ | `sha256=<hex>` (HMAC-SHA256) |
| Slack | ✅ | `v0=<hex>` (HMAC-SHA256) |
| Twilio | ✅ | base64 (HMAC-SHA1) |

## Quick start

```ts
import { createWebhookVerifier, verifyWebhookSignature, parseWebhookPayload } from '@kiwa-lab/webhook';

const verifier = createWebhookVerifier({ provider: 'stripe', secret: 'whsec_test' });

const outcome = verifier.verify({
  payload: '{"type":"payment_intent.succeeded","id":"pi_123"}',
  signature: 't=1700000000,v1=abcdef...',
});
// outcome = { id, provider: 'stripe', status: 'verified' | 'rejected', event, receivedAt }

const sigResult = verifyWebhookSignature('body', 'signature', 'secret', 'github');
const event = parseWebhookPayload({ provider: 'stripe', raw: { type: 'payment_intent.succeeded' } });
```

## API reference

- `createWebhookVerifier(options: CreateWebhookVerifierOptions): WebhookVerifier` — provider + secret で verifier 生成
- `WebhookVerifier.verify(incoming: IncomingWebhook): WebhookVerifyOutcome` — 1 request で signature + parse + record を atomic 実行
- `WebhookVerifier.listDelivered(): DeliveredWebhookRecord[]` — 受信ログ全件
- `verifyWebhookSignature(payload, signature, secret, provider, options?): SignatureVerifyResult` — signature 単独検証
- `parseWebhookPayload(rawEvent: RawWebhookEvent): NormalizedWebhookEvent` — 4 provider 別 payload を統一 shape に正規化
- `dispatchWithRetry(fn, options?): Promise<DispatchRetryResult>` — exponential backoff retry (max attempts / base delay 設定)

## Test integration

```ts
import { describe, expect, it } from 'vitest';
import { createWebhookVerifier } from '@kiwa-lab/webhook';

describe('stripe payment webhook', () => {
  it('valid signature = verified', () => {
    const v = createWebhookVerifier({ provider: 'stripe', secret: 's' });
    const outcome = v.verify({ payload: '{}', signature: 't=1,v1=deadbeef' });
    expect(['verified', 'rejected']).toContain(outcome.status);
  });
});
```

`/kiwa-webhook` skill を起動すると 4 provider 別 signature format + retry 経路を含む test を生成できる。

## License

UNLICENSED — see [cardene777/kiwa](https://github.com/cardene777/kiwa) for repo terms.
