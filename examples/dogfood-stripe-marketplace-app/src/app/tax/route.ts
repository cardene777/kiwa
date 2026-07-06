/**
 * Next.js 15 App Router-compatible handlers for marketplace tax reports.
 *
 * Handlers are pure Request/Response functions so the tests can drive them
 * directly and still mirror Next.js 15 route signatures.
 */

import type { StripeMarketplaceAdapter } from '../../adapters/interface.js';

/**
 * Build the `POST /tax/1099k` handler.
 */
export function generateTaxReport1099KHandler(
  adapter: StripeMarketplaceAdapter,
): (req: Request) => Promise<Response> {
  return async function POST(req: Request): Promise<Response> {
    if (req.method !== 'POST') return jsonResponse(405, { error: 'method_not_allowed', reason: 'POST required' });
    let body: { accountId?: string; year?: number };
    try {
      body = (await req.json()) as { accountId?: string; year?: number };
    } catch {
      return jsonResponse(400, { error: 'invalid_json', reason: 'invalid_json' });
    }
    if (!body.accountId || typeof body.year !== 'number') {
      return jsonResponse(400, { error: 'missing_fields', reason: 'invalid_input' });
    }
    try {
      const report = await adapter.generateTaxReport1099K({
        accountId: body.accountId,
        year: body.year,
      });
      return jsonResponse(200, { report });
    } catch (err) {
      return routeError(err);
    }
  };
}

/**
 * Build the `POST /tax/dac7` handler.
 */
export function generateTaxReportDAC7Handler(
  adapter: StripeMarketplaceAdapter,
): (req: Request) => Promise<Response> {
  return async function POST(req: Request): Promise<Response> {
    if (req.method !== 'POST') return jsonResponse(405, { error: 'method_not_allowed', reason: 'POST required' });
    let body: {
      accountId?: string;
      year?: number;
      sellerName?: string;
      tin?: string;
      address?: string;
      bankAccount?: string;
      country?: string;
    };
    try {
      body = (await req.json()) as typeof body;
    } catch {
      return jsonResponse(400, { error: 'invalid_json', reason: 'invalid_json' });
    }
    if (!body.accountId || typeof body.year !== 'number' || !body.sellerName || !body.tin || !body.address || !body.bankAccount || !body.country) {
      return jsonResponse(400, { error: 'missing_fields', reason: 'invalid_input' });
    }
    try {
      const report = await adapter.generateTaxReportDAC7({
        accountId: body.accountId,
        year: body.year,
        sellerName: body.sellerName,
        tin: body.tin,
        address: body.address,
        bankAccount: body.bankAccount,
        country: body.country,
      });
      return jsonResponse(200, { report });
    } catch (err) {
      return routeError(err);
    }
  };
}

/**
 * Build the `GET /tax?accountId=...` handler.
 */
export function listTaxReportsHandler(
  adapter: StripeMarketplaceAdapter,
): (req: Request) => Promise<Response> {
  return async function GET(req: Request): Promise<Response> {
    if (req.method !== 'GET') return jsonResponse(405, { error: 'method_not_allowed', reason: 'GET required' });
    const accountId = new URL(req.url).searchParams.get('accountId');
    return jsonResponse(200, {
      reports: adapter.listTaxReports(accountId ? { accountId } : undefined),
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
