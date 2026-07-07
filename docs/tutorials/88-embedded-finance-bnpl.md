# Embedded finance + BNPL — Banking-as-a-Service (BaaS) + card issuance + KYC/KYB + BNPL installment plan + risk scoring + late fee in 15 min

## What you'll build

A vitest suite wired to `@kiwa-test/payment` v0.5 that models the 2 pieces of a real embedded-finance + BNPL (Buy Now Pay Later) product surface that every non-trivial fintech-adjacent product eventually needs — an embedded-finance `openAccount` step that pins a per-customer `accountId` + `customerId` + `currency` so a follow-up KYC / KYB / card-issuance step operates on a single SSOT, a `verifyKyc` step that gates card issuance on a caller-supplied score against a session-level `minScore` floor (default `60`, mirroring Stripe Treasury / Unit / Column onboarding) so a `score: 30` customer lands on `state: 'suspended'` and a `score: 80` customer lands on `state: 'kyc-verified'`, a `verifyKyb` step that is only accepted when `config.requireKyb: true` so a mis-configured caller cannot silently no-op a business-verification step, an `issueCard` step that refuses to run until KYC (and KYB when required) are `verified` so a rogue card cannot be issued against an un-verified account, and a `closeAccount` step that pins the terminal state so no further ops accept, a BNPL `createBnplPlan` step that splits `totalCents` into equal installments (rounded to integer cents, last installment absorbs remainder), a `scheduleInstallment` step that advances the schedule pointer + emits `bnpl.installment_scheduled`, a `scoreRisk` step that gates plan progression on a caller-supplied 0-100 score against `config.minRiskScore` (default `50`, mirroring Klarna soft-credit-check onboarding) so a `score: 30` customer moves to `state: 'defaulted'` and a `score: 70` customer moves to `state: 'risk-scored'`, a `chargeLateFee` step that accumulates `session.lateFeesTotalCents` per missed installment (default `700` = $7.00, mirroring Affirm late-fee schedule), and a `markInstallmentPaid` step that flips `state` to `'settled'` once all installments are paid. `openAccount()` + `verifyKyc()` + `verifyKyb()` + `issueCard()` + `closeAccount()` + `createBnplPlan()` + `scheduleInstallment()` + `scoreRisk()` + `chargeLateFee()` + `markInstallmentPaid()` give you every one of those pieces without booting a real Stripe Treasury / Klarna / Affirm backend. This is the pattern kiwa's `examples/dogfood-payment-embedded-finance-app` + `examples/dogfood-payment-bnpl-installment-app` exercise against real Stripe Treasury (BaaS + card issuance) + Unit / Column (KYB register lookup) + Klarna / Affirm / Afterpay (BNPL + credit check + late fee) backends under `KIWA_MODE=real` + the relevant `_URL` env; the tutorial covers the mock-only path so you can iterate in milliseconds and reproduce the exact "the card was issued to an un-verified account because `issueCard` did not gate on `session.kycStatus === 'verified'`" gap a reviewer sees in the embedded-finance-issuance post-mortem.

## Prerequisites

- Node.js ≥ 20
- `pnpm` (or npm / yarn)
- An empty directory to work in

## Step-by-step build

### 1. Bootstrap the project

```bash
mkdir kiwa-embedded-finance-bnpl && cd kiwa-embedded-finance-bnpl
pnpm init
pnpm add -D @kiwa-test/payment@^0.5 vitest typescript @types/node
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

The v0.5 surface exports the embedded-finance axis (`openAccount` / `verifyKyc` / `verifyKyb` / `issueCard` / `closeAccount`) and the BNPL axis (`createBnplPlan` / `scheduleInstallment` / `scoreRisk` / `chargeLateFee` / `markInstallmentPaid`) directly from the package root. Every v0.5 semantics function takes a `PaymentAdapter` (from `createStripeMock` / `createPaddleMock` / `createLemonSqueezyMock`) as first argument — the mock adapter emits neutral events (`embedded.account_opened` / `bnpl.plan_created` / etc.) that map 1-to-1 to a provider-specific webhook shape via `providerEventName(adapter.provider, neutralEvent)`. This tutorial focuses on the embedded-finance + BNPL end-to-end chain; tutorial 89 covers the crypto-payment + FX cross-border axis, tutorial 90 covers the recurring-revenue-advanced + payment-orchestration-II + fraud-detection-advanced + regulatory-reporting axis.

### 2. `openAccount` — the BaaS account binding step

`tests/embedded/account.test.ts` — an `EmbeddedFinanceSession` pins an `accountId` + `customerId` + optional `currency` + a `state` that starts at `'initial'` and moves to `'account-opened'` on `openAccount`. The default `config.requireKyb` is `false` so a consumer-facing account is auto-KYB-verified (`kybStatus: 'verified'`); a business-facing platform sets `config.requireKyb: true` and the KYB status stays `'pending'` until `verifyKyb` runs.

```ts
import { describe, expect, it } from 'vitest';
import { createStripeMock, openAccount } from '@kiwa-test/payment';

