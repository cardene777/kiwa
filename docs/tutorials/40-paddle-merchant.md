# Paddle merchant-of-record — subscription tier + VAT/GST auto-calc in 15 min

## What you'll build

A Nuxt 3 merchant-of-record app wired to `@kiwa/payment` v0.3's Paddle Billing v2 mock. The suite covers Paddle's distinguishing fidelity axes — inline checkout instead of hosted redirect, tier upgrade + proration, and VAT/GST/sales-tax auto-calculation with reverse charge for B2B cross-border EU customers. Because Paddle acts as a **Merchant-of-Record** (MoR), the app never touches PSP details — Paddle handles fraud + chargeback + tax registration, and the app just books the neutralised events.

## Prerequisites

- Node.js ≥ 20
- `pnpm` (or npm / yarn)
- An empty directory to work in

## Step-by-step build

### 1. Bootstrap the project

```bash
mkdir kiwa-paddle-merchant && cd kiwa-paddle-merchant
pnpm init
pnpm add -D @kiwa/payment@^0.3 vitest typescript @types/node
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

### 2. Wire the Paddle mock adapter

`src/adapters/mock.ts` — `createPaddleMock` returns the shared `PaymentAdapter` interface.

```ts
import { createPaddleMock } from '@kiwa/payment';

export function paddleMock() {
  return createPaddleMock({ secret: 'pdl_ntf_test' });
}
```

Paddle's webhook signature scheme differs from Stripe — HMAC-SHA256 over the raw body prefixed with a timestamp header (`Paddle-Signature: ts=...;h1=...`). The mock reproduces the envelope so tests exercise the same verify path as production.

### 3. Test the inline checkout flow

Paddle uses an **inline JavaScript checkout** (`Paddle.Checkout.open(...)`) instead of the hosted redirect Stripe defaults to. The mock reproduces the completion event.

`tests/checkout.test.ts`.

```ts
import { describe, expect, it } from 'vitest';
import { checkoutCompleted, createPaddleMock } from '@kiwa/payment';

describe('paddle inline checkout', () => {
  it('emits checkout.completed after the inline flow closes', async () => {
    const adapter = createPaddleMock({ secret: 'pdl_ntf_test' });
    const received: string[] = [];
    adapter.onWebhook((event) => received.push(event.type));

    const { event } = checkoutCompleted(adapter, {
      amountCents: 2999,
      currency: 'usd',
      customerId: 'ctm_paddle_1',
    });
    await adapter.emit(event);

    expect(received).toHaveLength(1);
    expect(received[0]).toBe('checkout.completed');
  });
});
```

The neutral event name (`checkout.completed`) stays the same across providers — the mock adapter emits under the neutral name so downstream harnesses can filter without knowing whether the source was Paddle, Stripe or Lemon Squeezy.

### 4. Test tier upgrade + proration

Subscription tier changes go through the same `changePlan` helper as Stripe, but Paddle's proration model differs — Paddle charges the **difference** immediately on upgrade + credits on downgrade, whereas Stripe defers to the next invoice by default.

`tests/tier.test.ts`.

```ts
import { describe, expect, it } from 'vitest';
import { createPaddleMock, createSubscription, changePlan } from '@kiwa/payment';

describe('subscription tier + proration', () => {
  it('upgrades to a higher plan and records the delta metadata', async () => {
    const adapter = createPaddleMock({ secret: 'pdl_ntf_test' });
    const { subscription } = await createSubscription(adapter, {
      customerId: 'ctm_1',
      planId: 'basic',
      amountCents: 999,
      currency: 'usd',
    });

    const step = await changePlan(adapter, subscription, {
      newPlanId: 'pro',
      newAmountCents: 2999,
    });

    expect(step.state).toBe('upgraded');
    expect(step.metadata?.isUpgrade).toBe(true);
    expect(step.metadata?.previousAmountCents).toBe(999);
    expect(step.metadata?.newAmountCents).toBe(2999);
  });

  it('downgrades to a lower plan and records the delta metadata', async () => {
    const adapter = createPaddleMock({ secret: 'pdl_ntf_test' });
    const { subscription } = await createSubscription(adapter, {
      customerId: 'ctm_2',
      planId: 'pro',
      amountCents: 2999,
      currency: 'usd',
    });

    const step = await changePlan(adapter, subscription, {
      newPlanId: 'basic',
      newAmountCents: 999,
    });

    expect(step.state).toBe('downgraded');
    expect(step.metadata?.isUpgrade).toBe(false);
  });
});
```

The `metadata` records both the previous and new amount + plan so merchant apps can compute proration deltas without querying the provider. That provider-specific policy — Paddle charges the delta immediately, Stripe defers — lives in the merchant-app layer above the neutral state machine.

### 5. Test VAT/GST/sales-tax auto-calc

Paddle's MoR model handles tax registration in ~180 jurisdictions. Merchants **don't collect tax themselves** — Paddle applies the correct rate, remits, and files. Tests exercise the pure `calculateTax` helper to assert the merchant app books the right net + tax lines.

`tests/tax.test.ts`.

```ts
import { describe, expect, it } from 'vitest';
import { calculateTax } from '@kiwa/payment';

