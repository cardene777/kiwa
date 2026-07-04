/**
 * Nuxt 3 server route for `GET /api/subscription`.
 *
 * Returns every persisted subscription — the merchant dashboard uses this
 * to render the tier upgrade/downgrade UI. Real Paddle paginates via
 * `?after=...`; the mock returns everything.
 */

import type { PaddleBillingAdapter } from '../../adapters/interface.js';

export function createSubscriptionListHandler(
  adapter: PaddleBillingAdapter,
): (req: Request) => Promise<Response> {
  return async function GET(_req: Request): Promise<Response> {
    const subs = adapter.listSubscriptions();
    return jsonResponse(200, { subscriptions: subs });
  };
}

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}
