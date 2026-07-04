/**
 * Next.js 15 App Router route handler for `POST /checkout`.
 *
 * The Next.js runtime is not imported here — the handler is a plain
 * `(req: Request) => Promise<Response>` function that Next.js 15 will
 * mount when `src/app/checkout/route.ts` is picked up by the App Router
 * convention (§Route Handlers, Next.js 15 docs). Keeping the handler
 * framework-neutral lets the dogfood tests exercise it as pure fetch()
 * without booting Next.js — Playwright e2e boots the actual Next.js runtime.
 *
 * Request shape (JSON) —
 *   { customerId, planId, amountCents, currency?, requiresThreeDs?,
 *     successUrl?, cancelUrl? }
 * matches {@link CheckoutInput}. Response shape (JSON) —
 *   { sessionId, paymentIntentId, url, amountCents, currency, status,
 *     threeDs? }
 * mirrors what a browser client would receive from a real Stripe
 * `stripe.checkout.sessions.create()` call.
 */

import type { CheckoutInput, StripeBillingAdapter } from '../../adapters/interface.js';

export interface CheckoutRouteBody {
  customerId: string;
  planId: string;
  amountCents: number;
  currency?: string;
  requiresThreeDs?: boolean;
  successUrl?: string;
  cancelUrl?: string;
}

export interface CheckoutRouteResponse {
  sessionId: string;
  paymentIntentId: string;
  url: string;
  amountCents: number;
  currency: string;
  status: 'open' | 'complete' | 'expired';
  threeDsPaymentIntentId?: string;
  threeDsState?: 'fingerprint' | 'challenge-pending' | 'completed' | 'frictionless';
}

/**
 * Build a `POST` handler bound to a specific {@link StripeBillingAdapter}
 * instance. The Next.js 15 App Router entry point wires this up as
 * `export const POST = createCheckoutHandler(adapter)`.
 */
export function createCheckoutHandler(
  adapter: StripeBillingAdapter,
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

    if (!body.customerId || !body.planId || typeof body.amountCents !== 'number') {
      return jsonResponse(400, {
        error: 'missing_fields',
        message: 'customerId, planId and amountCents are required',
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
        planId: body.planId,
        amountCents: body.amountCents,
      };
      if (body.currency !== undefined) input.currency = body.currency;
      if (body.requiresThreeDs !== undefined) input.requiresThreeDs = body.requiresThreeDs;
      if (body.successUrl !== undefined) input.successUrl = body.successUrl;
      if (body.cancelUrl !== undefined) input.cancelUrl = body.cancelUrl;

      const result = await adapter.checkout(input);
      const responseBody: CheckoutRouteResponse = {
        sessionId: result.sessionId,
        paymentIntentId: result.paymentIntentId,
        url: result.url,
        amountCents: result.amountCents,
        currency: result.currency,
        status: result.status,
      };
      if (result.threeDs) {
        responseBody.threeDsPaymentIntentId = result.threeDs.paymentIntentId;
        responseBody.threeDsState = result.threeDs.state;
      }
      return jsonResponse(200, responseBody);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const status = message.includes('KIWA_STRIPE_ENV_MISSING') ? 503 : 500;
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
