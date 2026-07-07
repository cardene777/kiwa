# Recurring revenue + Payment orchestration II + Fraud detection + Regulatory reporting — MRR/ARR/NRR + smart routing + ML fraud + PCI/PSD2/DORA/SAR in 15 min

## What you'll build

A vitest suite wired to `@kiwa-test/payment` v0.5 that models the 4 pieces of a real subscription-billing + payment-routing + fraud-defense + compliance-reporting product surface that every non-trivial global SaaS eventually needs — a recurring-revenue-advanced `startRecurringRevenue` step that pins a per-cohort `cohortId` + `customerId` + `mrrStartCents`, a `computeMrr` step that derives `mrrCents` + `arrCents` (= `mrrCents * 12`) from the current snapshot so a downstream dashboard can query the cohort with one field lookup, a `recordChurn` step that decrements `snapshot.mrrEndCents` per subscription cancellation, a `recordExpansion` step that classifies the growth signal (`'upgrade'` / `'seat-add'` / `'usage'`) so a follow-up NRR breakdown can attribute the growth source, a `computeNrr` step that computes NRR = `(mrrStart - churn - contraction + expansion) / mrrStart * 100` (industry-standard growth quality metric, `> 100 %` = the cohort grew despite churn), a `recordContraction` step that separates downgrade (without churn) from churn so NRR captures the difference; a payment-orchestration-II `startOrchestrationII` step that pins an `intentId` + `amountCents` + `config.providers` (ordered ladder) + `config.mlScoringEnabled` (default `true`), a `smartRoute` step that runs the primary route + increments `attemptCount`, a `scoreMl` step that gates route-decision on a 0-1 score against `config.minMlScore` (default `0.5`), a `triggerFallback` step that walks the fallback ladder and moves to `'cascade-exhausted'` once all providers are tried or `maxAttempts` is hit; a fraud-detection-advanced `startFraudDetection` step that pins a `transactionId` + `customerId` + `amountCents` + a `config.mlBlockThreshold` (default `0.85`, mirroring Stripe Radar / Sift production thresholds), a `scoreDevice` step that runs device fingerprint scoring, a `verifyBiometric` step that runs behavioral biometrics (typing rhythm + mouse motion + swipe pattern), a `flagVelocity` step that records attempts-in-window against `config.maxVelocityPerHour`, a `scoreMlBlock` step that runs the ML fusion model + flips `verdict` to `'block'` when score >= threshold; a regulatory-reporting `startRegulatoryReporting` step that pins an `entityId` + `customerId`, a `reportPci` step that files PCI DSS attestation with SAQ level (`'A'` / `'A-EP'` / `'D'`), a `reportPsd2` step that files PSD2 SCA challenge rate + exemption count with the EBA, a `reportDora` step that files DORA ICT risk score + third-party register with the ESA, a `fileSar` step that files a Suspicious Activity Report with FinCEN / NCA (non-deletable, one-shot per session), and a `lockForAudit` step that pins the terminal audit-locked state. `startRecurringRevenue()` + `computeMrr()` + `recordChurn()` + `recordExpansion()` + `computeNrr()` + `recordContraction()` + `startOrchestrationII()` + `smartRoute()` + `scoreMl()` + `triggerFallback()` + `startFraudDetection()` + `scoreDevice()` + `verifyBiometric()` + `flagVelocity()` + `scoreMlBlock()` + `startRegulatoryReporting()` + `reportPci()` + `reportPsd2()` + `reportDora()` + `fileSar()` + `lockForAudit()` give you every one of those pieces without booting a real Chargebee / Recurly / Stripe Radar / Sift / EBA reporting service. This is the pattern kiwa's 3 v1.41 dogfood apps + a hypothetical `examples/dogfood-payment-orchestration-fraud-app` exercise against real Chargebee / Recurly (recurring revenue analytics) + Spreedly (payment orchestration + smart routing) + Stripe Radar / Sift / Signifyd (fraud detection ML fusion) + EBA / FinCEN reporting endpoints (regulatory filing) under `KIWA_MODE=real`; the tutorial covers the mock-only path so you can iterate in milliseconds and reproduce the exact "the NRR came out negative because `recordChurn` decremented `mrrEnd` but `computeNrr` used `mrrStart` as the denominator without accounting for the churn in the numerator sign" gap a reviewer sees in the recurring-revenue-nrr post-mortem.

