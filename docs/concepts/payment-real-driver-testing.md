# Payment real-driver testing — 8 axis × 3 provider = 24 cell grid + testcontainers-shaped env-gate (SSOT)

kiwa's v1.23 payment work covered the **9 base axes** (dunning / retry / 3DS v2 / SCA / PSD2 / subscription-lifecycle / invoice / tax / chargeback) as unified mocks for Stripe + Paddle + Lemon Squeezy — the `docs/concepts/billing-semantics.md` doc is the SSOT for those 9 axes. v1.33 adds **8 advanced axes on top of that base** — the ones production merchants hit once their mock-only suite is green but real provider behavior (Stripe outages, Paddle Billing v2 grace period edge cases, Lemon Squeezy refund windows, EU DAC7 aggregation, cross-provider vault migration) starts showing up in incident reports. This concept doc is the SSOT for those 8 axes; the tutorials (64-66) and dogfood app v2 upgrades (v1.33-2/3/4) are the concrete implementations.

## The 8-axis grid

The 8 advanced axes are cover-oriented — each one names a real-world failure surface every non-trivial payment stack hits within the first 3 months.

| Axis | Real-world failure it catches | v0.4 API |
|---|---|---|
| Orchestration | "Stripe was down for 4 minutes and we lost 2 % of revenue" (no failover to a secondary PSP, no circuit breaker) | `startOrchestration` / `routeCharge` / `probeCircuit` |
| Revenue recovery | "Our involuntary churn is 3 %, but the industry benchmark is 1 %" (no smart retry, no dunning cascade, no card updater) | `startRecovery` / `scheduleSmartRetry` / `advanceCascade` / `applyCardUpdate` / `applyNetworkToken` / `finalizeRecovery` |
| Refund advanced | "A partial refund exceeded the original charge because we forgot to check policy" (no policy enforcement, no window guard) | `startRefund` / `partialRefund` / `fullRefund` / `denyByPolicy` / `markWindowExpired` / `preventChargeback` |
| Dispute lifecycle | "We won the chargeback but our tax report still counted the lost amount" (no liability shift record) | `openDispute` / `submitDisputeEvidence` / `representDispute` / `escalateArbitration` / `shiftLiability` / `finalizeDispute` |
| Webhook idempotency advanced | "Our payout handler fired 5 times because we forgot to dedup by handler name" (no scoped dedup key, no replay protection) | `startIdempotency` / `deliver` / `reportFailure` / `rotateSignature` |
| Tax localization | "The EU DAC7 report was rejected because we did not apply reverse charge for B2B intra-EU" (no jurisdiction lookup, no reverse-charge flag) | `calculateLocalizedTax` / `reportDac7` |
| Subscription state machine | "A customer's card failed but we cancelled their subscription immediately, they churned" (no grace period, no proration on plan change) | `startSubscriptionMachine` / `enterGracePeriod` / `exitGracePeriod` / `applyProration` / `stackCoupon` |
| Payment method vault | "We migrated from Paddle to Stripe and 40 % of subscribers had to re-enter their cards" (no cross-provider token migration, no PCI scope check) | `startVault` / `tokenizeCard` / `revokeToken` / `migrateToken` / `verifyPciScope` |

Each axis has 3 shapes — a mock-only path (fast inner loop, ms scale), a real-driver path (`KIWA_MODE=real` + provider env, Stripe test mode / Paddle sandbox / Lemon Squeezy sandbox, seconds scale), and a fidelity assertion that the two produce the same output. Tutorial 64 covers the orchestration axis in depth, tutorial 65 covers dispute / refund / webhook / tax-localization for a Stripe Connect marketplace, tutorial 66 covers subscription state machine / recovery / vault for a Paddle Billing v2 subscription.

## The 3-provider × 8-axis = 24 cell grid

Every provider covers every axis. The mock shapes are provider-neutral (the API surface is the same across Stripe / Paddle / Lemon Squeezy), the emitted event dialects are provider-specific (`stripe.dispute.evidence_submitted` vs `paddle.dispute.evidence_submitted` vs `lemonsqueezy.dispute.evidence_submitted`), and the fidelity harness reports the coverage explicitly.

| Provider | 1 Orch | 2 Recovery | 3 Refund | 4 Dispute | 5 Webhook | 6 Tax-loc | 7 Sub-machine | 8 Vault |
|---|---|---|---|---|---|---|---|---|
| Stripe | implemented | implemented | implemented | implemented | implemented | implemented | implemented | implemented |
| Paddle | implemented | implemented | implemented | implemented | implemented | implemented | implemented | implemented |
| Lemon Squeezy | implemented | implemented | implemented | implemented | implemented | implemented | implemented | implemented |

Unlike v1.31 streaming (where NATS has no Kafka wire protocol, so 6 of 24 cells are `not-applicable`), the v1.33 payment grid is fully covered — every provider implements every axis because the API surface is provider-neutral. That is what makes cross-provider migration (axis 8) even possible.

### Why the payment grid is fully covered while streaming is not

