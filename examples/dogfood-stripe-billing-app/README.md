# dogfood-stripe-billing-app

Sub-Issue #901 (v1.23-2) — Next.js 15 App Router dogfood app for Stripe
advanced billing. Wires `@kiwa-lab/payment` v0.3 mock adapter + 9-axis
semantics into a merchant-flow surface (checkout / webhook / subscription /
invoice) so end-to-end fidelity can be verified without booting the real
Stripe API.

## Layout

```
src/
├── adapters/
│   ├── interface.ts    — provider-neutral RP surface
│   ├── mock.ts         — @kiwa-lab/payment stripe mock
│   └── real.ts         — env-gated real driver skeleton
├── app/                 — Next.js 15 App Router route handlers
│   ├── checkout/route.ts
│   ├── webhook/route.ts
│   ├── subscription/route.ts
│   └── invoice/route.ts
└── lib/
    ├── store.ts             — in-memory persistence
    └── stripe-adapter.ts    — 8-axis routing runtime

tests/
├── checkout-e2e.spec.ts   — 19 tests, full journey + route validation
├── dunning-e2e.spec.ts    — 8 tests, retry cadence + grace + uncollectible
└── 3ds-e2e.spec.ts        — 8 tests, 3DS v2 accepted / rejected / frictionless
```

## Run tests

```
pnpm --filter dogfood-stripe-billing-app test        # vitest
pnpm --filter dogfood-stripe-billing-app typecheck   # strict tsc
```

The `pnpm test` script builds `@kiwa-lab/payment` + `@kiwa-lab/core`
first so the workspace symlink resolves the freshest `dist/`.

## Modes

```
KIWA_MODE=mock  (default) — @kiwa-lab/payment createStripeMock + 9-axis semantics
KIWA_MODE=real            — real driver, requires STRIPE_KEY + STRIPE_WEBHOOK_SECRET + KIWA_STRIPE_REAL_READY=1
```

v1.23-2b lands the Stripe testcontainers fixture that flips
`KIWA_STRIPE_REAL_READY=1` inside the test setup. Until then every real
adapter method surfaces `KIWA_STRIPE_ENV_MISSING`.

## Related

- Parent Issue #899 (v1.23 Payment 深化 milestone)
- Sub-Issue #900 (v1.23-1) — `@kiwa-lab/payment` v0.3 9-axis semantics
- docs/quality-reports/payment/stripe-billing-app.md — release gate SSOT