## Prerequisites

- Node.js ≥ 20
- `pnpm` (or npm / yarn)
- An empty directory to work in

## Step-by-step build

### 1. Bootstrap the project

```bash
mkdir kiwa-recurring-orchestration-fraud-regulatory && cd kiwa-recurring-orchestration-fraud-regulatory
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

The v0.5 surface exports the recurring-revenue-advanced axis (`startRecurringRevenue` / `computeMrr` / `recordChurn` / `recordExpansion` / `computeNrr` / `recordContraction`), the payment-orchestration-II axis (`startOrchestrationII` / `smartRoute` / `scoreMl` / `triggerFallback`), the fraud-detection-advanced axis (`startFraudDetection` / `scoreDevice` / `verifyBiometric` / `flagVelocity` / `scoreMlBlock`), and the regulatory-reporting axis (`startRegulatoryReporting` / `reportPci` / `reportPsd2` / `reportDora` / `fileSar` / `lockForAudit`) directly from the package root. Every v0.5 semantics function takes a `PaymentAdapter` (from `createStripeMock` / `createPaddleMock` / `createLemonSqueezyMock`) as first argument — the mock adapter emits neutral events (`rr.mrr_computed` / `po2.smart_routed` / `fraud.ml_blocked` / `reg.sar_filed` / etc.) that map 1-to-1 to a provider-specific webhook shape via `providerEventName(adapter.provider, neutralEvent)`. This tutorial focuses on the recurring-revenue + orchestration II + fraud-detection + regulatory-reporting chain; tutorial 88 covers the embedded-finance + BNPL axis, tutorial 89 covers the crypto-payment + FX cross-border axis.

### 2. `startRecurringRevenue` + `computeMrr` — MRR / ARR from a cohort snapshot

`tests/rr/mrr.test.ts` — a `RecurringRevenueSession` pins a `cohortId` + `customerId` + `mrrStartCents` + a `snapshot` that starts at `{ mrrEndCents: mrrStartCents, churnCents: 0, contractionCents: 0, expansionCents: 0 }`. `computeMrr()` derives `computedMrr = snapshot.mrrEndCents` + `computedArr = computedMrr * 12`. The session state moves to `'mrr-computed'` on first call.

```ts
import { describe, expect, it } from 'vitest';
import {
  computeMrr,
  createStripeMock,
  startRecurringRevenue,
} from '@kiwa-test/payment';

describe('rr — MRR + ARR computation', () => {
  it('computes MRR + ARR from the initial snapshot', async () => {
    const adapter = createStripeMock();
    const session = startRecurringRevenue({
      cohortId: 'cohort_1',
      customerId: 'cus_1',
      mrrStartCents: 100000,
    });
    const step = await computeMrr(adapter, session);
    expect(step.metadata.mrrCents).toBe(100000);
    expect(step.metadata.arrCents).toBe(1200000);
    expect(session.state).toBe('mrr-computed');
  });

  it('rejects negative mrrStartCents', () => {
    expect(() =>
      startRecurringRevenue({
        cohortId: 'cohort_bad',
        customerId: 'cus_1',
        mrrStartCents: -1,
      }),
    ).toThrow(/non-negative/);
  });
});
```

`session.computedMrr` + `session.computedArr` are now the SSOT for the dashboard — a downstream analytics query walks `session.snapshot.mrrEndCents` for the current MRR and `session.computedArr` for the annualized run rate.

### 3. `recordChurn` + `recordExpansion` + `recordContraction` — MRR movement tape

`tests/rr/movement.test.ts` — `recordChurn()` decrements `snapshot.mrrEndCents` per subscription cancellation and accumulates `snapshot.churnCents`. `recordExpansion()` increments `snapshot.mrrEndCents` per upgrade / seat-add / usage growth. `recordContraction()` is a pure accumulator on the contraction bucket (no state change) so downgrade without churn is separately trackable.

```ts
import { describe, expect, it } from 'vitest';
import {
  createStripeMock,
  recordChurn,
  recordContraction,
  recordExpansion,
  startRecurringRevenue,
} from '@kiwa-test/payment';

