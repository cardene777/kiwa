# Payment advanced III testing — v0.5 8 axis × 3 provider = 24 cell advanced III grid + 25-axis combined harness + pair 深度 4 段 2 例目 record (SSOT)

kiwa's v1.41-1 payment v0.5 package (`@kiwa/payment` v0.5.0) covers **8 advanced III axes** that model the deepening production payment posture of a real product stack beyond the v0.4 advanced II axes (payment orchestration + revenue recovery + refund advanced + dispute + webhook idempotency + tax localization + subscription state machine + payment-method vault) — embedded finance (Banking-as-a-Service + card issuance + KYC/KYB) + BNPL (installment plan + risk scoring + late fee) + crypto payment (stablecoin invoicing + on-chain confirmation + gas abstraction + wallet linking) + FX cross-border (multi-currency rate lock + SWIFT/SEPA settlement + rate expiration) + recurring revenue advanced (MRR/ARR + churn/expansion/contraction + NRR rollup) + payment orchestration II (smart routing + ML score gate + fallback ladder + cascade exhaustion) + fraud detection advanced (device fingerprint + behavioral biometrics + velocity + ML fusion) + regulatory reporting (PCI DSS + PSD2 SCA + DORA ICT + SAR + audit lock). This concept doc is the SSOT for those 8 advanced III axes; the tutorials (88-90) and dogfood apps (v1.41-2/3/4) are the concrete implementations.

The v0.5 grid is orthogonal to the v0.4 advanced II grid — the v0.4 grid covers the "orchestrate a charge, recover a failure, refund a mistake, defend a dispute, deliver a webhook, localize a tax, drive a subscription state, vault a card" primitive across 3 provider (`stripe` / `paddle` / `lemonsqueezy`), and the v0.5 advanced III grid extends the same 3 provider matrix with the "onboard a BaaS account, split a purchase into installments, invoice in stablecoin, settle across borders, roll up NRR, ML-route a payment, ML-block fraud, file a regulatory report" primitives. Read the `payment-real-driver-testing.md` concept doc first for the v0.3 base grid + `payment-testing.md` for the webhook signature primitive, then read this doc for the v0.5 advanced III grid.

## The 8 advanced III axes grid

The 8 axes are cover-oriented — each one names a real-world failure surface every non-trivial production payment stack hits after the v0.4 advanced II axes land.

| Axis | Real-world failure it catches | v0.5 API |
|---|---|---|
| Embedded finance | "The card was issued to an un-verified account because `issueCard` did not gate on `session.kycStatus === 'verified'`, and the KYB step silently no-op'd because `verifyKyb` was called with `requireKyb: false` in config" (no KYC-verified precondition on card issuance, no explicit `requireKyb` opt-in check on KYB step) | `openAccount` / `verifyKyc` / `verifyKyb` / `issueCard` / `closeAccount` |
| BNPL | "The plan was activated on a `score: 30` customer because `scoreRisk` compared with `>` instead of `>=`, and the late fee accumulator double-counted because `chargeLateFee` was called twice for the same installment without an index guard" (no `>= minRiskScore` gate on plan activation, no per-installment idempotency on late fee) | `createBnplPlan` / `scheduleInstallment` / `scoreRisk` / `chargeLateFee` / `markInstallmentPaid` |
| Crypto payment | "The invoice was marked confirmed on a 1-confirmation tx because the required-confirmations gate was off by one, and the gas abstraction ran on a `gasAbstractionEnabled: false` session because the config check was inverted" (no `>= requiredConfirmations` invariant, no explicit `gasAbstractionEnabled` opt-in check) | `createCryptoInvoice` / `confirmTx` / `abstractGas` / `linkWallet` |
| FX cross-border | "The settlement ran against an expired rate lock because `initiateSettlement` did not check `lockExpiresAt`, and the settlement completed against a fresh quote without re-computing `amountToCents` because `completeSettlement` used the initial `amountFromCents` instead of the locked `amountToCents`" (no `Date.now() > lockExpiresAt` guard, no `session.quote.amountToCents` read on settlement) | `startFxTransfer` / `lockRate` / `initiateSettlement` / `completeSettlement` / `expireRate` |
| Recurring revenue advanced | "The NRR came out negative because `recordChurn` decremented `mrrEnd` but `computeNrr` used `mrrStart` as the denominator without accounting for the churn in the numerator sign, and the ARR was 10x off because the multiplier was 120 instead of 12" (no `(mrrStart - churn - contraction + expansion) / mrrStart * 100` invariant, no MRR × 12 = ARR guard) | `startRecurringRevenue` / `computeMrr` / `recordChurn` / `recordExpansion` / `computeNrr` / `recordContraction` |
| Payment orchestration II | "The cascade never exhausted because `triggerFallback` walked past the last provider without moving to `'cascade-exhausted'`, and the ML score gate accepted a `score: -0.1` because the bound check was `<= 1` instead of `>= 0 && <= 1`" (no explicit `currentIndex >= providers.length` guard, no `0-1` bound assertion on ML score) | `startOrchestrationII` / `smartRoute` / `scoreMl` / `triggerFallback` |
| Fraud detection advanced | "The ML fusion model returned `verdict: 'accept'` on a `score: 0.9` because the threshold comparison was `>` instead of `>=`, and the velocity check flagged a legitimate customer because the window was 1 hour but the counter was reset to 0 on process restart without a persistent store" (no `>= mlBlockThreshold` invariant, no persistent velocity counter) | `startFraudDetection` / `scoreDevice` / `verifyBiometric` / `flagVelocity` / `scoreMlBlock` |
| Regulatory reporting | "The SAR was filed twice on the same session because `fileSar` did not check `session.sarFiled`, and the audit lock was bypassed because `reportPci` did not gate on `state !== 'audit-locked'`" (no one-shot invariant on SAR, no terminal-state guard on report steps) | `startRegulatoryReporting` / `reportPci` / `reportPsd2` / `reportDora` / `fileSar` / `lockForAudit` |

