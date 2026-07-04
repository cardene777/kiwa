import type { PaymentAdapter, PaymentProvider } from '../types.js';
import { providerEventName, type BillingAxis, type NeutralEventName } from './types.js';

/**
 * Fidelity harness — collects the provider × axis coverage grid that
 * downstream release-gate reports on. Not a runner (no side effect emit);
 * pure inspection so tests / release-gate can assert "3 provider × 9 axis"
 * without walking every neutral event by hand.
 */
export interface FidelityRow {
  provider: PaymentProvider;
  axis: BillingAxis;
  neutralEvents: NeutralEventName[];
  providerEvents: string[];
}

export interface FidelityCoverage {
  providers: PaymentProvider[];
  axes: BillingAxis[];
  rows: FidelityRow[];
}

const AXIS_TO_EVENTS: Record<BillingAxis, NeutralEventName[]> = {
  dunning: ['dunning.attempt', 'dunning.exhausted', 'dunning.recovered'],
  retry: ['retry.scheduled', 'retry.delivered', 'retry.abandoned'],
  '3ds': ['3ds.challenge_required', '3ds.challenge_completed', '3ds.frictionless'],
  sca: ['sca.required', 'sca.exempt', 'sca.authenticated'],
  psd2: ['psd2.mandate_created', 'psd2.mandate_revoked', 'psd2.consent_granted'],
  'subscription-lifecycle': [
    'subscription.created',
    'subscription.upgraded',
    'subscription.downgraded',
    'subscription.paused',
    'subscription.resumed',
    'subscription.canceled',
    'subscription.reactivated',
  ],
  invoice: [
    'invoice.drafted',
    'invoice.opened',
    'invoice.paid',
    'invoice.voided',
    'invoice.uncollectible',
    'invoice.credit_noted',
  ],
  tax: ['tax.calculated', 'tax.reverse_charged', 'tax.exempted'],
  chargeback: [
    'chargeback.opened',
    'chargeback.evidence_submitted',
    'chargeback.won',
    'chargeback.lost',
  ],
};

/**
 * Collect the provider × axis coverage grid. `adapters` is the list of
 * adapters to inspect — usually all 3 (`createStripeMock()`,
 * `createPaddleMock()`, `createLemonSqueezyMock()`).
 *
 * The output is a flat row list `adapters.length * 9 = 27` for the default
 * setup, plus `providers` + `axes` roll-up lists so callers can assert on
 * the grid dimensions.
 */
export function collectFidelityCoverage(adapters: PaymentAdapter[]): FidelityCoverage {
  const providers = adapters.map((a) => a.provider);
  const axes = Object.keys(AXIS_TO_EVENTS) as BillingAxis[];
  const rows: FidelityRow[] = [];
  for (const adapter of adapters) {
    for (const axis of axes) {
      const neutralEvents = AXIS_TO_EVENTS[axis];
      const providerEvents = neutralEvents.map((n) => providerEventName(adapter.provider, n));
      rows.push({
        provider: adapter.provider,
        axis,
        neutralEvents,
        providerEvents,
      });
    }
  }
  return { providers, axes, rows };
}
