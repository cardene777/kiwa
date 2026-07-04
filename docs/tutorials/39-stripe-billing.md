# Stripe advanced billing — subscription + 3DS + dunning in 15 min

## What you'll build

A Next.js 15 App Router merchant app wired to `@kiwa-test/payment` v0.3's Stripe mock adapter and 9-axis semantics. The suite covers the full billing journey — checkout session, subscription create + upgrade + downgrade + cancel, 3D Secure v2 challenge + frictionless, and Smart Retry dunning (4 attempts + grace period + uncollectible). Every event goes through the same `PaymentAdapter` interface, so the `KIWA_MODE=real` switch flips the run to the actual Stripe API without touching the test bodies.

## Prerequisites

- Node.js ≥ 20
- `pnpm` (or npm / yarn)
- An empty directory to work in

## Step-by-step build

### 1. Bootstrap the project

```bash
mkdir kiwa-stripe-billing && cd kiwa-stripe-billing
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

### 2. Wire the Stripe mock adapter

`src/adapters/mock.ts` — a thin factory that returns the shared `PaymentAdapter` interface used by every route handler.

```ts
import { createStripeMock } from '@kiwa-test/payment';

export function stripeMock() {
  return createStripeMock({ secret: 'whsec_test' });
}
```

`createStripeMock` returns an object that implements the same 4 methods (`signWebhook` / `emit` / `verifyWebhook` / `onWebhook`) as the real Stripe SDK wrapper. Every axis semantic (dunning / retry / 3DS / SCA / subscription / invoice / tax / chargeback) accepts this adapter, so the tests below never touch real Stripe code paths.

### 3. Test the subscription lifecycle

`tests/subscription.test.ts` — walk the 5-state envelope (`active` → `upgraded` → `downgraded` → `paused` → `canceled`) with strict transition guards.

```ts
import { describe, expect, it } from 'vitest';
import {
  createStripeMock,
  createSubscription,
  changePlan,
  pauseSubscription,
  resumeSubscription,
  cancelSubscription,
} from '@kiwa-test/payment';

describe('subscription lifecycle', () => {
  it('walks created → upgraded → paused → resumed → canceled', async () => {
    const adapter = createStripeMock({ secret: 'whsec_test' });
    const { subscription } = await createSubscription(adapter, {
      customerId: 'cus_1',
      planId: 'basic',
      amountCents: 999,
      currency: 'usd',
    });
    expect(subscription.state).toBe('active');

    const upgraded = await changePlan(adapter, subscription, {
      newPlanId: 'pro',
      newAmountCents: 2999,
    });
    expect(upgraded.state).toBe('upgraded');
    expect(subscription.amountCents).toBe(2999);

    const paused = await pauseSubscription(adapter, subscription);
    expect(paused.state).toBe('paused');

    const resumed = await resumeSubscription(adapter, subscription);
    expect(resumed.state).toBe('active');

    const canceled = await cancelSubscription(adapter, subscription);
    expect(canceled.state).toBe('canceled');
  });
});
```

Every transition emits the neutral event (`subscription.created` / `subscription.upgraded` / `subscription.paused` / `subscription.resumed` / `subscription.canceled`) that maps to Stripe's provider-specific event names (`customer.subscription.created` etc.) through `providerEventName(adapter.provider, ...)`.

### 4. Test 3D Secure v2 — accepted, rejected, frictionless

`tests/three-ds.test.ts` — cover the 3 EMVCo 3DS 2.2 outcomes.

```ts
import { describe, expect, it } from 'vitest';
import {
  createStripeMock,
  startThreeDs,
  threeDsRequestChallenge,
  threeDsSubmitChallenge,
  threeDsFrictionless,
} from '@kiwa-test/payment';

