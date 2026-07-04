import type { PaymentAdapter } from '../types.js';
import { providerEventName, type AxisStep } from './types.js';

/**
 * 3D Secure v2 challenge flow. Real providers surface 3DS through a two-
 * or three-step flow: fingerprint (device data collection), challenge
 * (user interaction), result (accept/reject). Frictionless flow skips the
 * challenge when the issuer risk assessment is low. The mock reproduces
 * the observable envelope only — no real ACS callout, just event ordering
 * with sensible metadata (transStatus, eci) drawn from EMVCo 3DS 2.2.
 */
export type ThreeDsState =
  | 'fingerprint'
  | 'challenge-pending'
  | 'completed'
  | 'frictionless';

export type ThreeDsTransStatus = 'Y' | 'N' | 'A' | 'C' | 'U' | 'R';

export interface ThreeDsSession {
  paymentIntentId: string;
  amountCents: number;
  currency?: string;
  customerId: string;
  state: ThreeDsState;
  history: AxisStep<ThreeDsState>[];
}

/**
 * Start a 3DS session. No webhook is emitted at start — this is the local
 * fingerprint capture step; call {@link threeDsRequestChallenge} to
 * transition to the challenge, or {@link threeDsFrictionless} to skip.
 */
export function startThreeDs(input: {
  paymentIntentId: string;
  amountCents: number;
  currency?: string;
  customerId: string;
}): ThreeDsSession {
  const s: ThreeDsSession = {
    paymentIntentId: input.paymentIntentId,
    amountCents: input.amountCents,
    customerId: input.customerId,
    state: 'fingerprint',
    history: [],
  };
  if (input.currency !== undefined) s.currency = input.currency;
  return s;
}

/**
 * Request a 3DS challenge. Emits `3ds.challenge_required`. Session moves to
 * `challenge-pending` — call {@link threeDsSubmitChallenge} to complete.
 */
export async function threeDsRequestChallenge(
  adapter: PaymentAdapter,
  session: ThreeDsSession,
): Promise<AxisStep<ThreeDsState>> {
  if (session.state !== 'fingerprint') {
    throw new Error(`threeDsRequestChallenge: session is ${session.state}`);
  }
  const providerEvent = providerEventName(adapter.provider, '3ds.challenge_required');
  const { event } = adapter.signWebhook({
    type: providerEvent,
    amountCents: session.amountCents,
    ...(session.currency !== undefined ? { currency: session.currency } : {}),
    customerId: session.customerId,
  });
  await adapter.emit(event);
  session.state = 'challenge-pending';
  const step: AxisStep<ThreeDsState> = {
    neutralEvent: '3ds.challenge_required',
    providerEvent,
    state: 'challenge-pending',
    amountCents: session.amountCents,
    metadata: {
      paymentIntentId: session.paymentIntentId,
      acsChallengeUrl: `https://acs.mock/3ds/${session.paymentIntentId}`,
      threeDsVersion: '2.2.0',
    },
  };
  session.history.push(step);
  return step;
}

/**
 * Submit the challenge result. `transStatus` follows EMVCo values: `Y` =
 * authenticated, `N` = not authenticated, `A` = attempt performed, `U` =
 * unavailable, `C` = challenge required (should be pre-transitioned), `R` =
 * rejected. `Y` / `A` → session `completed`; `N` / `R` / `U` throw so tests
 * exercise both accept and reject explicitly.
 */
export async function threeDsSubmitChallenge(
  adapter: PaymentAdapter,
  session: ThreeDsSession,
  input: { transStatus: ThreeDsTransStatus },
): Promise<AxisStep<ThreeDsState>> {
  if (session.state !== 'challenge-pending') {
    throw new Error(`threeDsSubmitChallenge: session is ${session.state}`);
  }
  const accepted = input.transStatus === 'Y' || input.transStatus === 'A';
  const providerEvent = providerEventName(adapter.provider, '3ds.challenge_completed');
  const { event } = adapter.signWebhook({
    type: providerEvent,
    amountCents: accepted ? session.amountCents : 0,
    ...(session.currency !== undefined ? { currency: session.currency } : {}),
    customerId: session.customerId,
  });
  await adapter.emit(event);
  session.state = 'completed';
  const step: AxisStep<ThreeDsState> = {
    neutralEvent: '3ds.challenge_completed',
    providerEvent,
    state: 'completed',
    amountCents: event.amountCents,
    metadata: {
      paymentIntentId: session.paymentIntentId,
      transStatus: input.transStatus,
      accepted,
      eci: accepted ? '05' : '07',
    },
  };
  session.history.push(step);
  return step;
}

/**
 * Frictionless path — issuer accepted the transaction without a challenge.
 * Emits `3ds.frictionless` and terminates. Only valid from `fingerprint`.
 */
export async function threeDsFrictionless(
  adapter: PaymentAdapter,
  session: ThreeDsSession,
): Promise<AxisStep<ThreeDsState>> {
  if (session.state !== 'fingerprint') {
    throw new Error(`threeDsFrictionless: session is ${session.state}`);
  }
  const providerEvent = providerEventName(adapter.provider, '3ds.frictionless');
  const { event } = adapter.signWebhook({
    type: providerEvent,
    amountCents: session.amountCents,
    ...(session.currency !== undefined ? { currency: session.currency } : {}),
    customerId: session.customerId,
  });
  await adapter.emit(event);
  session.state = 'frictionless';
  const step: AxisStep<ThreeDsState> = {
    neutralEvent: '3ds.frictionless',
    providerEvent,
    state: 'frictionless',
    amountCents: session.amountCents,
    metadata: {
      paymentIntentId: session.paymentIntentId,
      transStatus: 'Y',
      eci: '05',
    },
  };
  session.history.push(step);
  return step;
}
