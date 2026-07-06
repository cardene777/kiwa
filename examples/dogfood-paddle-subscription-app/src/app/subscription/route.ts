/**
 * Next.js 15 App Router-compatible handlers for Paddle Billing v2
 * subscription lifecycle routes (customer signup + subscription create +
 * activate + cancel + list).
 *
 * The functions stay framework-neutral `(req: Request) => Promise<Response>`
 * so tests can call them directly without booting Next.js.
 */

import type { PaddleSubscriptionAdapter } from '../../adapters/interface.js';

/**
 * Build the `POST /customer` handler that creates a Paddle Billing v2
 * customer and returns the persisted customer snapshot.
 */
export function createCustomerHandler(
  adapter: PaddleSubscriptionAdapter,
): (req: Request) => Promise<Response> {
  return async function POST(req: Request): Promise<Response> {
    if (req.method !== 'POST') return jsonResponse(405, { error: 'method_not_allowed', reason: 'POST required' });
    let body: { email?: string; country?: string };
    try {
      body = (await req.json()) as { email?: string; country?: string };
    } catch {
      return jsonResponse(400, { error: 'invalid_json', reason: 'invalid_json' });
    }
    try {
      const customer = await adapter.createCustomer({
        email: body.email ?? '',
        ...(body.country !== undefined ? { country: body.country } : {}),
      });
      return jsonResponse(200, { customer });
    } catch (err) {
      return routeError(err);
    }
  };
}

/**
 * Build the `GET /customer?customerId=...` handler.
 */
export function getCustomerHandler(
  adapter: PaddleSubscriptionAdapter,
): (req: Request) => Promise<Response> {
  return async function GET(req: Request): Promise<Response> {
    if (req.method !== 'GET') return jsonResponse(405, { error: 'method_not_allowed', reason: 'GET required' });
    const customerId = new URL(req.url).searchParams.get('customerId');
    if (!customerId) return jsonResponse(400, { error: 'missing_customer_id', reason: 'invalid_input' });
    try {
      const customer = await adapter.getCustomer(customerId);
      return jsonResponse(200, { customer });
    } catch (err) {
      return routeError(err);
    }
  };
}

/**
 * Build the `POST /subscription` handler that creates a subscription for a
 * customer with optional trial + coupon + idempotency support.
 */
export function createSubscriptionHandler(
  adapter: PaddleSubscriptionAdapter,
): (req: Request) => Promise<Response> {
  return async function POST(req: Request): Promise<Response> {
    if (req.method !== 'POST') return jsonResponse(405, { error: 'method_not_allowed', reason: 'POST required' });
    let body: {
      customerId?: string;
      priceId?: string;
      planPriceCents?: number;
      currency?: string;
      trialDays?: number;
      couponCode?: string;
      idempotencyKey?: string;
      createdAtMs?: number;
    };
    try {
      body = (await req.json()) as typeof body;
    } catch {
      return jsonResponse(400, { error: 'invalid_json', reason: 'invalid_json' });
    }
    if (!body.customerId || !body.priceId || typeof body.planPriceCents !== 'number') {
      return jsonResponse(400, { error: 'missing_fields', reason: 'invalid_input' });
    }
    try {
      const subscription = await adapter.createSubscription({
        customerId: body.customerId,
        priceId: body.priceId,
        planPriceCents: body.planPriceCents,
        ...(body.currency !== undefined ? { currency: body.currency } : {}),
        ...(body.trialDays !== undefined ? { trialDays: body.trialDays } : {}),
        ...(body.couponCode !== undefined ? { couponCode: body.couponCode } : {}),
        ...(body.idempotencyKey !== undefined ? { idempotencyKey: body.idempotencyKey } : {}),
        ...(body.createdAtMs !== undefined ? { createdAtMs: body.createdAtMs } : {}),
      });
      return jsonResponse(200, { subscription });
    } catch (err) {
      return routeError(err);
    }
  };
}

/**
 * Build the `POST /subscription/activate` handler.
 */
export function activateSubscriptionHandler(
  adapter: PaddleSubscriptionAdapter,
): (req: Request) => Promise<Response> {
  return async function POST(req: Request): Promise<Response> {
    if (req.method !== 'POST') return jsonResponse(405, { error: 'method_not_allowed', reason: 'POST required' });
    let body: { subscriptionId?: string };
    try {
      body = (await req.json()) as { subscriptionId?: string };
    } catch {
      return jsonResponse(400, { error: 'invalid_json', reason: 'invalid_json' });
    }
    if (!body.subscriptionId) return jsonResponse(400, { error: 'missing_subscription_id', reason: 'invalid_input' });
    try {
      const subscription = await adapter.activateSubscription(body.subscriptionId);
      return jsonResponse(200, { subscription });
    } catch (err) {
      return routeError(err);
    }
  };
}

/**
 * Build the `POST /subscription/cancel` handler.
 */
export function cancelSubscriptionHandler(
  adapter: PaddleSubscriptionAdapter,
): (req: Request) => Promise<Response> {
  return async function POST(req: Request): Promise<Response> {
    if (req.method !== 'POST') return jsonResponse(405, { error: 'method_not_allowed', reason: 'POST required' });
    let body: { subscriptionId?: string };
    try {
      body = (await req.json()) as { subscriptionId?: string };
    } catch {
      return jsonResponse(400, { error: 'invalid_json', reason: 'invalid_json' });
    }
    if (!body.subscriptionId) return jsonResponse(400, { error: 'missing_subscription_id', reason: 'invalid_input' });
    try {
      const subscription = await adapter.cancelSubscription(body.subscriptionId);
      return jsonResponse(200, { subscription });
    } catch (err) {
      return routeError(err);
    }
  };
}

/**
 * Build the `GET /subscription?customerId=...` handler.
 */
export function listSubscriptionsHandler(
  adapter: PaddleSubscriptionAdapter,
): (req: Request) => Promise<Response> {
  return async function GET(req: Request): Promise<Response> {
    if (req.method !== 'GET') return jsonResponse(405, { error: 'method_not_allowed', reason: 'GET required' });
    const customerId = new URL(req.url).searchParams.get('customerId');
    return jsonResponse(200, {
      subscriptions: adapter.listSubscriptions(customerId ? { customerId } : undefined),
    });
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
    reason === 'invalid_amount' ||
    reason === 'invalid_json'
  ) {
    return 400;
  }
  if (reason === 'entity_not_found') return 404;
  if (
    reason === 'duplicate_email' ||
    reason === 'already_active' ||
    reason === 'already_canceled'
  ) {
    return 409;
  }
  return 500;
}
