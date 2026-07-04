# Lemon Squeezy — refund + chargeback dispute in 15 min

## What you'll build

A SvelteKit merchant-of-record app wired to `@kiwa-test/payment` v0.3's Lemon Squeezy mock. The suite covers Lemon Squeezy's distinguishing axes — hosted checkout page (no inline SDK), refund full + partial via the neutral `refunded` fixture, and the chargeback dispute lifecycle (opened → evidence submitted → won or lost + fee assessment). Like Paddle, Lemon Squeezy is a Merchant-of-Record — tax + fraud + chargeback are handled upstream, and the app books the neutralised events.

## Prerequisites

- Node.js ≥ 20
- `pnpm` (or npm / yarn)
- An empty directory to work in

## Step-by-step build

### 1. Bootstrap the project

```bash
mkdir kiwa-lemon-squeezy-license && cd kiwa-lemon-squeezy-license
pnpm init
pnpm add -D @kiwa-test/payment@^0.3 vitest typescript @types/node
```

Add the vitest script in `package.json`.

```json
{
  "type": "module",
  "scripts": {
    "test": "vitest run",
    "test:real": "KIWA_MODE=real vitest run"
  }
}
```

### 2. Wire the Lemon Squeezy mock adapter

`src/adapters/mock.ts`.

```ts
import { createLemonSqueezyMock } from '@kiwa-test/payment';

export function lemonSqueezyMock() {
  return createLemonSqueezyMock({ secret: 'ls_sign_test' });
}
```

Lemon Squeezy webhooks use an `X-Signature` header carrying an HMAC-SHA256 over the raw body — no timestamp component. The mock reproduces the envelope so tests exercise the same verify path as production.

### 3. Test hosted checkout completion

Unlike Paddle's inline SDK, Lemon Squeezy uses a **hosted checkout URL** — merchants generate the URL, redirect the customer, and receive the `checkout.completed` neutral event on completion.

`tests/checkout.test.ts`.

```ts
import { describe, expect, it } from 'vitest';
import { checkoutCompleted, createLemonSqueezyMock } from '@kiwa-test/payment';

describe('lemon squeezy hosted checkout', () => {
  it('emits checkout.completed after the hosted flow completes', async () => {
    const adapter = createLemonSqueezyMock({ secret: 'ls_sign_test' });
    const received: string[] = [];
    adapter.onWebhook((event) => received.push(event.type));

    const { event } = checkoutCompleted(adapter, {
      amountCents: 4900,
      currency: 'usd',
      customerId: 'lsc_1',
    });
    await adapter.emit(event);

    expect(received).toHaveLength(1);
    expect(received[0]).toBe('checkout.completed');
  });
});
```

The neutral event name (`checkout.completed`) stays the same across providers. Lemon Squeezy's real webhook fires `order_created` when a hosted checkout completes; the mock adapter neutralises that so downstream code doesn't need to switch on provider.

### 4. Test refund full + partial

Refunds use the neutral `refunded` fixture. The fixture inverts the amount sign so downstream code can sum orders + refunds to get net revenue directly.

`tests/refund.test.ts`.

```ts
import { describe, expect, it } from 'vitest';
import { createLemonSqueezyMock, refunded } from '@kiwa-test/payment';

describe('refund', () => {
  it('processes a full refund with negative amount', async () => {
    const adapter = createLemonSqueezyMock({ secret: 'ls_sign_test' });
    const received: number[] = [];
    adapter.onWebhook((event) => received.push(event.amountCents));

    const { event } = refunded(adapter, {
      amountCents: 4900,
      currency: 'usd',
      customerId: 'lsc_1',
    });
    await adapter.emit(event);

    expect(received).toHaveLength(1);
    expect(received[0]).toBe(-4900);
  });

  it('processes a partial refund with negative amount', async () => {
    const adapter = createLemonSqueezyMock({ secret: 'ls_sign_test' });
    const received: number[] = [];
    adapter.onWebhook((event) => received.push(event.amountCents));

    const { event } = refunded(adapter, {
      amountCents: 2000,
      currency: 'usd',
      customerId: 'lsc_1',
    });
    await adapter.emit(event);

    expect(received).toHaveLength(1);
    expect(received[0]).toBe(-2000);
  });
});
```

