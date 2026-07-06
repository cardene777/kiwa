/**
 * Next.js 15 App Router-compatible handlers for destination charges.
 *
 * These stay as plain Request/Response functions so tests can drive them
 * directly without a Next.js runtime.
 */

import type { StripeMarketplaceAdapter } from '../../adapters/interface.js';

/**
 * Build the `POST /charge` handler for destination charges.
 */
export function createDestinationChargeHandler(
  adapter: StripeMarketplaceAdapter,
): (req: Request) => Promise<Response> {
  return async function POST(req: Request): Promise<Response> {
    if (req.method !== 'POST') return jsonResponse(405, { error: 'method_not_allowed', reason: 'POST required' });
    let body: {
      customerId?: string;
      accountId?: string;
      amountCents?: number;
      applicationFeeCents?: number;
      currency?: string;
      captureMethod?: 'automatic' | 'manual';
      idempotencyKey?: string;
      createdAtMs?: number;
    };
    try {
      body = (await req.json()) as typeof body;
    } catch {
      return jsonResponse(400, { error: 'invalid_json', reason: 'invalid_json' });
    }
    if (!body.customerId || !body.accountId || typeof body.amountCents !== 'number' || typeof body.applicationFeeCents !== 'number') {
      return jsonResponse(400, { error: 'missing_fields', reason: 'invalid_input' });
    }
    try {
      const charge = await adapter.createDestinationCharge({
        customerId: body.customerId,
        accountId: body.accountId,
        amountCents: body.amountCents,
        applicationFeeCents: body.applicationFeeCents,
        ...(body.currency !== undefined ? { currency: body.currency } : {}),
        ...(body.captureMethod !== undefined ? { captureMethod: body.captureMethod } : {}),
        ...(body.idempotencyKey !== undefined ? { idempotencyKey: body.idempotencyKey } : {}),
        ...(body.createdAtMs !== undefined ? { createdAtMs: body.createdAtMs } : {}),
      });
      return jsonResponse(200, { charge });
    } catch (err) {
      return routeError(err);
    }
  };
}

/**
 * Build the `POST /charge/capture` handler.
 */
export function captureChargeHandler(
  adapter: StripeMarketplaceAdapter,
): (req: Request) => Promise<Response> {
  return async function POST(req: Request): Promise<Response> {
    if (req.method !== 'POST') return jsonResponse(405, { error: 'method_not_allowed', reason: 'POST required' });
    let body: { chargeId?: string };
    try {
      body = (await req.json()) as { chargeId?: string };
    } catch {
      return jsonResponse(400, { error: 'invalid_json', reason: 'invalid_json' });
    }
    if (!body.chargeId) return jsonResponse(400, { error: 'missing_charge_id', reason: 'invalid_input' });
    try {
      const charge = await adapter.captureCharge(body.chargeId);
      return jsonResponse(200, { charge });
    } catch (err) {
      return routeError(err);
    }
  };
}

/**
 * Build the `GET /charge?accountId=...` handler.
 */
export function listChargesHandler(
  adapter: StripeMarketplaceAdapter,
): (req: Request) => Promise<Response> {
  return async function GET(req: Request): Promise<Response> {
    if (req.method !== 'GET') return jsonResponse(405, { error: 'method_not_allowed', reason: 'GET required' });
    const accountId = new URL(req.url).searchParams.get('accountId');
    return jsonResponse(200, {
      charges: adapter.listCharges(accountId ? { accountId } : undefined),
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
  if (reason === 'invalid_input' || reason === 'invalid_amount' || reason === 'application_fee_exceeds_amount' || reason === 'invalid_json') return 400;
  if (reason === 'entity_not_found') return 404;
  if (reason === 'already_captured') return 409;
  return 500;
}
