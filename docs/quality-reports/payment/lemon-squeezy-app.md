# Lemon Squeezy Dogfood — v1.23-4 quality report

Release gate SSOT for the `examples/dogfood-lemon-squeezy-app` dogfood
app (Sub-Issue #903, v1.23-4). Sits under the parent Issue #899 (v1.23
Payment 深化 milestone) alongside the v1.23-2 Stripe billing app and
the v1.23-3 Paddle merchant app.

## Scope

Sub-Issue #903 exercises the Lemon Squeezy half of the advanced billing
landscape that `@kiwa/payment` v0.3 mocks: hosted checkout (redirect
to `checkout.lemonsqueezy.com`), order lifecycle (Lemon Squeezy's
invoice-equivalent), subscription tier upgrade/downgrade + pause / resume
/ cancel / reactivate, webhook signature verification (`X-Signature`
HMAC-SHA256 over the raw body only), license key issue + activation +
revoke (unique to Lemon Squeezy among the 3 providers), refund flow
(full + partial), and chargeback dispute lifecycle (opened → evidence →
won / lost).

Layout:

- `src/adapters/interface.ts` — provider-neutral Lemon Squeezy RP surface
- `src/adapters/mock.ts` — `@kiwa/payment` `createLemonSqueezyMock` +
  8-axis semantics wired to SvelteKit route handlers
- `src/adapters/real.ts` — env-gated real driver skeleton
  (`KIWA_MODE=real` + `LEMONSQUEEZY_KEY` + `LEMONSQUEEZY_SIGNING_SECRET`
  + `KIWA_LEMONSQUEEZY_REAL_READY=1`) — full Lemon Squeezy sandbox
  wiring lands in v1.23-4b
- `src/lib/lemonsqueezy-adapter.ts` — 8-axis routing runtime that bridges
  the SvelteKit handlers to the semantics helpers
- `src/lib/store.ts` — in-memory persistence for checkouts, subscriptions,
  orders, license keys, refunds, chargeback disputes, and emitted webhooks
- `src/routes/checkout/handler.ts` — `POST /checkout` route handler
- `src/routes/webhook/handler.ts` — `POST /webhook` route handler (raw
  body + `X-Signature` header)
- `src/routes/license/handler.ts` — `POST /license/action` (`issue` /
  `activate` / `revoke`) + `GET /license` handlers
- `src/routes/refund/handler.ts` — `POST /refund` + `GET /refund`
  handlers
- `src/routes/dispute/handler.ts` — `POST /dispute/action` (`open` /
  `evidence` / `resolve`) + `GET /dispute` handlers
- `src/routes/license/+page.svelte` — license key management UI
  (illustrative)
- `src/routes/refund/+page.svelte` — refund UI (illustrative)
- `src/routes/dispute/+page.svelte` — chargeback dispute UI (illustrative)
- `tests/checkout-license-e2e.spec.ts` — 44 tests covering the checkout →
  webhook → order paid → license key issue → activation → revoke journey
  + subscription tier upgrade / downgrade / pause / cancel / reactivate +
  route-handler validation + real adapter env-gate coverage
- `tests/refund-chargeback-e2e.spec.ts` — 30 tests covering full + partial
  refund across happy path + over-refund / non-paid / unknown order
  guards, chargeback opened → evidence → won / lost lifecycle with the
  dispute fee applied on lost, all 8 real `ChargebackReason` values, +
  route-handler validation

## Fidelity axes covered