Both full and partial refunds ride the same fixture — the amount magnitude reflects the customer refund; the sign convention (negative) is applied by the fixture. Merchant apps that sum `event.amountCents` across all events derive net revenue for free.

### 5. Test chargeback dispute

`tests/chargeback.test.ts` — walk `opened` → `evidence-submitted` → `won` or `lost` with fee assessment.

```ts
import { describe, expect, it } from 'vitest';
import {
  createLemonSqueezyMock,
  openChargeback,
  submitEvidence,
  resolveChargeback,
} from '@kiwa-test/payment';

describe('chargeback dispute', () => {
  it('walks opened → evidence → won with no fee', async () => {
    const adapter = createLemonSqueezyMock({ secret: 'ls_sign_test' });
    const { chargeback } = await openChargeback(adapter, {
      transactionId: 'ord_1',
      amountCents: 4900,
      currency: 'usd',
      customerId: 'lsc_1',
      reason: 'fraudulent',
    });
    expect(chargeback.state).toBe('opened');

    await submitEvidence(adapter, chargeback, {
      shippingProof: 'digital delivery — activation logged on 2 devices',
      receiptUrl: 'https://mock.receipt/1',
    });
    expect(chargeback.state).toBe('evidence-submitted');

    const resolved = await resolveChargeback(adapter, chargeback, { merchantWon: true });
    expect(chargeback.state).toBe('won');
    expect(resolved.metadata?.merchantWon).toBe(true);
    expect(resolved.metadata?.disputeFeeCents).toBe(0);
  });

  it('walks opened → evidence → lost with dispute fee', async () => {
    const adapter = createLemonSqueezyMock({ secret: 'ls_sign_test' });
    const { chargeback } = await openChargeback(adapter, {
      transactionId: 'ord_2',
      amountCents: 4900,
      currency: 'usd',
      customerId: 'lsc_1',
      reason: 'product-not-received',
    });
    await submitEvidence(adapter, chargeback, {});

    const resolved = await resolveChargeback(adapter, chargeback, { merchantWon: false });
    expect(chargeback.state).toBe('lost');
    expect(resolved.metadata?.merchantWon).toBe(false);
    expect(resolved.metadata?.disputeFeeCents).toBe(1500);
  });
});
```

The chargeback state machine mirrors real card-network disputes — `opened` (customer files) → `evidence-submitted` (merchant responds) → `won` or `lost`. `disputeFeeCents` reflects card-network policy (~$15 assessed on lost, waived on wins).

### 6. Real driver mode

```ts
import { createLemonSqueezyMock } from '@kiwa-test/payment';

const mode = process.env.KIWA_MODE ?? 'mock';
export const adapter = mode === 'real'
  ? createLemonSqueezyMock({ secret: process.env.LEMONSQUEEZY_SIGNING_SECRET })
  : createLemonSqueezyMock({ secret: 'ls_sign_test' });
```

`KIWA_MODE=real` + `LEMONSQUEEZY_KEY` + `KIWA_LEMONSQUEEZY_REAL_READY=1` swaps the adapter to a real Lemon Squeezy sandbox. Everything above the adapter — refund logic, chargeback resolution — stays identical.

### 7. Run it

```bash
pnpm test        # mock only, no network
pnpm test:real   # requires LEMONSQUEEZY_KEY + KIWA_LEMONSQUEEZY_REAL_READY=1
```

The full end-to-end example lives in `examples/dogfood-lemon-squeezy-app` — 74 vitest cases spanning hosted checkout / subscription / license key issue+activate+revoke / refund full+partial / chargeback dispute lifecycle across 3 outcomes.

## Where to next

- [Concept doc — Advanced billing semantics (9 axis SSOT)](../concepts/billing-semantics)
- [Tutorial 39 — Stripe advanced billing](./39-stripe-billing)
- [Tutorial 40 — Paddle merchant-of-record](./40-paddle-merchant)
- [Migration guide v1.22 → v1.23](../migrations/v1.22-to-v1.23)
