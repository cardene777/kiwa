/**
 * Next.js 15 App Router-compatible handlers for retention offer + coupon
 * stacking + refund routes.
 *
 * Handlers stay as plain Request/Response functions so tests can drive them
 * directly without a Next.js runtime.
 */

import type {
  PaddleSubscriptionAdapter,
  RetentionOfferKind,
} from '../../adapters/interface.js';

/**
 * Build the `POST /retention/offer` handler.
 */
export function offerRetentionHandler(
  adapter: PaddleSubscriptionAdapter,
): (req: Request) => Promise<Response> {
  return async function POST(req: Request): Promise<Response> {
    if (req.method !== 'POST') return jsonResponse(405, { error: 'method_not_allowed', reason: 'POST required' });
    let body: {
      subscriptionId?: string;
      kind?: RetentionOfferKind;
      pauseDays?: number;
      newPriceId?: string;
      newPlanPriceCents?: number;
      couponCode?: string;
      couponPercentOff?: number;
      createdAtMs?: number;
    };
    try {
      body = (await req.json()) as typeof body;
    } catch {
      return jsonResponse(400, { error: 'invalid_json', reason: 'invalid_json' });
    }
    if (!body.subscriptionId || !body.kind) {
      return jsonResponse(400, { error: 'missing_fields', reason: 'invalid_input' });
    }
    try {
      const offer = await adapter.offerRetention({
        subscriptionId: body.subscriptionId,
        kind: body.kind,
        ...(body.pauseDays !== undefined ? { pauseDays: body.pauseDays } : {}),
        ...(body.newPriceId !== undefined ? { newPriceId: body.newPriceId } : {}),
        ...(body.newPlanPriceCents !== undefined
          ? { newPlanPriceCents: body.newPlanPriceCents }
          : {}),
        ...(body.couponCode !== undefined ? { couponCode: body.couponCode } : {}),
        ...(body.couponPercentOff !== undefined
          ? { couponPercentOff: body.couponPercentOff }
          : {}),
        ...(body.createdAtMs !== undefined ? { createdAtMs: body.createdAtMs } : {}),
      });
      return jsonResponse(200, { offer });
    } catch (err) {
      return routeError(err);
    }
  };
}

/**
 * Build the `POST /retention/accept` handler.
 */
export function acceptRetentionHandler(
  adapter: PaddleSubscriptionAdapter,
): (req: Request) => Promise<Response> {
  return async function POST(req: Request): Promise<Response> {
    if (req.method !== 'POST') return jsonResponse(405, { error: 'method_not_allowed', reason: 'POST required' });
    let body: { offerId?: string };
    try {
      body = (await req.json()) as { offerId?: string };
    } catch {
      return jsonResponse(400, { error: 'invalid_json', reason: 'invalid_json' });
    }
    if (!body.offerId) return jsonResponse(400, { error: 'missing_offer_id', reason: 'invalid_input' });
    try {
      const offer = await adapter.acceptRetention(body.offerId);
      return jsonResponse(200, { offer });
    } catch (err) {
      return routeError(err);
    }
  };
}

/**
 * Build the `GET /retention?subscriptionId=...` handler.
 */
export function listRetentionOffersHandler(
  adapter: PaddleSubscriptionAdapter,
): (req: Request) => Promise<Response> {
  return async function GET(req: Request): Promise<Response> {
    if (req.method !== 'GET') return jsonResponse(405, { error: 'method_not_allowed', reason: 'GET required' });
    const subscriptionId = new URL(req.url).searchParams.get('subscriptionId');
    return jsonResponse(200, {
      offers: adapter.listRetentionOffers(subscriptionId ? { subscriptionId } : undefined),
    });
  };
}

/**
 * Build the `POST /retention/coupon` handler for coupon stacking.
 */
export function stackCouponHandler(
  adapter: PaddleSubscriptionAdapter,
): (req: Request) => Promise<Response> {
  return async function POST(req: Request): Promise<Response> {
    if (req.method !== 'POST') return jsonResponse(405, { error: 'method_not_allowed', reason: 'POST required' });
    let body: {
      subscriptionId?: string;
      code?: string;
      percentOff?: number;
      stackable?: boolean;
      createdAtMs?: number;
    };
    try {
      body = (await req.json()) as typeof body;
    } catch {
      return jsonResponse(400, { error: 'invalid_json', reason: 'invalid_json' });
    }
    if (!body.subscriptionId || !body.code || typeof body.percentOff !== 'number') {
      return jsonResponse(400, { error: 'missing_fields', reason: 'invalid_input' });
    }
    try {
      const stack = await adapter.stackCoupon({
        subscriptionId: body.subscriptionId,
        code: body.code,
        percentOff: body.percentOff,
        ...(body.stackable !== undefined ? { stackable: body.stackable } : {}),
        ...(body.createdAtMs !== undefined ? { createdAtMs: body.createdAtMs } : {}),
      });
      return jsonResponse(200, { stack });
    } catch (err) {
      return routeError(err);
    }
  };
}

/**
 * Build the `POST /retention/refund` handler.
 */
export function requestRefundHandler(
  adapter: PaddleSubscriptionAdapter,
): (req: Request) => Promise<Response> {
  return async function POST(req: Request): Promise<Response> {
    if (req.method !== 'POST') return jsonResponse(405, { error: 'method_not_allowed', reason: 'POST required' });
    let body: {
      subscriptionId?: string;
      requestedAtMs?: number;
      refundWindowDays?: number;
    };
    try {
      body = (await req.json()) as typeof body;
    } catch {
      return jsonResponse(400, { error: 'invalid_json', reason: 'invalid_json' });
    }
    if (!body.subscriptionId || typeof body.requestedAtMs !== 'number') {
      return jsonResponse(400, { error: 'missing_fields', reason: 'invalid_input' });
    }
    try {
      const refund = await adapter.requestRefund({
        subscriptionId: body.subscriptionId,
        requestedAtMs: body.requestedAtMs,
        ...(body.refundWindowDays !== undefined ? { refundWindowDays: body.refundWindowDays } : {}),
      });
      return jsonResponse(200, { refund });
    } catch (err) {
      return routeError(err);
    }
  };
}

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function routeError(err: unknown): Response {
  const reason = getReason(err);
  return jsonResponse(statusFromReason(reason), { error: 'request_failed', reason });
}

function getReason(err: unknown): string {
  if (
    typeof err === 'object' &&
    err !== null &&
    'reason' in err &&
    typeof (err as { reason?: unknown }).reason === 'string'
  ) {
    return (err as { reason: string }).reason;
  }
  return err instanceof Error ? err.message : String(err);
}

function statusFromReason(reason: string): number {
  if (
    reason === 'invalid_input' ||
    reason === 'invalid_pause_days' ||
    reason === 'invalid_downgrade' ||
    reason === 'invalid_coupon_offer' ||
    reason === 'invalid_coupon_percent' ||
    reason === 'invalid_json'
  ) {
    return 400;
  }
  if (reason === 'entity_not_found') return 404;
  if (reason === 'already_accepted' || reason === 'already_canceled') return 409;
  return 500;
}
