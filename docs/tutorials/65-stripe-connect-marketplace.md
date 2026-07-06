# Stripe Connect marketplace — Connect + destination charge + application fee + tax report in 15 min

## What you'll build

A vitest suite wired to `@kiwa-test/payment` v0.4 that models the 4 pieces of a real Stripe Connect marketplace that every non-trivial payout system eventually needs — dispute lifecycle for chargebacks arising from destination-charged transactions (evidence submission + representment + arbitration escalation + 3DS-based liability shift), refund policy enforcement so a marketplace can split partial refunds across the platform + connected account fee legs, webhook idempotency for the retry storms that hit Connect endpoints during payout scheduling, and tax localization for DAC7 marketplace reporting (EU digital platforms must file annual seller-revenue-by-jurisdiction reports). `openDispute()` + `submitDisputeEvidence()` + `representDispute()` + `startRefund()` + `partialRefund()` + `calculateLocalizedTax()` + `reportDac7()` give you every one of those pieces as deterministic state machines. No live Stripe Connect endpoints, no manual `Stripe-Account: acct_xxx` header threading, no ad-hoc DAC7 CSV builder. This is the pattern kiwa's Stripe marketplace v2 dogfood app (v1.33-2) exercises against real Stripe test mode under the fidelity harness; the tutorial covers the mock-only path so you can iterate in milliseconds and reproduce the exact "one seller had a chargeback and it messed up the tax report" case reviewers ask about.

## Prerequisites

- Node.js ≥ 20
- `pnpm` (or npm / yarn)
- An empty directory to work in

## Step-by-step build

### 1. Bootstrap the project

```bash
mkdir kiwa-stripe-connect && cd kiwa-stripe-connect
pnpm init
pnpm add -D @kiwa-test/payment@^0.4 vitest typescript @types/node
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

The v0.4 surface exports `openDispute` + `submitDisputeEvidence` + `representDispute` + `escalateArbitration` + `shiftLiability` + `startRefund` + `partialRefund` + `startIdempotency` + `deliver` + `calculateLocalizedTax` + `reportDac7` from the semantics barrel. This tutorial focuses on the 4 axes a marketplace needs on top of the base orchestration axis; tutorial 64 covers routing / failover / circuit-breaker, tutorial 66 covers Paddle subscription retention.

### 2. `openDispute` + `submitDisputeEvidence` — dispute lifecycle

`tests/marketplace/dispute-evidence.test.ts` — a marketplace with destination charges routes chargebacks to the connected account by default. The mock reproduces the Stripe Connect 5-stage dispute cycle (opened → evidence-submitted → represented → arbitration-opened → won / lost).

```ts
import { describe, expect, it } from 'vitest';
import {
  createStripeMock,
  openDispute,
  submitDisputeEvidence,
  representDispute,
} from '@kiwa-test/payment';

describe('marketplace — dispute evidence + representment', () => {
  it('opens a dispute then advances through evidence-submitted → represented', async () => {
    const stripe = createStripeMock({ secret: 'whsec_test' });
    const session = openDispute({
      disputeId: 'dp_1',
      chargeId: 'ch_1',
      amountCents: 4999,
      currency: 'usd',
      customerId: 'cus_1',
      reason: 'product_not_received',
    });
    expect(session.state).toBe('opened');

    const submitted = await submitDisputeEvidence(stripe, session, {
      evidenceIds: ['receipt.pdf', 'shipping_label.pdf'],
    });
    expect(submitted.state).toBe('evidence-submitted');
    expect(session.evidence).toHaveLength(2);

    const represented = await representDispute(stripe, session);
    expect(represented.state).toBe('represented');
    expect(represented.neutralEvent).toBe('dispute.represented');
  });

  it('rejects representDispute without evidence — a merchant with 0 evidence cannot represent', async () => {
    const stripe = createStripeMock({ secret: 'whsec_test' });
    const session = openDispute({
      disputeId: 'dp_2',
      chargeId: 'ch_2',
      amountCents: 4999,
      customerId: 'cus_1',
      reason: 'fraud',
    });
    await expect(representDispute(stripe, session)).rejects.toThrow(/evidence must be submitted first/);
  });
});
```

The rule of thumb is that a dispute is a state machine you cannot short-cut — Stripe rejects `dispute_won` requests that skip evidence submission with a 400. The mock enforces the same order so a test that forgets to submit evidence fails immediately instead of silently succeeding.

### 3. `escalateArbitration` + `shiftLiability` — arbitration + 3DS liability shift

`tests/marketplace/arbitration.test.ts` — after a `represented` dispute is re-challenged by the issuer, the merchant can escalate to arbitration (non-refundable filing fee, network-arbitrated final ruling) or shift liability to the issuer via 3DS-passed evidence.

```ts
import { describe, expect, it } from 'vitest';
import {
  createStripeMock,
  openDispute,
  submitDisputeEvidence,
  representDispute,
  escalateArbitration,
  shiftLiability,
} from '@kiwa-test/payment';