describe('rr — churn + expansion + contraction', () => {
  it('records churn and decrements mrrEnd', async () => {
    const adapter = createStripeMock();
    const session = startRecurringRevenue({
      cohortId: 'cohort_2',
      customerId: 'cus_2',
      mrrStartCents: 100000,
    });
    await recordChurn(adapter, session, {
      churnCents: 20000,
      subscriptionId: 'sub_1',
    });
    expect(session.snapshot.mrrEndCents).toBe(80000);
    expect(session.snapshot.churnCents).toBe(20000);
    expect(session.state).toBe('churn-recorded');
  });

  it('records expansion and increments mrrEnd', async () => {
    const adapter = createStripeMock();
    const session = startRecurringRevenue({
      cohortId: 'cohort_3',
      customerId: 'cus_3',
      mrrStartCents: 100000,
    });
    await recordExpansion(adapter, session, {
      expansionCents: 15000,
      subscriptionId: 'sub_2',
      kind: 'seat-add',
    });
    expect(session.snapshot.mrrEndCents).toBe(115000);
    expect(session.snapshot.expansionCents).toBe(15000);
    expect(session.state).toBe('expansion-recorded');
  });

  it('records contraction as a separate bucket', () => {
    const session = startRecurringRevenue({
      cohortId: 'cohort_4',
      customerId: 'cus_4',
      mrrStartCents: 50000,
    });
    recordContraction(session, { contractionCents: 5000 });
    expect(session.snapshot.contractionCents).toBe(5000);
    expect(session.snapshot.mrrEndCents).toBe(45000);
  });
});
```

The 3-way movement (churn / expansion / contraction) is the invariant that lets NRR capture the full growth quality — a cohort with 5 % churn + 15 % expansion + 2 % contraction lands on NRR = 108 %, and each bucket is independently queryable for attribution.

### 4. `computeNrr` — Net Revenue Retention rollup

`tests/rr/nrr.test.ts` — `computeNrr()` computes `NRR = (mrrStartCents - churnCents - contractionCents + expansionCents) / mrrStartCents * 100`, rounded to 2 decimal places. NRR > 100 means the cohort grew despite churn — this is the industry-standard growth quality metric that separates a healthy SaaS from a leaky-bucket business.

```ts
import { describe, expect, it } from 'vitest';
import {
  computeNrr,
  createStripeMock,
  recordChurn,
  recordExpansion,
  startRecurringRevenue,
} from '@kiwa-test/payment';