describe('3DS v2', () => {
  it('accepted — user completes the challenge', async () => {
    const adapter = createStripeMock({ secret: 'whsec_test' });
    const session = startThreeDs({
      paymentIntentId: 'pi_1',
      amountCents: 4999,
      currency: 'usd',
      customerId: 'cus_1',
    });
    await threeDsRequestChallenge(adapter, session);
    const result = await threeDsSubmitChallenge(adapter, session, { transStatus: 'Y' });
    expect(result.state).toBe('completed');
    expect(result.metadata?.accepted).toBe(true);
    expect(result.metadata?.transStatus).toBe('Y');
  });

  it('rejected — issuer refuses the challenge', async () => {
    const adapter = createStripeMock({ secret: 'whsec_test' });
    const session = startThreeDs({
      paymentIntentId: 'pi_2',
      amountCents: 4999,
      currency: 'usd',
      customerId: 'cus_1',
    });
    await threeDsRequestChallenge(adapter, session);
    const result = await threeDsSubmitChallenge(adapter, session, { transStatus: 'N' });
    expect(result.state).toBe('completed');
    expect(result.metadata?.accepted).toBe(false);
  });

  it('frictionless — issuer skips the challenge', async () => {
    const adapter = createStripeMock({ secret: 'whsec_test' });
    const session = startThreeDs({
      paymentIntentId: 'pi_3',
      amountCents: 4999,
      currency: 'usd',
      customerId: 'cus_1',
    });
    const result = await threeDsFrictionless(adapter, session);
    expect(result.state).toBe('frictionless');
    expect(result.metadata?.eci).toBe('05');
  });
});
```

The 3 outcomes ride the same session — only the terminal `transStatus` differs (`Y` / `A` = accepted, `N` / `U` / `R` = rejected). Frictionless flows skip the `challenge-pending` state entirely and short-circuit to `frictionless`.

### 5. Test Smart Retries dunning

`tests/dunning.test.ts` — 4 attempts over ~1 week with a 1-day grace period.

```ts
import { describe, expect, it } from 'vitest';
import {
  createStripeMock,
  startDunning,
  dunningAttempt,
  finalizeDunning,
} from '@kiwa-test/payment';

describe('dunning', () => {
  it('recovers on the 3rd retry', async () => {
    const adapter = createStripeMock({ secret: 'whsec_test' });
    const session = startDunning({
      invoiceId: 'in_1',
      amountCents: 1999,
      customerId: 'cus_1',
      currency: 'usd',
      config: { maxAttempts: 4 },
    });

    await dunningAttempt(adapter, session);
    await dunningAttempt(adapter, session);
    await dunningAttempt(adapter, session);
    expect(session.state).toBe('active');
    expect(session.attempt).toBe(3);

    const result = await finalizeDunning(adapter, session, { succeed: true });
    expect(result.state).toBe('recovered');
  });

  it('exhausts after maxAttempts + grace', async () => {
    const adapter = createStripeMock({ secret: 'whsec_test' });
    const session = startDunning({
      invoiceId: 'in_2',
      amountCents: 1999,
      customerId: 'cus_1',
      currency: 'usd',
      config: { maxAttempts: 4, gracePeriodMs: 60_000 },
    });

    await dunningAttempt(adapter, session);
    await dunningAttempt(adapter, session);
    await dunningAttempt(adapter, session);
    const last = await dunningAttempt(adapter, session);
    expect(last.state).toBe('in-grace-period');

    const result = await finalizeDunning(adapter, session, { succeed: false });
    expect(result.state).toBe('exhausted');
  });
});
```

The default `maxAttempts` = 4 with a 3-day `retryIntervalMs` matches Stripe Smart Retries (~1 week window). After the last attempt fails, the session moves to `in-grace-period` for the configured `gracePeriodMs` (default 1 day). `finalizeDunning({ succeed: false })` transitions to the terminal `exhausted` state and emits `invoice.marked_uncollectible` neutralised as `dunning.exhausted`.

### 6. Real driver mode (opt-in)

Every route handler in the merchant app reads `KIWA_MODE`:

```ts
import { createStripeMock } from '@kiwa-test/payment';

const mode = process.env.KIWA_MODE ?? 'mock';
export const adapter = mode === 'real'
  ? createStripeMock({ secret: process.env.STRIPE_WEBHOOK_SECRET })
  : createStripeMock({ secret: 'whsec_test' });
```

In `mock only` mode (`KIWA_MODE` unset), the vitest suite runs against the pure mock — zero network, sub-100 ms per test, safe on every laptop. In `KIWA_MODE=real` mode + real credentials, the same tests re-run against a Stripe test-mode account. The 9-axis semantics stay in the driver's seat — only the underlying `PaymentAdapter` swaps.

### 7. Run it

```bash
pnpm test        # mock only, no network
pnpm test:real   # requires STRIPE_KEY + KIWA_STRIPE_REAL_READY=1
```

The full end-to-end example lives in `examples/dogfood-stripe-billing-app` — 35 vitest cases spanning checkout / subscription / invoice / 3DS / dunning, all wired through the same 9-axis semantics you just built.

## Where to next

- [Concept doc — Advanced billing semantics (9 axis SSOT)](../concepts/billing-semantics)
- [Tutorial 40 — Paddle merchant-of-record](./40-paddle-merchant)
- [Tutorial 41 — Lemon Squeezy license flow](./41-lemon-squeezy-license)
- [Migration guide v1.22 → v1.23](../migrations/v1.22-to-v1.23)
