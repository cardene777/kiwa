import type { PaymentAdapter } from '../types.js';
import { providerEventName, type AxisStep } from './types.js';

/**
 * Revenue recovery axis — smart retry + dunning cascade + card updater +
 * network tokenization. Real providers combine 4 mechanisms to recover
 * failed payments: intelligent retry timing (Stripe Smart Retries), a
 * multi-step dunning cascade (email + in-app + SMS), the card updater
 * network to refresh expired cards, and network tokenization to survive
 * card re-issue events without re-collecting PAN.
 */
export type RecoveryState =
  | 'initial'
  | 'smart-retry-scheduled'
  | 'dunning-cascade'
  | 'card-updated'
  | 'network-tokenized'
  | 'recovered'
  | 'lost';

export interface RecoveryConfig {
  /** cascade step definitions ordered by fire time */
  cascade?: Array<'email' | 'in-app' | 'sms' | 'push'>;
  /** ms between cascade steps */
  cascadeStepMs?: number;
  /** whether the merchant subscribes to card updater */
  cardUpdaterEnabled?: boolean;
  /** whether the merchant uses network tokenization */
  networkTokenizationEnabled?: boolean;
}

export interface RecoverySession {
  invoiceId: string;
  amountCents: number;
  customerId: string;
  currency?: string;
  state: RecoveryState;
  config: Required<RecoveryConfig>;
  cascadeStepIndex: number;
  history: AxisStep<RecoveryState>[];
}

const RECOVERY_DEFAULTS: Required<RecoveryConfig> = {
  cascade: ['email', 'in-app', 'sms'],
  cascadeStepMs: 24 * 60 * 60 * 1000,
  cardUpdaterEnabled: true,
  networkTokenizationEnabled: true,
};

/**
 * Start a recovery session. The initial failed charge is assumed to have
 * been emitted through the base adapter already.
 */
export function startRecovery(input: {
  invoiceId: string;
  amountCents: number;
  customerId: string;
  currency?: string;
  config?: RecoveryConfig;
}): RecoverySession {
  const config: Required<RecoveryConfig> = {
    ...RECOVERY_DEFAULTS,
    ...(input.config ?? {}),
  };
  const session: RecoverySession = {
    invoiceId: input.invoiceId,
    amountCents: input.amountCents,
    customerId: input.customerId,
    state: 'initial',
    config,
    cascadeStepIndex: 0,
    history: [],
  };
  if (input.currency !== undefined) session.currency = input.currency;
  return session;
}

/**
 * Schedule the next smart retry. Emits `recovery.smart_retry_scheduled`
 * with the computed backoff and priority hint. Real Stripe uses ML to
 * predict optimal retry times; the mock uses linear cascade timing.
 */
export async function scheduleSmartRetry(
  adapter: PaymentAdapter,
  session: RecoverySession,
): Promise<AxisStep<RecoveryState>> {
  if (session.state === 'recovered' || session.state === 'lost') {
    throw new Error(`scheduleSmartRetry: session already ${session.state}`);
  }
  session.state = 'smart-retry-scheduled';
  return emit(adapter, session, 'recovery.smart_retry_scheduled', {
    priority: 'high',
    backoffMs: session.config.cascadeStepMs,
  });
}

/**
 * Advance the dunning cascade one step. Emits `recovery.dunning_cascade_step`
 * with the channel (email / in-app / sms / push) and step index.
 */
export async function advanceCascade(
  adapter: PaymentAdapter,
  session: RecoverySession,
): Promise<AxisStep<RecoveryState>> {
  if (session.state === 'recovered' || session.state === 'lost') {
    throw new Error(`advanceCascade: session already ${session.state}`);
  }
  if (session.cascadeStepIndex >= session.config.cascade.length) {
    session.state = 'lost';
    throw new Error('advanceCascade: cascade exhausted');
  }
  const channel = session.config.cascade[session.cascadeStepIndex];
  if (channel === undefined) {
    throw new Error('advanceCascade: cascade step index out of range');
  }
  session.cascadeStepIndex += 1;
  session.state = 'dunning-cascade';
  return emit(adapter, session, 'recovery.dunning_cascade_step', {
    channel,
    stepIndex: session.cascadeStepIndex,
    stepsRemaining: session.config.cascade.length - session.cascadeStepIndex,
  });
}

/**
 * Card updater ran — customer's expiring card was refreshed via the
 * network. Emits `recovery.card_updated` with the new PAN suffix hint.
 */
export async function applyCardUpdate(
  adapter: PaymentAdapter,
  session: RecoverySession,
  input: { last4: string; expMonth: number; expYear: number },
): Promise<AxisStep<RecoveryState>> {
  if (!session.config.cardUpdaterEnabled) {
    throw new Error('applyCardUpdate: cardUpdater disabled in config');
  }
  session.state = 'card-updated';
  return emit(adapter, session, 'recovery.card_updated', {
    last4: input.last4,
    expMonth: input.expMonth,
    expYear: input.expYear,
  });
}

/**
 * Network tokenization applied — customer card issued a network token
 * that survives PAN re-issue.
 */
export async function applyNetworkToken(
  adapter: PaymentAdapter,
  session: RecoverySession,
  input: { networkTokenId: string },
): Promise<AxisStep<RecoveryState>> {
  if (!session.config.networkTokenizationEnabled) {
    throw new Error('applyNetworkToken: networkTokenization disabled in config');
  }
  session.state = 'network-tokenized';
  return emit(adapter, session, 'recovery.network_tokenized', {
    networkTokenId: input.networkTokenId,
  });
}

/**
 * Mark the recovery terminal — succeeded (recovered) or exhausted (lost).
 */
export function finalizeRecovery(
  session: RecoverySession,
  input: { succeed: boolean },
): RecoverySession {
  session.state = input.succeed ? 'recovered' : 'lost';
  return session;
}

async function emit(
  adapter: PaymentAdapter,
  session: RecoverySession,
  neutral:
    | 'recovery.smart_retry_scheduled'
    | 'recovery.dunning_cascade_step'
    | 'recovery.card_updated'
    | 'recovery.network_tokenized',
  extra: Record<string, string | number | boolean>,
): Promise<AxisStep<RecoveryState>> {
  const providerEvent = providerEventName(adapter.provider, neutral);
  const { event } = adapter.signWebhook({
    type: providerEvent,
    amountCents: session.amountCents,
    ...(session.currency !== undefined ? { currency: session.currency } : {}),
    customerId: session.customerId,
  });
  await adapter.emit(event);
  const step: AxisStep<RecoveryState> = {
    neutralEvent: neutral,
    providerEvent,
    state: session.state,
    amountCents: session.amountCents,
    metadata: {
      invoiceId: session.invoiceId,
      ...extra,
    },
  };
  session.history.push(step);
  return step;
}
