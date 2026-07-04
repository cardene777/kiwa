# dogfood-lemon-squeezy-app

Sub-Issue #903 (v1.23-4) — SvelteKit dogfood app for Lemon Squeezy as a
Merchant-of-Record. Wires `@kiwa-test/payment` v0.3 mock adapter + 8-axis
semantics into a merchant-flow surface (hosted checkout / webhook /
license key issue + activation + revoke / refund full + partial /
chargeback dispute lifecycle) so end-to-end fidelity can be verified
without booting the real Lemon Squeezy API.

## Layout

```
src/
├── adapters/
│   ├── interface.ts                provider-neutral Lemon Squeezy RP surface
│   ├── mock.ts                     @kiwa-test/payment lemonsqueezy mock
│   └── real.ts                     env-gated real driver skeleton
├── routes/                         SvelteKit route logic (framework-neutral factories)
│   ├── checkout/handler.ts         POST /checkout
│   ├── webhook/handler.ts          POST /webhook
│   ├── license/handler.ts          POST /license/action + GET /license
│   ├── refund/handler.ts           POST /refund + GET /refund
│   ├── dispute/handler.ts          POST /dispute/action + GET /dispute
│   ├── license/+page.svelte        license key management UI (illustrative)
│   ├── refund/+page.svelte         refund UI (illustrative)
│   └── dispute/+page.svelte        chargeback dispute UI (illustrative)
└── lib/
    ├── store.ts                    in-memory persistence (checkouts + subs + orders + licenses + refunds + disputes + events)
    └── lemonsqueezy-adapter.ts     8-axis routing runtime

tests/
├── checkout-license-e2e.spec.ts    checkout + webhook + license lifecycle + subscription + real env-detect
└── refund-chargeback-e2e.spec.ts   full + partial refund + chargeback lifecycle + evidence + won/lost + fee
```

## Run tests

```
pnpm --filter dogfood-lemon-squeezy-app test        # vitest — 2 spec files
pnpm --filter dogfood-lemon-squeezy-app typecheck   # strict tsc
```

The `pnpm test` script builds `@kiwa-test/payment` + `@kiwa-test/core`
first so the workspace symlink resolves the freshest `dist/`.

## Modes

```
KIWA_MODE=mock  (default) — @kiwa-test/payment createLemonSqueezyMock + 8-axis semantics
KIWA_MODE=real            — real driver, requires LEMONSQUEEZY_KEY + LEMONSQUEEZY_SIGNING_SECRET + KIWA_LEMONSQUEEZY_REAL_READY=1
```

v1.23-4b (follow-up) lands the Lemon Squeezy sandbox fixture that flips
`KIWA_LEMONSQUEEZY_REAL_READY=1` inside the test setup. Until then every
real adapter method surfaces `KIWA_LEMONSQUEEZY_ENV_MISSING`.

## Lemon Squeezy vs Paddle vs Stripe fidelity differences

The Lemon Squeezy Merchant-of-Record model differs from Paddle + Stripe in
three axes the dogfood app makes explicit:

- **Hosted checkout URL shape** — Lemon Squeezy uses
  `https://{store}.lemonsqueezy.com/checkout/buy/{variantId}?checkout%5Bcustom%5D%5Buser_id%5D=...`
  redirect (not inline like Paddle, not session-based hosted like
  Stripe). The dogfood app returns the URL so tests can assert on the
  redirect shape.
- **License keys** — LS is unique among the 3 providers in having a
  first-class License Keys product mode. Every digital variant can have
  License Keys enabled, in which case order paid emits a license key that
  the buyer activates / revokes via `POST /v1/licenses/activate` +
  `POST /v1/licenses/deactivate`. The dogfood app exposes an explicit
  `issueLicenseKey` step so tests can drive the issue path
  deterministically without waiting for the order paid webhook.
- **Chargeback dispute lifecycle** — real LS surfaces disputes as
  `order_refunded` with `refund_reason: 'dispute'` (no separate dispute
  API). The dogfood app models the multi-step dispute flow explicitly
  through the `chargeback` semantics axis so evidence submission +
  representment can be exercised.

## Related

- Parent Issue #899 (v1.23 Payment 深化 milestone)
- Sub-Issue #901 (v1.23-2 Stripe billing app)
- Sub-Issue #902 (v1.23-3 Paddle merchant app)
- `@kiwa-test/payment` v0.3 advanced billing semantics (v1.23-1)
