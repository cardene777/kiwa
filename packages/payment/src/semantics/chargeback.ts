import type { PaymentAdapter } from '../types.js';
import { providerEventName, type AxisStep } from './types.js';

/**
 * Chargeback / dispute semantics. Real card networks (Visa VCR, Mastercard
 * MCOP) run a multi-step dispute flow: opened → evidence submitted (or
 * accept) → representment → arbitration → final outcome. The mock reduces
 * that to the observable 4-event envelope providers surface (opened /
 * evidence_submitted / won / lost) with a state machine that guards
 * transitions.
 */
export type ChargebackState =
  | 'opened'
  | 'evidence-submitted'
  | 'won'
  | 'lost';

export type ChargebackReason =
  | 'fraudulent'
  | 'unrecognized'
  | 'duplicate'
  | 'product-not-received'
  | 'product-unacceptable'
  | 'subscription-canceled'
  | 'credit-not-processed'
  | 'general';

export interface Chargeback {
  id: string;
  transactionId: string;
  customerId: string;
  amountCents: number;
  currency?: string;
  reason: ChargebackReason;
  state: ChargebackState;
  history: AxisStep<ChargebackState>[];
}

/**
 * Open a chargeback. Emits `chargeback.opened`.
 */
export async function openChargeback(
  adapter: PaymentAdapter,
  input: {
    transactionId: string;
    customerId: string;
    amountCents: number;
    currency?: string;
    reason: ChargebackReason;
  },
): Promise<{ chargeback: Chargeback; step: AxisStep<ChargebackState> }> {
  const providerEvent = providerEventName(adapter.provider, 'chargeback.opened');
  const { event } = adapter.signWebhook({
    type: providerEvent,
    amountCents: input.amountCents,
    ...(input.currency !== undefined ? { currency: input.currency } : {}),
    customerId: input.customerId,
  });
  await adapter.emit(event);
  const chargeback: Chargeback = {
    id: `dp_${event.id}`,
    transactionId: input.transactionId,
    customerId: input.customerId,
    amountCents: input.amountCents,
    reason: input.reason,
    state: 'opened',
    history: [],
  };
  if (input.currency !== undefined) chargeback.currency = input.currency;
  const step: AxisStep<ChargebackState> = {
    neutralEvent: 'chargeback.opened',
    providerEvent,
    state: 'opened',
    amountCents: input.amountCents,
    metadata: {
      chargebackId: chargeback.id,
      transactionId: input.transactionId,
      reason: input.reason,
      openedAt: event.timestamp,
    },
  };
  chargeback.history.push(step);
  return { chargeback, step };
}

/**
 * Submit evidence to represent the dispute. Emits
 * `chargeback.evidence_submitted`. Only allowed from `opened`.
 */
export async function submitEvidence(
  adapter: PaymentAdapter,
  chargeback: Chargeback,
  input: {
    receiptUrl?: string;
    shippingProof?: string;
    customerCommunication?: string;
  },
): Promise<AxisStep<ChargebackState>> {
  if (chargeback.state !== 'opened') {
    throw new Error(`submitEvidence: chargeback ${chargeback.id} is ${chargeback.state}`);
  }
  const providerEvent = providerEventName(adapter.provider, 'chargeback.evidence_submitted');
  const { event } = adapter.signWebhook({
    type: providerEvent,
    amountCents: chargeback.amountCents,
    ...(chargeback.currency !== undefined ? { currency: chargeback.currency } : {}),
    customerId: chargeback.customerId,
  });
  await adapter.emit(event);
  chargeback.state = 'evidence-submitted';
  const step: AxisStep<ChargebackState> = {
    neutralEvent: 'chargeback.evidence_submitted',
    providerEvent,
    state: 'evidence-submitted',
    amountCents: chargeback.amountCents,
    metadata: {
      chargebackId: chargeback.id,
      hasReceipt: input.receiptUrl !== undefined,
      hasShippingProof: input.shippingProof !== undefined,
      hasCustomerCommunication: input.customerCommunication !== undefined,
      submittedAt: event.timestamp,
    },
  };
  chargeback.history.push(step);
  return step;
}

/**
 * Resolve the dispute. `merchantWon: true` → `chargeback.won` (funds
 * returned), `false` → `chargeback.lost` (funds forfeit + fee). Only allowed
 * from `evidence-submitted`.
 */
export async function resolveChargeback(
  adapter: PaymentAdapter,
  chargeback: Chargeback,
  input: { merchantWon: boolean },
): Promise<AxisStep<ChargebackState>> {
  if (chargeback.state !== 'evidence-submitted') {
    throw new Error(`resolveChargeback: chargeback is ${chargeback.state}, submit evidence first`);
  }
  const neutral = input.merchantWon ? 'chargeback.won' : 'chargeback.lost';
  const providerEvent = providerEventName(adapter.provider, neutral);
  const amount = input.merchantWon ? chargeback.amountCents : -chargeback.amountCents;
  const { event } = adapter.signWebhook({
    type: providerEvent,
    amountCents: amount,
    ...(chargeback.currency !== undefined ? { currency: chargeback.currency } : {}),
    customerId: chargeback.customerId,
  });
  await adapter.emit(event);
  chargeback.state = input.merchantWon ? 'won' : 'lost';
  const step: AxisStep<ChargebackState> = {
    neutralEvent: neutral,
    providerEvent,
    state: chargeback.state,
    amountCents: amount,
    metadata: {
      chargebackId: chargeback.id,
      resolvedAt: event.timestamp,
      merchantWon: input.merchantWon,
      // real card networks charge a $15-25 dispute fee on lost chargebacks
      disputeFeeCents: input.merchantWon ? 0 : 1500,
    },
  };
  chargeback.history.push(step);
  return step;
}
