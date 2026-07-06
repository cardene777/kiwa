/**
 * Next.js 15 App Router-compatible handlers for marketplace Connect routes.
 *
 * The functions stay framework-neutral `(req: Request) => Promise<Response>`
 * so tests can call them directly without booting Next.js.
 */

import type { StripeMarketplaceAdapter } from '../../adapters/interface.js';

/**
 * Build the `POST /connect` handler that creates a Stripe Connect Express
 * account and returns the persisted account snapshot.
 */
export function createExpressAccountHandler(
  adapter: StripeMarketplaceAdapter,
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
      const account = await adapter.createExpressAccount({
        email: body.email ?? '',
        ...(body.country !== undefined ? { country: body.country } : {}),
      });
      return jsonResponse(200, { account });
    } catch (err) {
      return routeError(err);
    }
  };
}

/**
 * Build the `GET /connect/onboarding?accountId=...` handler.
 */
export function getOnboardingLinkHandler(
  adapter: StripeMarketplaceAdapter,
): (req: Request) => Promise<Response> {
  return async function GET(req: Request): Promise<Response> {
    if (req.method !== 'GET') return jsonResponse(405, { error: 'method_not_allowed', reason: 'GET required' });
    const accountId = new URL(req.url).searchParams.get('accountId');
    if (!accountId) return jsonResponse(400, { error: 'missing_account_id', reason: 'invalid_input' });
    try {
      const link = await adapter.getOnboardingLink(accountId);
      return jsonResponse(200, link);
    } catch (err) {
      return routeError(err);
    }
  };
}

/**
 * Build the `GET /connect/status?accountId=...` handler.
 */
export function getAccountStatusHandler(
  adapter: StripeMarketplaceAdapter,
): (req: Request) => Promise<Response> {
  return async function GET(req: Request): Promise<Response> {
    if (req.method !== 'GET') return jsonResponse(405, { error: 'method_not_allowed', reason: 'GET required' });
    const accountId = new URL(req.url).searchParams.get('accountId');
    if (!accountId) return jsonResponse(400, { error: 'missing_account_id', reason: 'invalid_input' });
    try {
      const account = await adapter.getAccountStatus(accountId);
      return jsonResponse(200, { account });
    } catch (err) {
      return routeError(err);
    }
  };
}

/**
 * Build the `GET /connect/accounts` handler that lists all seller accounts in
 * insertion order.
 */
export function listAccountsHandler(
  adapter: StripeMarketplaceAdapter,
): (req: Request) => Promise<Response> {
  return async function GET(req: Request): Promise<Response> {
    if (req.method !== 'GET') return jsonResponse(405, { error: 'method_not_allowed', reason: 'GET required' });
    try {
      return jsonResponse(200, { accounts: adapter.listAccounts() });
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
  if (reason === 'invalid_input' || reason === 'invalid_json') return 400;
  if (reason === 'entity_not_found') return 404;
  if (reason === 'duplicate_email' || reason === 'already_captured') return 409;
  return 500;
}