Payment providers converged on a common shape (webhook + REST for CRUD + OAuth for connected accounts + a signed HMAC for webhook auth) around 2018-2020. Kafka / Redpanda / NATS did not — Kafka defines a wire protocol, Redpanda accepts it, NATS invented its own protocol on top of NATS core. The v1.33 fidelity grid at 24/24 = 100 % implemented reflects that convergence at the payment surface.

## The `KIWA_MODE=real` env-gate contract

`resolveMode(provider, env)` returns `{ mode: 'real', reason: 'kiwa-mode-real' }` when both `env.KIWA_MODE === 'real'` and the provider's key env is present. `resolveAllModes(env)` returns the 3 mode summaries in one pass. `assertMode(provider, 'real', env)` throws when the env is not configured — the dogfood apps use this at startup.

Per-provider key env mapping.

- **Stripe** axes → `STRIPE_KEY` (Stripe test-mode `sk_test_*` key)
- **Paddle** axes → `PADDLE_KEY` (Paddle sandbox API key)
- **Lemon Squeezy** axes → `LEMONSQUEEZY_KEY` (Lemon Squeezy sandbox API key)

A test that respects the contract runs the mock path unconditionally and the real-driver path only when both `KIWA_MODE=real` and the required key are present. That means CI stays cheap by default (mock only), the nightly job flips both envs (real driver + provider sandboxes), and the fidelity harness ties the two together.

Absent env means silently fall back to mock mode with `reason: 'missing-key'`. Absent `KIWA_MODE` means fall back with `reason: 'default-mock'`. An invalid `KIWA_MODE` value (anything other than `real` or `mock`) reports `reason: 'invalid-mode'` — the fallback is still mock so a typo does not break tests.

## The dogfood app v2 pattern

The 3 dogfood apps (v1.33-2/3/4) each expose a `pnpm test:real` command that flips `KIWA_MODE=real` and routes through the provider's sandbox.

- `examples/dogfood-stripe-marketplace-app` v2 — Stripe test mode + Connect Express + destination charge + application fee + tax report + Playwright e2e that walks the marketplace flow (checkout → destination charge → payout → chargeback → dispute → refund → DAC7 report).
- `examples/dogfood-paddle-subscription-app` v2 — Paddle Billing v2 sandbox + retention + proration + coupon + trial + Playwright e2e that walks the subscription flow (checkout → upgrade → coupon apply → payment failure → grace period → recovery → renewal).
- `examples/dogfood-lemonsqueezy-license-app` new — Lemon Squeezy sandbox + license key + activation + affiliate program + refund window + Playwright e2e that walks the license flow (purchase → activation → affiliate credit → refund inside window → refund outside window).

The pattern each v2 (or new) app follows.

1. Keep the v1 mock-only path (`pnpm test`) green — the fast inner loop stays sub-second (or sub-3-seconds for the license app).
2. Add a `pnpm test:real` command that requires the provider env (`STRIPE_KEY` / `PADDLE_KEY` / `LEMONSQUEEZY_KEY`) and routes through the provider sandbox instead of the mock.
3. Run the same fidelity-harness assertions against the real driver; failure means "the mock diverged from real provider behavior" — the mock gets the fix.
4. Route the e2e through Playwright when the flow crosses UI boundaries (checkout page, Customer Portal, license activation page).

## The `not-implemented` failure mode

If the fidelity harness has a `planned` cell, the corresponding tutorial + dogfood + snippet-validation-test trio does not exist yet. The 24-cell grid at v1.33 has 0 `planned` cells — every intended cell is `implemented`. When a future milestone adds a 9th axis (e.g., `crypto-payment`), it will start as `planned` for all 3 providers, then transition to `implemented` for the ones that cover it as the milestone lands its tutorial + dogfood + snippet test.

## How this ties into the 13-axis release gate

v1.33 does not add a 14th release-gate axis. The 8 advanced payment axes gate the payment package's own tests (via `pnpm --filter @kiwa/payment test`) but do not surface as a per-package `@kiwa/quality-metrics` axis. The reasoning — the fidelity harness is provider-shape-specific, and a package that does not use Stripe / Paddle / Lemon Squeezy has nothing to assert on. When a future milestone adds a `provider.fidelity` axis that describes "which payment providers this package's tests hit," it will slot into the 13-axis release gate as the 14th; v1.33 keeps the axis count at 13.

## SSOT boundaries

- The 9 base axes (dunning / retry / 3DS v2 / SCA / PSD2 / subscription-lifecycle / invoice / tax / chargeback) live in `docs/concepts/billing-semantics.md`. v1.33 does not modify that doc.
- The 8 advanced axes live in this doc. Tutorials 64-66 and the migration guide (v1.32 → v1.33) link back here for the axis SSOT.
- The 3-provider × 8-axis grid is the harness's data structure. The `collectFidelityCoverage()` implementation in `packages/payment/src/semantics/fidelity.ts` is the code SSOT — this doc's grid table is derived from that code.
- The `KIWA_MODE=real` env-gate contract is shared with the v1.22 real-driver testing tutorial (auth adapters + Keycloak), the v1.31 streaming real-driver concept doc, and the v1.32 database real-driver concept doc. All four use the same pattern; the payment axes just add provider-specific `_KEY` envs (`STRIPE_KEY` / `PADDLE_KEY` / `LEMONSQUEEZY_KEY`).
