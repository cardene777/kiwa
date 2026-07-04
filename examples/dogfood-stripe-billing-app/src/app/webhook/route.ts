/**
 * Next.js 15 App Router route handler for `POST /webhook`.
 *
 * Mirrors a real Stripe webhook endpoint. The handler expects the raw body
 * (Stripe requires the untouched bytes for signature verification) + a
 * `Stripe-Signature` header. The adapter runs `verifyWebhook` on the pair
 * and, on success, emits the event through its dispatcher so downstream
 * subscription / invoice mutations run.
 *
 * Response shape (JSON) —
 *   200 { ok: true, eventId, eventType, dispatched, effect? }
 *   400 { error: 'invalid_signature' | 'stale_timestamp' | 'malformed_body' }
 *   500 { error: 'webhook_failed', message }
 *
 * Real Stripe returns 200 on any handled event (even ones the RP does not
 * care about) so the retry queue can move on — the mock mirrors that
 * behaviour.
 */

import type { StripeBillingAdapter } from '../../adapters/interface.js';

export interface WebhookRouteResponse {
  ok: boolean;
  eventId?: string;
  eventType?: string;
  dispatched?: boolean;
  effect?: {
    kind: 'subscription' | 'invoice' | 'checkout' | '3ds' | 'dunning';
    entityId: string;
    newState?: string | undefined;
  };
}

/**
 * Build a `POST` handler bound to a specific {@link StripeBillingAdapter}
 * instance. The Next.js 15 App Router entry point wires this up as
 * `export const POST = createWebhookHandler(adapter)`.
 */
export function createWebhookHandler(
  adapter: StripeBillingAdapter,
): (req: Request) => Promise<Response> {
  return async function POST(req: Request): Promise<Response> {
    // WebAuthn / Stripe both require the **raw** body for signature verify —
    // JSON re-encoding after parse would change the byte order in the signed
    // envelope. Read as text and skip the JSON parse.
    let rawBody: string;
    try {
      rawBody = await req.text();
    } catch (err) {
      return jsonResponse(400, {
        error: 'read_failed',
        message: err instanceof Error ? err.message : String(err),
      });
    }
    const signature = req.headers.get('stripe-signature');
    if (!signature) {
      return jsonResponse(400, {
        error: 'missing_signature',
        message: 'Stripe-Signature header is required',
      });
    }

    try {
      const result = await adapter.receiveWebhook({ rawBody, signature });
      if (!result.verify.ok || !result.verify.event) {
        // Real Stripe treats bad-signature / stale-timestamp as 400 so their
        // retry queue can distinguish "reject" from "5xx retry".
        const status = result.verify.reason === 'malformed-body' ? 400 : 400;
        return jsonResponse(status, {
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
      const status = message.includes('KIWA_STRIPE_ENV_MISSING') ? 503 : 500;
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
