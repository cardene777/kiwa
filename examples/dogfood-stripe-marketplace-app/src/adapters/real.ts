/**
 * Env-gated real adapter skeleton for the marketplace dogfood app.
 *
 * The real Stripe Connect wiring is not shipped in this sub-issue. Instead
 * the adapter detects whether the required env contract is present and, until
 * then, throws `KIWA_STRIPE_ENV_MISSING` on write operations while returning
 * empty snapshots for list-style reads so the fidelity harness can still
 * drive both modes uniformly.
 */

import type {
  StripeMarketplaceAdapter,
  TraceEvent,
  WebhookReceiveResult,
} from './interface.js';

const MISSING_ENV_ERROR = 'KIWA_STRIPE_ENV_MISSING';

/**
 * Report whether the current process can talk to the future real Stripe
 * Connect driver. `null` means the env is complete; any string means the
 * adapter must stay in the env-missing skeleton path.
 */
export function detectRealEnvMissing(): string | null {
  if (process.env['KIWA_MODE'] !== 'real') return 'KIWA_MODE not real';
  if (!process.env['STRIPE_SECRET_KEY']) return 'STRIPE_SECRET_KEY unset';
  if (process.env['KIWA_STRIPE_REAL_READY'] !== '1') return 'KIWA_STRIPE_REAL_READY not 1';
  return null;
}

/**
 * Build the real adapter skeleton. Reads return empty lists with trace
 * records; writes fail loudly until the true driver lands.
 */
export function makeRealAdapter(): StripeMarketplaceAdapter {
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

    async createExpressAccount(_input) {
      throw envError('createExpressAccount');
    },
    async getOnboardingLink(_accountId) {
      throw envError('getOnboardingLink');
    },
    async getAccountStatus(_accountId) {
      throw envError('getAccountStatus');
    },
    listAccounts() {
      record('listAccounts', true, { detail: { count: 0 } });
      return [];
    },

    async createDestinationCharge(_input) {
      throw envError('createDestinationCharge');
    },
    async captureCharge(_chargeId) {
      throw envError('captureCharge');
    },
    listCharges() {
      record('listCharges', true, { detail: { count: 0 } });
      return [];
    },

    async createSellerTransfer(_input) {
      throw envError('createSellerTransfer');
    },
    async createReferrerTransfer(_input) {
      throw envError('createReferrerTransfer');
    },
    listTransfers() {
      record('listTransfers', true, { detail: { count: 0 } });
      return [];
    },

    async generateTaxReport1099K(_input) {
      throw envError('generateTaxReport1099K');
    },
    async generateTaxReportDAC7(_input) {
      throw envError('generateTaxReportDAC7');
    },
    listTaxReports() {
      record('listTaxReports', true, { detail: { count: 0 } });
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
