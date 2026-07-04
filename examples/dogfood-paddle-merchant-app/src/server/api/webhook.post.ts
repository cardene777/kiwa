/**
 * Nuxt 3 server route for `POST /api/webhook`.
 *
 * Mirrors a real Paddle Billing webhook endpoint. The handler expects the
 * raw body (Paddle requires the untouched bytes for `Paddle-Signature`
 * verification) + a `Paddle-Signature: ts=..;h1=..` header. The adapter
 * runs `verifyWebhook` on the pair and, on success, emits the event
 * through its dispatcher so downstream subscription / transaction mutations
 * run.
 *
 * Response shape (JSON) —
 *   200 { ok: true, eventId, eventType, dispatched, effect? }
 *   400 { error: 'invalid_signature' | 'stale_timestamp' | 'malformed_body' }
 *   500 { error: 'webhook_failed', message }
 *
 * Real Paddle returns 200 on any handled event (even ones the RP does not
 * care about) so the retry queue can move on — the mock mirrors that
 * behaviour.
 */

import type { PaddleBillingAdapter } from '../../adapters/interface.js';

export interface WebhookRouteResponse {
  ok: boolean;
  eventId?: string;
  eventType?: string;
  dispatched?: boolean;
  effect?: {
    kind: 'subscription' | 'transaction' | 'checkout' | 'tax' | 'dunning';
    entityId: string;
    newState?: string | undefined;
  };
}

/**
 * Build a `POST` handler bound to a specific {@link PaddleBillingAdapter}
 * instance. The Nuxt 3 server route entry point wires this up as
 * `export default createWebhookHandler(adapter)`.
 */
export function createWebhookHandler(
  adapter: PaddleBillingAdapter,
): (req: Request) => Promise<Response> {
  return async function POST(req: Request): Promise<Response> {
    // Paddle requires the **raw** body for signature verify — JSON re-encoding
    // after parse would change the byte order in the signed envelope. Read
    // as text and skip the JSON parse.
    let rawBody: string;
    try {
      rawBody = await req.text();
    } catch (err) {
      return jsonResponse(400, {
        error: 'read_failed',
        message: err instanceof Error ? err.message : String(err),
      });
    }
    const signature = req.headers.get('paddle-signature');
    if (!signature) {
      return jsonResponse(400, {
        error: 'missing_signature',
        message: 'Paddle-Signature header is required',
      });
    }

    try {
      const result = await adapter.receiveWebhook({ rawBody, signature });
      if (!result.verify.ok || !result.verify.event) {
        // Real Paddle treats bad-signature / stale-timestamp as 400 so their
        // retry queue can distinguish "reject" from "5xx retry".
        return jsonResponse(400, {
          error: 'webhook_rejected',
          message: `signature verify failed: ${result.verify.reason}`,
        });
      }
      const response: WebhookRouteResponse = {
        ok: true,
        eventId: result.verify.event.id,
        eventType: result.verify.event.type,
        dispatched: result.dispatched,
      };
      if (result.effect) response.effect = result.effect;
      return jsonResponse(200, response);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const status = message.includes('KIWA_PADDLE_ENV_MISSING') ? 503 : 500;
      return jsonResponse(status, {
        error: 'webhook_failed',
        message,
      });
    }
  };
}

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}
