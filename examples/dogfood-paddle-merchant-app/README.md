# dogfood-paddle-merchant-app

Sub-Issue #902 (v1.23-3) — Nuxt 3 dogfood app for Paddle Billing v2 as a
Merchant-of-Record. Wires `@kiwa-lab/payment` v0.3 mock adapter + 9-axis
semantics into a merchant-flow surface (inline checkout / webhook /
subscription tier upgrade-downgrade / VAT/GST/sales-tax auto-calc) so
end-to-end fidelity can be verified without booting the real Paddle
sandbox.

## Layout

```
src/
├── adapters/
│   ├── interface.ts         provider-neutral RP surface
│   ├── mock.ts              @kiwa-lab/payment paddle mock
│   └── real.ts              env-gated real driver skeleton
├── server/api/              Nuxt 3 server routes (H3-compatible handlers)
│   ├── checkout.post.ts
│   ├── webhook.post.ts
│   ├── subscription.get.ts
│   ├── subscription-action.post.ts
│   ├── tax.get.ts
│   └── tax-calculate.post.ts
├── pages/                   Nuxt 3 Vue pages (illustrative)
│   ├── subscription.vue     tier upgrade/downgrade UI + proration display
│   └── tax.vue              VAT/GST/sales-tax UI + tax registration
└── lib/
    ├── store.ts             in-memory persistence (subs + txns + tax + events)
    └── paddle-adapter.ts    8-axis routing runtime

tests/
├── checkout-tier-e2e.spec.ts   23 tests, inline checkout + tier upgrade + proration
└── tax-vat-e2e.spec.ts         17 tests, VAT/GST/sales-tax + reverse charge + registration
```

## Run tests

```
pnpm --filter dogfood-paddle-merchant-app test        # vitest — 40 tests
pnpm --filter dogfood-paddle-merchant-app typecheck   # strict tsc
```

The `pnpm test` script builds `@kiwa-lab/payment` + `@kiwa-lab/core`
first so the workspace symlink resolves the freshest `dist/`.

## Modes

```
KIWA_MODE=mock  (default) — @kiwa-lab/payment createPaddleMock + 9-axis semantics
KIWA_MODE=real            — real driver, requires PADDLE_KEY + PADDLE_NOTIFICATION_SECRET + KIWA_PADDLE_REAL_READY=1
```

v1.23-3b lands the Paddle sandbox fixture that flips
`KIWA_PADDLE_REAL_READY=1` inside the test setup. Until then every real
adapter method surfaces `KIWA_PADDLE_ENV_MISSING`.

## Paddle vs Stripe fidelity differences

The Paddle merchant-of-record model differs from Stripe in three axes the
dogfood app makes explicit:

- **Inline checkout** — Paddle uses `paddle.js` mounted inline on the
  merchant page instead of a hosted checkout page. The dogfood app returns
  the checkout id + `checkout.paddle.com/checkout/{id}` URL so tests can
  assert on the inline shape.
- **Transactions instead of invoices** — Paddle's billing surface is
  `transaction.*` webhooks (not `invoice.*`). The store keeps the
  cross-provider `SemanticInvoice` name but the field is `transactions`.
- **Tax handled internally** — Paddle Merchant-of-Record calculates tax
  at transaction time. The dogfood app surfaces the intermediate line
  calculations via `POST /api/tax/calculate` + `GET /api/tax` so the
  fidelity harness can diff mock vs real output line-by-line.

## Related

- Parent Issue #899 (v1.23 Payment 深化 milestone)
- Sub-Issue #900 (v1.23-1) — `@kiwa-lab/payment` v0.3 9-axis semantics
- Sub-Issue #901 (v1.23-2) — Stripe billing dogfood app (Next.js 15)
- Sub-Issue #903 (v1.23-4) — Lemon Squeezy license dogfood app (SvelteKit)
- docs/quality-reports/payment/paddle-merchant-app.md — release gate SSOT
