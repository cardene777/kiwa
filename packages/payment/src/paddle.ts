import { PaymentEngine } from './engine.js';
import type { PaymentAdapter } from './types.js';

/**
 * Paddle Billing (Paddle v2) webhook mock. Real Paddle: `Paddle-Signature:
 * ts=...;h1=...` over `{ts}:{body}` with HMAC-SHA256, notification secret.
 * Shape difference vs Stripe: Paddle uses `data.attributes.*` instead of
 * `data.object.*`.
 */
export function createPaddleMock(config?: {
  secret?: string;
  toleranceMs?: number;
  now?: () => number;
}): PaymentAdapter {
  return new PaymentEngine({
    provider: 'paddle',
    secret: config?.secret ?? 'pdl_ntfset_kiwa_paddle',
    idPrefix: 'ntf',
    toleranceMs: config?.toleranceMs ?? 5 * 60 * 1000,
    now: config?.now ?? Date.now,
    buildRawBody: (event) =>
      JSON.stringify({
        id: event.id,
        event_type: event.type,
        type: event.type,
        provider: event.provider,
        amountCents: event.amountCents,
        currency: event.currency,
        customerId: event.customerId,
        timestamp: event.timestamp,
        occurred_at: new Date(event.timestamp).toISOString(),
        data: {
          type: 'transaction',
          attributes: {
            customer_id: event.customerId,
            totals: {
              subtotal: `${event.amountCents}`,
              total: `${event.amountCents}`,
              currency_code: event.currency.toUpperCase(),
            },
          },
        },
      }),
  });
}
