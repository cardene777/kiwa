/**
 * Nuxt 3 server route for `POST /api/checkout`.
 *
 * The Nuxt runtime is not imported here — the handler is a plain
 * `(req: Request) => Promise<Response>` function that Nuxt 3 mounts when
 * `server/api/checkout.post.ts` is picked up by the Nitro server routes
 * convention (§Server Routes, Nuxt 3 docs). Keeping the handler
 * framework-neutral lets the dogfood tests exercise it as pure fetch()
 * without booting Nuxt — Playwright e2e boots the actual Nitro runtime.
 *
 * Request shape (JSON) —
 *   { customerId, priceId, planId, amountCents, currency?, buyerCountry,
 *     buyerVatId?, merchantCountry?, productKind?, successUrl? }
 * matches {@link CheckoutInput}. Response shape (JSON) —
 *   { checkoutId, transactionId, url, amountCents, currency, status,
 *     tax: { kind, country, rateBps, taxCents, reverseCharged, exempt } }
 * mirrors what a browser client would receive from a real Paddle Billing
 * `paddle.transactions.create()` call plus the tax preview line.
 */

import type { CheckoutInput, PaddleBillingAdapter } from '../../adapters/interface.js';

export interface CheckoutRouteBody {
  customerId: string;
  priceId: string;
  planId: string;
  amountCents: number;
  currency?: string;
  buyerCountry: string;
  buyerVatId?: string;
  merchantCountry?: string;
  productKind?: 'digital' | 'physical' | 'service';
  successUrl?: string;
}

export interface CheckoutRouteResponse {
  checkoutId: string;
  transactionId: string;
  url: string;
  amountCents: number;
  currency: string;
  status: 'open' | 'complete' | 'expired';
  tax: {
    kind: 'vat' | 'gst' | 'sales-tax';
    country: string;
    rateBps: number;
    amountCents: number;
    taxCents: number;
    reverseCharged: boolean;
    exempt: boolean;
  };
}

/**
 * Build a `POST` handler bound to a specific {@link PaddleBillingAdapter}
 * instance. The Nuxt 3 server route entry point wires this up as
 * `export default createCheckoutHandler(adapter)`.
 */
export function createCheckoutHandler(
  adapter: PaddleBillingAdapter,
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
      !body.priceId ||
      !body.planId ||
      typeof body.amountCents !== 'number' ||
      !body.buyerCountry
    ) {
      return jsonResponse(400, {
        error: 'missing_fields',
        message: 'customerId, priceId, planId, amountCents and buyerCountry are required',
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
        priceId: body.priceId,
        planId: body.planId,
        amountCents: body.amountCents,
        buyerCountry: body.buyerCountry,
      };
      if (body.currency !== undefined) input.currency = body.currency;
      if (body.buyerVatId !== undefined) input.buyerVatId = body.buyerVatId;
      if (body.merchantCountry !== undefined) input.merchantCountry = body.merchantCountry;
      if (body.productKind !== undefined) input.productKind = body.productKind;
      if (body.successUrl !== undefined) input.successUrl = body.successUrl;

      const result = await adapter.checkout(input);
      const responseBody: CheckoutRouteResponse = {
        checkoutId: result.checkoutId,
        transactionId: result.transactionId,
        url: result.url,
        amountCents: result.amountCents,
        currency: result.currency,
        status: result.status,
        tax: {
          kind: result.taxLine.kind,
          country: result.taxLine.country,
          rateBps: result.taxLine.rateBps,
          amountCents: result.taxLine.amountCents,
          taxCents: result.taxLine.taxCents,
          reverseCharged: result.taxLine.reverseCharged,
          exempt: result.taxLine.exempt,
        },
      };
      return jsonResponse(200, responseBody);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const status = message.includes('KIWA_PADDLE_ENV_MISSING') ? 503 : 500;
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
