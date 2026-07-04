import type { PaymentAdapter } from '../types.js';
import { providerEventName, type AxisStep } from './types.js';

/**
 * PSD2 open banking + mandate semantics. Under PSD2 (EU) and the equivalent
 * UK OBIE spec, recurring debits require a signed customer mandate (SEPA
 * DD B2C, SEPA DD B2B, UK BACS DDI). Open banking payment initiation
 * requires a granular consent from the customer's bank. This module tracks
 * both — mandate lifecycle (create / revoke) and consent grant.
 */
export type PsdMandateScheme = 'sepa-core' | 'sepa-b2b' | 'bacs' | 'open-banking';

export type PsdMandateState = 'active' | 'revoked';

export interface PsdMandate {
  id: string;
  scheme: PsdMandateScheme;
  customerId: string;
  amountCentsCap?: number;
  currency?: string;
  state: PsdMandateState;
  history: AxisStep<PsdMandateState>[];
}

/**
 * Create a new mandate. Emits `psd2.mandate_created` with the scheme
 * embedded in metadata so downstream tests can filter per scheme.
 */
export async function createMandate(
  adapter: PaymentAdapter,
  input: {
    scheme: PsdMandateScheme;
    customerId: string;
    amountCentsCap?: number;
    currency?: string;
  },
): Promise<{ mandate: PsdMandate; step: AxisStep<PsdMandateState> }> {
  const providerEvent = providerEventName(adapter.provider, 'psd2.mandate_created');
  const cap = input.amountCentsCap ?? 0;
  const { event } = adapter.signWebhook({
    type: providerEvent,
    amountCents: cap,
    ...(input.currency !== undefined ? { currency: input.currency } : {}),
    customerId: input.customerId,
  });
  await adapter.emit(event);
  const mandate: PsdMandate = {
    id: `mnd_${event.id}`,
    scheme: input.scheme,
    customerId: input.customerId,
    state: 'active',
    history: [],
  };
  if (input.amountCentsCap !== undefined) mandate.amountCentsCap = input.amountCentsCap;
  if (input.currency !== undefined) mandate.currency = input.currency;
  const step: AxisStep<PsdMandateState> = {
    neutralEvent: 'psd2.mandate_created',
    providerEvent,
    state: 'active',
    amountCents: cap,
    metadata: {
      mandateId: mandate.id,
      scheme: input.scheme,
      requiresDoubleOptIn: input.scheme === 'sepa-b2b',
    },
  };
  mandate.history.push(step);
  return { mandate, step };
}

/**
 * Revoke an active mandate. Emits `psd2.mandate_revoked`. Idempotent — a
 * second call on an already-revoked mandate throws so tests exercise the
 * guard explicitly.
 */
export async function revokeMandate(
  adapter: PaymentAdapter,
  mandate: PsdMandate,
): Promise<AxisStep<PsdMandateState>> {
  if (mandate.state !== 'active') {
    throw new Error(`revokeMandate: mandate ${mandate.id} is ${mandate.state}`);
  }
  const providerEvent = providerEventName(adapter.provider, 'psd2.mandate_revoked');
  const { event } = adapter.signWebhook({
    type: providerEvent,
    amountCents: 0,
    ...(mandate.currency !== undefined ? { currency: mandate.currency } : {}),
    customerId: mandate.customerId,
  });
  await adapter.emit(event);
  mandate.state = 'revoked';
  const step: AxisStep<PsdMandateState> = {
    neutralEvent: 'psd2.mandate_revoked',
    providerEvent,
    state: 'revoked',
    amountCents: 0,
    metadata: {
      mandateId: mandate.id,
      scheme: mandate.scheme,
      revokedAt: event.timestamp,
    },
  };
  mandate.history.push(step);
  return step;
}

/**
 * Grant open banking consent. Emits `psd2.consent_granted` with the scope
 * list embedded — real OBIE consents scope to `accounts` / `payments`, this
 * mock echoes whatever caller passes so tests can assert on custom scopes.
 */
export async function grantConsent(
  adapter: PaymentAdapter,
  input: {
    customerId: string;
    scopes: string[];
    validForMs?: number;
  },
): Promise<AxisStep<'granted'>> {
  const providerEvent = providerEventName(adapter.provider, 'psd2.consent_granted');
  const { event } = adapter.signWebhook({
    type: providerEvent,
    amountCents: 0,
    customerId: input.customerId,
  });
  await adapter.emit(event);
  return {
    neutralEvent: 'psd2.consent_granted',
    providerEvent,
    state: 'granted',
    amountCents: 0,
    metadata: {
      consentId: `cnst_${event.id}`,
      scopes: input.scopes.join(','),
      validForMs: input.validForMs ?? 90 * 24 * 60 * 60 * 1000,
    },
  };
}