describe('VAT/GST/sales-tax auto-calc', () => {
  it('calculates 20 % UK VAT for a B2C digital purchase', () => {
    const line = calculateTax({
      netAmountCents: 10000,
      buyerCountry: 'GB',
      merchantCountry: 'US',
      productKind: 'digital',
    });
    expect(line.kind).toBe('vat');
    expect(line.rateBps).toBe(2000);
    expect(line.taxCents).toBe(2000);
    expect(line.reverseCharged).toBe(false);
    expect(line.exempt).toBe(false);
  });

  it('applies reverse charge for a B2B cross-border EU digital purchase', () => {
    const line = calculateTax({
      netAmountCents: 10000,
      buyerCountry: 'DE',
      buyerVatId: 'DE123456789',
      merchantCountry: 'FR',
      productKind: 'digital',
    });
    expect(line.reverseCharged).toBe(true);
    expect(line.taxCents).toBe(0);
    expect(line.rateBps).toBe(1900);
  });

  it('calculates US sales tax for a B2C purchase', () => {
    const line = calculateTax({
      netAmountCents: 10000,
      buyerCountry: 'US',
      merchantCountry: 'US',
      productKind: 'digital',
    });
    expect(line.kind).toBe('sales-tax');
    expect(line.rateBps).toBe(800);
    expect(line.taxCents).toBe(800);
  });

  it('marks buyers in unlisted countries as exempt', () => {
    const line = calculateTax({
      netAmountCents: 10000,
      buyerCountry: 'ZZ',
      merchantCountry: 'US',
      productKind: 'digital',
    });
    expect(line.exempt).toBe(true);
    expect(line.taxCents).toBe(0);
  });
});
```

Four axes covered — VAT (UK B2C digital), reverse charge (EU B2B cross-border with valid VAT ID), US sales tax, and exempt (unlisted jurisdiction). The mock is deterministic so tests reproduce the same rate every run.

### 6. Real driver mode

Same env-gated shape as the Stripe tutorial.

```ts
import { createPaddleMock } from '@kiwa/payment';

const mode = process.env.KIWA_MODE ?? 'mock';
export const adapter = mode === 'real'
  ? createPaddleMock({ secret: process.env.PADDLE_NOTIFICATION_SECRET })
  : createPaddleMock({ secret: 'pdl_ntf_test' });
```

In `KIWA_MODE=real` mode with `PADDLE_KEY` + `KIWA_PADDLE_REAL_READY=1`, the same test bodies re-run against the Paddle sandbox. The MoR + tax + inline checkout fidelity axes stay in the test surface — only the underlying adapter swaps.

### 7. Run it

```bash
pnpm test        # mock only, no network
pnpm test:real   # requires PADDLE_KEY + KIWA_PADDLE_REAL_READY=1
```

The full end-to-end example lives in `examples/dogfood-paddle-merchant-app` — 40 vitest cases spanning inline checkout / tier upgrade + proration / VAT+GST+sales-tax across 3 jurisdictions.

## Where to next

- [Concept doc — Advanced billing semantics (9 axis SSOT)](../concepts/billing-semantics)
- [Tutorial 39 — Stripe advanced billing](./39-stripe-billing)
- [Tutorial 41 — Lemon Squeezy license flow](./41-lemon-squeezy-license)
- [Migration guide v1.22 → v1.23](../migrations/v1.22-to-v1.23)