describe('rr — NRR rollup', () => {
  it('computes NRR > 100 when expansion beats churn', async () => {
    const adapter = createStripeMock();
    const session = startRecurringRevenue({
      cohortId: 'cohort_5',
      customerId: 'cus_5',
      mrrStartCents: 100000,
    });
    await recordChurn(adapter, session, {
      churnCents: 5000,
      subscriptionId: 'sub_x',
    });
    await recordExpansion(adapter, session, {
      expansionCents: 15000,
      subscriptionId: 'sub_y',
      kind: 'upgrade',
    });
    const step = await computeNrr(adapter, session);
    expect(step.metadata.nrr).toBe(110); // (100000 - 5000 + 15000) / 100000 * 100
    expect(session.state).toBe('nrr-computed');
  });

  it('handles mrrStartCents = 0 without divide-by-zero', async () => {
    const adapter = createStripeMock();
    const session = startRecurringRevenue({
      cohortId: 'cohort_6',
      customerId: 'cus_6',
      mrrStartCents: 0,
    });
    await computeNrr(adapter, session);
    expect(session.computedNrr).toBe(0);
  });
});
```

The NRR value is the outer-loop signal — a NRR < 100 cohort is churning faster than it grows and needs product intervention; a NRR > 120 cohort is a repeatable growth engine.

### 5. `startOrchestrationII` + `smartRoute` — smart routing on a provider ladder

`tests/po2/route.test.ts` — an `OrchestrationIISession` pins an `intentId` + `amountCents` + `config.providers` (ordered ladder) + `config.mlScoringEnabled` (default `true`) + `config.minMlScore` (default `0.5`) + `config.maxAttempts` (default `5`). `smartRoute()` runs the primary route + increments `attemptCount` + moves state to `'smart-routed'`. A caller must supply the concrete adapters matching the config provider names.

```ts
import { describe, expect, it } from 'vitest';
import {
  createPaddleMock,
  createStripeMock,
  smartRoute,
  startOrchestrationII,
} from '@kiwa-test/payment';

describe('po2 — smart routing', () => {
  it('routes through the primary provider on first call', async () => {
    const stripe = createStripeMock();
    const paddle = createPaddleMock();
    const session = startOrchestrationII({
      intentId: 'pi_1',
      amountCents: 5000,
      customerId: 'cus_1',
      config: { providers: ['stripe', 'paddle'] },
    });
    const step = await smartRoute([stripe, paddle], session);
    expect(step.metadata.provider).toBe('stripe');
    expect(session.attemptCount).toBe(1);
    expect(session.state).toBe('smart-routed');
  });

  it('rejects empty providers config', () => {
    expect(() =>
      startOrchestrationII({
        intentId: 'pi_bad',
        amountCents: 5000,
        customerId: 'cus_1',
        config: { providers: [] },
      }),
    ).toThrow(/providers must not be empty/);
  });
});
```

`session.attemptCount` is the deterministic counter — a downstream ML retrain job walks the attempt counts to identify high-cost intent flows.

### 6. `scoreMl` + `triggerFallback` — ML gate + fallback ladder

`tests/po2/ml-fallback.test.ts` — `scoreMl()` gates the primary route on a 0-1 ML score against `config.minMlScore` (default `0.5`). `triggerFallback()` walks the fallback ladder and moves to `'cascade-exhausted'` once all providers are tried or `maxAttempts` is hit. A caller that lets the cascade exhaust cannot silently retry — the terminal state throws on subsequent calls.

```ts
import { describe, expect, it } from 'vitest';
import {
  createPaddleMock,
  createStripeMock,
  scoreMl,
  smartRoute,
  startOrchestrationII,
  triggerFallback,
} from '@kiwa-test/payment';

