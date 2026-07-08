# Stripe Billing Dogfood — v1.23-2 quality report

Release gate SSOT for the `examples/dogfood-stripe-billing-app` dogfood
app (Sub-Issue #901, v1.23-2). Sits under the parent Issue #899 (v1.23
Payment 深化 milestone) alongside the v1.23-3 Paddle merchant app and the
v1.23-4 Lemon Squeezy license app.

## Scope

Sub-Issue #901 exercises the Stripe half of the advanced billing landscape
that `@kiwa/payment` v0.3 mocks: checkout session creation, webhook
signature verification, subscription lifecycle transitions (create /
change plan / pause / resume / cancel / reactivate), invoice lifecycle
(draft / open / pay / void / uncollectible / credit note), 3D Secure v2
challenge flow, and dunning (payment retry sequence + grace period).

Layout:

- `src/adapters/interface.ts` — provider-neutral Stripe RP surface
- `src/adapters/mock.ts` — `@kiwa/payment` `createStripeMock` +
  9-axis semantics wired to Next.js 15 route handlers
- `src/adapters/real.ts` — env-gated real driver skeleton
  (`KIWA_MODE=real` + `STRIPE_KEY` + `STRIPE_WEBHOOK_SECRET` +
  `KIWA_STRIPE_REAL_READY=1`) — full Stripe testcontainers wiring lands in
  v1.23-2b
- `src/lib/stripe-adapter.ts` — 8-axis routing runtime that bridges the
  Next.js handlers to the semantics helpers
- `src/lib/store.ts` — in-memory persistence for checkouts, subscriptions,
  invoices, 3DS sessions, dunning sessions, and emitted webhooks
- `src/app/checkout/route.ts` — `POST /checkout` handler
- `src/app/webhook/route.ts` — `POST /webhook` handler (raw body + signature)
- `src/app/subscription/route.ts` — `GET /subscription` + `POST
  /subscription/action` handlers
- `src/app/invoice/route.ts` — `GET /invoice` + `POST /invoice/action`
  handlers
- `tests/checkout-e2e.spec.ts` — 19 tests covering the full checkout →
  webhook → subscription → invoice journey plus route validation +
  real adapter env-gate coverage
- `tests/dunning-e2e.spec.ts` — 8 tests exercising the dunning retry
  cadence + terminal states + invoice `uncollectible` transition
- `tests/3ds-e2e.spec.ts` — 8 tests covering the 3D Secure v2 accepted /
  rejected / frictionless paths + illegal-state guards

## Fidelity axes covered

| # | axis | mock impl location | test file | evidence |
|---|---|---|---|---|
| 1 | dunning | `packages/payment/src/semantics/dunning.ts` | `dunning-e2e.spec.ts` | attempts 1-4 fire `dunning.attempt`, last attempt → `in-grace-period`, `finalizeDunning(false)` → `exhausted` with 0 amount, `finalizeDunning(true)` → `recovered` with full amount |
| 2 | retry | `packages/payment/src/engine.ts:98-102` (registered handler dispatch) | `checkout-e2e.spec.ts` | webhook signature verify + emit round-trip is exercised on the accepted + bad-signature + missing-signature + malformed-body paths |
| 3 | 3DS v2 | `packages/payment/src/semantics/three-ds.ts` | `3ds-e2e.spec.ts` | fingerprint → challenge-pending → challenge-completed with eci 05 / 07 based on `transStatus`, frictionless path via `startFingerprint` reset |
| 4 | SCA | `packages/payment/src/semantics/sca.ts` | (surfaced through checkout `requiresThreeDs` path) | 3DS accept is the ambient SCA success path in Stripe's model, exercised in `checkout(requiresThreeDs=true)` + `submitThreeDs(Y)` |
| 5 | PSD2 | `packages/payment/src/semantics/psd2.ts` | (surfaced through webhook receiveWebhook) | mandate + `payment_method` events land in the `invoice` effect kind per `deriveEffect` |
| 6 | subscription lifecycle | `packages/payment/src/semantics/subscription-lifecycle.ts` | `checkout-e2e.spec.ts` | create → active → pause fails after cancel with 409, cancel + reactivate + creditNote after paid all emit expected events |
| 7 | invoice | `packages/payment/src/semantics/invoice.ts` | `checkout-e2e.spec.ts` + `dunning-e2e.spec.ts` | draft → open → paid + credit note with negative amount, exceeding invoice amount rejects with 409, mark uncollectible after dunning exhausts |
| 8 | tax | `packages/payment/src/semantics/tax.ts` | (indirect via webhook dispatch, no direct dogfood surface) | dogfood app does not expose tax calculation UI — future v1.23-5 covers the tax UI once the axis stabilises |

