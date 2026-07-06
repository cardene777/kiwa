/**
 * Next.js 15 App Router-compatible handlers for marketplace payouts.
 *
 * Seller + referrer transfers are exposed as plain Request/Response handlers
 * so tests can execute them without starting a framework server.
 */

import type { StripeMarketplaceAdapter } from '../../adapters/interface.js';

/**
 * Build the `POST /payout/seller` handler.
 */
export function createSellerTransferHandler(
  adapter: StripeMarketplaceAdapter,
): (req: Request) => Promise<Response> {
  return async function POST(req: Request): Promise<Response> {
    if (req.method !== 'POST') return jsonResponse(405, { error: 'method_not_allowed', reason: 'POST required' });
    let body: {
      accountId?: string;
      chargeId?: string;
      amountCents?: number;
      sourceTransaction?: string;
      createdAtMs?: number;
    };
    try {
      body = (await req.json()) as typeof body;
    } catch {
      return jsonResponse(400, { error: 'invalid_json', reason: 'invalid_json' });
    }
    if (!body.accountId || !body.chargeId || typeof body.amountCents !== 'number') {
      return jsonResponse(400, { error: 'missing_fields', reason: 'invalid_input' });
    }
    try {
      const transfer = await adapter.createSellerTransfer({
        accountId: body.accountId,
        chargeId: body.chargeId,
        amountCents: body.amountCents,
        ...(body.sourceTransaction !== undefined ? { sourceTransaction: body.sourceTransaction } : {}),
        ...(body.createdAtMs !== undefined ? { createdAtMs: body.createdAtMs } : {}),
      });
      return jsonResponse(200, { transfer });
    } catch (err) {
      return routeError(err);
    }
  };
}

/**
 * Build the `POST /payout/referrer` handler.
 */
export function createReferrerTransferHandler(
  adapter: StripeMarketplaceAdapter,
): (req: Request) => Promise<Response> {
  return async function POST(req: Request): Promise<Response> {
    if (req.method !== 'POST') return jsonResponse(405, { error: 'method_not_allowed', reason: 'POST required' });
    let body: {
      accountId?: string;
      chargeId?: string;
      amountCents?: number;
      rateBps?: number;
      sourceTransaction?: string;
      createdAtMs?: number;
    };
    try {
      body = (await req.json()) as typeof body;
    } catch {
      return jsonResponse(400, { error: 'invalid_json', reason: 'invalid_json' });
    }
    if (!body.accountId || !body.chargeId) {
      return jsonResponse(400, { error: 'missing_fields', reason: 'invalid_input' });
    }
    try {
      const transfer = await adapter.createReferrerTransfer({
        accountId: body.accountId,
        chargeId: body.chargeId,
        ...(body.amountCents !== undefined ? { amountCents: body.amountCents } : {}),
        ...(body.rateBps !== undefined ? { rateBps: body.rateBps } : {}),
        ...(body.sourceTransaction !== undefined ? { sourceTransaction: body.sourceTransaction } : {}),
        ...(body.createdAtMs !== undefined ? { createdAtMs: body.createdAtMs } : {}),
      });
      return jsonResponse(200, { transfer });
    } catch (err) {
      return routeError(err);
    }
  };
}

/**
 * Build the `GET /payout?accountId=...` handler.
 */
export function listTransfersHandler(
  adapter: StripeMarketplaceAdapter,
): (req: Request) => Promise<Response> {
  return async function GET(req: Request): Promise<Response> {
    if (req.method !== 'GET') return jsonResponse(405, { error: 'method_not_allowed', reason: 'GET required' });
    const accountId = new URL(req.url).searchParams.get('accountId');
    return jsonResponse(200, {
      transfers: adapter.listTransfers(accountId ? { accountId } : undefined),
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
  if (reason === 'invalid_input' || reason === 'invalid_json') return 400;
  if (reason === 'entity_not_found') return 404;
  if (reason === 'duplicate_email' || reason === 'already_captured') return 409;
  return 500;
}