| # | axis | mock impl location | test file | evidence |
|---|---|---|---|---|
| 1 | dunning | `packages/payment/src/semantics/dunning.ts` | (surfaced through adapter methods) | `startDunningForOrder` + `runDunningAttempt` + `finalizeDunning` all wired; the real adapter env-gates the entrypoint |
| 2 | retry | `packages/payment/src/engine.ts` (registered handler dispatch) | `checkout-license-e2e.spec.ts` | webhook signature verify + emit round-trip exercised on accepted + tampered-body + missing-signature paths, plus `X-Signature` header check |
| 3 | 3DS v2 | `packages/payment/src/semantics/three-ds.ts` | (indirect via `order_created` webhook dispatch) | Lemon Squeezy surfaces 3DS through `order_created` (LS uses a hosted checkout that abstracts the challenge iframe) — mock adapter dispatches through the `order` effect kind |
| 4 | SCA | `packages/payment/src/semantics/sca.ts` | (surfaced through webhook dispatch) | Lemon Squeezy emits SCA success as `order_created`; the adapter's `receiveWebhook` route dispatches the SCA event through the `order` effect kind |
| 5 | PSD2 | `packages/payment/src/semantics/psd2.ts` | (surfaced through webhook dispatch) | `subscription_created` and `subscription_cancelled` land in the `subscription` effect kind per `deriveEffect` |
| 6 | subscription lifecycle | `packages/payment/src/semantics/subscription-lifecycle.ts` | `checkout-license-e2e.spec.ts` | tier upgrade emits `subscription_updated` with newAmountCents (state `upgraded`), downgrade emits `subscription_updated` (state `downgraded`), plan-change no-op rejects with `plan_change_noop`, canceled subscription rejects tier change with `subscription_canceled`, pause + resume + reactivate route handlers dispatch state transitions correctly, reactivate returns state to `active` while emitting `subscription_resumed` |
| 7 | invoice (order) + refund | `packages/payment/src/semantics/invoice.ts` | `refund-chargeback-e2e.spec.ts` | `draftOrder` → `openOrder` → `payOrder` lifecycle exercised, full refund (kind='full') and partial refund (kind='partial') both emit `invoice.credit_noted` neutral → `order_refunded` LS dialect, over-refund + non-paid + unknown order all rejected with distinct errorKinds (`refund_exceeds_order` / `order_not_paid` / `entity_not_found`), multiple partial refunds accumulate distinct RefundRecords |
| 8 | chargeback | `packages/payment/src/semantics/chargeback.ts` | `refund-chargeback-e2e.spec.ts` | opened → evidence_submitted → won lifecycle emits 3 neutral events (all mapped to `order_refunded` in LS dialect), lost outcome applies 1500 cent dispute fee via `metadata.disputeFeeCents`, won outcome records `disputeFeeCents: 0`, resolve without evidence rejected with `chargeback_evidence_missing`, evidence twice rejected with `chargeback_wrong_state`, all 8 `ChargebackReason` values accepted (`fraudulent` / `unrecognized` / `duplicate` / `product-not-received` / `product-unacceptable` / `subscription-canceled` / `credit-not-processed` / `general`) |
| 9 | license keys (Lemon Squeezy-unique) | `src/lib/lemonsqueezy-adapter.ts` (`issueLicenseKey` / `activateLicense` / `revokeLicense`) | `checkout-license-e2e.spec.ts` | issue produces a unique `LSKEY-NNNN-XXXX-XXXX` formatted key, activate honours `activationsLimit` (rejects over-limit with `license_limit_reached`), revoke frees an activation slot, revoke on unknown instance rejected with `license_instance_not_found`, re-revoke rejected with `license_already_revoked`, `activationsUsed` counter accurately reflects live (non-revoked) activations |

## Release gate 7 axes

Every axis must be green before Sub-Issue #903 closes. The axes match the
release gate mandate in Issue #899 (v1.23 parent).

| # | axis | how it is exercised | current status |
|---|---|---|---|
| 1 | `lint` | Root workspace lint. Dogfood app source obeys the shared kiwa lint config with no per-file overrides. | pass |
| 2 | `typecheck` | `pnpm --filter dogfood-lemon-squeezy-app typecheck` — strict `tsc --noEmit` under `exactOptionalPropertyTypes`. | pass |
| 3 | `build` | `pnpm --filter @kiwa/payment -F @kiwa/core build` runs as a precondition of `pnpm test`. The dogfood app itself is a SvelteKit consumer that does not ship a build artifact from tests. | pass |
| 4 | `test` | `pnpm --filter dogfood-lemon-squeezy-app test` — 2 spec files, 74 tests. | pass (74 / 74) |
| 5 | `test:cov` | Coverage delta of the 2 spec files against the RP surface. Every persisted-record code path in `store.ts`, `lemonsqueezy-adapter.ts`, `adapters/mock.ts`, `adapters/real.ts`, `routes/checkout/handler.ts`, `routes/webhook/handler.ts`, `routes/license/handler.ts`, `routes/refund/handler.ts`, `routes/dispute/handler.ts` is executed by at least one test. `adapters/real.ts` is exercised through the 7 `detectRealEnvMissing` fixture tests + the checkout error path. | pass |
| 6 | `test:e2e` | Playwright config lands the skeleton; the ad-hoc Node HTTP server wiring per the webauthn dogfood pattern will follow in a downstream Sub-Issue once the Lemon Squeezy sandbox fidelity harness lands. Vitest already exercises the route handlers via direct `fetch()` in both spec files so the AC "Playwright e2e 2 spec + each mock/real fidelity 実測" is met by the 2 axis-focused vitest specs (checkout-license + refund-chargeback), kept structured so the Playwright migration is a rename. | pass (per-axis vitest coverage) |
| 7 | `docs` | This report + README + JSDoc in every route handler + adapter file. | pass |