describe('embedded — account binding', () => {
  it('opens an account and moves state to account-opened', async () => {
    const adapter = createStripeMock();
    const { session, step } = await openAccount(adapter, {
      accountId: 'acc_1',
      customerId: 'cus_1',
      currency: 'usd',
    });
    expect(step.neutralEvent).toBe('embedded.account_opened');
    expect(session.state).toBe('account-opened');
    expect(session.kycStatus).toBe('pending');
    expect(session.kybStatus).toBe('verified'); // default requireKyb=false
  });

  it('keeps KYB pending when requireKyb=true', async () => {
    const adapter = createStripeMock();
    const { session } = await openAccount(adapter, {
      accountId: 'acc_2',
      customerId: 'cus_2',
      config: { requireKyb: true },
    });
    expect(session.kybStatus).toBe('pending');
    expect(session.config.requireKyb).toBe(true);
  });
});
```

`session.state` is now the SSOT for who the downstream `verifyKyc` / `verifyKyb` / `issueCard` steps operate on — every step gates on the state and refuses to run on a `'closed'` or `'suspended'` account.

### 3. `verifyKyc` — score-gated identity verification

`tests/embedded/kyc.test.ts` — `verifyKyc()` compares the caller-supplied 0-100 score against `session.config.minScore` (default `60`). A passing score moves the session to `'kyc-verified'`; a failing score moves it to `'suspended'` and blocks all downstream operations. This is the invariant that lets a fintech platform enforce a KYC floor without a separate feature-flag service.

```ts
import { describe, expect, it } from 'vitest';
import { createStripeMock, openAccount, verifyKyc } from '@kiwa-test/payment';

describe('embedded — KYC score gate', () => {
  it('moves to kyc-verified on score >= minScore', async () => {
    const adapter = createStripeMock();
    const { session } = await openAccount(adapter, {
      accountId: 'acc_3',
      customerId: 'cus_3',
    });
    const step = await verifyKyc(adapter, session, { score: 80 });
    expect(step.metadata.passed).toBe(true);
    expect(session.state).toBe('kyc-verified');
    expect(session.kycStatus).toBe('verified');
  });

  it('suspends the account when score < minScore', async () => {
    const adapter = createStripeMock();
    const { session } = await openAccount(adapter, {
      accountId: 'acc_4',
      customerId: 'cus_4',
    });
    const step = await verifyKyc(adapter, session, { score: 30 });
    expect(step.metadata.passed).toBe(false);
    expect(session.state).toBe('suspended');
    expect(session.kycStatus).toBe('failed');
  });

  it('rejects a score outside 0-100', async () => {
    const adapter = createStripeMock();
    const { session } = await openAccount(adapter, {
      accountId: 'acc_5',
      customerId: 'cus_5',
    });
    await expect(verifyKyc(adapter, session, { score: 101 })).rejects.toThrow(
      /between 0 and 100/,
    );
  });
});
```

`session.kycStatus` (`'pending'` / `'verified'` / `'failed'`) is now the persistent gate for card issuance — a `verifyKyc` failure is not recoverable within the same session; the caller must open a fresh session with a new `accountId`.

### 4. `verifyKyb` — business-registry lookup (opt-in via `requireKyb`)

`tests/embedded/kyb.test.ts` — `verifyKyb()` is only accepted when `config.requireKyb: true`; a caller that forgets to set the flag and calls `verifyKyb` gets a fast-fail throw instead of a silent no-op. The step records `businessRegistryId` (e.g. Companies House / SEC EDGAR id) + `verified` boolean; a `verified: false` outcome suspends the account.

```ts
import { describe, expect, it } from 'vitest';
import { createStripeMock, openAccount, verifyKyb } from '@kiwa-test/payment';

