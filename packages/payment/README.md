# @kiwa-test/payment

Unified webhook mock harness for the 3 major payment providers — Stripe, Paddle Billing, Lemon Squeezy.

- `signWebhook` — build a raw payload + HMAC-SHA256 signature over `{ts}.{body}` (matches the real provider signature schemes)
- `verifyWebhook` — timing-safe verify + stale timestamp rejection + malformed body rejection
- `onWebhook` / `emit` — synchronous registered handler dispatch for end-to-end tests

Usage:

```ts
import { createStripeMock, checkoutCompleted } from '@kiwa-test/payment';

const stripe = createStripeMock({ secret: 'whsec_test' });
const { rawBody, signature } = checkoutCompleted(stripe, {
  amountCents: 2000,
  customerId: 'cus_test',
});
const verified = stripe.verifyWebhook({ rawBody, signature });
```
