import type { PaymentAdapter } from '../types.js';
import { providerEventName, type AxisStep } from './types.js';

/**
 * Embedded finance axis — Banking-as-a-Service (BaaS) + card issuance +
 * KYC (Know Your Customer) + KYB (Know Your Business) verification.
 * Real embedded finance providers (Stripe Treasury / Unit / Column) let a
 * platform open bank accounts on behalf of end users, issue physical or
 * virtual cards, and run compliance verification without the platform
 * itself becoming a bank. The mock reproduces the observable envelope:
 * account open → KYC / KYB verified → card issued.
 */
export type EmbeddedFinanceState =
  | 'initial'
  | 'account-opened'
  | 'kyc-pending'
  | 'kyc-verified'
  | 'kyb-pending'
  | 'kyb-verified'
  | 'card-issued'
  | 'suspended'
  | 'closed';

export type KycStatus = 'pending' | 'verified' | 'failed';

export interface EmbeddedFinanceConfig {
  /** whether KYB (business verification) is required in addition to KYC */
  requireKyb?: boolean;
  /** minimum score (0-100) required to advance to card issuance */
  minScore?: number;
}

export interface EmbeddedFinanceSession {
  accountId: string;
  customerId: string;
  currency?: string;
  config: Required<EmbeddedFinanceConfig>;
  kycStatus: KycStatus;
  kybStatus: KycStatus;
  kycScore: number;
  cardIds: string[];
  state: EmbeddedFinanceState;
  history: AxisStep<EmbeddedFinanceState>[];
}

const EMBEDDED_DEFAULTS: Required<EmbeddedFinanceConfig> = {
  requireKyb: false,
  minScore: 60,
};

/**
 * Open a fresh BaaS account for the customer.
 */
export async function openAccount(
  adapter: PaymentAdapter,
  input: {
    accountId: string;
    customerId: string;
    currency?: string;
    config?: EmbeddedFinanceConfig;
  },
): Promise<{ session: EmbeddedFinanceSession; step: AxisStep<EmbeddedFinanceState> }> {
  const config: Required<EmbeddedFinanceConfig> = {
    ...EMBEDDED_DEFAULTS,
    ...(input.config ?? {}),
  };
  const session: EmbeddedFinanceSession = {
    accountId: input.accountId,
    customerId: input.customerId,
    config,
    kycStatus: 'pending',
    kybStatus: config.requireKyb ? 'pending' : 'verified',
    kycScore: 0,
    cardIds: [],
    state: 'account-opened',
    history: [],
  };
  if (input.currency !== undefined) session.currency = input.currency;
  const step = await emit(adapter, session, 'embedded.account_opened', {
    accountId: session.accountId,
    requireKyb: config.requireKyb,
  });
  return { session, step };
}

/**
 * Run KYC verification on the account holder. Score is 0-100.
 */
export async function verifyKyc(
  adapter: PaymentAdapter,
  session: EmbeddedFinanceSession,
  input: { score: number },
): Promise<AxisStep<EmbeddedFinanceState>> {
  if (session.state === 'suspended' || session.state === 'closed') {
    throw new Error(`verifyKyc: session is ${session.state}`);
  }
  if (input.score < 0 || input.score > 100) {
    throw new Error('verifyKyc: score must be between 0 and 100');
  }
  session.kycScore = input.score;
  if (input.score >= session.config.minScore) {
    session.kycStatus = 'verified';
    session.state = 'kyc-verified';
  } else {
    session.kycStatus = 'failed';
    session.state = 'suspended';
  }
  return emit(adapter, session, 'embedded.kyc_verified', {
    score: input.score,
    passed: session.kycStatus === 'verified',
  });
}

/**
 * Run KYB (Know Your Business) verification — only meaningful when
 * `config.requireKyb=true`.
 */
export async function verifyKyb(
  adapter: PaymentAdapter,
  session: EmbeddedFinanceSession,
  input: { businessRegistryId: string; verified: boolean },
): Promise<AxisStep<EmbeddedFinanceState>> {
  if (!session.config.requireKyb) {
    throw new Error('verifyKyb: KYB not required for this session');
  }
  session.kybStatus = input.verified ? 'verified' : 'failed';
  session.state = input.verified ? 'kyb-verified' : 'suspended';
  return emit(adapter, session, 'embedded.kyb_verified', {
    businessRegistryId: input.businessRegistryId,
    passed: input.verified,
  });
}

/**
 * Issue a virtual or physical card against the account. Requires KYC
 * verified (and KYB verified when required).
 */
export async function issueCard(
  adapter: PaymentAdapter,
  session: EmbeddedFinanceSession,
  input: { cardId: string; type: 'virtual' | 'physical'; last4: string },
): Promise<AxisStep<EmbeddedFinanceState>> {
  if (session.kycStatus !== 'verified') {
    throw new Error('issueCard: KYC must be verified before issuing a card');
  }
  if (session.config.requireKyb && session.kybStatus !== 'verified') {
    throw new Error('issueCard: KYB must be verified before issuing a card');
  }
  session.cardIds.push(input.cardId);
  session.state = 'card-issued';
  return emit(adapter, session, 'embedded.card_issued', {
    cardId: input.cardId,
    type: input.type,
    last4: input.last4,
    totalCards: session.cardIds.length,
  });
}

/**
 * Close the account — terminal state, no further ops accepted.
 */
export function closeAccount(session: EmbeddedFinanceSession): EmbeddedFinanceSession {
  session.state = 'closed';
  return session;
}

async function emit(
  adapter: PaymentAdapter,
  session: EmbeddedFinanceSession,
  neutral:
    | 'embedded.account_opened'
    | 'embedded.card_issued'
    | 'embedded.kyc_verified'
    | 'embedded.kyb_verified',
  extra: Record<string, string | number | boolean>,
): Promise<AxisStep<EmbeddedFinanceState>> {
  const providerEvent = providerEventName(adapter.provider, neutral);
  const { event } = adapter.signWebhook({
    type: providerEvent,
    amountCents: 0,
    ...(session.currency !== undefined ? { currency: session.currency } : {}),
    customerId: session.customerId,
  });
  await adapter.emit(event);
  const step: AxisStep<EmbeddedFinanceState> = {
    neutralEvent: neutral,
    providerEvent,
    state: session.state,
    amountCents: 0,
    metadata: {
      accountId: session.accountId,
      customerId: session.customerId,
      ...extra,
    },
  };
  session.history.push(step);
  return step;
}