describe('po2 — ML score + fallback', () => {
  it('scores ML and flags pass/fail', async () => {
    const stripe = createStripeMock();
    const paddle = createPaddleMock();
    const session = startOrchestrationII({
      intentId: 'pi_2',
      amountCents: 5000,
      customerId: 'cus_2',
      config: { providers: ['stripe', 'paddle'] },
    });
    await smartRoute([stripe, paddle], session);
    const step = await scoreMl([stripe, paddle], session, {
      score: 0.7,
      features: { bin_country: 1, velocity: 2 },
    });
    expect(step.metadata.passed).toBe(true);
    expect(session.mlScore).toBe(0.7);
    expect(session.state).toBe('ml-scored');
  });

  it('triggers fallback to the next provider in the ladder', async () => {
    const stripe = createStripeMock();
    const paddle = createPaddleMock();
    const session = startOrchestrationII({
      intentId: 'pi_3',
      amountCents: 5000,
      customerId: 'cus_3',
      config: { providers: ['stripe', 'paddle'] },
    });
    await smartRoute([stripe, paddle], session);
    const step = await triggerFallback([stripe, paddle], session);
    expect(step.metadata.toProvider).toBe('paddle');
    expect(session.currentIndex).toBe(1);
    expect(session.state).toBe('fallback-triggered');
  });

  it('exhausts the cascade when all providers are tried', async () => {
    const stripe = createStripeMock();
    const paddle = createPaddleMock();
    const session = startOrchestrationII({
      intentId: 'pi_4',
      amountCents: 5000,
      customerId: 'cus_4',
      config: { providers: ['stripe', 'paddle'], maxAttempts: 10 },
    });
    await smartRoute([stripe, paddle], session);
    await triggerFallback([stripe, paddle], session);
    const exhaust = await triggerFallback([stripe, paddle], session);
    expect(exhaust.neutralEvent).toBe('po2.cascade_exhausted');
    expect(session.state).toBe('cascade-exhausted');
  });
});
```

The `cascade-exhausted` terminal state is the outer-loop gate — a caller that gets this state must abort the intent and surface the failure to the customer, not silently retry.

### 7. `startFraudDetection` + `scoreDevice` + `verifyBiometric` — device + biometric signals

`tests/fraud/signals.test.ts` — a `FraudDetectionSession` pins a `transactionId` + `customerId` + `amountCents` + a `config.mlBlockThreshold` (default `0.85`, mirroring Stripe Radar / Sift production defaults). `scoreDevice()` records a 0-100 device fingerprint score, `verifyBiometric()` records typing rhythm / mouse motion / swipe pattern signals. Both are pre-cursors to the ML fusion step.

```ts
import { describe, expect, it } from 'vitest';
import {
  createStripeMock,
  scoreDevice,
  startFraudDetection,
  verifyBiometric,
} from '@kiwa-test/payment';

describe('fraud — device + biometric signals', () => {
  it('scores device fingerprint', async () => {
    const adapter = createStripeMock();
    const session = startFraudDetection({
      transactionId: 'tx_1',
      customerId: 'cus_1',
      amountCents: 5000,
    });
    const step = await scoreDevice(adapter, session, {
      score: 75,
      fingerprint: 'fp_abc',
      ipAddress: '1.2.3.4',
    });
    expect(step.metadata.passed).toBe(true);
    expect(session.deviceScore).toBe(75);
    expect(session.state).toBe('device-scored');
  });

  it('verifies biometric with confidence gate', async () => {
    const adapter = createStripeMock();
    const session = startFraudDetection({
      transactionId: 'tx_2',
      customerId: 'cus_2',
      amountCents: 5000,
    });
    const step = await verifyBiometric(adapter, session, {
      passed: true,
      confidence: 0.9,
      signals: ['typing', 'mouse'],
    });
    expect(step.metadata.passed).toBe(true);
    expect(session.biometricPassed).toBe(true);
    expect(session.state).toBe('biometric-verified');
  });
});
```

The device score + biometric verdict are 2 of the 4 signals that feed the ML fusion — the other 2 are velocity + risk-context, wired in the next step.

### 8. `flagVelocity` + `scoreMlBlock` — velocity + ML fusion verdict

`tests/fraud/velocity-ml.test.ts` — `flagVelocity()` records `attemptsInWindow` + `windowMs` and sets `state: 'velocity-flagged'` when the count exceeds `config.maxVelocityPerHour` (default `5`). `scoreMlBlock()` runs the ML fusion model + flips `verdict` to `'block'` when score >= `config.mlBlockThreshold` (default `0.85`) or `'accept'` when score < threshold/2 or `'review'` otherwise.

```ts
import { describe, expect, it } from 'vitest';
import {
  createStripeMock,
  flagVelocity,
  scoreMlBlock,
  startFraudDetection,
} from '@kiwa-test/payment';

