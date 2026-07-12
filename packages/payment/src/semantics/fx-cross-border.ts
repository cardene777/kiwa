import type { PaymentAdapter } from '../types.js';
import { providerEventName, type AxisStep } from './types.js';

/**
 * FX / cross-border axis — multi-currency rate lock + SWIFT / SEPA
 * settlement + rate expiration. Real cross-border providers (Wise / Airwallex /
 * Currencycloud) quote a rate that stays valid for a fixed window (typically
 * 60-3600 seconds), then settle via SWIFT (global) or SEPA (EU). The mock
 * reproduces rate lock, settlement initiation, settlement completion, and
 * rate expiration.
 */
export type FxState =
  | 'initial'
  | 'rate-locked'
  | 'settlement-initiated'
  | 'settlement-completed'
  | 'expired'
  | 'failed';

export type SettlementRail = 'SWIFT' | 'SEPA' | 'ACH' | 'FASTER' | 'RTGS';

export interface FxRateQuote {
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  quoteId: string;
  lockedAt: number;
  lockExpiresAt: number;
  amountFromCents: number;
  amountToCents: number;
}

export interface FxConfig {
  /** ms the rate lock stays valid */
  rateLockDurationMs?: number;
  /** which settlement rail to use */
  settlementRail?: SettlementRail;
}

export interface FxSession {
  transferId: string;
  customerId: string;
  quote: FxRateQuote | null;
  state: FxState;
  config: Required<FxConfig>;
  settledAmountCents: number;
  history: AxisStep<FxState>[];
}

const FX_DEFAULTS: Required<FxConfig> = {
  rateLockDurationMs: 60_000, // 60 seconds
  settlementRail: 'SWIFT',
};

/**
 * Start a fresh FX session.
 */
export function startFxTransfer(input: {
  transferId: string;
  customerId: string;
  config?: FxConfig;
}): FxSession {
  const config: Required<FxConfig> = {
    ...FX_DEFAULTS,
    ...(input.config ?? {}),
  };
  return {
    transferId: input.transferId,
    customerId: input.customerId,
    quote: null,
    state: 'initial',
    config,
    settledAmountCents: 0,
    history: [],
  };
}

/**
 * Lock an FX rate for the given currency pair + amount. The rate stays
 * valid for `rateLockDurationMs`, after which callers must call
 * `expireRate` and re-lock.
 */
export async function lockRate(
  adapter: PaymentAdapter,
  session: FxSession,
  input: {
    fromCurrency: string;
    toCurrency: string;
    rate: number;
    quoteId: string;
    amountFromCents: number;
  },
): Promise<AxisStep<FxState>> {
  if (input.rate <= 0) {
    throw new Error('lockRate: rate must be positive');
  }
  if (input.amountFromCents <= 0) {
    throw new Error('lockRate: amountFromCents must be positive');
  }
  const now = Date.now();
  const amountToCents = Math.round(input.amountFromCents * input.rate);
  const quote: FxRateQuote = {
    fromCurrency: input.fromCurrency,
    toCurrency: input.toCurrency,
    rate: input.rate,
    quoteId: input.quoteId,
    lockedAt: now,
    lockExpiresAt: now + session.config.rateLockDurationMs,
    amountFromCents: input.amountFromCents,
    amountToCents,
  };
  session.quote = quote;
  session.state = 'rate-locked';
  return emit(adapter, session, 'fx.rate_locked', {
    quoteId: quote.quoteId,
    rate: input.rate,
    fromCurrency: input.fromCurrency,
    toCurrency: input.toCurrency,
    amountToCents,
  });
}

/**
 * Initiate settlement via the configured rail (SWIFT / SEPA / ACH etc.).
 * Rate must not have expired.
 */
export async function initiateSettlement(
  adapter: PaymentAdapter,
  session: FxSession,
  input: { beneficiaryIban?: string; beneficiaryBic?: string },
): Promise<AxisStep<FxState>> {
  if (!session.quote) {
    throw new Error('initiateSettlement: no rate locked');
  }
  if (Date.now() > session.quote.lockExpiresAt) {
    session.state = 'expired';
    throw new Error('initiateSettlement: rate lock expired');
  }
  session.state = 'settlement-initiated';
  return emit(adapter, session, 'fx.settlement_initiated', {
    rail: session.config.settlementRail,
    quoteId: session.quote.quoteId,
    beneficiaryIban: input.beneficiaryIban ?? '',
    beneficiaryBic: input.beneficiaryBic ?? '',
  });
}

/**
 * Complete settlement — funds arrived at the beneficiary bank.
 */
export async function completeSettlement(
  adapter: PaymentAdapter,
  session: FxSession,
  input: { settlementRef: string },
): Promise<AxisStep<FxState>> {
  if (session.state !== 'settlement-initiated') {
    throw new Error(
      `completeSettlement: session is ${session.state}, must be settlement-initiated`,
    );
  }
  /* c8 ignore next 3 -- unreachable: state=settlement-initiated implies quote was locked in initiateSettlement */
  if (!session.quote) {
    throw new Error('completeSettlement: no rate locked');
  }
  session.state = 'settlement-completed';
  session.settledAmountCents = session.quote.amountToCents;
  return emit(adapter, session, 'fx.settlement_completed', {
    settlementRef: input.settlementRef,
    settledAmountCents: session.settledAmountCents,
    rail: session.config.settlementRail,
  });
}

/**
 * Explicitly expire the current rate lock — used when the caller detects
 * the lock window has passed.
 */
export async function expireRate(
  adapter: PaymentAdapter,
  session: FxSession,
): Promise<AxisStep<FxState>> {
  if (!session.quote) {
    throw new Error('expireRate: no rate locked');
  }
  session.state = 'expired';
  return emit(adapter, session, 'fx.rate_expired', {
    quoteId: session.quote.quoteId,
    expiredAt: Date.now(),
  });
}

async function emit(
  adapter: PaymentAdapter,
  session: FxSession,
  neutral:
    | 'fx.rate_locked'
    | 'fx.settlement_initiated'
    | 'fx.settlement_completed'
    | 'fx.rate_expired',
  extra: Record<string, string | number | boolean>,
): Promise<AxisStep<FxState>> {
  const providerEvent = providerEventName(adapter.provider, neutral);
  const amountCents = session.quote?.amountToCents ?? 0;
  const currency = session.quote?.toCurrency;
  const { event } = adapter.signWebhook({
    type: providerEvent,
    amountCents,
    ...(currency !== undefined ? { currency } : {}),
    customerId: session.customerId,
  });
  await adapter.emit(event);
  const step: AxisStep<FxState> = {
    neutralEvent: neutral,
    providerEvent,
    state: session.state,
    amountCents,
    metadata: {
      transferId: session.transferId,
      customerId: session.customerId,
      ...extra,
    },
  };
  session.history.push(step);
  return step;
}
