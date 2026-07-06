/**
 * Next.js 15 App Router-compatible handlers for proration routes.
 *
 * Mid-cycle plan changes are exposed as plain Request/Response handlers so
 * tests can execute them without starting a framework server.
 */

import type { PaddleSubscriptionAdapter } from '../../adapters/interface.js';

/**
 * Build the `POST /proration` handler.
 */
export function applyProrationHandler(
  adapter: PaddleSubscriptionAdapter,
): (req: Request) => Promise<Response> {
  return async function POST(req: Request): Promise<Response> {
    if (req.method !== 'POST') return jsonResponse(405, { error: 'method_not_allowed', reason: 'POST required' });
    let body: {
      subscriptionId?: string;
      newPriceId?: string;
      newPlanPriceCents?: number;
      daysElapsed?: number;
      daysInCycle?: number;
      createdAtMs?: number;
    };
    try {
      body = (await req.json()) as typeof body;
    } catch {
      return jsonResponse(400, { error: 'invalid_json', reason: 'invalid_json' });
    }
    if (
      !body.subscriptionId ||
      !body.newPriceId ||
      typeof body.newPlanPriceCents !== 'number' ||
      typeof body.daysElapsed !== 'number' ||
      typeof body.daysInCycle !== 'number'
    ) {
      return jsonResponse(400, { error: 'missing_fields', reason: 'invalid_input' });
    }
    try {
      const proration = await adapter.applyProration({
        subscriptionId: body.subscriptionId,
        newPriceId: body.newPriceId,
        newPlanPriceCents: body.newPlanPriceCents,
        daysElapsed: body.daysElapsed,
        daysInCycle: body.daysInCycle,
        ...(body.createdAtMs !== undefined ? { createdAtMs: body.createdAtMs } : {}),
      });
      return jsonResponse(200, { proration });
    } catch (err) {
      return routeError(err);
    }
  };
}

/**
 * Build the `GET /proration?subscriptionId=...` handler.
 */
export function listProrationsHandler(
  adapter: PaddleSubscriptionAdapter,
): (req: Request) => Promise<Response> {
  return async function GET(req: Request): Promise<Response> {
    if (req.method !== 'GET') return jsonResponse(405, { error: 'method_not_allowed', reason: 'GET required' });
    const subscriptionId = new URL(req.url).searchParams.get('subscriptionId');
    return jsonResponse(200, {
      prorations: adapter.listProrations(subscriptionId ? { subscriptionId } : undefined),
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
    reason === 'invalid_cycle' ||
    reason === 'invalid_elapsed' ||
    reason === 'invalid_json'
  ) {
    return 400;
  }
  if (reason === 'entity_not_found') return 404;
  if (reason === 'already_canceled') return 409;
  return 500;
}