describe('fraud — velocity + ML fusion', () => {
  it('flags velocity when over the hourly limit', async () => {
    const adapter = createStripeMock();
    const session = startFraudDetection({
      transactionId: 'tx_3',
      customerId: 'cus_3',
      amountCents: 5000,
      config: { maxVelocityPerHour: 5 },
    });
    const step = await flagVelocity(adapter, session, {
      attemptsInWindow: 8,
      windowMs: 3_600_000,
    });
    expect(step.metadata.overLimit).toBe(true);
    expect(session.state).toBe('velocity-flagged');
  });

  it('blocks when ML score >= threshold', async () => {
    const adapter = createStripeMock();
    const session = startFraudDetection({
      transactionId: 'tx_4',
      customerId: 'cus_4',
      amountCents: 5000,
    });
    const step = await scoreMlBlock(adapter, session, {
      score: 0.9,
      modelVersion: 'v1',
      features: { device: 20, biometric: 30 },
    });
    expect(step.metadata.verdict).toBe('block');
    expect(session.verdict).toBe('block');
    expect(session.state).toBe('ml-blocked');
  });

  it('accepts when ML score is well below threshold', async () => {
    const adapter = createStripeMock();
    const session = startFraudDetection({
      transactionId: 'tx_5',
      customerId: 'cus_5',
      amountCents: 5000,
    });
    const step = await scoreMlBlock(adapter, session, {
      score: 0.1,
      modelVersion: 'v1',
      features: { device: 80, biometric: 90 },
    });
    expect(step.metadata.verdict).toBe('accept');
    expect(session.state).toBe('accepted');
  });
});
```

The 3-way verdict (`accept` / `review` / `block`) is the invariant that lets a downstream payment gateway route on the model output — a `'block'` verdict aborts the charge, a `'review'` verdict queues the transaction for manual analyst review, and an `'accept'` verdict passes through to the auth step.

### 9. `startRegulatoryReporting` + `reportPci` + `reportPsd2` + `reportDora` — compliance filings

`tests/reg/reports.test.ts` — a `RegulatoryReportingSession` pins an `entityId` + `customerId`. `reportPci()` files PCI DSS attestation with SAQ level (`'A'` / `'A-EP'` / `'D'`), `reportPsd2()` files PSD2 SCA challenge rate + exemption count with the EBA (European Banking Authority), `reportDora()` files DORA ICT risk score + third-party register with the ESA (European Supervisory Authorities). Each step appends a `ReportRecord` to `session.reports` with a fingerprint for tamper detection.

```ts
import { describe, expect, it } from 'vitest';
import {
  createStripeMock,
  reportDora,
  reportPci,
  reportPsd2,
  startRegulatoryReporting,
} from '@kiwa-test/payment';

describe('reg — PCI + PSD2 + DORA reports', () => {
  it('files PCI DSS attestation', async () => {
    const adapter = createStripeMock();
    const session = startRegulatoryReporting({
      entityId: 'ent_1',
      customerId: 'cus_1',
    });
    const step = await reportPci(adapter, session, {
      reportId: 'pci_q1_2026',
      period: 'quarterly',
      fingerprint: 'fp_pci',
      saqLevel: 'D',
    });
    expect(step.metadata.saqLevel).toBe('D');
    expect(session.state).toBe('pci-reported');
    expect(session.reports).toHaveLength(1);
  });

  it('files PSD2 SCA compliance report', async () => {
    const adapter = createStripeMock();
    const session = startRegulatoryReporting({
      entityId: 'ent_2',
      customerId: 'cus_2',
    });
    const step = await reportPsd2(adapter, session, {
      reportId: 'psd2_2026_q1',
      period: 'quarterly',
      challengeRate: 0.15,
      exemptionCount: 12000,
      fingerprint: 'fp_psd2',
    });
    expect(step.metadata.challengeRate).toBe(0.15);
    expect(session.state).toBe('psd2-reported');
  });

  it('files DORA ICT risk report', async () => {
    const adapter = createStripeMock();
    const session = startRegulatoryReporting({
      entityId: 'ent_3',
      customerId: 'cus_3',
    });
    const step = await reportDora(adapter, session, {
      reportId: 'dora_2026',
      period: 'annual',
      ictRiskScore: 25,
      thirdPartyCount: 45,
      incidentCount: 2,
      fingerprint: 'fp_dora',
    });
    expect(step.metadata.ictRiskScore).toBe(25);
    expect(session.state).toBe('dora-reported');
  });
});
```

`session.reports` is now the audit tape — a downstream compliance dashboard walks the array for a chronological filing history keyed by regulator + fingerprint.

### 10. `fileSar` + `lockForAudit` — Suspicious Activity Report + audit lock

`tests/reg/sar.test.ts` — `fileSar()` files a SAR with FinCEN (US) or NCA (UK), non-deletable + one-shot per session (a filed SAR cannot be un-filed). `lockForAudit()` pins the terminal `'audit-locked'` state so no further reports are accepted.

```ts
import { describe, expect, it } from 'vitest';
import {
  createStripeMock,
  fileSar,
  lockForAudit,
  startRegulatoryReporting,
} from '@kiwa-test/payment';