Each axis has 3 shapes — a mock-only path (fast inner loop, ms scale), a real-driver path (`KIWA_MODE=real` + real Stripe Treasury / Unit / Column / Klarna / Affirm / Afterpay / Coinbase Commerce / BitPay / Wise / Airwallex, seconds scale), and a fidelity assertion that the two produce the same output. Tutorial 88 covers the embedded-finance + BNPL end-to-end chain (openAccount → KYC → KYB → issueCard → createBnplPlan → schedule → risk → lateFee → paid), tutorial 89 covers the crypto-payment + FX cross-border chain (createCryptoInvoice → confirmTx → abstractGas → linkWallet → startFxTransfer → lockRate → initiateSettlement → completeSettlement → expireRate), tutorial 90 covers the recurring-revenue + orchestration II + fraud-detection + regulatory-reporting chain (startRecurringRevenue → computeMrr → recordChurn → recordExpansion → computeNrr → startOrchestrationII → smartRoute → scoreMl → triggerFallback → startFraudDetection → scoreDevice → verifyBiometric → flagVelocity → scoreMlBlock → startRegulatoryReporting → reportPci → reportPsd2 → reportDora → fileSar → lockForAudit).

## The 3-provider × 8-axis = 24 cell advanced III grid

Every provider covers every axis. The mock shapes are provider-neutral (the API surface is the same across `stripe` + `paddle` + `lemonsqueezy`), the emitted event dialects are provider-specific (`stripe.embedded.account_opened` vs. `paddle.embedded.account_opened` vs. `lemonsqueezy.embedded.account_opened`), and the advanced III fidelity harness reports the coverage explicitly through `collectFidelityCoverage()` walking all 25 axes (v0.3 9 + v0.4 8 + v0.5 8).

| Provider | Embedded finance | BNPL | Crypto payment | FX cross-border | Recurring revenue adv | Orchestration II | Fraud detection adv | Regulatory reporting |
|---|---|---|---|---|---|---|---|---|
| stripe | implemented | implemented | implemented | implemented | implemented | implemented | implemented | implemented |
| paddle | implemented | implemented | implemented | implemented | implemented | implemented | implemented | implemented |
| lemonsqueezy | implemented | implemented | implemented | implemented | implemented | implemented | implemented | implemented |

The v0.5 advanced III grid is fully covered — every provider implements every axis because the semantics are runtime-agnostic. That is what makes cross-provider reuse (a BNPL plan that runs under Stripe + Paddle + LemonSqueezy without change) even possible. The neutral event names live in the v0.5 semantics `types.ts` SSOT and the per-provider dialect table is a static lookup — a new provider drops into the same shape.

### Why the advanced III grid is fully covered

stripe + paddle + lemonsqueezy converged on the same neutral events at the "onboard a customer, split a purchase, invoice in stablecoin, settle across borders, roll up recurring metrics, route a payment, block fraud, file a regulatory report" primitive — the 8 advanced III shapes are the same across all 3 providers, even though the wire encodings differ (Stripe Webhook Events vs. Paddle Notifications vs. Lemon Squeezy Webhook payloads). The `providerEventName(provider, neutralEvent)` mapping table is the single point where the 3 dialects diverge; everything upstream stays neutral. The v1.41 advanced III fidelity grid at 24/24 = 100 % implemented reflects that convergence at the "advanced III production payment" level. Combined with the v0.3 27-cell base grid (9 axis × 3 provider) + the v0.4 24-cell advanced II grid (8 axis × 3 provider) + the v0.5 24-cell advanced III grid, the total v0.3 + v0.4 + v0.5 fidelity harness now walks 75 cells (3 provider × 25 axis) in one `collectFidelityCoverage()` call.