describe('marketplace — arbitration escalation + liability shift', () => {
  it('walks opened → evidence-submitted → represented → arbitration-opened', async () => {
    const stripe = createStripeMock({ secret: 'whsec_test' });
    const session = openDispute({
      disputeId: 'dp_1',
      chargeId: 'ch_1',
      amountCents: 9999,
      currency: 'usd',
      customerId: 'cus_1',
      reason: 'product_unacceptable',
    });
    await submitDisputeEvidence(stripe, session, { evidenceIds: ['receipt.pdf'] });
    await representDispute(stripe, session);
    const escalated = await escalateArbitration(stripe, session);

    expect(escalated.state).toBe('arbitration-opened');
    expect(escalated.metadata.filingFeeCents).toBe(500);
    expect(session.arbitrationOpenedAt).not.toBeNull();
  });

  it('shifts liability to the issuer with a 3DS auth code', async () => {
    const stripe = createStripeMock({ secret: 'whsec_test' });
    const session = openDispute({
      disputeId: 'dp_2',
      chargeId: 'ch_2',
      amountCents: 4999,
      customerId: 'cus_1',
      reason: 'fraud',
    });
    const shifted = await shiftLiability(stripe, session, { threeDsAuthCode: '3ds_abc' });

    expect(shifted.state).toBe('liability-shifted');
    expect(shifted.metadata.threeDsAuthCode).toBe('3ds_abc');
    expect(session.liabilityShifted).toBe(true);
  });
});
```

The rule of thumb is that liability shift is what turns a chargeback from a merchant loss into an issuer loss — the merchant proves the customer passed 3DS at authorisation and the network re-routes the loss upstream. The mock records the auth code in metadata so downstream tax reports can exclude liability-shifted disputes from platform revenue.

### 4. `startRefund` + `partialRefund` — split refunds across the platform + connected account

`tests/marketplace/partial-refund.test.ts` — a marketplace refunding a destination-charged transaction typically wants to refund the customer in full while pulling only the platform's application-fee portion from the connected account. The mock's `partialRefund` supports the amount cap.

```ts
import { describe, expect, it } from 'vitest';
import { createStripeMock, startRefund, partialRefund } from '@kiwa-test/payment';

describe('marketplace — partial refund with policy', () => {
  it('issues a partial refund inside the window with per-refund caps', async () => {
    const stripe = createStripeMock({ secret: 'whsec_test' });
    const session = startRefund({
      chargeId: 'ch_1',
      originalAmountCents: 9999,
      chargedAt: Date.now(),
      customerId: 'cus_1',
      currency: 'usd',
      policy: {
        windowMs: 30 * 24 * 60 * 60 * 1000,
        minAmountCents: 100,
        maxAmountCents: 5000,
      },
    });

    const step = await partialRefund(stripe, session, { amountCents: 2500 });

    expect(step.state).toBe('partial-issued');
    expect(step.neutralEvent).toBe('refund.partial');
    expect(session.refundedCents).toBe(2500);
    expect(step.metadata.remainingCents).toBe(9999 - 2500);
  });

  it('rejects a refund above maxAmountCents — a policy cap protects the connected account', async () => {
    const stripe = createStripeMock({ secret: 'whsec_test' });
    const session = startRefund({
      chargeId: 'ch_2',
      originalAmountCents: 9999,
      chargedAt: Date.now(),
      customerId: 'cus_1',
      policy: { windowMs: 30 * 24 * 60 * 60 * 1000, maxAmountCents: 5000 },
    });
    await expect(partialRefund(stripe, session, { amountCents: 6000 })).rejects.toThrow(
      /above maxAmountCents/,
    );
  });
});
```

The rule of thumb is that a marketplace refund policy is more restrictive than a direct-charge refund policy — the platform is legally obligated to the customer but the money sits inside the connected account balance, so a per-refund cap prevents an accidental full refund from draining the connected account. The mock enforces `minAmountCents` + `maxAmountCents` so a test that misconfigures the policy fails immediately.

### 5. `startIdempotency` + `deliver` — webhook idempotency for Connect payout retries

`tests/marketplace/idempotency.test.ts` — Stripe Connect payout webhooks are famously chatty during the "scheduled → paid" transition (5-8 delivery attempts is normal for a `payout.paid` event). The mock's `startIdempotency` + `deliver` deduplicate on `handlerName:eventId` and refuse redelivery for events outside the 5-min replay tolerance window.

```ts
import { describe, expect, it } from 'vitest';
import { createStripeMock, startIdempotency, deliver } from '@kiwa-test/payment';

