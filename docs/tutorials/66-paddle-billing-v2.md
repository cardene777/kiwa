# Paddle Billing v2 — retention + proration + coupon stacking + trial + smart-retry recovery in 15 min

## What you'll build

A vitest suite wired to `@kiwa-lab/payment` v0.4 that models the 5 pieces of a real Paddle Billing v2 subscription that every non-trivial retention system eventually needs — subscription state machine with a grace period (past-due but still active from the customer's POV), mid-cycle proration for plan changes with the daysElapsed / daysInCycle split, coupon stacking with stackable vs non-stackable rules and a 100 % combined cap, revenue recovery via smart retry + dunning cascade (email → in-app → SMS → push) with card updater + network tokenization, and cross-provider token vault migration so a merchant can move from Paddle Billing v2 to Stripe without asking customers to re-enter cards. `startSubscriptionMachine()` + `enterGracePeriod()` + `applyProration()` + `stackCoupon()` + `startRecovery()` + `advanceCascade()` + `applyCardUpdate()` + `startVault()` + `migrateToken()` give you every one of those pieces as deterministic state machines. No live Paddle Billing v2 sandbox, no manual `paddle.transactions.preview()` amortisation, no ad-hoc coupon stacking calculator. This is the pattern kiwa's Paddle subscription v2 dogfood app (v1.33-3) exercises against real Paddle sandbox under the fidelity harness; the tutorial covers the mock-only path so you can iterate in milliseconds and reproduce the exact "we ran a black-friday coupon and it broke proration" case reviewers ask about.

## Prerequisites

- Node.js ≥ 20
- `pnpm` (or npm / yarn)
- An empty directory to work in

## Step-by-step build

### 1. Bootstrap the project

```bash
mkdir kiwa-paddle-billing && cd kiwa-paddle-billing
pnpm init
pnpm add -D @kiwa-lab/payment@^0.4 vitest typescript @types/node
```

Add the vitest scripts in `package.json`.

```json
{
  "type": "module",
  "scripts": {
    "test": "vitest run"
  }
}
```

The v0.4 surface exports `startSubscriptionMachine` + `enterGracePeriod` + `exitGracePeriod` + `applyProration` + `stackCoupon` + `startRecovery` + `scheduleSmartRetry` + `advanceCascade` + `applyCardUpdate` + `applyNetworkToken` + `finalizeRecovery` + `startVault` + `tokenizeCard` + `migrateToken` + `verifyPciScope` from the semantics barrel.

### 2. `startSubscriptionMachine` + `enterGracePeriod` — grace period

`tests/paddle/grace.test.ts` — Paddle Billing v2 (unlike Classic) has a first-class grace period between the failed renewal and the cancel. The mock reproduces the observable envelope — `active` → `grace-period` → `active` (recovered) or `expired` (timeout).

```ts
import { describe, expect, it } from 'vitest';
import {
  createPaddleMock,
  startSubscriptionMachine,
  enterGracePeriod,
  exitGracePeriod,
} from '@kiwa-lab/payment';

describe('paddle — grace period lifecycle', () => {
  it('enters grace, recovers back to active', async () => {
    const paddle = createPaddleMock({ secret: 'whsec_test' });
    const session = startSubscriptionMachine({
      subscriptionId: 'sub_1',
      customerId: 'cus_1',
      planPriceCents: 2999,
      currency: 'usd',
      gracePeriodMs: 7 * 24 * 60 * 60 * 1000,
    });

    const entered = await enterGracePeriod(paddle, session);
    expect(entered.state).toBe('grace-period');
    expect(entered.neutralEvent).toBe('subscription.grace_period_entered');
    expect(entered.metadata.graceEndsAt).toBeGreaterThan(Date.now());

    const exited = await exitGracePeriod(paddle, session, { recovered: true });
    expect(exited.state).toBe('active');
    expect(session.gracePeriodEnteredAt).toBeNull();
  });

  it('enters grace, expires on timeout', async () => {
    const paddle = createPaddleMock({ secret: 'whsec_test' });
    const session = startSubscriptionMachine({
      subscriptionId: 'sub_2',
      customerId: 'cus_1',
      planPriceCents: 2999,
    });
    await enterGracePeriod(paddle, session);
    const expired = await exitGracePeriod(paddle, session, { recovered: false });

    expect(expired.state).toBe('expired');
    expect(expired.metadata.recovered).toBe(false);
  });
});
```

The rule of thumb is that a grace period is what turns a 3 % involuntary churn into a 1 % involuntary churn. The customer's card fails at renewal, the merchant retries for a week, and the subscription only expires if all retries fail. The mock enforces the state transition so a test that skips grace and jumps straight to expired fails immediately.

### 3. `applyProration` — mid-cycle plan change

`tests/paddle/proration.test.ts` — the classic day-N-of-a-30-day-cycle upgrade computes `(daysInCycle - daysElapsed) / daysInCycle * (newPlan - oldPlan)` and bills or credits the difference on the next invoice. The mock reproduces the arithmetic exactly.

```ts
import { describe, expect, it } from 'vitest';
import {
  createPaddleMock,
  startSubscriptionMachine,
  applyProration,
} from '@kiwa-lab/payment';

describe('paddle — mid-cycle proration', () => {
  it('upgrades on day 10 of a 30-day cycle: credits 20 days of old + charges 20 days of new', async () => {
    const paddle = createPaddleMock({ secret: 'whsec_test' });
    const session = startSubscriptionMachine({
      subscriptionId: 'sub_1',
      customerId: 'cus_1',
      planPriceCents: 900, // basic plan
    });

    const step = await applyProration(paddle, session, {
      daysElapsed: 10,
      daysInCycle: 30,
      newPlanPriceCents: 2999, // pro plan
    });

    expect(step.neutralEvent).toBe('subscription.proration_applied');
    // (30-10)/30 * (2999 - 900) = 20/30 * 2099 = ~1399
    expect(step.metadata.prorationDeltaCents).toBe(1399);
    expect(step.metadata.oldPlanCents).toBe(900);
    expect(step.metadata.newPlanCents).toBe(2999);
    expect(session.currentCyclePriceCents).toBe(2999);
  });

  it('rejects daysInCycle=0 — a 0-day cycle is arithmetic-undefined', async () => {
    const paddle = createPaddleMock({ secret: 'whsec_test' });
    const session = startSubscriptionMachine({
      subscriptionId: 'sub_2',
      customerId: 'cus_1',
      planPriceCents: 900,
    });
    await expect(
      applyProration(paddle, session, { daysElapsed: 5, daysInCycle: 0, newPlanPriceCents: 2999 }),
    ).rejects.toThrow(/daysInCycle must be positive/);
  });
});
```

The rule of thumb is that proration arithmetic is what separates a merchant that reads its subscribers correctly from a merchant that overcharges upgrades and undercharges downgrades. The mock exposes `prorationDeltaCents` in metadata so the caller can assert the exact amount without re-implementing the formula.

### 4. `stackCoupon` — coupon stacking rules

`tests/paddle/coupons.test.ts` — Paddle Billing v2 supports both stackable coupons (multiple % off apply) and non-stackable coupons (a single "biggest wins" or exclusive discount). The mock enforces the combined 100 % cap so a `120 % off` coupon combination cannot mint free money.

```ts
import { describe, expect, it } from 'vitest';
import {
  createPaddleMock,
  startSubscriptionMachine,
  stackCoupon,
} from '@kiwa-lab/payment';

describe('paddle — coupon stacking', () => {
  it('stacks 2 stackable coupons summing under 100', async () => {
    const paddle = createPaddleMock({ secret: 'whsec_test' });
    const session = startSubscriptionMachine({
      subscriptionId: 'sub_1',
      customerId: 'cus_1',
      planPriceCents: 3000,
    });

    await stackCoupon(paddle, session, { code: 'BF10', percentOff: 10, stackable: true });
    const second = await stackCoupon(paddle, session, {
      code: 'REF15',
      percentOff: 15,
      stackable: true,
    });

    // 3000 * (100-25)/100 = 2250
    expect(second.metadata.totalPercentOff).toBe(25);
    expect(second.metadata.discountedCents).toBe(2250);
    expect(second.metadata.stackSize).toBe(2);
  });

  it('caps combined percent at 100 — a 60% + 80% stack does not go free', async () => {
    const paddle = createPaddleMock({ secret: 'whsec_test' });
    const session = startSubscriptionMachine({
      subscriptionId: 'sub_2',
      customerId: 'cus_1',
      planPriceCents: 3000,
    });
    await stackCoupon(paddle, session, { code: 'A', percentOff: 60, stackable: true });
    const capped = await stackCoupon(paddle, session, {
      code: 'B',
      percentOff: 80,
      stackable: true,
    });

    expect(capped.metadata.totalPercentOff).toBe(100);
    expect(capped.metadata.discountedCents).toBe(0);
  });

  it('non-stackable coupon replaces all previous stackable coupons', async () => {
    const paddle = createPaddleMock({ secret: 'whsec_test' });
    const session = startSubscriptionMachine({
      subscriptionId: 'sub_3',
      customerId: 'cus_1',
      planPriceCents: 3000,
    });
    await stackCoupon(paddle, session, { code: 'A', percentOff: 20, stackable: true });
    const exclusive = await stackCoupon(paddle, session, {
      code: 'VIP50',
      percentOff: 50,
      stackable: false,
    });

    expect(exclusive.metadata.stackSize).toBe(1);
    expect(exclusive.metadata.totalPercentOff).toBe(50);
    expect(session.coupons.map((c) => c.code)).toEqual(['VIP50']);
  });
});
```

The rule of thumb is that coupon stacking is what breaks accounting when you forget to cap the combined percent — a bug that lets `60 %` + `80 %` combine into a `-40 %` charge issues negative-dollar invoices that a downstream ETL cannot round-trip. The mock caps at 100 % so a test that misconfigures the stack fails visibly.

### 5. `startRecovery` + `advanceCascade` + `applyCardUpdate` — smart retry + cascade

`tests/paddle/recovery.test.ts` — a failed renewal triggers a 4-mechanism recovery ladder — smart retry (Stripe's Smart Retries or Paddle's built-in retry cadence), dunning cascade (email → in-app → SMS → push), card updater (network refreshes an expiring card), and network tokenization (survive PAN re-issue). The mock composes all 4.

```ts
import { describe, expect, it } from 'vitest';
import {
  createPaddleMock,
  startRecovery,
  scheduleSmartRetry,
  advanceCascade,
  applyCardUpdate,
  applyNetworkToken,
  finalizeRecovery,
} from '@kiwa-lab/payment';

describe('paddle — recovery ladder', () => {
  it('smart retry → dunning cascade → card update → network token → recovered', async () => {
    const paddle = createPaddleMock({ secret: 'whsec_test' });
    const session = startRecovery({
      invoiceId: 'inv_1',
      amountCents: 2999,
      customerId: 'cus_1',
      currency: 'usd',
      config: {
        cascade: ['email', 'in-app', 'sms'],
        cascadeStepMs: 60_000,
        cardUpdaterEnabled: true,
        networkTokenizationEnabled: true,
      },
    });

    const smart = await scheduleSmartRetry(paddle, session);
    expect(smart.state).toBe('smart-retry-scheduled');
    expect(smart.metadata.priority).toBe('high');

    const email = await advanceCascade(paddle, session);
    expect(email.metadata.channel).toBe('email');
    expect(email.metadata.stepIndex).toBe(1);

    const inApp = await advanceCascade(paddle, session);
    expect(inApp.metadata.channel).toBe('in-app');

    const carded = await applyCardUpdate(paddle, session, {
      last4: '4242',
      expMonth: 12,
      expYear: 2030,
    });
    expect(carded.state).toBe('card-updated');
    expect(carded.metadata.last4).toBe('4242');

    const tokened = await applyNetworkToken(paddle, session, {
      networkTokenId: 'ntk_visa_abc',
    });
    expect(tokened.state).toBe('network-tokenized');

    const final = finalizeRecovery(session, { succeed: true });
    expect(final.state).toBe('recovered');
  });
});
```

The rule of thumb is that a 4-mechanism recovery ladder recovers roughly 30-40 % of failed renewals in a real merchant while a single "retry once and give up" recovers under 10 %. The mock exposes all 4 mechanisms so a test can assert on the exact sequence without booking real Stripe / Paddle retry cost.

### 6. `startVault` + `tokenizeCard` + `migrateToken` — cross-provider vault migration

`tests/paddle/vault-migration.test.ts` — a merchant switching from Paddle Billing v2 to Stripe wants to keep the customer's tokenized card without a re-collect prompt. Portable network tokens make this possible; the mock exposes the migration path.

```ts
import { describe, expect, it } from 'vitest';
import {
  createPaddleMock,
  createStripeMock,
  startVault,
  tokenizeCard,
  migrateToken,
  verifyPciScope,
} from '@kiwa-lab/payment';

describe('paddle — vault + cross-provider migration', () => {
  it('tokenizes a card in Paddle then migrates it to Stripe with the same fingerprint', async () => {
    const paddle = createPaddleMock({ secret: 'whsec_paddle' });
    const stripe = createStripeMock({ secret: 'whsec_stripe' });
    const vault = startVault({ customerId: 'cus_1', currency: 'usd' });

    await tokenizeCard(paddle, vault, {
      tokenId: 'pm_paddle_abc',
      last4: '4242',
      brand: 'visa',
      expMonth: 12,
      expYear: 2030,
      fingerprint: 'fp_visa_4242',
      networkTokenId: 'ntk_visa_abc',
    });

    const migrated = await migrateToken(paddle, stripe, vault, {
      tokenId: 'pm_paddle_abc',
      newTokenId: 'pm_stripe_xyz',
    });

    expect(migrated.state).toBe('migrated');
    expect(migrated.metadata.fromProvider).toBe('paddle');
    expect(migrated.metadata.toProvider).toBe('stripe');
    expect(migrated.metadata.fingerprint).toBe('fp_visa_4242');
    expect(vault.tokens.has('pm_stripe_xyz')).toBe(true);
    expect(vault.tokens.has('pm_paddle_abc')).toBe(false);
  });

  it('verifyPciScope passes when no raw PAN is present in any token', async () => {
    const paddle = createPaddleMock({ secret: 'whsec_paddle' });
    const vault = startVault({ customerId: 'cus_1' });
    await tokenizeCard(paddle, vault, {
      tokenId: 'pm_1',
      last4: '4242',
      brand: 'visa',
      expMonth: 12,
      expYear: 2030,
      fingerprint: 'fp_1',
    });

    const verified = await verifyPciScope(paddle, vault, { targetScope: 'SAQ-A' });

    expect(verified.state).toBe('pci-verified');
    expect(verified.metadata.scope).toBe('SAQ-A');
    expect(vault.pciScope).toBe('SAQ-A');
  });
});
```

The rule of thumb is that PCI DSS SAQ-A compliance is what keeps merchants off the fully-scoped SAQ-D audit — the merchant never touches raw PAN, only network tokens or PSP tokens. The mock's `verifyPciScope` checks for `pan` / `cvv` / `cardNumber` field names in any token and refuses the assertion if any are present, so a test that accidentally stashes raw PAN fails visibly.

## Run it

```bash
pnpm test
```

All 5 files pass in under 3 seconds. The full v0.4 subscription + recovery + vault surface — 5 subscription-machine states + 7 recovery states + 5 vault states — is exercised by `packages/payment/tests/docs-tutorial-v1.33.test.ts` for every code snippet in this tutorial so a public API drift breaks CI before the reader sees a broken example.

## What you learned

- Grace period between failed renewal and cancel converts 3 % involuntary churn into 1 % — the machine transitions active → grace-period → active (recovered) or expired (timeout).
- Proration formula `(daysInCycle - daysElapsed) / daysInCycle * (newPlan - oldPlan)` is the SSOT for mid-cycle plan changes; the mock exposes the delta so tests can assert without re-implementing the arithmetic.
- Coupon stacking caps at 100 % combined percent so a `60 % + 80 %` stack does not mint free money — the mock caps at 100 % so a test that misconfigures the stack fails visibly.
- 4-mechanism recovery ladder (smart retry + dunning cascade + card updater + network token) recovers 30-40 % of failed renewals — the mock exposes all 4 mechanisms as separate state transitions.
- Cross-provider vault migration preserves fingerprint + network token so a merchant can switch PSP without re-collecting cards; PCI SAQ-A compliance forbids raw PAN in any token.

## Next steps

- Concept doc `docs/concepts/payment-real-driver-testing.md` documents the 8-axis SSOT + 3 provider × 8 axis = 24 cell grid + `KIWA_MODE=real` env-gate + `STRIPE_KEY` / `PADDLE_KEY` / `LEMONSQUEEZY_KEY` per-provider mapping.
- Migration guide `docs/migrations/v1.32-to-v1.33.md` documents the additive v0.4 changes and the 11-milestone snippet validation streak.
