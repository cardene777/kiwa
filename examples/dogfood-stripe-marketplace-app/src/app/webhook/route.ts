/**
 * Next.js 15 App Router-compatible handler for `POST /webhook`.
 *
 * Mirrors a Stripe webhook endpoint: reads the raw body, verifies the
 * `Stripe-Signature` header through the adapter, and dispatches known
 * marketplace events into the runtime event log.
 */

import type { StripeMarketplaceAdapter } from '../../adapters/interface.js';

/**
 * Build the `POST /webhook` handler bound to a specific marketplace adapter.
 */
export function createWebhookHandler(
  adapter: StripeMarketplaceAdapter,
): (req: Request) => Promise<Response> {
  return async function POST(req: Request): Promise<Response> {
    if (req.method !== 'POST') return jsonResponse(405, { error: 'method_not_allowed', reason: 'POST required' });

    let rawBody: string;
    try {
      rawBody = await req.text();
    } catch {
      return jsonResponse(400, { error: 'read_failed', reason: 'invalid_input' });
    }
    const signature = req.headers.get('stripe-signature');
    if (!signature) {
      return jsonResponse(400, { error: 'missing_signature', reason: 'invalid_input' });
    }

    try {
      const result = await adapter.receiveWebhook({ rawBody, signature });
      if (!result.verify.ok || !result.verify.event) {
        return jsonResponse(400, { error: 'webhook_rejected', reason: result.verify.reason });
      }
      return jsonResponse(200, {
        ok: true,
        eventId: result.verify.event.id,
        eventType: result.verify.event.type,
        dispatched: result.dispatched,
      });
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      return jsonResponse(500, { error: 'webhook_failed', reason });
    }
  };
}

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}