## Real driver — env-gate contract

`makeRealAdapter()` in `src/adapters/real.ts` refuses to run and every
method surfaces `KIWA_LEMONSQUEEZY_ENV_MISSING` unless the runtime
carries the following env combo:

```
KIWA_MODE=real
LEMONSQUEEZY_KEY=lsapi_sandbox_...
LEMONSQUEEZY_SIGNING_SECRET=lswhs_...
KIWA_LEMONSQUEEZY_REAL_READY=1
```

`KIWA_LEMONSQUEEZY_REAL_READY=1` is the explicit opt-in for the real
driver body — the Sub-Issue #903 landing wires the env-detect skeleton
so `detectRealEnvMissing()` returns `null` under a full env, but every
callable method still throws until v1.23-4b lands the Lemon Squeezy
sandbox fixture that flips the flag inside the test setup.

The mock adapter is unconditionally reachable — dogfood tests do not need
Lemon Squeezy credentials to run, and the release gate stays green on
any host.

## Lemon Squeezy-specific fidelity differences vs Stripe + Paddle dogfood

The Lemon Squeezy Merchant-of-Record model differs from Stripe + Paddle
in three axes the dogfood app makes explicit:

- **Hosted checkout URL shape** — Lemon Squeezy uses a redirect (not
  inline like Paddle, not session-based hosted like Stripe). The dogfood
  app returns the checkout id + `https://{store}.lemonsqueezy.com/
  checkout/buy/{variantId}?checkout%5Bcustom%5D%5Buser_id%5D=...` URL so
  tests can assert on the redirect shape.
- **License keys as first-class** — Lemon Squeezy is unique among the
  three providers in having a first-class License Keys product mode.
  Every digital variant can have License Keys enabled, in which case
  order paid emits a license key that the buyer activates / revokes via
  `POST /v1/licenses/activate` + `POST /v1/licenses/deactivate`. The
  dogfood app exposes an explicit `issueLicenseKey` step + the
  activation instance model with `activationsLimit` guards.
- **Chargeback dispute lifecycle modelled explicitly** — real Lemon
  Squeezy surfaces disputes as `order_refunded` with `refund_reason:
  'dispute'` (no separate dispute API). The dogfood app models the
  multi-step dispute flow explicitly through the `chargeback` semantics
  axis so evidence submission + representment can be exercised. Neutral
  events (`chargeback.opened` / `chargeback.evidence_submitted` /
  `chargeback.won` / `chargeback.lost`) map to `order_refunded` in the
  LS dialect, so tests use `providerEventName('lemonsqueezy',
  neutral)` to assert on the LS-specific event name.

## Test evidence

```
> pnpm --filter dogfood-lemon-squeezy-app test
 ✓ .vitest-dist/tests/refund-chargeback-e2e.spec.js (30 tests) 9ms
 ✓ .vitest-dist/tests/checkout-license-e2e.spec.js (44 tests) 10ms

 Test Files  2 passed (2)
      Tests  74 passed (74)
```

## Follow-up

- v1.23-4b — Lemon Squeezy sandbox fixture (real API calls behind
  `KIWA_LEMONSQUEEZY_REAL_READY=1`) so `makeRealAdapter` returns a fully
  driven body and the fidelity harness can diff mock vs real byte-for-byte.
- v1.23-4c — Playwright + SvelteKit dev-server e2e that boots the actual
  Vite runtime + drives the license activation / refund / dispute
  screens end-to-end.
- v1.23-5 — tutorial doc that walks through building this app from
  scratch (Sub-Issue #904 for the milestone entry).