describe('reg — SAR + audit lock', () => {
  it('files a SAR with FinCEN', async () => {
    const adapter = createStripeMock();
    const session = startRegulatoryReporting({
      entityId: 'ent_4',
      customerId: 'cus_4',
    });
    const step = await fileSar(adapter, session, {
      reportId: 'sar_1',
      regulator: 'FinCEN',
      reason: 'Unusual pattern of structured cash deposits',
      fingerprint: 'fp_sar',
    });
    expect(step.metadata.regulator).toBe('FinCEN');
    expect(session.sarFiled).toBe(true);
    expect(session.state).toBe('sar-filed');
  });

  it('refuses a second SAR filing on the same session', async () => {
    const adapter = createStripeMock();
    const session = startRegulatoryReporting({
      entityId: 'ent_5',
      customerId: 'cus_5',
    });
    await fileSar(adapter, session, {
      reportId: 'sar_2',
      regulator: 'NCA',
      reason: 'Suspicious transaction chain',
      fingerprint: 'fp_sar2',
    });
    await expect(
      fileSar(adapter, session, {
        reportId: 'sar_3',
        regulator: 'NCA',
        reason: 'again',
        fingerprint: 'fp_sar3',
      }),
    ).rejects.toThrow(/already filed/);
  });

  it('locks the session for audit', () => {
    const session = startRegulatoryReporting({
      entityId: 'ent_6',
      customerId: 'cus_6',
    });
    lockForAudit(session);
    expect(session.state).toBe('audit-locked');
  });
});
```

The `sarFiled` guard is the immutability invariant — a compliance officer cannot file a SAR twice on the same session, and a follow-up audit trace has a single-point-of-truth for the filing history.

## Wrap-up

You now have a recurring-revenue + orchestration II + fraud-detection + regulatory-reporting pipeline that (a) tracks MRR / ARR / NRR from a cohort snapshot with 3-way movement (churn / expansion / contraction), (b) smart-routes payments through an ordered provider ladder with ML score gate + fallback + cascade exhaustion, (c) fuses device fingerprint + behavioral biometric + velocity + ML model into an accept / review / block verdict, and (d) files PCI DSS + PSD2 SCA + DORA ICT + SAR reports with tamper-evident fingerprints + terminal audit lock — all without booting a real Chargebee / Recurly / Spreedly / Stripe Radar / Sift / EBA reporting backend, all in a millisecond-scale inner loop, and all on the same neutral event names (`rr.nrr_computed` / `po2.cascade_exhausted` / `fraud.ml_blocked` / `reg.sar_filed` / etc.) that the 3 provider dialects (`stripe` / `paddle` / `lemonsqueezy`) emit under real routing. The v1.41 dogfood apps run related assertions against real backends under `KIWA_MODE=real`; the fidelity harness (`collectFidelityCoverage()`) reports the mock-vs-real coverage on a per-axis basis.
