# dogfood-lemonsqueezy-license-app

CAR-738 (v1.33-4) — Lemon Squeezy Merchant-of-Record RP focused on
license key + activation + affiliate program + refund window. Drives
`@kiwa-lab/payment` v0.4 through a mock adapter, with a real driver
env-gate (`KIWA_MODE=real` + `LEMONSQUEEZY_KEY` +
`KIWA_LEMONSQUEEZY_REAL_READY=1`) that surfaces
`KIWA_LEMONSQUEEZY_ENV_MISSING` until CI wires the sandbox fixture.

## Scope (CAR-738)

- license key issue + activation (per-seat / per-machine)
- affiliate program (referral link + commission tier — bronze / silver / gold)
- refund window (30 day money-back guarantee + partial refund)
- webhook (order created / license activated / refund issued)
- real driver env-gate (KIWA_MODE=real + LEMONSQUEEZY_KEY sandbox)
- 35+ test

Complements the existing `dogfood-lemon-squeezy-app` (v1.23-4) which
covers the broader Merchant-of-Record surface (checkout + subscription
+ chargeback dispute). This app narrows to the license + affiliate +
refund-window axis so the v1.33-1 `refund-advanced` +
`payment-method-vault` semantics can be dogfooded end-to-end.

## Layout

```
src/
├── adapters/
│   ├── interface.ts                provider-neutral adapter contract
│   ├── mock.ts                     @kiwa-lab/payment lemonsqueezy mock + in-memory store
│   └── real.ts                     env-gated real driver skeleton
├── routes/
│   ├── checkout/handler.ts         POST /checkout (referral link support)
│   ├── webhook/handler.ts          POST /webhook (X-Signature verify + dispatch)
│   ├── license/handler.ts          POST /license/{issue|activate|deactivate}
│   ├── refund/handler.ts           POST /refund (30-day window + partial)
│   └── affiliate/handler.ts        POST /affiliate/{register|convert|claw-back}
└── lib/
    ├── store.ts                    in-memory persistence (licenses / orders / refunds / referrals / webhooks)
    ├── license-issue.ts            issue / activate / deactivate / revoke logic
    ├── refund-window.ts            30-day window + amount cap policy
    └── affiliate-tier.ts           tier evaluate + commission math + promote / demote

tests/
├── license-issue-activation.spec.ts    per-machine cap + idempotency + revoke + HTTP surface
├── refund-window.spec.ts               30-day boundary + chargeback bypass + license revoke on full
├── affiliate-program.spec.ts           tier promotion + commission + clawback + HTTP surface
└── webhook-checkout.spec.ts            signature verify + dispatch + env-gate + hosted URL shape
```

## Run tests

```
pnpm --filter dogfood-lemonsqueezy-license-app test        # vitest — 4 spec files, 40+ cases
pnpm --filter dogfood-lemonsqueezy-license-app typecheck   # strict tsc
```

The `pnpm test` script builds `@kiwa-lab/payment` + `@kiwa-lab/core`
first so the workspace symlink resolves the freshest `dist/`.

## Modes

```
KIWA_MODE=mock  (default) — @kiwa-lab/payment createLemonSqueezyMock + local license / affiliate logic
KIWA_MODE=real            — real driver, requires LEMONSQUEEZY_KEY + KIWA_LEMONSQUEEZY_REAL_READY=1
```

Until the sandbox fixture lands, every real adapter method surfaces
`KIWA_LEMONSQUEEZY_ENV_MISSING:{op}` when the env gate is unmet, or
`KIWA_LEMONSQUEEZY_REAL_NOT_IMPLEMENTED:{op}` when the gate is met but
the driver body is deferred.

## License-key first vs subscription-first framing

Lemon Squeezy's License Keys product mode is unique among the three
providers (Stripe / Paddle / LS). This app narrows to that mode + the
affiliate program that wraps around it — refund windows and clawbacks
tie the two together so a merchant selling perpetual desktop licenses
with a 30-day money-back guarantee and a referral program can dogfood
the entire flow deterministically.

## Related

- `dogfood-lemon-squeezy-app` (v1.23-4) — broader Merchant-of-Record surface
- `@kiwa-lab/payment` v0.4 semantics — `refund-advanced`, `payment-method-vault`
- CAR-731 (v1.33 parent) — payment 深化 II
- CAR-732 (v1.33-1) — @kiwa-lab/payment v0.4 base
