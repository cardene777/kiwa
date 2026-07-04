/**
 * SvelteKit route logic for `POST /checkout`.
 *
 * The SvelteKit runtime is not imported here — the handler is a plain
 * `(req: Request) => Promise<Response>` function that a SvelteKit
 * `+server.ts` module wires as `export const POST = createCheckoutHandler(adapter)`.
 * Keeping the handler framework-neutral lets the dogfood tests exercise it
 * as pure `fetch()` without booting SvelteKit — Playwright e2e boots the
 * actual SvelteKit runtime later.
 *
 * Request shape (JSON) —
 *   { customerId, variantId, storeId, amountCents, currency?, productKind?,
 *     successUrl? }
 * matches {@link CheckoutInput}. Response shape (JSON) —
 *   { checkoutId, orderId, url, amountCents, currency, status, productKind }
 * mirrors what a browser client would receive from a real Lemon Squeezy
 * `POST /v1/checkouts` call.
 */

import type { CheckoutInput, LemonSqueezyDogfoodAdapter } from '../../adapters/interface.js';

export interface CheckoutRouteBody {
  customerId: string;
  variantId: string;
  storeId: string;
  amountCents: number;
  currency?: string;
  productKind?: 'digital' | 'physical' | 'service' | 'license';
  successUrl?: string;
}

export interface CheckoutRouteResponse {
  checkoutId: string;
  orderId: string;
  url: string;
  amountCents: number;
  currency: string;
  status: 'open' | 'complete' | 'expired';
  productKind: 'digital' | 'physical' | 'service' | 'license';
}

/**
 * Build a `POST` handler bound to a specific {@link LemonSqueezyDogfoodAdapter}
 * instance. The SvelteKit `+server.ts` entry point wires this up as
 * `export const POST = createCheckoutHandler(adapter)`.
 */
export function createCheckoutHandler(
  adapter: LemonSqueezyDogfoodAdapter,
): (req: Request) => Promise<Response> {
  return async function POST(req: Request): Promise<Response> {
    let body: CheckoutRouteBody;
    try {
      body = (await req.json()) as CheckoutRouteBody;
    } catch (err) {
      return jsonResponse(400, {
        error: 'invalid_json',
        message: err instanceof Error ? err.message : String(err),
      });
    }

    if (
      !body.customerId ||
      !body.variantId ||
      !body.storeId ||
      typeof body.amountCents !== 'number'
    ) {
      return jsonResponse(400, {
        error: 'missing_fields',
        message: 'customerId, variantId, storeId and amountCents are required',
      });
    }
    if (body.amountCents <= 0) {
      return jsonResponse(400, {
        error: 'invalid_amount',
        message: `amountCents must be > 0 (got ${body.amountCents})`,
      });
    }

    try {
      const input: CheckoutInput = {
        customerId: body.customerId,
        variantId: body.variantId,
        storeId: body.storeId,
        amountCents: body.amountCents,
      };
      if (body.currency !== undefined) input.currency = body.currency;
      if (body.productKind !== undefined) input.productKind = body.productKind;
      if (body.successUrl !== undefined) input.successUrl = body.successUrl;

      const result = await adapter.checkout(input);
      const responseBody: CheckoutRouteResponse = {
        checkoutId: result.checkoutId,
        orderId: result.orderId,
        url: result.url,
        amountCents: result.amountCents,
        currency: result.currency,
        status: result.status,
        productKind: result.productKind,
      };
      return jsonResponse(200, responseBody);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const status = message.includes('KIWA_LEMONSQUEEZY_ENV_MISSING') ? 503 : 500;
      return jsonResponse(status, {
        error: 'checkout_failed',
        message,
      });
    }
  };
}

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}
