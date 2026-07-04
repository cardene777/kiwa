import type { PaymentAdapter } from '../types.js';
import { providerEventName, type AxisStep } from './types.js';

/**
 * Dunning — payment retry sequence for a failed invoice. Real providers all
 * run a scheduled retry cadence (Stripe Smart Retries default = 4 attempts
 * over ~1 week, Paddle's dunning follows the merchant-configured schedule,
 * Lemon Squeezy retries 4 times over 14 days). The mock reproduces the
 * user-observable envelope: N attempts, each with a delay window, a grace
 * period between last attempt and terminal state, and a notification hook
 * that fires on every attempt.
 */
export type DunningState =
  | 'active'
  | 'in-grace-period'
  | 'recovered'
  | 'exhausted';

export interface DunningConfig {
  /** attempts total (1st attempt included) */
  maxAttempts?: number;
  /** ms between attempts */
  retryIntervalMs?: number;
  /** ms grace period between last failed attempt and terminal state */
  gracePeriodMs?: number;
}

export interface DunningSession {
  invoiceId: string;
  amountCents: number;
  customerId: string;
  currency?: string;
  attempt: number;
  state: DunningState;
  config: Required<DunningConfig>;
  history: AxisStep<DunningState>[];
}

const DUNNING_DEFAULTS: Required<DunningConfig> = {
  maxAttempts: 4,
  retryIntervalMs: 3 * 24 * 60 * 60 * 1000,
  gracePeriodMs: 24 * 60 * 60 * 1000,
};

/**
 * Start a dunning session. No webhook is emitted at start — the initial
 * failed charge is assumed to have been emitted via `signWebhook` /
 * `checkoutCompleted` etc. Call {@link dunningAttempt} to drive the retry
 * sequence.
 */
export function startDunning(input: {
  invoiceId: string;
  amountCents: number;
  customerId: string;
  currency?: string;
  config?: DunningConfig;
}): DunningSession {
  const config = { ...DUNNING_DEFAULTS, ...(input.config ?? {}) };
  const session: DunningSession = {
    invoiceId: input.invoiceId,
    amountCents: input.amountCents,
    customerId: input.customerId,
    attempt: 0,
    state: 'active',
    config,
    history: [],
  };
  if (input.currency !== undefined) session.currency = input.currency;
  return session;
}

/**
 * Run the next dunning attempt. Emits `dunning.attempt` on every retry,
 * transitions to `in-grace-period` after the last configured attempt, and
 * finalises to `exhausted` when `finalizeDunning` is called with `succeed:
 * false` (or `recovered` with `succeed: true`).
 */
export async function dunningAttempt(
  adapter: PaymentAdapter,
  session: DunningSession,
): Promise<AxisStep<DunningState>> {
  if (session.state !== 'active') {
    throw new Error(`dunningAttempt: session is ${session.state}, cannot attempt`);
  }
  session.attempt += 1;
  const isLast = session.attempt >= session.config.maxAttempts;
  const providerEvent = providerEventName(adapter.provider, 'dunning.attempt');
  const { event } = adapter.signWebhook({
    type: providerEvent,
    amountCents: session.amountCents,
    ...(session.currency !== undefined ? { currency: session.currency } : {}),
    customerId: session.customerId,
  });
  await adapter.emit(event);
  if (isLast) session.state = 'in-grace-period';
  const step: AxisStep<DunningState> = {
    neutralEvent: 'dunning.attempt',
    providerEvent,
    state: session.state,
    amountCents: session.amountCents,
    metadata: {
      invoiceId: session.invoiceId,
      attempt: session.attempt,
      remainingAttempts: Math.max(0, session.config.maxAttempts - session.attempt),
      graceEndsAt: isLast ? event.timestamp + session.config.gracePeriodMs : 0,
    },
  };
  session.history.push(step);
  return step;
}

/**
 * Terminal step — either the last attempt succeeded during grace period
 * (`succeed: true` → `dunning.recovered`), or the grace period elapsed
 * (`succeed: false` → `dunning.exhausted`).
 */
export async function finalizeDunning(
  adapter: PaymentAdapter,
  session: DunningSession,
  input: { succeed: boolean },
): Promise<AxisStep<DunningState>> {
  if (session.state === 'recovered' || session.state === 'exhausted') {
    throw new Error(`finalizeDunning: session already ${session.state}`);
  }
  const neutral = input.succeed ? 'dunning.recovered' : 'dunning.exhausted';
  const providerEvent = providerEventName(adapter.provider, neutral);
  const { event } = adapter.signWebhook({
    type: providerEvent,
    amountCents: input.succeed ? session.amountCents : 0,
    ...(session.currency !== undefined ? { currency: session.currency } : {}),
    customerId: session.customerId,
  });
  await adapter.emit(event);
  session.state = input.succeed ? 'recovered' : 'exhausted';
  const step: AxisStep<DunningState> = {
    neutralEvent: neutral,
    providerEvent,
    state: session.state,
    amountCents: event.amountCents,
    metadata: {
      invoiceId: session.invoiceId,
      totalAttempts: session.attempt,
    },
  };
  session.history.push(step);
  return step;
}
