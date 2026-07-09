/**
 * Mock adapter for the Stripe Connect marketplace dogfood app.
 *
 * Wraps `@kiwa-lab/payment`'s `createStripeMock()` plus the marketplace
 * runtime so tests exercise deterministic Connect ids, charge arithmetic,
 * payout ordering, tax-report aggregation, and Stripe-style webhook signing
 * without touching the real Stripe API.
 */

import { createStripeMock } from '@kiwa-lab/payment';
import type {
  StripeMarketplaceAdapter,
  TraceEvent,
  WebhookReceiveResult,
} from './interface.js';
import { createMarketplaceRuntime, type MarketplaceRuntime } from '../lib/marketplace-runtime.js';

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
  if (message.includes('KIWA_STRIPE_ENV_MISSING')) return 'KIWA_STRIPE_ENV_MISSING';
  if (message.includes('already captured')) return 'already_captured';
  if (message.includes('duplicate email')) return 'duplicate_email';
  if (message.includes('not found')) return 'entity_not_found';
  return `${op}_failed`;
}

/**
 * Build a mock adapter satisfying {@link StripeMarketplaceAdapter}. The
 * runtime owns marketplace behaviour; the adapter adds ordered trace capture
 * and the webhook verify/dispatch surface the route handlers use.
 */
export function makeMockAdapter(opts: MakeMockAdapterOptions = {}): StripeMarketplaceAdapter & {
  readonly runtime: () => MarketplaceRuntime;
} {
  const trace: TraceEvent[] = [];
  const paymentAdapter = createStripeMock({
    ...(opts.secret !== undefined ? { secret: opts.secret } : {}),
    ...(opts.toleranceMs !== undefined ? { toleranceMs: opts.toleranceMs } : {}),
    ...(opts.now !== undefined ? { now: opts.now } : {}),
  });
  const runtime = createMarketplaceRuntime(paymentAdapter, {
    ...(opts.now !== undefined ? { now: opts.now } : {}),
  });
  const handledEventTypes = new Set([
    'account.updated',
    'charge.succeeded',
    'application_fee.created',
    'transfer.created',
    'tax_report.generated',
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

    async createExpressAccount(input) {
      try {
        const account = await runtime.createExpressAccount(input);
        record('createExpressAccount', true, { detail: { accountId: account.id } });
        return account;
      } catch (err) {
        record('createExpressAccount', false, { errorKind: classifyError(err, 'createExpressAccount') });
        throw err;
      }
    },

    async getOnboardingLink(accountId) {
      try {
        const link = await runtime.getOnboardingLink(accountId);
        record('getOnboardingLink', true, { detail: { accountId } });
        return link;
      } catch (err) {
        record('getOnboardingLink', false, { errorKind: classifyError(err, 'getOnboardingLink') });
        throw err;
      }
    },

    async getAccountStatus(accountId) {
      try {
        const account = await runtime.getAccountStatus(accountId);
        record('getAccountStatus', true, {
          detail: { accountId, status: account.status },
        });
        return account;
      } catch (err) {
        record('getAccountStatus', false, { errorKind: classifyError(err, 'getAccountStatus') });
        throw err;
      }
    },

    listAccounts() {
      const accounts = runtime.listAccounts();
      recordList('listAccounts', accounts.length);
      return accounts;
    },

    async createDestinationCharge(input) {
      try {
        const charge = await runtime.createDestinationCharge(input);
        record('createDestinationCharge', true, { detail: { chargeId: charge.id, accountId: charge.accountId } });
        return charge;
      } catch (err) {
        record('createDestinationCharge', false, {
          errorKind: classifyError(err, 'createDestinationCharge'),
        });
        throw err;
      }
    },

    async captureCharge(chargeId) {
      try {
        const charge = await runtime.captureCharge(chargeId);
        record('captureCharge', true, { detail: { chargeId } });
        return charge;
      } catch (err) {
        record('captureCharge', false, { errorKind: classifyError(err, 'captureCharge') });
        throw err;
      }
    },

    listCharges(filter) {
      const charges = runtime.listCharges(filter);
      recordList('listCharges', charges.length);
      return charges;
    },

    async createSellerTransfer(input) {
      try {
        const transfer = await runtime.createSellerTransfer(input);
        record('createSellerTransfer', true, { detail: { transferId: transfer.id, chargeId: transfer.chargeId } });
        return transfer;
      } catch (err) {
        record('createSellerTransfer', false, { errorKind: classifyError(err, 'createSellerTransfer') });
        throw err;
      }
    },

    async createReferrerTransfer(input) {
      try {
        const transfer = await runtime.createReferrerTransfer(input);
        record('createReferrerTransfer', true, { detail: { transferId: transfer.id, chargeId: transfer.chargeId } });
        return transfer;
      } catch (err) {
        record('createReferrerTransfer', false, {
          errorKind: classifyError(err, 'createReferrerTransfer'),
        });
        throw err;
      }
    },

    listTransfers(filter) {
      const transfers = runtime.listTransfers(filter);
      recordList('listTransfers', transfers.length);
      return transfers;
    },

    async generateTaxReport1099K(input) {
      try {
        const report = await runtime.generateTaxReport1099K(input);
        record('generateTaxReport1099K', true, {
          detail: { accountId: input.accountId, generated: report !== null },
        });
        return report;
      } catch (err) {
        record('generateTaxReport1099K', false, {
          errorKind: classifyError(err, 'generateTaxReport1099K'),
        });
        throw err;
      }
    },

    async generateTaxReportDAC7(input) {
      try {
        const report = await runtime.generateTaxReportDAC7(input);
        record('generateTaxReportDAC7', true, {
          detail: { accountId: input.accountId, generated: report !== null },
        });
        return report;
      } catch (err) {
        record('generateTaxReportDAC7', false, {
          errorKind: classifyError(err, 'generateTaxReportDAC7'),
        });
        throw err;
      }
    },

    listTaxReports(filter) {
      const reports = runtime.listTaxReports(filter);
      recordList('listTaxReports', reports.length);
      return reports;
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
