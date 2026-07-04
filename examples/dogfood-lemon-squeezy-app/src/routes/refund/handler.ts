/**
 * SvelteKit route logic for `POST /refund` and `GET /refund`.
 *
 * Dispatches a full or partial refund on a paid order. Full refunds emit a
 * credit note for the full order amount; partials emit a credit note for
 * the requested delta. Both surface as `order_refunded` through the LS
 * provider dialect so the fidelity harness can diff both branches on the
 * same event.
 */

import type {
  LemonSqueezyDogfoodAdapter,
  RefundInput,
} from '../../adapters/interface.js';

export interface RefundRouteBody {
  orderId: string;
  refundAmountCents?: number;
  reason?: string;
}

export function createRefundHandler(
  adapter: LemonSqueezyDogfoodAdapter,
): (req: Request) => Promise<Response> {
  return async function POST(req: Request): Promise<Response> {
    let body: RefundRouteBody;
    try {
      body = (await req.json()) as RefundRouteBody;
    } catch (err) {
      return jsonResponse(400, {
        error: 'invalid_json',
        message: err instanceof Error ? err.message : String(err),
      });
    }
    if (!body.orderId) {
      return jsonResponse(400, {
        error: 'missing_fields',
        message: 'orderId is required',
      });
    }
    if (body.refundAmountCents !== undefined && body.refundAmountCents <= 0) {
      return jsonResponse(400, {
        error: 'invalid_amount',
        message: `refundAmountCents must be > 0 (got ${body.refundAmountCents})`,
      });
    }
    try {
      const input: RefundInput = { orderId: body.orderId };
      if (body.refundAmountCents !== undefined) input.refundAmountCents = body.refundAmountCents;
      if (body.reason !== undefined) input.reason = body.reason;
      const result = await adapter.refundOrder(input);
      return jsonResponse(200, {
        refund: result.refund,
        order: {
          id: result.order.id,
          state: result.order.state,
          amountCents: result.order.amountCents,
        },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (
        message.includes('exceeds invoice') ||
        message.includes('must be paid') ||
        message.includes('not found')
      ) {
        return jsonResponse(409, {
          error: 'illegal_refund',
          message,
        });
      }
      const status = message.includes('KIWA_LEMONSQUEEZY_ENV_MISSING') ? 503 : 500;
      return jsonResponse(status, {
        error: 'refund_failed',
        message,
      });
    }
  };
}

export function createRefundListHandler(
  adapter: LemonSqueezyDogfoodAdapter,
): (req: Request) => Promise<Response> {
  return async function GET(_req: Request): Promise<Response> {
    return jsonResponse(200, { refunds: adapter.listRefunds() });
  };
}

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}
