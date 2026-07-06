import type { PaymentAdapter } from '../types.js';
import { providerEventName, type AxisStep } from './types.js';

/**
 * Dispute lifecycle axis — evidence submission + representment +
 * arbitration + liability shift. Real card networks (Visa / Mastercard)
 * define a 5-stage dispute cycle: retrieval → first chargeback → second
 * presentment → arbitration → final ruling. Liability shift occurs when
 * 3DS challenge was passed at authorisation, moving fraud loss from the
 * merchant to the issuer.
 */
export type DisputeState =
  | 'opened'
  | 'evidence-submitted'
  | 'represented'
  | 'arbitration-opened'
  | 'liability-shifted'
  | 'lost'
  | 'won';

export interface DisputeSession {
  disputeId: string;
  chargeId: string;
  amountCents: number;
  customerId: string;
  currency?: string;
  reason: string;
  state: DisputeState;
  evidence: string[];
  liabilityShifted: boolean;
  history: AxisStep<DisputeState>[];
  arbitrationOpenedAt: number | null;
}

/**
 * Open a dispute against an existing charge.
 */
export function openDispute(input: {
  disputeId: string;
  chargeId: string;
  amountCents: number;
  customerId: string;
  currency?: string;
  reason: string;
}): DisputeSession {
  const session: DisputeSession = {
    disputeId: input.disputeId,
    chargeId: input.chargeId,
    amountCents: input.amountCents,
    customerId: input.customerId,
    reason: input.reason,
    state: 'opened',
    evidence: [],
    liabilityShifted: false,
    history: [],
    arbitrationOpenedAt: null,
  };
  if (input.currency !== undefined) session.currency = input.currency;
  return session;
}

/**
 * Submit evidence for the dispute — receipt, shipping confirmation,
 * customer communication, etc.
 */
export async function submitDisputeEvidence(
  adapter: PaymentAdapter,
  session: DisputeSession,
  input: { evidenceIds: string[] },
): Promise<AxisStep<DisputeState>> {
  if (session.state !== 'opened' && session.state !== 'evidence-submitted') {
    throw new Error(`submitDisputeEvidence: session is ${session.state}, cannot add evidence`);
  }
  session.evidence.push(...input.evidenceIds);
  session.state = 'evidence-submitted';
  return emit(adapter, session, 'dispute.evidence_submitted', {
    evidenceCount: session.evidence.length,
  });
}

/**
 * Represent the dispute — merchant challenges the chargeback with the
 * submitted evidence. Advances the case to second presentment.
 */
export async function representDispute(
  adapter: PaymentAdapter,
  session: DisputeSession,
): Promise<AxisStep<DisputeState>> {
  if (session.state !== 'evidence-submitted') {
    throw new Error('representDispute: evidence must be submitted first');
  }
  if (session.evidence.length === 0) {
    throw new Error('representDispute: cannot represent without evidence');
  }
  session.state = 'represented';
  return emit(adapter, session, 'dispute.represented', {
    evidenceCount: session.evidence.length,
  });
}

/**
 * Escalate to arbitration — final round in the card-network dispute
 * process, decided by the network with a non-refundable filing fee.
 */
export async function escalateArbitration(
  adapter: PaymentAdapter,
  session: DisputeSession,
): Promise<AxisStep<DisputeState>> {
  if (session.state !== 'represented') {
    throw new Error('escalateArbitration: dispute must be represented first');
  }
  session.state = 'arbitration-opened';
  session.arbitrationOpenedAt = Date.now();
  return emit(adapter, session, 'dispute.arbitration_opened', {
    filingFeeCents: 500,
  });
}

/**
 * Liability shift — apply the 3DS liability shift for a passed challenge.
 * Moves fraud loss from merchant to issuer; typically emitted right after
 * dispute open when the original auth had a successful 3DS.
 */
export async function shiftLiability(
  adapter: PaymentAdapter,
  session: DisputeSession,
  input: { threeDsAuthCode: string },
): Promise<AxisStep<DisputeState>> {
  if (session.liabilityShifted) {
    throw new Error('shiftLiability: liability already shifted');
  }
  session.liabilityShifted = true;
  session.state = 'liability-shifted';
  return emit(adapter, session, 'dispute.liability_shifted', {
    threeDsAuthCode: input.threeDsAuthCode,
  });
}

/**
 * Terminal — dispute resolved with an outcome. `won` returns funds to
 * the merchant; `lost` finalises the chargeback.
 */
export function finalizeDispute(
  session: DisputeSession,
  input: { won: boolean },
): DisputeSession {
  session.state = input.won ? 'won' : 'lost';
  return session;
}

async function emit(
  adapter: PaymentAdapter,
  session: DisputeSession,
  neutral:
    | 'dispute.evidence_submitted'
    | 'dispute.represented'
    | 'dispute.arbitration_opened'
    | 'dispute.liability_shifted',
  extra: Record<string, string | number | boolean>,
): Promise<AxisStep<DisputeState>> {
  const providerEvent = providerEventName(adapter.provider, neutral);
  const { event } = adapter.signWebhook({
    type: providerEvent,
    amountCents: session.amountCents,
    ...(session.currency !== undefined ? { currency: session.currency } : {}),
    customerId: session.customerId,
  });
  await adapter.emit(event);
  const step: AxisStep<DisputeState> = {
    neutralEvent: neutral,
    providerEvent,
    state: session.state,
    amountCents: session.amountCents,
    metadata: {
      disputeId: session.disputeId,
      chargeId: session.chargeId,
      reason: session.reason,
      ...extra,
    },
  };
  session.history.push(step);
  return step;
}
