# dogfood-paddle-subscription-app

Sub-Issue #1038 (CAR-737) — Next.js 15 App Router dogfood app for Paddle
Billing v2 subscription lifecycle flows. Wires `@kiwa-lab/payment` v0.4 mock
signing into customer signup, subscription creation + trial extension, mid-
cycle proration, retention offers (pause + downgrade + coupon), coupon
stacking, and refund window enforcement so mock-vs-real fidelity can feed the
payment release gate.

## Layout

```text
src/
├── adapters/
│   ├── interface.ts    — provider-neutral Paddle Billing v2 subscription surface
│   ├── mock.ts         — createPaddleMock + subscription runtime
│   └── real.ts         — env-gated real driver skeleton
├── app/
│   ├── subscription/route.ts  — customer + subscription create + activate + cancel + list
│   ├── trial/route.ts         — trial extension
│   ├── proration/route.ts     — mid-cycle plan change proration
│   ├── retention/route.ts     — retention offer + coupon stack + refund
│   └── webhook/route.ts       — Paddle-Signature verify + dispatch
└── lib/
    ├── store.ts                — in-memory persistence
    └── subscription-runtime.ts — customer + subscription + proration + retention + coupon + refund orchestration

tests/
├── subscription-lifecycle-e2e.spec.ts — 26 tests, customer + subscription + trial
├── retention-e2e.spec.ts              — 23 tests, retention offers + coupon stacking
└── proration-refund-e2e.spec.ts       — 19 tests, proration deltas + refund window
```

## Run tests

```bash
pnpm --filter dogfood-paddle-subscription-app test
pnpm --filter dogfood-paddle-subscription-app typecheck
```

The `pnpm test` script builds `@kiwa-lab/payment` + `@kiwa-lab/core`
first so the workspace symlink resolves the freshest `dist/`.

## Modes

```text
KIWA_MODE=mock  (default) — createPaddleMock + deterministic subscription runtime
KIWA_MODE=real            — env-gated skeleton, requires PADDLE_API_KEY + KIWA_PADDLE_REAL_READY=1
```

Until the real Paddle Billing v2 driver lands, every write method on the real
adapter throws `KIWA_PADDLE_ENV_MISSING`. Read-style list methods return empty
arrays so the fidelity harness can still compare envelopes.

## Related

- Linear CAR-737 / GH #1038
- examples/dogfood-stripe-marketplace-app/ — style and runtime reference
- packages/payment/src/semantics/subscription-state-machine.ts — proration + coupon stacking SSOT
- packages/payment/src/semantics/types.ts — provider event dialect mapping
