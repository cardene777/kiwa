/**
 * Mock adapter for the Paddle Billing v2 subscription dogfood app.
 *
 * Wraps `@kiwa/payment`'s `createPaddleMock()` plus the subscription
 * runtime so tests exercise deterministic subscription ids, trial arithmetic,
 * proration deltas, retention offer flows, coupon stacking, refund window
 * enforcement, and Paddle-style webhook signing without touching the real
 * Paddle API.
 */

import { createPaddleMock } from '@kiwa/payment';
import type {
  PaddleSubscriptionAdapter,
  TraceEvent,
  WebhookReceiveResult,
} from './interface.js';
import {
  createSubscriptionRuntime,
  type SubscriptionRuntime,
} from '../lib/subscription-runtime.js';

export interface MakeMockAdapterOptions {
  secret?: string;
  toleranceMs?: number;
  now?: () => number;
}

/**
 * Map runtime-layer rejections to stable trace `errorKind` values. The tests
 * assert on these exact strings so the classification lives in one place.
 */
function classifyError(err: unknown, op: TraceEvent['op']): string {
  const reason =
    typeof err === 'object' &&
    err !== null &&
    'reason' in err &&
    typeof (err as { reason?: unknown }).reason === 'string'
      ? (err as { reason: string }).reason
      : undefined;
  if (reason) return reason;

  const message = err instanceof Error ? err.message : String(err);
  if (message.includes('KIWA_PADDLE_ENV_MISSING')) return 'KIWA_PADDLE_ENV_MISSING';
  if (message.includes('duplicate email')) return 'duplicate_email';
  if (message.includes('not found')) return 'entity_not_found';
  return `${op}_failed`;
}

/**
 * Build a mock adapter satisfying {@link PaddleSubscriptionAdapter}. The
 * runtime owns subscription behaviour; the adapter adds ordered trace capture
 * and the webhook verify/dispatch surface the route handlers use.
 */
