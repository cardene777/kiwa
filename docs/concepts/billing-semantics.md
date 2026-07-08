# Advanced billing semantics — 9-axis SSOT for kiwa `@kiwa/payment` v0.3

Introduced in v1.23-1, `@kiwa/payment` v0.3 raises the payment mock harness from a **webhook signature + fixture builder** surface to a full **advanced billing semantics** surface. Where v0.2 gave you `signWebhook` / `emit` / `verify` and 4 fixture events (checkout / subscription / paymentFailed / refund), v0.3 layers **9 axes** of provider-neutralised billing state on top.

The 9 axes are the observable envelope every real provider (Stripe, Paddle, Lemon Squeezy) converges on — mapped to the same neutral event names + state machines — so tests write once and re-run against any provider. This document is the SSOT for what each axis exists to test, what state machine it defines, and which real-provider behaviours it neutralises.

## Why 9 axes, why now

Payment testing has three failure modes that a webhook-only mock can't catch.

- **State-machine drift**. A subscription's real lifecycle isn't `active` / `canceled` — it's a 5-state graph with transition guards (`active` → `upgraded` → `downgraded` → `paused` → `canceled`, with `reactivate` only allowed from `canceled`). Tests that only assert `event.type === 'customer.subscription.created'` miss the guards, and production bugs surface as invalid transitions the merchant app permits but the provider rejects.
- **Retry cadence**. Real dunning is 4 attempts over ~1 week + a grace period. Tests that skip the retry loop miss uncollectible-flip regressions and let merchant apps ship without the grace-period UX.
- **Cross-provider fidelity**. Stripe defers proration to the next invoice; Paddle charges the difference immediately; Lemon Squeezy hosts checkout while Paddle inlines it. A neutral test surface makes these differences **explicit assertions**, not silent regressions.

The 9 axes below are the smallest set that reproduces the full billing envelope across the 3 target providers. Each axis is an independent module under `@kiwa/payment/semantics/*`; each provides pure functions that operate on a `PaymentAdapter` (the same interface `createStripeMock` / `createPaddleMock` / `createLemonSqueezyMock` return) and emit a strongly typed `AxisStep` sequence.

## Axis 1 — Dunning

