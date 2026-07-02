import { PaymentEngine } from './engine.js';
import type { PaymentAdapter } from './types.js';

/**
 * Stripe webhook mock. Real Stripe: `Stripe-Signature: t={ts},v1={sig}`
 * over `{ts}.{body}`, secret from `whsec_*`. This mock exercises the
 * same HMAC-SHA256 signing so tests that verify with the real Stripe
 * SDK can run against this fixture.
 */
export function createStripeMock(config?: {
  secret?: string;
  toleranceMs?: number;
  now?: () => number;
}): PaymentAdapter {
  return new PaymentEngine({
    provider: 'stripe',
    secret: config?.secret ?? 'whsec_kiwa_stripe',
    idPrefix: 'evt',
    toleranceMs: config?.toleranceMs ?? 5 * 60 * 1000,
    now: config?.now ?? Date.now,
    buildRawBody: (event) =>
      JSON.stringify({
        id: event.id,
        object: 'event',
        type: event.type,
        provider: event.provider,
        amountCents: event.amountCents,
        currency: event.currency,
        customerId: event.customerId,
        timestamp: event.timestamp,
        data: {
          object: {
            id: event.customerId,
            amount: event.amountCents,
            currency: event.currency,
          },
        },
      }),
  });
}
