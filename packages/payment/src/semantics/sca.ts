import type { PaymentAdapter } from '../types.js';
import { providerEventName, type AxisStep } from './types.js';

/**
 * Strong Customer Authentication (SCA) semantics under PSD2. Real providers
 * expose SCA through: (1) exemption evaluation (low-value, TRA, MIT, recurring
 * subsequent), (2) required authentication when no exemption applies, (3)
 * post-auth token issue. This module wraps the 3-state envelope: `required`
 * / `exempt` / `authenticated`.
 */
export type ScaState = 'evaluating' | 'required' | 'exempt' | 'authenticated';

export type ScaExemption =
  | 'low-value'
  | 'trusted-beneficiary'
  | 'transaction-risk-analysis'
  | 'merchant-initiated'
  | 'recurring-subsequent'
  | 'corporate';

export interface ScaSession {
  paymentIntentId: string;
  amountCents: number;
  currency?: string;
  customerId: string;
  state: ScaState;
  strongAuthToken?: string;
  history: AxisStep<ScaState>[];
}

/**
 * Start an SCA evaluation session. Call {@link scaEvaluate} to decide.
 */
export function startSca(input: {
  paymentIntentId: string;
  amountCents: number;
  currency?: string;
  customerId: string;
}): ScaSession {
  const s: ScaSession = {
    paymentIntentId: input.paymentIntentId,
    amountCents: input.amountCents,
    customerId: input.customerId,
    state: 'evaluating',
    history: [],
  };
  if (input.currency !== undefined) s.currency = input.currency;
  return s;
}

/**
 * Evaluate SCA. If `exemption` is supplied the session terminates in `exempt`,
 * otherwise it moves to `required`.
 */
export async function scaEvaluate(
  adapter: PaymentAdapter,
  session: ScaSession,
  input: { exemption?: ScaExemption },
): Promise<AxisStep<ScaState>> {
  if (session.state !== 'evaluating') {
    throw new Error(`scaEvaluate: session is ${session.state}`);
  }
  if (input.exemption !== undefined) {
    const providerEvent = providerEventName(adapter.provider, 'sca.exempt');
    const { event } = adapter.signWebhook({
      type: providerEvent,
      amountCents: session.amountCents,
      ...(session.currency !== undefined ? { currency: session.currency } : {}),
      customerId: session.customerId,
    });
    await adapter.emit(event);
    session.state = 'exempt';
    const step: AxisStep<ScaState> = {
      neutralEvent: 'sca.exempt',
      providerEvent,
      state: 'exempt',
      amountCents: session.amountCents,
      metadata: {
        paymentIntentId: session.paymentIntentId,
        exemption: input.exemption,
      },
    };
    session.history.push(step);
    return step;
  }
  const providerEvent = providerEventName(adapter.provider, 'sca.required');
  const { event } = adapter.signWebhook({
    type: providerEvent,
    amountCents: session.amountCents,
    ...(session.currency !== undefined ? { currency: session.currency } : {}),
    customerId: session.customerId,
  });
  await adapter.emit(event);
  session.state = 'required';
  const step: AxisStep<ScaState> = {
    neutralEvent: 'sca.required',
    providerEvent,
    state: 'required',
    amountCents: session.amountCents,
    metadata: {
      paymentIntentId: session.paymentIntentId,
      requiresRedirect: true,
    },
  };
  session.history.push(step);
  return step;
}

/**
 * Complete SCA. Emits `sca.authenticated` and issues a synthetic strong
 * auth token that downstream calls can attach for the 90-day validity
 * window PSD2 mandates.
 */
export async function scaAuthenticate(
  adapter: PaymentAdapter,
  session: ScaSession,
): Promise<AxisStep<ScaState>> {
  if (session.state !== 'required') {
    throw new Error(`scaAuthenticate: session is ${session.state}`);
  }
  const providerEvent = providerEventName(adapter.provider, 'sca.authenticated');
  const { event } = adapter.signWebhook({
    type: providerEvent,
    amountCents: session.amountCents,
    ...(session.currency !== undefined ? { currency: session.currency } : {}),
    customerId: session.customerId,
  });
  await adapter.emit(event);
  session.state = 'authenticated';
  session.strongAuthToken = `sca_tok_${session.paymentIntentId}_${event.timestamp}`;
  const step: AxisStep<ScaState> = {
    neutralEvent: 'sca.authenticated',
    providerEvent,
    state: 'authenticated',
    amountCents: session.amountCents,
    metadata: {
      paymentIntentId: session.paymentIntentId,
      strongAuthToken: session.strongAuthToken,
      validForMs: 90 * 24 * 60 * 60 * 1000,
    },
  };
  session.history.push(step);
  return step;
}
