# kiwa v1.23 released — Payment 深化 (advanced billing semantics 9 axis + 3 dogfood merchant app)

v1.23 is out. After v1.14's payment layer landed the 3 provider webhook baseline (Stripe + Paddle + Lemon Squeezy HMAC signature verify + 4 fixture events), v1.23 layers **9 axes of advanced billing semantics** on top — dunning + retry + 3DS v2 + SCA + PSD2 mandate + subscription lifecycle + invoice lifecycle + VAT/GST/sales-tax + chargeback dispute. Provider-neutral state machines + strict transition guards + fidelity harness across all 3 providers. 100 new semantics behavior tests + 3 dogfood merchant apps + 3 tutorials + concept doc SSOT.

## What shipped

- **`@kiwa-test/payment` v0.3.0** (9-axis advanced billing semantics). v0.2's webhook mock + 4 fixture events (`createStripeMock` / `createPaddleMock` / `createLemonSqueezyMock` / `signWebhook` / `emit` / `verify` / `checkoutCompleted` / `subscriptionCreated` / `paymentFailed` / `refunded`) keep every prior signature. v0.3 lands `packages/payment/src/semantics/*` — 1 axis = 1 file of pure state-machine helpers that operate on the shared `PaymentAdapter` interface every provider mock implements. Every axis emits a strongly typed `AxisStep` sequence so tests assert on the transitions, not the event names.
  - `dunning.ts` — Stripe Smart Retries envelope (`active` → `in-grace-period` → `recovered` or `exhausted`, default `maxAttempts: 4`, `retryIntervalMs: 3 days`, `gracePeriodMs: 1 day`)
  - `retry.ts` — general-purpose exponential backoff with jitter (`pending` → `retrying` → `delivered` or `dead-letter`, default `maxAttempts: 5`)
  - `three-ds.ts` — EMVCo 3DS 2.2 challenge flow (`fingerprint` → `challenge-pending` → `completed`, or `fingerprint` → `frictionless`, accepts all 6 `transStatus` codes `Y`/`N`/`A`/`C`/`U`/`R`)
  - `sca.ts` — PSD2 Strong Customer Authentication (6 exemption categories — low-value / low-risk / trusted-beneficiary / secure-corporate / recurring / MIT)
  - `psd2.ts` — SEPA direct debit / BACS / ACH mandate (`pending` → `active` → `revoked` + consent-timestamp)
  - `subscription-lifecycle.ts` — 5-state envelope (`active` → `upgraded` / `downgraded` / `paused` / `canceled` + `paused` → `resumed` + `canceled` → `reactivated`) with strict transition guards
  - `invoice.ts` — `draft` → `open` → (`paid` | `void` | `uncollectible`) + credit-note support
  - `tax.ts` — VAT / GST / sales-tax auto-calc across ~180 jurisdictions + reverse charge for B2B EU customers with a valid VAT ID
  - `chargeback.ts` — card-network dispute lifecycle (`opened` → `evidence-submitted` → `won` or `lost` with provider-specific fee assessment)
- **`examples/dogfood-stripe-billing-app`** — Next.js 15 App Router merchant app wired to Stripe. `createStripeMock` drives checkout session + webhook endpoint + subscription lifecycle + invoice + 3D Secure v2 + Smart Retries dunning across 35 vitest. The `KIWA_MODE=real` env-gate flips the entire suite from mock to the real Stripe sandbox without touching test bodies. Every axis semantic (dunning / retry / 3DS / SCA / subscription / invoice / tax / chargeback) exercises the same 4-method adapter surface.
- **`examples/dogfood-paddle-merchant-app`** — Nuxt 3 merchant-of-record app wired to Paddle Billing v2. `createPaddleMock` drives inline checkout (`Paddle.Checkout.open` instead of hosted redirect), tier upgrade with proration, VAT/GST/sales-tax auto-calc, and reverse-charge for B2B intra-EU customers. 40 vitest. Paddle acts as Merchant-of-Record so the app never touches PSP details — Paddle handles fraud + chargeback + tax registration and the app just books neutralised events.
- **`examples/dogfood-lemon-squeezy-app`** — SvelteKit merchant-of-record app wired to Lemon Squeezy. `createLemonSqueezyMock` drives hosted checkout (URL redirect, no inline SDK), license key issue+activate+revoke, refund full+partial via the neutral `refunded` fixture, and full chargeback dispute lifecycle (opened → evidence-submitted → won/lost + fee assessment). 74 vitest — the widest v1.23 dogfood app because license flow doubles as a chargeback signal source.
- **docs** — 3 new tutorials (39 Stripe advanced billing + 40 Paddle merchant-of-record + 41 Lemon Squeezy license flow) + concept doc `billing-semantics.md` — SSOT for the 9 axes + provider-specific fidelity surface across all 3 dogfood merchant apps. Migration guide v1.22 → v1.23 (additive-only). Snippet validation test `packages/payment/tests/docs-tutorial-v1.23.test.ts` (18 tests) re-runs every code snippet against the real `@kiwa-test/payment` API. Same drift-detection pattern as `docs-tutorial-v1.21.test.ts` + `docs-tutorial-v1.22.test.ts`. VitePress sidebar gains a `Payment 深化 (v1.23)` tutorial section; gh-pages published via `/docs-publish-kiwa`.