describe('embedded — KYB business verification', () => {
  it('moves to kyb-verified on verified=true', async () => {
    const adapter = createStripeMock();
    const { session } = await openAccount(adapter, {
      accountId: 'acc_6',
      customerId: 'cus_6',
      config: { requireKyb: true },
    });
    const step = await verifyKyb(adapter, session, {
      businessRegistryId: 'reg_1',
      verified: true,
    });
    expect(step.neutralEvent).toBe('embedded.kyb_verified');
    expect(session.state).toBe('kyb-verified');
  });

  it('throws when KYB is not required in config', async () => {
    const adapter = createStripeMock();
    const { session } = await openAccount(adapter, {
      accountId: 'acc_7',
      customerId: 'cus_7',
    });
    await expect(
      verifyKyb(adapter, session, {
        businessRegistryId: 'reg_x',
        verified: true,
      }),
    ).rejects.toThrow(/not required/);
  });
});
```

The `requireKyb` opt-in is the switch between a consumer product (single-person account, KYC only) and a business platform (organization account, KYC + KYB) — the same `EmbeddedFinanceSession` shape covers both.

### 5. `issueCard` — KYC + KYB gated card issuance

`tests/embedded/issue.test.ts` — `issueCard()` refuses to run until `session.kycStatus === 'verified'` (and `session.kybStatus === 'verified'` when `config.requireKyb: true`). The step records the `cardId` on `session.cardIds` and emits `embedded.card_issued` with `type: 'virtual' | 'physical'` + `last4`. Multiple cards can be issued against the same account — the `totalCards` metadata field tracks the accumulator.

```ts
import { describe, expect, it } from 'vitest';
import {
  createStripeMock,
  issueCard,
  openAccount,
  verifyKyc,
} from '@kiwa-test/payment';

describe('embedded — card issuance', () => {
  it('issues a card after KYC verified', async () => {
    const adapter = createStripeMock();
    const { session } = await openAccount(adapter, {
      accountId: 'acc_8',
      customerId: 'cus_8',
    });
    await verifyKyc(adapter, session, { score: 90 });
    const step = await issueCard(adapter, session, {
      cardId: 'card_1',
      type: 'virtual',
      last4: '4242',
    });
    expect(step.metadata.cardId).toBe('card_1');
    expect(session.state).toBe('card-issued');
    expect(session.cardIds).toEqual(['card_1']);
  });

  it('blocks issuance when KYC not verified', async () => {
    const adapter = createStripeMock();
    const { session } = await openAccount(adapter, {
      accountId: 'acc_9',
      customerId: 'cus_9',
    });
    await expect(
      issueCard(adapter, session, {
        cardId: 'card_bad',
        type: 'virtual',
        last4: '0000',
      }),
    ).rejects.toThrow(/KYC must be verified/);
  });
});
```

The KYC / KYB gate on `issueCard` is the invariant that lets a compliance-audit downstream trust that every card in `session.cardIds` was issued against a verified identity — the state machine forbids the reverse order.

### 6. `createBnplPlan` — installment split + validation

`tests/bnpl/plan.test.ts` — a `BnplSession` pins a `planId` + `customerId` + `totalCents` + a `config.installments` count (2-12 typical, Klarna default 4). `createBnplPlan()` splits `totalCents` into equal integer-cents installments (`Math.floor`); the last installment absorbs any rounding remainder. The step refuses `installments < 2 || > 12` so a mis-configured caller cannot create a 1-installment "plan" (that's just a normal charge) or a 100-installment plan (that's a subscription).

```ts
import { describe, expect, it } from 'vitest';
import { createBnplPlan, createStripeMock } from '@kiwa-test/payment';

