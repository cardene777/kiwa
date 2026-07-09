# Payment webhook testing — kiwa SSOT

## Why webhooks are hard to test

Payment providers push webhooks asynchronously from their backend. A test that spins up the real provider hits three problems at once:

- **flaky** — the delivery is not synchronous. Poll timing decides pass/fail.
- **coupled** — a test account has to exist. Sandbox mode differs per provider.
- **verify chain** — the signature is HMAC-SHA256 over `{ts}.{body}` for Stripe, `{ts}:{body}` for Paddle, raw body only for Lemon Squeezy. Tampering vs stale-timestamp vs malformed-body must be exercised separately.

`@kiwa-lab/payment` addresses all three by moving the sign + verify path in-process.

## The `PaymentAdapter` contract

Three ops. All three providers implement the same shape.

- `signWebhook({ type, amountCents, currency?, customerId, timestamp? })` — build a canonical rawBody + HMAC-SHA256 signature. Returns `{ rawBody, signature, event }`.
- `verifyWebhook({ rawBody, signature, toleranceMs? })` — timing-safe verify. Returns one of 4 reasons: `ok` / `bad-signature` / `stale-timestamp` / `malformed-body`.
- `onWebhook(handler)` + `emit(event)` — synchronous handler dispatch for end-to-end webhook flows.

The provider prefix (`@kiwa-lab/payment/stripe` etc.) triggers the common 7-axis release gate — no AI-LLM axes apply.

## The 3 provider differences that matter

| provider | signature scheme | payload shape | secret prefix |
|---|---|---|---|
| Stripe | `Stripe-Signature: t=...,v1=...` over `{ts}.{body}` | `data.object.{id,amount,currency}` | `whsec_...` |
| Paddle Billing | `Paddle-Signature: ts=...;h1=...` over `{ts}:{body}` | `data.attributes.totals.total` (string cents) | `pdl_ntfset_...` |
| Lemon Squeezy | `X-Signature: <hmac>` over raw body | `meta.event_name` + `data.attributes.total` | `lswhs_...` |

The `PaymentEngine` shared core normalises these differences behind the adapter shape so consumer test code reads identical `PaymentWebhookEvent` fields regardless of provider.

## The 4 fixture builders

- `checkoutCompleted(adapter, { amountCents, currency?, customerId })`
- `subscriptionCreated(adapter, { amountCents, currency?, customerId })`
- `paymentFailed(adapter, { amountCents, currency?, customerId })`
- `refunded(adapter, { amountCents, currency?, customerId })` — flips `amountCents` sign for the accounting delta

For provider-specific event types (`invoice.upcoming`, `transaction.canceled`, etc.) call `adapter.signWebhook({ type: '...', ... })` directly.

## The 4 verify failure modes

The tests you should write for every payment integration.

- **`ok`** — happy path. Sign, verify, dispatch.
- **`bad-signature`** — tamper the body. Verify must reject.
- **`stale-timestamp`** — replay attack. Body signed 10 minutes ago, verify with `toleranceMs: 60_000` must reject.
- **`malformed-body`** — arbitrary garbage. JSON parse fails or `timestamp` field missing. Verify must reject.

All 4 must pass before the endpoint reaches production. `@kiwa-lab/payment` exercises each in unit-test time (no real webhook, no polling).

## When NOT to use the mock

- Testing the actual HTTP round-trip against the real provider's endpoints — use the real SDK against sandbox / test-mode instead. The mock exercises the sign/verify byte contract, not the network.
- Load / stress testing — the mock is deterministic, does not simulate real backend latency variance. Use the real provider (sandbox mode) for perf testing.

## Related

- [Tutorial 12 — Payment webhook mock](../tutorials/12-payment)
- [`@kiwa-lab/payment` on npm](https://www.npmjs.com/package/@kiwa-lab/payment)
