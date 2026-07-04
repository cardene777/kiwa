/**
 * Nuxt 3 server route for `POST /api/tax/calculate`.
 *
 * On-demand tax recalculation — the tax UI calls this when the buyer
 * changes their address / VAT id after the checkout preview. Real Paddle
 * Merchant-of-Record calculates tax at transaction time; this endpoint
 * surfaces the same computation so the harness can compare mock vs real
 * output line-by-line.
 *
 * Request shape (JSON) —
 *   { customerId, netAmountCents, buyerCountry, buyerVatId?,
 *     merchantCountry, productKind?, currency? }
 *
 * Response shape (JSON) —
 *   { tax: { kind, country, rateBps, amountCents, taxCents,
 *     reverseCharged, exempt } }
 */

import type { PaddleBillingAdapter, TaxCalculationInput } from '../../adapters/interface.js';

export interface TaxCalculateBody {
  customerId: string;
  netAmountCents: number;
  buyerCountry: string;
  buyerVatId?: string;
  merchantCountry: string;
  productKind?: 'digital' | 'physical' | 'service';
  currency?: string;
}

export function createTaxCalculateHandler(
  adapter: PaddleBillingAdapter,
): (req: Request) => Promise<Response> {
  return async function POST(req: Request): Promise<Response> {
    let body: TaxCalculateBody;
    try {
      body = (await req.json()) as TaxCalculateBody;
    } catch (err) {
      return jsonResponse(400, {
        error: 'invalid_json',
        message: err instanceof Error ? err.message : String(err),
      });
    }
    if (
      !body.customerId ||
      typeof body.netAmountCents !== 'number' ||
      !body.buyerCountry ||
      !body.merchantCountry
    ) {
      return jsonResponse(400, {
        error: 'missing_fields',
        message:
          'customerId, netAmountCents, buyerCountry, merchantCountry are required',
      });
    }
    if (body.netAmountCents <= 0) {
      return jsonResponse(400, {
        error: 'invalid_amount',
        message: `netAmountCents must be > 0 (got ${body.netAmountCents})`,
      });
    }
    try {
      const input: TaxCalculationInput = {
        customerId: body.customerId,
        netAmountCents: body.netAmountCents,
        buyerCountry: body.buyerCountry,
        merchantCountry: body.merchantCountry,
      };
      if (body.buyerVatId !== undefined) input.buyerVatId = body.buyerVatId;
      if (body.productKind !== undefined) input.productKind = body.productKind;
      if (body.currency !== undefined) input.currency = body.currency;
      const line = await adapter.calculateTax(input);
      return jsonResponse(200, {
        tax: {
          kind: line.kind,
          country: line.country,
          rateBps: line.rateBps,
          amountCents: line.amountCents,
          taxCents: line.taxCents,
          reverseCharged: line.reverseCharged,
          exempt: line.exempt,
        },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const status = message.includes('KIWA_PADDLE_ENV_MISSING') ? 503 : 500;
      return jsonResponse(status, {
        error: 'tax_calculate_failed',
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
