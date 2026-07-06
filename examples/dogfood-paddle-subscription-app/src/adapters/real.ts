/**
 * Env-gated real adapter skeleton for the Paddle Billing v2 subscription
 * dogfood app.
 *
 * The real Paddle Billing v2 wiring is not shipped in this sub-issue. Instead
 * the adapter detects whether the required env contract is present and, until
 * then, throws `KIWA_PADDLE_ENV_MISSING` on write operations while returning
 * empty snapshots for list-style reads so the fidelity harness can still
 * drive both modes uniformly.
 */

import type {
  PaddleSubscriptionAdapter,
  TraceEvent,
  WebhookReceiveResult,
} from './interface.js';

const MISSING_ENV_ERROR = 'KIWA_PADDLE_ENV_MISSING';

/**
 * Report whether the current process can talk to the future real Paddle
 * Billing v2 driver. `null` means the env is complete; any string means the
 * adapter must stay in the env-missing skeleton path.
 */
export function detectRealEnvMissing(): string | null {
  if (process.env['KIWA_MODE'] !== 'real') return 'KIWA_MODE not real';
  if (!process.env['PADDLE_API_KEY']) return 'PADDLE_API_KEY unset';
  if (process.env['KIWA_PADDLE_REAL_READY'] !== '1') return 'KIWA_PADDLE_REAL_READY not 1';
  return null;
}

/**
 * Build the real adapter skeleton. Reads return empty lists with trace
 * records; writes fail loudly until the true driver lands.
 */
export function makeRealAdapter(): PaddleSubscriptionAdapter {
  const trace: TraceEvent[] = [];

  function record(op: TraceEvent['op'], ok: boolean, extra?: Partial<TraceEvent>): void {
    const entry: TraceEvent = { op, ok };
    if (extra?.errorKind !== undefined) entry.errorKind = extra.errorKind;
    if (extra?.detail !== undefined) entry.detail = extra.detail;
    trace.push(entry);
  }

  function envError(op: TraceEvent['op']): Error {
    const reason = detectRealEnvMissing() ?? MISSING_ENV_ERROR;
    record(op, false, { errorKind: MISSING_ENV_ERROR, detail: { reason } });
    return new Error(`makeRealAdapter.${op}: ${MISSING_ENV_ERROR}`);
  }

  return {
    mode: 'real',
    traces: () => [...trace],

    async createCustomer(_input) {
      throw envError('createCustomer');
    },
    async getCustomer(_id) {
      throw envError('getCustomer');
    },
    listCustomers() {
      record('listCustomers', true, { detail: { count: 0 } });
      return [];
    },

    async createSubscription(_input) {
      throw envError('createSubscription');
    },
    async extendTrial(_input) {
      throw envError('extendTrial');
    },
    async activateSubscription(_subscriptionId) {
      throw envError('activateSubscription');
    },
    async cancelSubscription(_subscriptionId) {
      throw envError('cancelSubscription');
    },
    listSubscriptions() {
      record('listSubscriptions', true, { detail: { count: 0 } });
      return [];
    },

    async applyProration(_input) {
      throw envError('applyProration');
    },
    listProrations() {
      record('listProrations', true, { detail: { count: 0 } });
      return [];
    },

    async offerRetention(_input) {
      throw envError('offerRetention');
    },
    async acceptRetention(_offerId) {
      throw envError('acceptRetention');
    },
    listRetentionOffers() {
      record('listRetentionOffers', true, { detail: { count: 0 } });
      return [];
    },

    async stackCoupon(_input) {
      throw envError('stackCoupon');
    },
    listCouponStacks() {
      record('listCouponStacks', true, { detail: { count: 0 } });
      return [];
    },

    async requestRefund(_input) {
      throw envError('requestRefund');
    },
    listRefunds() {
      record('listRefunds', true, { detail: { count: 0 } });
      return [];
    },

    eventsEmitted() {
      return [];
    },

    async receiveWebhook(_input): Promise<WebhookReceiveResult> {
      throw envError('receiveWebhook');
    },

    async reset() {
      trace.length = 0;
      record('reset', true);
    },
  };
}
