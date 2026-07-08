# dogfood-stripe-marketplace-app

Sub-Issue #1037 (CAR-733) — Next.js 15 App Router dogfood app for Stripe
Connect marketplace flows. Wires `@kiwa/payment` v0.4 mock signing into
seller onboarding, destination charges, application fees, multi-party payouts,
and annual tax reports so mock-vs-real fidelity can feed the payment release
gate.

## Layout

```text
src/
├── adapters/
│   ├── interface.ts    — provider-neutral marketplace RP surface
│   ├── mock.ts         — createStripeMock + marketplace runtime
│   └── real.ts         — env-gated real driver skeleton
├── app/
│   ├── connect/route.ts
│   ├── charge/route.ts
│   ├── payout/route.ts
│   ├── tax/route.ts
│   └── webhook/route.ts
└── lib/
    ├── store.ts              — in-memory persistence
    └── marketplace-runtime.ts — Connect + charge + payout + tax orchestration

tests/
├── connect-e2e.spec.ts        — 12 tests, onboarding + account state + traces
├── charge-payout-e2e.spec.ts  — 16 tests, destination charges + transfers
└── tax-report-e2e.spec.ts     — 12 tests, 1099-K + DAC7 aggregation
```

## Run tests

```bash
pnpm --filter dogfood-stripe-marketplace-app test
pnpm --filter dogfood-stripe-marketplace-app typecheck
```

The `pnpm test` script builds `@kiwa/payment` + `@kiwa/core`
first so the workspace symlink resolves the freshest `dist/`.

## Modes

```text
KIWA_MODE=mock  (default) — createStripeMock + deterministic marketplace runtime
KIWA_MODE=real            — env-gated skeleton, requires STRIPE_SECRET_KEY + KIWA_STRIPE_REAL_READY=1
```

Until the real Stripe Connect driver lands, every write method on the real
adapter throws `KIWA_STRIPE_ENV_MISSING`. Read-style list methods return empty
arrays so the fidelity harness can still compare envelopes.

## Related

- Linear CAR-733 / GH #1037
- examples/dogfood-stripe-billing-app/ — style and runtime reference
- packages/payment/src/semantics/types.ts — provider event dialect mapping