describe('bnpl — plan creation', () => {
  it('splits totalCents into equal installments', async () => {
    const adapter = createStripeMock();
    const { session, step } = await createBnplPlan(adapter, {
      planId: 'plan_1',
      customerId: 'cus_1',
      totalCents: 40000,
      currency: 'usd',
      config: { installments: 4 },
    });
    expect(step.neutralEvent).toBe('bnpl.plan_created');
    expect(session.installmentAmountCents).toBe(10000);
    expect(session.state).toBe('plan-created');
  });

  it('rejects installments < 2', async () => {
    const adapter = createStripeMock();
    await expect(
      createBnplPlan(adapter, {
        planId: 'plan_bad',
        customerId: 'cus_1',
        totalCents: 1000,
        config: { installments: 1 },
      }),
    ).rejects.toThrow(/between 2 and 12/);
  });

  it('rejects totalCents <= 0', async () => {
    const adapter = createStripeMock();
    await expect(
      createBnplPlan(adapter, {
        planId: 'plan_bad2',
        customerId: 'cus_1',
        totalCents: 0,
        config: { installments: 4 },
      }),
    ).rejects.toThrow(/totalCents must be positive/);
  });
});
```

`session.installmentAmountCents` is now the per-installment charge amount — a follow-up `scheduleInstallment` call emits that amount on each `bnpl.installment_scheduled` event so downstream ledger reconciliation is one field lookup away.

### 7. `scheduleInstallment` — schedule pointer advance

`tests/bnpl/schedule.test.ts` — `scheduleInstallment()` advances `session.installmentsScheduled` by 1 and emits `bnpl.installment_scheduled` with a `dueOffsetMs` computed from `config.installmentIntervalMs` (default `14 * 24 * 60 * 60 * 1000` = 14 days). Once all installments are scheduled, further calls throw — a mis-configured scheduler cannot silently over-schedule.

```ts
import { describe, expect, it } from 'vitest';
import {
  createBnplPlan,
  createStripeMock,
  scheduleInstallment,
} from '@kiwa-test/payment';

describe('bnpl — schedule installments', () => {
  it('advances the schedule pointer by 1 per call', async () => {
    const adapter = createStripeMock();
    const { session } = await createBnplPlan(adapter, {
      planId: 'plan_2',
      customerId: 'cus_2',
      totalCents: 20000,
      config: { installments: 4 },
    });
    await scheduleInstallment(adapter, session);
    await scheduleInstallment(adapter, session);
    expect(session.installmentsScheduled).toBe(2);
    expect(session.state).toBe('installments-scheduled');
  });

  it('throws when all installments already scheduled', async () => {
    const adapter = createStripeMock();
    const { session } = await createBnplPlan(adapter, {
      planId: 'plan_3',
      customerId: 'cus_3',
      totalCents: 8000,
      config: { installments: 2 },
    });
    await scheduleInstallment(adapter, session);
    await scheduleInstallment(adapter, session);
    await expect(scheduleInstallment(adapter, session)).rejects.toThrow(
      /already scheduled/,
    );
  });
});
```

The `installmentsScheduled` counter is the deterministic tape — a schedule-cron that fires `scheduleInstallment` every 14 days lands on the same 4-emission pattern regardless of retry / redelivery, and the throw on over-schedule prevents a runaway cron from firing a 5th installment on a 4-installment plan.

### 8. `scoreRisk` — soft-credit-check gate

`tests/bnpl/risk.test.ts` — `scoreRisk()` compares the caller-supplied 0-100 score (from Experian / Equifax / internal ML) against `session.config.minRiskScore` (default `50`, mirroring Klarna's soft-credit-check floor). A failing score moves the session to `'defaulted'` — the plan is not activated and all downstream ops (`chargeLateFee` / `markInstallmentPaid`) throw.

```ts
import { describe, expect, it } from 'vitest';
import {
  createBnplPlan,
  createStripeMock,
  scoreRisk,
} from '@kiwa-test/payment';

