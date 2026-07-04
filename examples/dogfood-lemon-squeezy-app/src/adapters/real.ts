/**
 * Real adapter — drives a real Lemon Squeezy sandbox integration. On systems
 * without `LEMONSQUEEZY_KEY` set or without `KIWA_MODE=real` the adapter
 * refuses to run and every method reports `KIWA_LEMONSQUEEZY_ENV_MISSING`.
 * Downstream tests inspect {@link LemonSqueezyDogfoodAdapter.mode} + the
 * trace to skip real assertions on those systems.
 *
 * The full real Lemon Squeezy sandbox wiring lands in v1.23-4b (follow-up
 * Sub-Issue): a sandbox fixture that boots a live sandbox tenant and
 * exercises the checkout / webhook / license / refund / dispute endpoints
 * against it. v1.23-4 (this one) lands the env-detect skeleton so the
 * fidelity harness can uniformly drive both adapters even when only the
 * mock has an actual body.
 */

import type {
  Chargeback,
  DunningSession,
  Invoice as SemanticInvoice,
  PaymentWebhookEvent,
  Subscription as SemanticSubscription,
} from '@kiwa-test/payment';
import type {
  CheckoutInput,
  CheckoutResult,
  ChargebackEvidenceInput,
  ChargebackOpenInput,
  ChargebackResolveInput,
  LemonSqueezyDogfoodAdapter,
  LicenseActivateInput,
  LicenseIssueInput,
  LicenseRevokeInput,
  RefundInput,
  RefundResult,
  SubscriptionPlanChangeInput,
  TraceEvent,
  WebhookReceiveInput,
  WebhookReceiveResult,
} from './interface.js';
import type { LicenseKeyRecord, RefundRecord } from '../lib/store.js';

const MISSING_ENV_ERROR = 'KIWA_LEMONSQUEEZY_ENV_MISSING';

/**
 * Report whether the current process can talk to a real Lemon Squeezy
 * sandbox endpoint (`https://api.lemonsqueezy.com/v1` in real mode).
 * Returns `null` on capable systems, or a short reason string when the env
 * is missing (used to populate `TraceEvent.errorKind`).
 */
export function detectRealEnvMissing(): string | null {
  // KIWA_MODE=mock is the explicit "please stay mock" toggle used by tests
  // that want to compare mock-vs-mock without touching Lemon Squeezy
  // sandbox.
  if (process.env['KIWA_MODE'] === 'mock') return 'KIWA_MODE=mock';
  if (process.env['KIWA_MODE'] !== 'real') return 'KIWA_MODE not real';
  // Real Lemon Squeezy API requires an API key.
  if (!process.env['LEMONSQUEEZY_KEY']) return 'LEMONSQUEEZY_KEY unset';
  // Lemon Squeezy webhooks require a per-store secret to verify the
  // `X-Signature` header.
  if (!process.env['LEMONSQUEEZY_SIGNING_SECRET']) return 'LEMONSQUEEZY_SIGNING_SECRET unset';
  // The `KIWA_LEMONSQUEEZY_REAL_READY=1` env flag opts in to real API calls
  // once the sandbox wiring is in place. Until it is set every operation
  // errors out with MISSING_ENV_ERROR — v1.23-4b will ship the sandbox
  // fixture that flips the flag inside the test setup.
  if (process.env['KIWA_LEMONSQUEEZY_REAL_READY'] === '1') return null;
  return MISSING_ENV_ERROR;
}

