/**
 * Nuxt 3 server route for `GET /api/tax`.
 *
 * Returns every persisted tax calculation record — the tax UI renders
 * these as the audit trail per customer / jurisdiction. Real Paddle
 * Merchant-of-Record handles tax internally; the dogfood app surfaces the
 * intermediate line calculations so the harness can compare fidelity.
 */

import type { PaddleBillingAdapter } from '../../adapters/interface.js';

export function createTaxListHandler(
  adapter: PaddleBillingAdapter,
): (req: Request) => Promise<Response> {
  return async function GET(_req: Request): Promise<Response> {
    const records = adapter.listTaxRecords();
    return jsonResponse(200, { records });
  };
}

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}
