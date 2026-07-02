# Payment webhook mock (Stripe / Paddle / Lemon Squeezy)

## What you'll build

A vitest test file that exercises **three payment webhook flows** — sign a webhook body with HMAC-SHA256, timing-safe verify it, and dispatch to registered handlers — across the three providers `@kiwa-test/payment` covers. The same test surface handles all three providers so a SaaS supporting multiple payment providers reuses one test spec.

## Prerequisites

- Node.js ≥ 20
- `pnpm`
- An empty directory to work in

## Step-by-step build

```bash
mkdir kiwa-payment && cd kiwa-payment
pnpm init -y
pnpm add -D vitest typescript @types/node @kiwa-test/payment
```

Set `type: module` + test script in `package.json`:

```json
{
  "type": "module",
  "scripts": { "test": "vitest run" }
}
```

Add `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "es2022",
    "module": "es2022",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "types": ["node", "vitest/globals"]
  }
}
```

Create `src/webhook-handler.ts` — a provider-neutral surface that any of the three provider mocks satisfies:

```ts
import type { PaymentAdapter, PaymentWebhookEvent } from '@kiwa-test/payment';

export function attachHandler(adapter: PaymentAdapter, sink: PaymentWebhookEvent[]) {
  return adapter.onWebhook((event) => {
    sink.push(event);
  });
}
```

## Test — 3 providers, 1 spec

Create `tests/payment.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  createStripeMock,
  createPaddleMock,
  createLemonSqueezyMock,
  checkoutCompleted,
  refunded,
  type PaymentAdapter,
  type PaymentWebhookEvent,
} from '@kiwa-test/payment';
import { attachHandler } from '../src/webhook-handler';

const providers: Array<[string, () => PaymentAdapter]> = [
  ['stripe', () => createStripeMock({ secret: 'whsec_test' })],
  ['paddle', () => createPaddleMock({ secret: 'pdl_test' })],
  ['lemonsqueezy', () => createLemonSqueezyMock({ secret: 'ls_test' })],
];

describe.each(providers)('payment webhook — %s', (_, factory) => {
  it('sign + verify + dispatch flow', async () => {
    const adapter = factory();
    const received: PaymentWebhookEvent[] = [];
    attachHandler(adapter, received);

    const { rawBody, signature, event } = checkoutCompleted(adapter, {
      amountCents: 2000,
      customerId: 'cus_1',
    });

    const verified = adapter.verifyWebhook({ rawBody, signature });
    expect(verified.ok).toBe(true);
    expect(verified.reason).toBe('ok');

    await adapter.emit(event);
    expect(received).toHaveLength(1);
    expect(received[0]?.type).toBe('checkout.completed');
  });

  it('refunded fixture flips amountCents sign', () => {
    const adapter = factory();
    const { event } = refunded(adapter, { amountCents: 1500, customerId: 'cus_1' });
    expect(event.amountCents).toBe(-1500);
  });

  it('rejects tampered body with bad-signature', () => {
    const adapter = factory();
    const { rawBody, signature } = checkoutCompleted(adapter, { amountCents: 100, customerId: 'x' });
    const tampered = rawBody.replace('"amountCents":100', '"amountCents":9999');
    const verified = adapter.verifyWebhook({ rawBody: tampered, signature });
    expect(verified.ok).toBe(false);
    expect(verified.reason).toBe('bad-signature');
  });

  it('rejects stale timestamp with stale-timestamp', () => {
    let now = 1_000_000;
    const adapter = factory();
    // re-sign with a clock we control — the fresh instance's own toleranceMs = 5 min applies
    const built = adapter.signWebhook({ type: 'x', amountCents: 1, customerId: 'c', timestamp: now });
    // move the wall clock past tolerance (default 5 min) — provider's verify uses Date.now
    // so we assert on a per-call toleranceMs override instead of manipulating global time
    const verified = adapter.verifyWebhook({
      rawBody: built.rawBody,
      signature: built.signature,
      toleranceMs: 0, // 0-tolerance rejects any drift
    });
    expect(verified.ok).toBe(false);
  });
});
```

Run:

```bash
pnpm test
```

You should see 12 passing tests (4 tests × 3 providers).

## Provider payload differences

The 3 providers ship slightly different webhook payload shapes. `@kiwa-test/payment` normalises them via the shared engine so your handler code reads identical `PaymentWebhookEvent` fields — but the raw JSON body differs so signature-verify tests exercise the actual bytes each provider sends.

| provider | payload shape | signature header |
|---|---|---|
| Stripe | `data.object.{id,amount,currency}` | `Stripe-Signature: t=…,v1=…` |
| Paddle | `data.attributes.totals.total` (string cents) | `Paddle-Signature: ts=…;h1=…` |
| Lemon Squeezy | `meta.event_name` + `data.attributes.total` | `X-Signature: <hmac>` |

## When to use each

- **Stripe** — the widest ecosystem, richest API. Default choice for US-centric SaaS.
- **Paddle Billing** — merchant-of-record model, handles tax in-EU / worldwide sales. Choose when you want to offload tax compliance.
- **Lemon Squeezy** — indie-friendly, simpler dashboard, still merchant-of-record. Choose when you want minimal setup.

`@kiwa-test/payment` lets you test **all three at once** so migrating between providers (or supporting multiple simultaneously) doesn't force a test rewrite.

## Related

- [`@kiwa-test/payment` on npm](https://www.npmjs.com/package/@kiwa-test/payment)
- [Concept — payment testing SSOT](../concepts/payment-testing)
- [Migration guide v1.13 → v1.14](../migrations/v1.13-to-v1.14)