## Numbers

- **6 sub-Issues resolved** (#900-#905)
- **6 PRs merged** (v1.23-1 + v1.23-2 + v1.23-3 + v1.23-4 + v1.23-5 + this publish PR)
- **1 npm minor bump** (`@kiwa-test/payment` v0.2.0 → v0.3.0) — kiwa runtime fixture count stays 34
- **3 new dogfood merchant apps** with fidelity reports feeding the 7-axis release gate
- **~267 new tests** across 9 semantics axes (100) + Stripe (35) + Paddle (40) + Lemon Squeezy (74) + snippet validation (18)

## Why 9 axes (and not just webhook mock)

Payment testing has three failure modes that a webhook-only mock can't catch, no matter how many fixture events you pack in.

- **State-machine drift** — a subscription's real lifecycle isn't `active` / `canceled`; it's a 5-state graph with transition guards (`active` → `upgraded` → `downgraded` → `paused` → `canceled`, with `reactivate` only allowed from `canceled`). Tests that assert `event.type === 'customer.subscription.created'` miss the guards, and production bugs surface as invalid transitions the merchant app permits but the provider rejects.
- **Retry cadence** — real dunning is 4 attempts over ~1 week + a grace period. Tests that skip the retry loop miss uncollectible-flip regressions and let merchant apps ship without the grace-period UX.
- **Cross-provider fidelity** — Stripe defers proration to the next invoice; Paddle charges the difference immediately; Lemon Squeezy hosts checkout while Paddle inlines it. A neutral test surface makes these differences **explicit assertions**, not silent regressions.

The 9 axes are the smallest set that reproduces the full billing envelope across the 3 target providers. Each axis is an independent module under `@kiwa-test/payment/semantics/*`; each provides pure functions that operate on the shared `PaymentAdapter` interface + emit a strongly typed `AxisStep` sequence so tests can assert on the transitions, not the event shapes.

## 3 dogfood merchant apps — one adapter surface, three billing envelopes

| App | Framework | Distinguishing axes |
|---|---|---|
| `dogfood-stripe-billing-app` | Next.js 15 App Router | Checkout session + webhook endpoint + subscription lifecycle + invoice + 3D Secure v2 + Smart Retries dunning |
| `dogfood-paddle-merchant-app` | Nuxt 3 | Inline checkout (`Paddle.Checkout.open`) + tier upgrade with proration + VAT/GST/sales-tax auto-calc + reverse-charge B2B EU |
| `dogfood-lemon-squeezy-app` | SvelteKit | Hosted checkout (URL redirect) + license key issue+activate+revoke + refund full+partial + chargeback dispute lifecycle (opened → evidence → won/lost) |

All three share the same `KIWA_MODE=mock|real-optional|real` switch v1.22 established — mock branch runs in ~1 ms per test; `KIWA_MODE=real` flips to the actual provider sandbox without touching bodies.

## 13-milestone streak

v1.11 (release gate) → v1.12 (non-determinism) → v1.13 (time-axis) → v1.14 (horizontal expansion) → v1.15 (AI-LLM depth) → v1.16 (component depth) → v1.17 (Observability v2) → v1.18 (Blockchain depth) → v1.19 (Framework 深化) → v1.20 (Streaming 深化) → v1.21 (Auth 深化) → v1.22 (Auth 深化 II) → **v1.23 (Payment 深化)**. Every milestone since v1.11 has landed 6 sub-Issues in full.

## v2.0 candidates

- Multi-version Vitest matrix (Vitest 1.x vs 2.x vs 3.x parity)
- Desktop (Electron / Tauri) + mobile (React Native / Expo) adapters
- Coverage 100% milestone
- Cache / Data depth (Dragonfly / Materialize / Neon)
- L2 depth (Base / Arbitrum / Optimism / Scroll block-space fidelity)
- ZK depth (Noir / Circom / RISC Zero test harness)
- IoT depth (MQTT / CoAP / LWM2M)
- DB depth (SurrealDB / EdgeDB / Turso)
- Payment 深化 II — real driver layer (real Stripe / Paddle / Lemon Squeezy sandbox testcontainers + `KIWA_MODE=real-required` nightly)

Feedback welcome on which of these should land next.