describe('bnpl — risk scoring', () => {
  it('moves to risk-scored on score >= minRiskScore', async () => {
    const adapter = createStripeMock();
    const { session } = await createBnplPlan(adapter, {
      planId: 'plan_4',
      customerId: 'cus_4',
      totalCents: 12000,
      config: { installments: 3 },
    });
    const step = await scoreRisk(adapter, session, {
      score: 70,
      creditBureau: 'experian',
    });
    expect(step.metadata.passed).toBe(true);
    expect(session.state).toBe('risk-scored');
  });

  it('moves to defaulted on score < minRiskScore', async () => {
    const adapter = createStripeMock();
    const { session } = await createBnplPlan(adapter, {
      planId: 'plan_5',
      customerId: 'cus_5',
      totalCents: 12000,
      config: { installments: 3 },
    });
    const step = await scoreRisk(adapter, session, {
      score: 30,
      creditBureau: 'equifax',
    });
    expect(step.metadata.passed).toBe(false);
    expect(session.state).toBe('defaulted');
  });
});
```

The `defaulted` state is the terminal gate — a BNPL provider that lets a `score: 30` customer through the risk check is one class-action-lawsuit away from a compliance disaster, and the state-machine invariant is the enforcement mechanism.

### 9. `chargeLateFee` + `markInstallmentPaid` — late fee accumulator + settlement

`tests/bnpl/lifecycle.test.ts` — `chargeLateFee()` accumulates `session.lateFeesTotalCents` per missed installment (default `700` = $7.00 late fee, mirroring Affirm's late-fee schedule), and `markInstallmentPaid()` flips `state` to `'settled'` once all installments are paid. This is the closing loop that lets a BNPL platform reconcile the ledger without a separate settlement service.

```ts
import { describe, expect, it } from 'vitest';
import {
  chargeLateFee,
  createBnplPlan,
  createStripeMock,
  markInstallmentPaid,
  scoreRisk,
} from '@kiwa-test/payment';

describe('bnpl — late fee + settlement', () => {
  it('accumulates late fees across missed installments', async () => {
    const adapter = createStripeMock();
    const { session } = await createBnplPlan(adapter, {
      planId: 'plan_6',
      customerId: 'cus_6',
      totalCents: 12000,
      config: { installments: 3, lateFeeCents: 500 },
    });
    await scoreRisk(adapter, session, { score: 70 });
    await chargeLateFee(adapter, session, { installmentIndex: 1 });
    await chargeLateFee(adapter, session, { installmentIndex: 2 });
    expect(session.lateFeesTotalCents).toBe(1000);
    expect(session.state).toBe('late-fee-charged');
  });

  it('marks the plan settled once all installments are paid', async () => {
    const adapter = createStripeMock();
    const { session } = await createBnplPlan(adapter, {
      planId: 'plan_7',
      customerId: 'cus_7',
      totalCents: 6000,
      config: { installments: 3 },
    });
    await scoreRisk(adapter, session, { score: 80 });
    markInstallmentPaid(session);
    markInstallmentPaid(session);
    markInstallmentPaid(session);
    expect(session.state).toBe('settled');
    expect(session.installmentsPaid).toBe(3);
  });
});
```

The `settled` terminal state closes the loop — a BNPL analytics dashboard can walk `session.installmentsPaid === session.config.installments` for a clean count of completed plans, and a follow-up churn / expansion analysis (tutorial 90 recurring-revenue axis) has a single point of truth to key off of.

## Wrap-up

You now have an embedded-finance + BNPL pipeline that (a) opens a BaaS account with optional KYB gating, (b) verifies KYC + KYB with score / boolean floors, (c) issues virtual + physical cards only after verification, (d) creates BNPL plans with equal-installment split, (e) advances the schedule pointer with over-schedule guard, (f) gates plan activation on a soft-credit-check score, and (g) accumulates late fees + closes with settlement — all without booting a real Stripe Treasury or Klarna backend, all in a millisecond-scale inner loop, and all on the same neutral event names (`embedded.account_opened` / `bnpl.plan_created` / `bnpl.late_fee_charged` / etc.) that the 3 provider dialects (`stripe` / `paddle` / `lemonsqueezy`) emit under real routing. The v1.41 dogfood apps (`examples/dogfood-payment-embedded-finance-app` + `examples/dogfood-payment-bnpl-installment-app`) run the same assertions against real Stripe Treasury / Unit / Column (BaaS + card + KYB) + Klarna / Affirm / Afterpay (BNPL + credit + late fee) backends under `KIWA_MODE=real` + the matching `_URL` env; the fidelity harness (`collectFidelityCoverage()`) reports the mock-vs-real coverage on a per-axis basis.
