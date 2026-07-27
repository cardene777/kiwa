# @kiwa-lab/payment

Unified webhook mock harness for the 3 major payment providers — Stripe, Paddle Billing, Lemon Squeezy — with advanced production billing semantics.

- `signWebhook` — build a raw payload + HMAC-SHA256 signature over `{ts}.{body}` (matches the real provider signature schemes)
- `verifyWebhook` — timing-safe verify + stale timestamp rejection + malformed body rejection
- `onWebhook` / `emit` — synchronous registered handler dispatch for end-to-end tests
- **v0.3** — advanced billing semantics module covering dunning / retry / 3DS / SCA / PSD2 / subscription lifecycle / invoice / tax / chargeback across all 3 providers with dialect-aware event name routing

Basic webhook mock usage:

```ts
import { createStripeMock, checkoutCompleted } from '@kiwa-lab/payment';

const stripe = createStripeMock({ secret: 'whsec_test' });
const { rawBody, signature } = checkoutCompleted(stripe, {
  amountCents: 2000,
  customerId: 'cus_test',
});
const verified = stripe.verifyWebhook({ rawBody, signature });
```

v0.3 advanced billing semantics — 9 axis dunning example:

```ts
import { createStripeMock, startDunning, dunningAttempt, finalizeDunning } from '@kiwa-lab/payment';

const stripe = createStripeMock();
const session = startDunning({
  invoiceId: 'inv_1',
  amountCents: 5000,
  customerId: 'cus_1',
  config: { maxAttempts: 4, retryIntervalMs: 3 * 24 * 60 * 60 * 1000 },
});
await dunningAttempt(stripe, session); // attempt 1 → active
await dunningAttempt(stripe, session); // attempt 2 → active
await dunningAttempt(stripe, session); // attempt 3 → active
await dunningAttempt(stripe, session); // attempt 4 → in-grace-period (last attempt)
await finalizeDunning(stripe, session, { succeed: false }); // → exhausted
```

## v0.3 axis matrix

Each axis is a small state machine that emits provider-dialect webhook events through the underlying `PaymentAdapter`. The neutral event name lets tests filter across providers; the dialect column lists the actual Stripe / Paddle / Lemon Squeezy string surfaced on the wire.

| axis | entry helpers | neutral events | providers |
|---|---|---|---|
| `dunning` | `startDunning` / `dunningAttempt` / `finalizeDunning` | attempt / exhausted / recovered | stripe / paddle / lemonsqueezy |
| `retry` | `startRetry` / `retryDeliver` / `retryBackoffMs` | scheduled / delivered / abandoned | stripe / paddle / lemonsqueezy |
| `3ds` | `startThreeDs` / `threeDsRequestChallenge` / `threeDsSubmitChallenge` / `threeDsFrictionless` | challenge_required / challenge_completed / frictionless | stripe / paddle / lemonsqueezy |
| `sca` | `startSca` / `scaEvaluate` / `scaAuthenticate` | required / exempt / authenticated | stripe / paddle / lemonsqueezy |
| `psd2` | `createMandate` / `revokeMandate` / `grantConsent` | mandate_created / mandate_revoked / consent_granted | stripe / paddle / lemonsqueezy |
| `subscription-lifecycle` | `createSubscription` / `changePlan` / `pauseSubscription` / `resumeSubscription` / `cancelSubscription` / `reactivateSubscription` | created / upgraded / downgraded / paused / resumed / canceled / reactivated | stripe / paddle / lemonsqueezy |
| `invoice` | `draftInvoice` / `openInvoice` / `payInvoice` / `voidInvoice` / `markUncollectible` / `creditNoteInvoice` | drafted / opened / paid / voided / uncollectible / credit_noted | stripe / paddle / lemonsqueezy |
| `tax` | `calculateTax` / `emitTaxLine` | calculated / reverse_charged / exempted | stripe / paddle / lemonsqueezy |
| `chargeback` | `openChargeback` / `submitEvidence` / `resolveChargeback` | opened / evidence_submitted / won / lost | stripe / paddle / lemonsqueezy |

## Fidelity harness

The `collectFidelityCoverage` helper returns the full 3 provider × 9 axis grid so release-gate can assert coverage without walking every neutral event by hand:

```ts
import { collectFidelityCoverage, createStripeMock, createPaddleMock, createLemonSqueezyMock } from '@kiwa-lab/payment';

const coverage = collectFidelityCoverage([
  createStripeMock(),
  createPaddleMock(),
  createLemonSqueezyMock(),
]);
// coverage.rows.length === 27
// each row lists { provider, axis, neutralEvents, providerEvents }
```

<!-- kiwa-docs:start -->
## Documentation

公開ドキュメントを正本として管理しています。

- [概要](https://cardene777.github.io/kiwa/libraries/services/payment/)
- [はじめる](https://cardene777.github.io/kiwa/libraries/services/payment/quickstart)
- [使い方](https://cardene777.github.io/kiwa/libraries/services/payment/how-to)
- [リファレンス](https://cardene777.github.io/kiwa/libraries/services/payment/reference)

編集元は [docs/libraries/services/payment](../../docs/libraries/services/payment/) です。
<!-- kiwa-docs:end -->
