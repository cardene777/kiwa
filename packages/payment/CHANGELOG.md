# @kiwa-test/payment

## 0.4.0 — 2026-07-06

### Minor Changes — v1.33-1 advanced billing II 8 axis

- 8 new billing semantic axes: orchestration (multi-provider routing + failover + retry ladder + circuit breaker), revenue-recovery (smart retry + dunning cascade + card updater + network tokenization), refund-advanced (partial refund + policy + window + chargeback prevention), dispute (evidence + representment + arbitration + liability shift), webhook-idempotency-advanced (dedup key + replay protection + signature rotation + poison queue), tax-localization (VAT / GST / sales tax / EU DAC7 + reporting), subscription-state-machine (grace period + pause/resume + proration + coupon stacking), payment-method-vault (tokenization + PCI DSS SAQ-A + cross-provider migration).
- Fidelity harness extended to 3 provider × (9 v0.3 + 8 v0.4) = 51 rows, of which the v0.4 slice is 24 combination.
- Real-driver env-gate (`KIWA_MODE=real` + `STRIPE_KEY` / `PADDLE_KEY` / `LEMONSQUEEZY_KEY`) — adapter factories inspect `process.env` and switch into real-driver mode when both flags are present.

## 0.2.0

### Minor Changes

- Initial release. Stripe + Paddle + Lemon Squeezy webhook mock harness with HMAC-SHA256 signature verify, 4 fixture builders (checkoutCompleted / subscriptionCreated / paymentFailed / refunded), and handler dispatch.

### Patch Changes

- Updated dependencies [797e5ea]
  - @kiwa-test/quality-metrics@0.2.0

## 0.1.0 — 2026-07-03

Initial release. Stripe + Paddle + Lemon Squeezy webhook mock harness with HMAC-SHA256 signature verify, 4 fixture builders (checkoutCompleted / subscriptionCreated / paymentFailed / refunded), and handler dispatch.