## The `KIWA_MODE=real` env-gate contract for the advanced III grid

`skipUnlessReal(provider, env)` (from `payment-real-driver-testing.md` SSOT) returns `{ skip: false, reason: 'KIWA_MODE=real + required env present — real driver' }` when `env.KIWA_MODE === 'real'` and the required env for that provider is set, and `{ skip: true, reason: 'KIWA_MODE!=real (got "unset") — mock driver' }` otherwise. A test that respects the contract combines the gate with a required-env presence check — the dogfood apps use this at each `describe.skipIf(gate.skip)` block. The v0.5 advanced III axes reuse the same real-driver gate as the v0.3 / v0.4 axes — no new env variable is introduced. The per-axis dogfood app pins the required backend URL (`KIWA_STRIPE_TREASURY_URL` / `KIWA_KLARNA_URL` / `KIWA_CRYPTO_URL` / `KIWA_FX_URL`) on top of the shared `KIWA_MODE` gate.

Per-provider required-env mapping stays the same as v0.3 / v0.4.

- **stripe** → `KIWA_MODE` + `KIWA_STRIPE_URL` (base Stripe API) + optional `KIWA_STRIPE_TREASURY_URL` (embedded finance)
- **paddle** → `KIWA_MODE` + `KIWA_PADDLE_URL`
- **lemonsqueezy** → `KIWA_MODE` + `KIWA_LEMONSQUEEZY_URL`

Per-dogfood-app required backend URL (on top of the provider gate above).

- **dogfood-payment-embedded-finance-app** → `KIWA_STRIPE_TREASURY_URL` + `KIWA_UNIT_URL` + `KIWA_COLUMN_URL` (Stripe Treasury + Unit + Column BaaS)
- **dogfood-payment-bnpl-installment-app** → `KIWA_KLARNA_URL` + `KIWA_AFFIRM_URL` + `KIWA_AFTERPAY_URL` (Klarna + Affirm + Afterpay BNPL sandboxes)
- **dogfood-payment-crypto-fx-app** → `KIWA_CRYPTO_URL` (Coinbase Commerce / BitPay) + `KIWA_FX_URL` (Wise / Airwallex)

## The 25-axis fidelity harness (v0.3 9 + v0.4 8 + v0.5 8 combined)

`collectFidelityCoverage()` walks the full 25-axis grid and returns a per-cell `{ provider, axis, implemented, missingEvents }` record so a CI job can assert `rows.every(r => r.implemented)` in one line. The neutral events per axis floor (asserted in the fidelity test) is preserved for the 8 new v0.5 axes.

```ts
import { collectFidelityCoverage } from '@kiwa/payment';

const cov = collectFidelityCoverage();
console.log(cov.rows.length); // 75 (3 provider × 25 axis)
console.log(cov.rows.every((r) => r.implemented)); // true after v0.5 lands
```

The 75-row grid is the single point of truth for the "is a provider × axis pair covered?" question — a new dogfood app that adds a new provider walks the same table without touching the axis list.

## The v1.41 pair 深度 4 段 2 例目 record

v0.5 is the **second pair in kiwa history to reach depth 4 (v1.14 → v1.19 → v1.33 → v1.41)**. The first was the AI-LLM 縦深化 pair (v1.12 v0.1 base → v1.15 v0.2 multimodal → v1.38 v0.4 advanced → v1.40 v0.5 advanced III), recorded in the v1.39 → v1.40 migration guide. The v1.41 milestone establishes the pair 深度 4 段 pattern as **repeatable** — the same 3-provider × 8-axis fidelity harness template applies at each depth without change, and the 深化 process (v0.1 base → v0.2 advanced → v0.4 advanced II → v0.5 advanced III) is idempotent under scale.

Combined with the v1.14 v0.1 base grid (9 axis × 3 provider = 27 cell) + the v1.19 v0.2 advanced grid (subset of v0.4 later) + the v1.33 v0.4 advanced II grid (8 axis × 3 provider = 24 cell) + the v1.41 v0.5 advanced III grid (8 axis × 3 provider = 24 cell), the payment package now covers 25 axes × 3 provider = 75 cells of production payment shape in one package with one fidelity harness — matched only by the AI-LLM package's 64-cell breadth (16 axes × 4 provider).

The 19-milestone snippet validation streak (v1.23 → v1.41) reinforces the same repeatability signal for docs — every milestone since v1.23 has added a snippet-validation test that walks the tutorial's code blocks against the actual API surface, catching drift before readers hit "the tutorial does not compile" gaps. The Payment 深化 pair achieves depth 4 as the second axis after AI-LLM, validating that the methodology is not AI-LLM-specific but applies to any production shape (payment / observability / security / streaming / etc.) that has natural v0.1 → v0.5 evolution.