**Purpose**. Reproduce payment retry sequences for failed invoices. Real providers all run a scheduled retry cadence (Stripe Smart Retries default = 4 attempts over ~1 week, Paddle's dunning follows the merchant-configured schedule, Lemon Squeezy retries 4 times over 14 days).

**State machine**. `active` → `in-grace-period` → `recovered` or `exhausted`.

**Key functions**.

- `startDunning({ invoiceId, amountCents, customerId, config })` — creates a session with default `maxAttempts: 4`, `retryIntervalMs: 3 days`, `gracePeriodMs: 1 day`
- `dunningAttempt(adapter, session)` — runs the next attempt, emits `dunning.attempt`, transitions to `in-grace-period` after the last attempt
- `finalizeDunning(adapter, session, { succeed })` — transitions to terminal `recovered` (succeed=true) or `exhausted` (succeed=false), emits `invoice.paid` or `invoice.marked_uncollectible`

**Failure mode caught**. Merchant app doesn't render the "we'll retry your card in 3 days" grace-period UX. Test catches it by asserting `session.state === 'in-grace-period'` between the last attempt and finalisation.

## Axis 2 — Retry

**Purpose**. General-purpose exponential-backoff retry primitive independent of billing dunning. Used for webhook delivery retries, idempotent API retries, and 3DS challenge polling.

**State machine**. `pending` → `retrying` → `delivered` or `dead-letter`.

**Key functions**.

- `startRetry({ jobId, config })` — default `maxAttempts: 5`, exponential backoff with jitter
- `retryDeliver(adapter, session)` — runs the next attempt, emits `webhook.retry_attempted`
- `retryBackoffMs(attempt, config)` — pure computation of the next backoff window

**Failure mode caught**. Merchant app doesn't dead-letter after `maxAttempts`. Test catches it by asserting the terminal state matches the configured max.

## Axis 3 — 3D Secure v2

**Purpose**. Reproduce EMVCo 3DS 2.2 challenge flow — fingerprint (device data collection), challenge (user interaction), result (accepted / rejected). Frictionless flow skips the challenge when issuer risk assessment is low.

**State machine**. `fingerprint` → `challenge-pending` → `completed`, or `fingerprint` → `frictionless`.

**Key functions**.

- `startThreeDs({ paymentIntentId, amountCents, customerId })` — session starts in `fingerprint`
- `threeDsRequestChallenge(adapter, session)` — emits `3ds.challenge_required`, transitions to `challenge-pending`
- `threeDsSubmitChallenge(adapter, session, { transStatus })` — accepts `Y` / `N` / `A` / `C` / `U` / `R` per EMVCo spec, transitions to `completed`
- `threeDsFrictionless(adapter, session)` — skips challenge, transitions directly to `frictionless`

**Failure mode caught**. Merchant app treats `frictionless` as `challenge-pending` and blocks checkout. Test catches it by asserting the terminal state distinguishes the two paths.

## Axis 4 — SCA (Strong Customer Authentication, PSD2)

**Purpose**. Reproduce PSD2 SCA evaluation — the EU regulation requiring 2-factor authentication above a threshold (~€30), with exemption categories (low-value, low-risk, trusted beneficiary, secure corporate payment, recurring, MIT) that let providers short-circuit the challenge.

**Key functions**.

- `startSca(...)` / `scaEvaluate(adapter, session)` / `scaAuthenticate(adapter, session, ...)` — see `packages/payment/src/semantics/sca.ts` for the exact signatures. `ScaExemption` values enumerate the 6 categories used by production Stripe / Paddle / Lemon Squeezy checkouts.

**Failure mode caught**. Merchant app doesn't apply the low-value exemption (< €30) and forces 3DS on every micro-transaction. Test catches it by asserting `scaEvaluate` returns `exempt` with the expected exemption category.

## Axis 5 — PSD2 mandate

**Purpose**. Reproduce PSD2 payment mandate lifecycle — SEPA direct debit / Bacs / ACH mandate creation + consent grant + revocation. Merchants must record consent explicitly to legally debit recurring payments.

**State machine**. `pending` → `active` → `revoked`.

**Key functions**.

- `createMandate({ customerId, scheme, iban })` — creates a mandate in `pending` state; scheme = `sepa-direct-debit` / `bacs` / `ach`
- `grantConsent(mandate, { signedAt })` — transitions to `active`, records the consent timestamp
- `revokeMandate(mandate, { reason })` — transitions to `revoked`; the recorded consent stays queryable for audit

**Failure mode caught**. Merchant app debits a customer whose mandate is `revoked`. Test catches it by asserting the debit call throws when `mandate.state === 'revoked'`.

## Axis 6 — Subscription lifecycle

**Purpose**. Reproduce the 5-state subscription envelope every real provider converges on. Guards enforce valid transitions so tests fail loudly on invalid state moves.

**State machine**. `active` → (`upgraded` | `downgraded` | `paused` | `canceled`); `paused` → `active` via `resumeSubscription`; `canceled` → `active` via `reactivateSubscription`.

**Key functions**.

- `createSubscription(adapter, { customerId, planId, amountCents, currency? })` — emits `subscription.created`, session starts in `active`
- `changePlan(adapter, subscription, { newPlanId, newAmountCents })` — transitions to `upgraded` or `downgraded` based on the amount delta, records previous plan + amount in metadata
- `pauseSubscription` / `resumeSubscription` — pause and resume; equal-amount `changePlan` is rejected as a no-op
- `cancelSubscription` / `reactivateSubscription` — terminal cancel + reactivation from `canceled`

**Failure mode caught**. Merchant app allows `changePlan` from `paused` (must `resumeSubscription` first). Test catches it because the transition guard throws.

## Axis 7 — Invoice lifecycle

**Purpose**. Reproduce the invoice state machine — draft, open, paid, void, uncollectible, with credit-note support.

**State machine**. `draft` → `open` → (`paid` | `void` | `uncollectible`); any terminal state → `credited` (credit-note).

**Key functions**.

- `draftInvoice({ customerId, amountCents, currency })` — creates a `draft` invoice
- `openInvoice(adapter, invoice)` — emits `invoice.finalized`, transitions to `open`
- `payInvoice(adapter, invoice)` — emits `invoice.paid`, transitions to `paid`
- `voidInvoice` / `markUncollectible` / `creditNoteInvoice` — the remaining terminal transitions

**Failure mode caught**. Merchant app double-charges a paid invoice. Test catches it because `payInvoice` on a `paid` invoice throws.

## Axis 8 — Tax (VAT / GST / sales tax)

**Purpose**. Reproduce merchant-of-record tax auto-calculation. Merchant-of-record providers (Paddle, Lemon Squeezy) handle tax registration and remittance in ~180 jurisdictions; merchants book the neutralised `TaxLine` (net + tax + kind + reverseCharged + exempt flags).

**Key data types**.

- `TaxKind` = `vat` | `gst` | `sales-tax`
- `TaxCalcInput` = `{ netAmountCents, buyerCountry, buyerVatId?, merchantCountry, productKind? }` where `productKind` is `digital` | `physical` | `service`
- `TaxLine` = `{ kind, country, rateBps, amountCents, taxCents, reverseCharged, exempt }`

**Key functions**.

- `calculateTax(input)` — pure function; picks VAT (EU + UK), GST (JP / AU / NZ), sales tax (US / CA) from a deterministic rate table; applies reverse charge for B2B cross-border EU digital / service transactions with a `buyerVatId`
- `emitTaxLine(adapter, { customerId, line })` — emits `tax.calculated` / `tax.reverse_charged` / `tax.exempted` as the neutral event

**Failure mode caught**. Merchant app double-taxes a B2B EU cross-border customer because it doesn't recognise reverse charge. Test catches it by asserting `line.reverseCharged === true` + `line.taxCents === 0` for a `DE` buyer with a `buyerVatId` when the merchant is in `FR`.

## Axis 9 — Chargeback dispute

**Purpose**. Reproduce the card-network dispute lifecycle — customer files, merchant submits evidence, network rules on the outcome, provider assesses fee.

**State machine**. `opened` → `evidence-submitted` → `won` or `lost`.

**Key data types**.

- `ChargebackReason` = `fraudulent` | `unrecognized` | `duplicate` | `product-not-received` | `product-unacceptable` | `subscription-canceled` | `credit-not-processed` | `general`
- `Chargeback` = `{ id, transactionId, customerId, amountCents, currency?, reason, state, history }`

**Key functions**.

- `openChargeback(adapter, { transactionId, customerId, amountCents, reason })` — customer files; session starts in `opened`, emits `chargeback.opened`
- `submitEvidence(adapter, chargeback, { receiptUrl?, shippingProof?, customerCommunication? })` — transitions to `evidence-submitted`, emits `chargeback.evidence_submitted`
- `resolveChargeback(adapter, chargeback, { merchantWon })` — network rules; `merchantWon: true` transitions to `won`, `false` to `lost`; the step metadata includes `disputeFeeCents` (0 on wins, ~$15 on lost)

**Failure mode caught**. Merchant app books the chargeback fee even on wins. Test catches it by asserting `step.metadata.disputeFeeCents === 0` on `won` outcomes.

## The 3 execution modes recap

Every axis works in the same 3 execution modes as the v1.22 real driver layer.

| Mode | Trigger | Behaviour |
|---|---|---|
| `mock only` | `KIWA_MODE` unset | Pure `@kiwa/payment` mock adapter, 0 network, sub-100 ms per test |
| `real-optional` | `KIWA_MODE=real-optional` | Try real driver; fall back to mock with a warning if credentials are missing |
| `real-required` | `KIWA_MODE=real` + provider-specific keys | Fail hard if credentials are missing; run only against the live sandbox |

The 3 dogfood apps (`dogfood-stripe-billing-app`, `dogfood-paddle-merchant-app`, `dogfood-lemon-squeezy-app`) all wire this same mode switch — pass `KIWA_MODE=real` + `STRIPE_KEY` / `PADDLE_KEY` / `LEMONSQUEEZY_KEY` to swap the adapter without touching the axis test bodies.

## Where each provider surfaces

| Axis | Stripe surface | Paddle surface | Lemon Squeezy surface |
|---|---|---|---|
| Dunning | Smart Retries (`invoice.marked_uncollectible`) | Dunning campaign (merchant-config) | Retry policy (4 × 14 days) |
| Retry | `webhook.retry` header | `paddle.retry` in signature | `X-Retry-Attempt` header |
| 3DS v2 | PaymentIntent 3ds status | Inline SDK 3ds callback | Hosted checkout 3ds redirect |
| SCA | Automatic (`payment_intent.requires_action`) | Automatic (inline SDK) | Automatic (hosted checkout) |
| PSD2 mandate | SetupIntent + Mandate | Not exposed (MoR handles) | Not exposed (MoR handles) |
| Subscription | 5-state `customer.subscription.*` | Same envelope, immediate proration | Same envelope, MoR-owned invoices |
| Invoice | `Invoice` object w/ state | `Transaction` object w/ state | `Order` + `Subscription` object |
| Tax | Stripe Tax (merchant registers) | Paddle MoR (auto-calc) | Lemon Squeezy MoR (auto-calc) |
| Chargeback | `Dispute` object + $15 fee | Handled by Paddle (waived) | Handled by Lemon Squeezy (waived on wins) |

## Related

- [Tutorial 39 — Stripe advanced billing](../tutorials/39-stripe-billing)
- [Tutorial 40 — Paddle merchant-of-record](../tutorials/40-paddle-merchant)
- [Tutorial 41 — Lemon Squeezy license flow](../tutorials/41-lemon-squeezy-license)
- [Migration guide v1.22 → v1.23](../migrations/v1.22-to-v1.23)
- [Payment testing concept doc (v1.14 SSOT)](./payment-testing)