describe('marketplace — webhook idempotency for payout events', () => {
  it('dedups a second delivery of the same event id inside the window', async () => {
    const stripe = createStripeMock({ secret: 'whsec_test' });
    const session = startIdempotency({ handlerName: 'payout-handler' });
    const { event } = stripe.signWebhook({
      type: 'payout.paid',
      amountCents: 12000,
      customerId: 'acct_1',
    });

    const first = await deliver(stripe, session, event);
    const second = await deliver(stripe, session, event);

    expect(first.deliver).toBe(true);
    expect(second.deliver).toBe(false);
    expect(second.step.state).toBe('dedup-hit');
    expect(second.step.metadata.dedupKey).toBe(`payout-handler:${event.id}`);
  });
});
```

The rule of thumb is that idempotency has to be scoped by handler — the same webhook delivered to `payout-handler` + `analytics-handler` must fire both handlers exactly once, but a redelivery to either handler must be a no-op. The mock composes the dedup key from `handlerName:eventId` so a test that forgets to scope by handler fails immediately.

### 6. `calculateLocalizedTax` + `reportDac7` — DAC7 marketplace report

`tests/marketplace/dac7.test.ts` — EU DAC7 requires digital platforms with sellers to file annual reports listing seller revenue by jurisdiction. The mock computes VAT / GST / sales-tax lines and rolls them up into a DAC7 report event that a downstream ETL can serialise.

```ts
import { describe, expect, it } from 'vitest';
import { createStripeMock, calculateLocalizedTax, reportDac7 } from '@kiwa-test/payment';

describe('marketplace — DAC7 report', () => {
  it('rolls up 3 EU + UK lines into a single DAC7 report event', async () => {
    const stripe = createStripeMock({ secret: 'whsec_test' });
    const { line: euLine } = await calculateLocalizedTax(stripe, {
      jurisdiction: 'EU',
      amountCents: 10_000,
      customerId: 'cus_de',
    });
    const { line: ukLine } = await calculateLocalizedTax(stripe, {
      jurisdiction: 'UK',
      amountCents: 5_000,
      customerId: 'cus_uk',
    });
    const { line: b2bReverseCharge } = await calculateLocalizedTax(stripe, {
      jurisdiction: 'EU',
      amountCents: 20_000,
      customerId: 'cus_biz',
      b2b: true,
    });

    expect(euLine.taxCents).toBe(2000);
    expect(euLine.reverseCharge).toBe(false);
    expect(ukLine.taxCents).toBe(1000);
    expect(b2bReverseCharge.reverseCharge).toBe(true);
    expect(b2bReverseCharge.taxCents).toBe(0);

    const report = await reportDac7(stripe, {
      sellerId: 'seller_1',
      reportingYear: 2026,
      lines: [euLine, ukLine, b2bReverseCharge],
      customerId: 'seller_1',
      currency: 'eur',
    });

    expect(report.state).toBe('reported');
    expect(report.metadata.lineCount).toBe(3);
    expect(report.metadata.totalTaxCents).toBe(3000);
    expect(report.amountCents).toBe(35_000);
  });
});
```

The rule of thumb is that DAC7 aggregates by seller × year, not by transaction — the report event carries `sellerId` + `reportingYear` + `lineCount` + `totalTaxCents` so a downstream ETL can bin by seller without walking every transaction line. The mock separates line computation (`calculateLocalizedTax`) from the report (`reportDac7`) so a test that only cares about tax computation does not need to build the whole report.

## Run it

```bash
pnpm test
```

All 5 files pass in under 3 seconds. The full v0.4 marketplace surface — 5 dispute states + 5 refund states + 5 webhook states + 4 tax localization states — is exercised by `packages/payment/tests/docs-tutorial-v1.33.test.ts` for every code snippet in this tutorial so a public API drift breaks CI before the reader sees a broken example.

## What you learned

- Dispute lifecycle has 5 non-skippable stages (opened / evidence-submitted / represented / arbitration-opened / liability-shifted → won or lost) that map to the Stripe Connect chargeback flow.
- Liability shift with a 3DS auth code removes the loss from the platform's dispute budget — the report event includes `threeDsAuthCode` so downstream tax and revenue reports can exclude shifted losses.
- Refund policy enforcement (`windowMs` + `minAmountCents` + `maxAmountCents`) protects the connected account balance so an accidental full refund does not drain the platform's payout budget.
- Webhook idempotency scoping (`handlerName:eventId`) lets a single event fire N handlers exactly once each, matching the Stripe Connect payout retry storm shape.
- DAC7 report aggregation (`sellerId × reportingYear`) computes a single report event from N localised tax lines so a downstream ETL can serialise the annual EU filing without walking every transaction.

## Next steps

- Tutorial 66 walks Paddle Billing v2 + retention + proration + coupon + trial for the subscription dogfood app.
- Concept doc `docs/concepts/payment-real-driver-testing.md` documents the 8-axis SSOT + 3 provider × 8 axis = 24 cell grid + `KIWA_MODE=real` env-gate + `STRIPE_KEY` / `PADDLE_KEY` / `LEMONSQUEEZY_KEY` per-provider mapping.