export function makeMockAdapter(opts: MakeMockAdapterOptions = {}): PaddleSubscriptionAdapter & {
  readonly runtime: () => SubscriptionRuntime;
} {
  const trace: TraceEvent[] = [];
  const paymentAdapter = createPaddleMock({
    ...(opts.secret !== undefined ? { secret: opts.secret } : {}),
    ...(opts.toleranceMs !== undefined ? { toleranceMs: opts.toleranceMs } : {}),
    ...(opts.now !== undefined ? { now: opts.now } : {}),
  });
  const runtime = createSubscriptionRuntime(paymentAdapter, {
    ...(opts.now !== undefined ? { now: opts.now } : {}),
  });
  const handledEventTypes = new Set([
    'customer.created',
    'subscription.created',
    'subscription.updated',
    'subscription.paused',
    'subscription.resumed',
    'subscription.canceled',
    'subscription.past_due',
    'subscription.trial_extended',
    'subscription.retention_offered',
    'subscription.retention_accepted',
    'subscription.activated',
    'subscription.refund_granted',
    'subscription.refund_denied',
    'transaction.updated',
    'discount.updated',
  ]);

  function record(op: TraceEvent['op'], ok: boolean, extra?: Partial<TraceEvent>): void {
    const entry: TraceEvent = { op, ok };
    if (extra?.errorKind !== undefined) entry.errorKind = extra.errorKind;
    if (extra?.detail !== undefined) entry.detail = extra.detail;
    trace.push(entry);
  }

  function recordList(op: TraceEvent['op'], count: number): void {
    record(op, true, { detail: { count } });
  }

  return {
    mode: 'mock',
    traces: () => [...trace],
    runtime: () => runtime,

    async createCustomer(input) {
      try {
        const customer = await runtime.createCustomer(input);
        record('createCustomer', true, { detail: { customerId: customer.id } });
        return customer;
      } catch (err) {
        record('createCustomer', false, { errorKind: classifyError(err, 'createCustomer') });
        throw err;
      }
    },

    async getCustomer(id) {
      try {
        const customer = await runtime.getCustomer(id);
        record('getCustomer', true, { detail: { customerId: customer.id } });
        return customer;
      } catch (err) {
        record('getCustomer', false, { errorKind: classifyError(err, 'getCustomer') });
        throw err;
      }
    },

    listCustomers() {
      const customers = runtime.listCustomers();
      recordList('listCustomers', customers.length);
      return customers;
    },

    async createSubscription(input) {
      try {
        const subscription = await runtime.createSubscription(input);
        record('createSubscription', true, {
          detail: { subscriptionId: subscription.id, status: subscription.status },
        });
        return subscription;
      } catch (err) {
        record('createSubscription', false, {
          errorKind: classifyError(err, 'createSubscription'),
        });
        throw err;
      }
    },

    async extendTrial(input) {
      try {
        const subscription = await runtime.extendTrial(input);
        record('extendTrial', true, {
          detail: { subscriptionId: subscription.id, trialEndsAt: subscription.trialEndsAt },
        });
        return subscription;
      } catch (err) {
        record('extendTrial', false, { errorKind: classifyError(err, 'extendTrial') });
        throw err;
      }
    },

    async activateSubscription(subscriptionId) {
      try {
        const subscription = await runtime.activateSubscription(subscriptionId);
        record('activateSubscription', true, { detail: { subscriptionId } });
        return subscription;
      } catch (err) {
        record('activateSubscription', false, {
          errorKind: classifyError(err, 'activateSubscription'),
        });
        throw err;
      }
    },

    async cancelSubscription(subscriptionId) {
      try {
        const subscription = await runtime.cancelSubscription(subscriptionId);
        record('cancelSubscription', true, { detail: { subscriptionId } });
        return subscription;
      } catch (err) {
        record('cancelSubscription', false, {
          errorKind: classifyError(err, 'cancelSubscription'),
        });
        throw err;
      }
    },

    listSubscriptions(filter) {
      const subscriptions = runtime.listSubscriptions(filter);
      recordList('listSubscriptions', subscriptions.length);
      return subscriptions;
    },

    async applyProration(input) {
      try {
        const proration = await runtime.applyProration(input);
        record('applyProration', true, {
          detail: {
            prorationId: proration.id,
            subscriptionId: proration.subscriptionId,
            deltaCents: proration.deltaCents,
          },
        });
        return proration;
      } catch (err) {
        record('applyProration', false, { errorKind: classifyError(err, 'applyProration') });
        throw err;
      }
    },

    listProrations(filter) {
      const prorations = runtime.listProrations(filter);
      recordList('listProrations', prorations.length);
      return prorations;
    },

    async offerRetention(input) {
      try {
        const offer = await runtime.offerRetention(input);
        record('offerRetention', true, {
          detail: { offerId: offer.id, kind: offer.kind },
        });
        return offer;
      } catch (err) {
        record('offerRetention', false, { errorKind: classifyError(err, 'offerRetention') });
        throw err;
      }
    },

    async acceptRetention(offerId) {
      try {
        const offer = await runtime.acceptRetention(offerId);
        record('acceptRetention', true, { detail: { offerId, kind: offer.kind } });
        return offer;
      } catch (err) {
        record('acceptRetention', false, { errorKind: classifyError(err, 'acceptRetention') });
        throw err;
      }
    },

    listRetentionOffers(filter) {
      const offers = runtime.listRetentionOffers(filter);
      recordList('listRetentionOffers', offers.length);
      return offers;
    },

    async stackCoupon(input) {
      try {
        const stack = await runtime.stackCoupon(input);
        record('stackCoupon', true, {
          detail: {
            subscriptionId: stack.subscriptionId,
            code: input.code,
            totalPercentOff: stack.totalPercentOff,
          },
        });
        return stack;
      } catch (err) {
        record('stackCoupon', false, { errorKind: classifyError(err, 'stackCoupon') });
        throw err;
      }
    },

    listCouponStacks(filter) {
      const stacks = runtime.listCouponStacks(filter);
      recordList('listCouponStacks', stacks.length);
      return stacks;
    },

    async requestRefund(input) {
      try {
        const refund = await runtime.requestRefund(input);
        record('requestRefund', true, {
          detail: { refundId: refund.id, status: refund.status },
        });
        return refund;
      } catch (err) {
        record('requestRefund', false, { errorKind: classifyError(err, 'requestRefund') });
        throw err;
      }
    },

    listRefunds(filter) {
      const refunds = runtime.listRefunds(filter);
      recordList('listRefunds', refunds.length);
      return refunds;
    },

    eventsEmitted() {
      return runtime.store.eventsEmitted();
    },

    async receiveWebhook(input): Promise<WebhookReceiveResult> {
      try {
        const verifyInput: Parameters<typeof paymentAdapter.verifyWebhook>[0] = {
          rawBody: input.rawBody,
          signature: input.signature,
        };
        if (input.toleranceMs !== undefined) verifyInput.toleranceMs = input.toleranceMs;
        const verify = paymentAdapter.verifyWebhook(verifyInput);
        if (!verify.ok || !verify.event) {
          record('receiveWebhook', false, {
            errorKind: verify.reason,
            detail: { reason: verify.reason },
          });
          return { verify, dispatched: false };
        }
        const dispatched = handledEventTypes.has(verify.event.type);
        if (dispatched) {
          await paymentAdapter.emit(verify.event);
        }
        record('receiveWebhook', true, {
          detail: { eventId: verify.event.id, eventType: verify.event.type, dispatched },
        });
        return { verify, dispatched };
      } catch (err) {
        record('receiveWebhook', false, { errorKind: classifyError(err, 'receiveWebhook') });
        throw err;
      }
    },

    async reset() {
      runtime.store.reset();
      trace.length = 0;
      record('reset', true);
    },
  };
}
