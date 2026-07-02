import type { PaymentAdapter, PaymentWebhookEvent } from './types.js';

/**
 * Common fixture builders for the 3 provider mocks. Each fixture returns
 * an already-signed webhook (rawBody + signature + parsed event) so tests
 * can either pass the rawBody + signature into `verifyWebhook` or hand
 * the event directly to `emit`.
 *
 * Only high-frequency event types are covered here — for provider-specific
 * event types, call `signWebhook({ type: '...', ... })` directly.
 */
export const checkoutCompleted = (
  adapter: PaymentAdapter,
  input: { amountCents: number; currency?: string; customerId: string },
): { rawBody: string; signature: string; event: PaymentWebhookEvent } =>
  adapter.signWebhook({
    type: 'checkout.completed',
    amountCents: input.amountCents,
    customerId: input.customerId,
    ...(input.currency !== undefined ? { currency: input.currency } : {}),
  });

export const subscriptionCreated = (
  adapter: PaymentAdapter,
  input: { amountCents: number; currency?: string; customerId: string },
): { rawBody: string; signature: string; event: PaymentWebhookEvent } =>
  adapter.signWebhook({
    type: 'subscription.created',
    amountCents: input.amountCents,
    customerId: input.customerId,
    ...(input.currency !== undefined ? { currency: input.currency } : {}),
  });

export const paymentFailed = (
  adapter: PaymentAdapter,
  input: { amountCents: number; currency?: string; customerId: string },
): { rawBody: string; signature: string; event: PaymentWebhookEvent } =>
  adapter.signWebhook({
    type: 'payment.failed',
    amountCents: input.amountCents,
    customerId: input.customerId,
    ...(input.currency !== undefined ? { currency: input.currency } : {}),
  });

export const refunded = (
  adapter: PaymentAdapter,
  input: { amountCents: number; currency?: string; customerId: string },
): { rawBody: string; signature: string; event: PaymentWebhookEvent } =>
  adapter.signWebhook({
    type: 'refunded',
    amountCents: -Math.abs(input.amountCents),
    customerId: input.customerId,
    ...(input.currency !== undefined ? { currency: input.currency } : {}),
  });