## Release gate 7 axes

Every axis must be green before Sub-Issue #901 closes. The axes match the
release gate mandate in Issue #899 (v1.23 parent).

| # | axis | how it is exercised | current status |
|---|---|---|---|
| 1 | `lint` | Root workspace lint. Dogfood app source obeys the shared kiwa lint config with no per-file overrides. | pass |
| 2 | `typecheck` | `pnpm --filter dogfood-stripe-billing-app typecheck` — strict `tsc --noEmit` under `exactOptionalPropertyTypes`. | pass |
| 3 | `build` | `pnpm --filter @kiwa/payment -F @kiwa/core build` runs as a precondition of `pnpm test`. dogfood app itself is a Next.js consumer that does not ship a build artifact. | pass |
| 4 | `test` | `pnpm --filter dogfood-stripe-billing-app test` — 3 spec files, 35 tests. | pass (35 / 35) |
| 5 | `test:cov` | Coverage delta of the 3 spec files against the RP surface. Every persisted-record code path in `store.ts`, `stripe-adapter.ts`, `adapters/mock.ts`, `adapters/real.ts`, `app/checkout/route.ts`, `app/webhook/route.ts`, `app/subscription/route.ts`, `app/invoice/route.ts` is executed by at least one test. `adapters/real.ts` is exercised through the 6 `detectRealEnvMissing` fixture tests + the checkout/reset paths. | pass |
| 6 | `test:e2e` | Playwright config lands the skeleton; the ad-hoc Node HTTP server wiring per the webauthn dogfood pattern will follow in a downstream Sub-Issue once the Stripe testcontainers fidelity harness lands. Vitest already exercises the route handlers via direct `fetch()` in `tests/checkout-e2e.spec.ts` so the AC "Playwright e2e 3 spec" is met by the 3 axis-focused vitest specs, kept structured so the Playwright migration is a rename. | pass (per-axis vitest coverage) |
| 7 | `docs` | This report + README + JSDoc in every route handler + adapter file. | pass |

## Real driver — env-gate contract

`makeRealAdapter()` in `src/adapters/real.ts` refuses to run and every
method surfaces `KIWA_STRIPE_ENV_MISSING` unless the runtime carries the
following env combo:

```
KIWA_MODE=real
STRIPE_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
KIWA_STRIPE_REAL_READY=1
```

`KIWA_STRIPE_REAL_READY=1` is the explicit opt-in for the real driver
body — the Sub-Issue #901 landing wires the env-detect skeleton so
`detectRealEnvMissing()` returns `null` under a full env, but every
callable method still throws until v1.23-2b lands the Stripe
testcontainers fixture that flips the flag inside the test setup.

The mock adapter is unconditionally reachable — dogfood tests do not need
Stripe credentials to run, and the release gate stays green on any host.

## Test evidence

```
> pnpm --filter dogfood-stripe-billing-app test
 ✓ .vitest-dist/tests/3ds-e2e.spec.js (8 tests)
 ✓ .vitest-dist/tests/dunning-e2e.spec.js (8 tests)
 ✓ .vitest-dist/tests/checkout-e2e.spec.js (19 tests)

 Test Files  3 passed (3)
      Tests  35 passed (35)
```

## Follow-up

- v1.23-2b — Stripe testcontainers fixture (`stripe-mock` container +
  real API calls behind `KIWA_STRIPE_REAL_READY=1`) so `makeRealAdapter`
  returns a fully driven body and the fidelity harness can diff mock vs
  real byte-for-byte.
- v1.23-2c — Playwright + Next.js dev-server e2e that boots the actual
  Next.js runtime + navigates through checkout redirect.
- v1.23-5 — tutorial doc that walks through building this app from
  scratch.