export function makeRealAdapter(): LemonSqueezyDogfoodAdapter {
  const trace: TraceEvent[] = [];
  const subscriptions = new Map<string, SemanticSubscription>();
  const orders = new Map<string, SemanticInvoice>();
  const licenseKeys = new Map<string, LicenseKeyRecord>();
  const refunds: RefundRecord[] = [];
  const chargebacks = new Map<string, Chargeback>();
  const events: PaymentWebhookEvent[] = [];

  function record(op: TraceEvent['op'], ok: boolean, extra?: Partial<TraceEvent>): void {
    const entry: TraceEvent = { op, ok };
    if (extra?.errorKind !== undefined) entry.errorKind = extra.errorKind;
    if (extra?.detail !== undefined) entry.detail = extra.detail;
    trace.push(entry);
  }

  function envError(op: TraceEvent['op']): Error {
    const reason = detectRealEnvMissing() ?? MISSING_ENV_ERROR;
    record(op, false, { errorKind: reason });
    return new Error(`makeRealAdapter.${op}: ${reason}`);
  }

  return {
    mode: 'real',
    traces: () => [...trace],

    async checkout(_input: CheckoutInput): Promise<CheckoutResult> {
      throw envError('checkout');
    },

    async receiveWebhook(_input: WebhookReceiveInput): Promise<WebhookReceiveResult> {
      throw envError('receiveWebhook');
    },

    listSubscriptions(): SemanticSubscription[] {
      return Array.from(subscriptions.values());
    },

    listOrders(): SemanticInvoice[] {
      return Array.from(orders.values());
    },

    listCheckouts() {
      return [];
    },

    listLicenseKeys(): LicenseKeyRecord[] {
      return Array.from(licenseKeys.values());
    },

    listRefunds(): RefundRecord[] {
      return [...refunds];
    },

    listChargebacks(): Chargeback[] {
      return Array.from(chargebacks.values());
    },

    eventsEmitted(): PaymentWebhookEvent[] {
      return [...events];
    },

    getSubscription(id) {
      return subscriptions.get(id) ?? null;
    },

    getOrder(id) {
      return orders.get(id) ?? null;
    },

    getLicenseKey(id) {
      return licenseKeys.get(id) ?? null;
    },

    getChargeback(id) {
      return chargebacks.get(id) ?? null;
    },

    async changePlan(_input: SubscriptionPlanChangeInput): Promise<SemanticSubscription> {
      throw envError('upgradeSubscription');
    },

    async pauseSubscription(_id): Promise<SemanticSubscription> {
      throw envError('pauseSubscription');
    },

    async resumeSubscription(_id): Promise<SemanticSubscription> {
      throw envError('resumeSubscription');
    },

    async cancelSubscription(_id): Promise<SemanticSubscription> {
      throw envError('cancelSubscription');
    },

    async reactivateSubscription(_id): Promise<SemanticSubscription> {
      throw envError('reactivateSubscription');
    },

    async draftOrder(_input): Promise<SemanticInvoice> {
      throw envError('draftOrder');
    },

    async openOrder(_id): Promise<SemanticInvoice> {
      throw envError('openOrder');
    },

    async payOrder(_id): Promise<SemanticInvoice> {
      throw envError('payOrder');
    },

    async voidOrder(_id): Promise<SemanticInvoice> {
      throw envError('voidOrder');
    },

    async markOrderUncollectible(_id): Promise<SemanticInvoice> {
      throw envError('markUncollectible');
    },

    async issueLicenseKey(_input: LicenseIssueInput): Promise<LicenseKeyRecord> {
      throw envError('issueLicenseKey');
    },

    async activateLicense(_input: LicenseActivateInput): Promise<LicenseKeyRecord> {
      throw envError('activateLicense');
    },

    async revokeLicense(_input: LicenseRevokeInput): Promise<LicenseKeyRecord> {
      throw envError('revokeLicense');
    },

    async refundOrder(_input: RefundInput): Promise<RefundResult> {
      throw envError('refundOrder');
    },

    async openChargeback(_input: ChargebackOpenInput): Promise<Chargeback> {
      throw envError('openChargeback');
    },

    async submitChargebackEvidence(_input: ChargebackEvidenceInput): Promise<Chargeback> {
      throw envError('submitChargebackEvidence');
    },

    async resolveChargeback(_input: ChargebackResolveInput): Promise<Chargeback> {
      throw envError('resolveChargeback');
    },

    async startDunningForOrder(_orderId): Promise<DunningSession> {
      throw envError('startDunning');
    },

    async runDunningAttempt(_orderId): Promise<DunningSession> {
      throw envError('dunningAttempt');
    },

    async finalizeDunning(_orderId, _succeed): Promise<DunningSession> {
      throw envError('finalizeDunning');
    },

    async reset(): Promise<void> {
      subscriptions.clear();
      orders.clear();
      licenseKeys.clear();
      refunds.length = 0;
      chargebacks.clear();
      events.length = 0;
      trace.length = 0;
      record('reset', true);
    },
  };
}
