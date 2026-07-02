import { PaymentEngine } from './engine.js';
import type { PaymentAdapter } from './types.js';

/**
 * Lemon Squeezy webhook mock. Real Lemon Squeezy: `X-Signature:
 * hmac_sha256({body})` (no timestamp mixed in — LS signs the raw body
 * only, verified against a webhook secret). The mock still adds a
 * timestamp for freshness checks so tests can exercise stale rejection.
 */
export function createLemonSqueezyMock(config?: {
  secret?: string;
  toleranceMs?: number;
  now?: () => number;
}): PaymentAdapter {
  return new PaymentEngine({
    provider: 'lemonsqueezy',
    secret: config?.secret ?? 'lswhs_kiwa_lemonsqueezy',
    idPrefix: 'ls_evt',
    toleranceMs: config?.toleranceMs ?? 5 * 60 * 1000,
    now: config?.now ?? Date.now,
    buildRawBody: (event) =>
      JSON.stringify({
        id: event.id,
        provider: event.provider,
        meta: {
          event_name: event.type,
          type: event.type,
        },
        type: event.type,
        amountCents: event.amountCents,
        currency: event.currency,
        customerId: event.customerId,
        timestamp: event.timestamp,
        data: {
          type: 'orders',
          id: event.customerId,
          attributes: {
            total: event.amountCents,
            currency: event.currency.toUpperCase(),
            customer_id: event.customerId,
          },
        },
      }),
  });
}
