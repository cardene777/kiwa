/**
 * `POST /checkout` handler. Given a customer + variant + amount +
 * optional referral code, creates a hosted checkout session via the
 * adapter and returns the redirect URL.
 *
 * Real Lemon Squeezy: `POST /v1/checkouts` returns a hosted URL under
 * `https://{store}.lemonsqueezy.com/checkout/buy/{variantId}`.
 */

import type {
  CheckoutInput,
  CheckoutResult,
  LemonSqueezyLicenseAdapter,
} from '../../adapters/interface.js';

export type CheckoutRouteResult =
  | { ok: true; status: 200; body: CheckoutResult }
  | { ok: false; status: 400; body: { error: string } };

export function makeCheckoutRoute(
  adapter: LemonSqueezyLicenseAdapter,
): (input: CheckoutInput) => Promise<CheckoutRouteResult> {
  return async (input: CheckoutInput): Promise<CheckoutRouteResult> => {
    if (input.amountCents <= 0) {
      return { ok: false, status: 400, body: { error: 'amount_must_be_positive' } };
    }
    if (input.customerId.length === 0 || input.variantId.length === 0) {
      return { ok: false, status: 400, body: { error: 'customer_and_variant_required' } };
    }
    const result = await adapter.checkout(input);
    return { ok: true, status: 200, body: result };
  };
}
