/**
 * Mock adapter — drives `@kiwa-lab/payment` v0.5 embedded-finance
 * semantics (openAccount / verifyKyc / verifyKyb / issueCard /
 * closeAccount) so the same app code exercises a deterministic BaaS
 * ceremony without a real Stripe Treasury / Unit / Column endpoint. Both
 * mock and real adapters satisfy {@link PaymentAdapter}, so the fidelity
 * harness can diff them side-by-side.
 *
 * State model — one session per (sessionId) tuple across each surface;
 * each session is isolated so per-surface metrics stay separated. The
 * treasury surface owns the BaaS account + funding + transfer envelope;
 * the card surface owns issuance + activation + spend authorization; the
 * kyc surface owns individual + business verify + aggregate threshold.
 *
 * The mock intentionally piggy-backs on the v0.5 embedded-finance
 * semantics EmbeddedFinanceSession — every op appends the matching
 * neutral event into the trace so the fidelity harness can assert the
 * mock and real adapters produce identical event orderings.
 */

import {
  createStripeMock,
  openAccount as openAccountSem,
  verifyKyc as verifyKycSem,
  verifyKyb as verifyKybSem,
  issueCard as issueCardSem,
  closeAccount as closeAccountSem,
  type EmbeddedFinanceSession,
  type PaymentAdapter as PaymentWebhookAdapter,
} from '@kiwa-lab/payment';
import type {
  CardActivateResult,
  CardIssueResult,
  CardSpendResult,
  KybVerifyResult,
  KycThresholdResult,
  KycVerifyResult,
  PaymentAdapter,
  TraceEvent,
  TreasuryFundResult,
  TreasuryOpenResult,
  TreasuryTransferResult,
} from './interface.js';

export interface MakeMockAdapterOptions {
  /** artificial latency injected into every mock op (ms、 default 1). */
  latencyMs?: number;
  /**
   * Initial webhook adapter used to drive the v0.5 semantics helpers.
   * Defaults to a stripe mock so the neutral event names emit under the
   * `stripe.*` provider vocabulary. Tests that want a paddle / lemonsqueezy
   * flavour can inject one here.
   */
  webhookAdapter?: PaymentWebhookAdapter;
}

interface TreasurySessionState {
  sessionId: string;
  provider: 'stripe-treasury' | 'unit' | 'column';
  accounts: Map<string, {
    embedded: EmbeddedFinanceSession;
    balanceCents: number;
    currency: string;
  }>;
  closed: boolean;
}

interface CardSessionState {
  sessionId: string;
  accountId: string;
  /** cardId → { last4, status } */
  cards: Map<string, { last4: string; status: 'inactive' | 'active' }>;
  closed: boolean;
}

interface KycSessionState {
  sessionId: string;
  customerId: string;
  embedded: EmbeddedFinanceSession;
  closed: boolean;
}

export function makeMockAdapter(opts: MakeMockAdapterOptions = {}): PaymentAdapter {
  const latencyMs = opts.latencyMs ?? 1;
  const webhookAdapter =
    opts.webhookAdapter ?? createStripeMock({ secret: 'whsec_dogfood_embedded' });
  const trace: TraceEvent[] = [];
  const treasury = new Map<string, TreasurySessionState>();
  const cards = new Map<string, CardSessionState>();
  const kyc = new Map<string, KycSessionState>();

  function record(
    op: TraceEvent['op'],
    ok: boolean,
    extra?: Partial<TraceEvent>,
  ): void {
    const entry: TraceEvent = { op, ok };
    if (extra?.errorKind !== undefined) entry.errorKind = extra.errorKind;
    if (extra?.detail !== undefined) entry.detail = extra.detail;
    trace.push(entry);
  }

  function coerceErrorKind(err: unknown): string {
    if (err instanceof Error) return err.message;
    return 'unknown_error';
  }

  return {
    mode: 'mock',

    async startTreasury(input) {
      if (treasury.has(input.sessionId)) {
        record('startTreasury', false, { errorKind: 'treasury_session_exists' });
        throw new Error('treasury_session_exists');
      }
      treasury.set(input.sessionId, {
        sessionId: input.sessionId,
        provider: input.provider,
        accounts: new Map(),
        closed: false,
      });
      record('startTreasury', true, {
        detail: { sessionId: input.sessionId, provider: input.provider },
      });
    },

    async openAccount(input) {
      const session = treasury.get(input.sessionId);
      if (!session) {
        record('openAccount', false, { errorKind: 'treasury_session_not_found' });
        throw new Error('treasury_session_not_found');
      }
      if (session.closed) {
        record('openAccount', false, { errorKind: 'treasury_session_closed' });
        throw new Error('treasury_session_closed');
      }
      if (session.accounts.has(input.accountId)) {
        record('openAccount', false, { errorKind: 'account_already_open' });
        throw new Error('account_already_open');
      }
      try {
        const { session: embedded } = await openAccountSem(webhookAdapter, {
          accountId: input.accountId,
          customerId: input.customerId,
          currency: input.currency,
          config: { requireKyb: false, minScore: 60 },
        });
        session.accounts.set(input.accountId, {
          embedded,
          balanceCents: 0,
          currency: input.currency,
        });
        const result: TreasuryOpenResult = {
          sessionId: input.sessionId,
          accountId: input.accountId,
          currency: input.currency,
          latencyMs,
        };
        record('openAccount', true, { detail: result });
        return result;
      } catch (err) {
        record('openAccount', false, { errorKind: coerceErrorKind(err) });
        throw err;
      }
    },

    async fundAccount(input) {
      const session = treasury.get(input.sessionId);
      if (!session) {
        record('fundAccount', false, { errorKind: 'treasury_session_not_found' });
        throw new Error('treasury_session_not_found');
      }
      const account = session.accounts.get(input.accountId);
      if (!account) {
        record('fundAccount', false, { errorKind: 'account_not_found' });
        throw new Error('account_not_found');
      }
      if (input.currency !== account.currency) {
        record('fundAccount', false, { errorKind: 'currency_mismatch' });
        throw new Error('currency_mismatch');
      }
      if (input.amountCents <= 0) {
        record('fundAccount', false, { errorKind: 'amount_must_be_positive' });
        throw new Error('amount_must_be_positive');
      }
      account.balanceCents += input.amountCents;
      const result: TreasuryFundResult = {
        sessionId: input.sessionId,
        accountId: input.accountId,
        amountCents: input.amountCents,
        currency: input.currency,
        balanceCents: account.balanceCents,
        latencyMs,
      };
      record('fundAccount', true, { detail: result });
      return result;
    },

    async transferFunds(input) {
      const session = treasury.get(input.sessionId);
      if (!session) {
        record('transferFunds', false, { errorKind: 'treasury_session_not_found' });
        throw new Error('treasury_session_not_found');
      }
      const from = session.accounts.get(input.fromAccountId);
      if (!from) {
        record('transferFunds', false, { errorKind: 'from_account_not_found' });
        throw new Error('from_account_not_found');
      }
      const to = session.accounts.get(input.toAccountId);
      if (!to) {
        record('transferFunds', false, { errorKind: 'to_account_not_found' });
        throw new Error('to_account_not_found');
      }
      if (input.currency !== from.currency || input.currency !== to.currency) {
        record('transferFunds', false, { errorKind: 'currency_mismatch' });
        throw new Error('currency_mismatch');
      }
      if (input.amountCents <= 0) {
        record('transferFunds', false, { errorKind: 'amount_must_be_positive' });
        throw new Error('amount_must_be_positive');
      }
      const succeeded = from.balanceCents >= input.amountCents;
      if (succeeded) {
        from.balanceCents -= input.amountCents;
        to.balanceCents += input.amountCents;
      }
      const result: TreasuryTransferResult = {
        sessionId: input.sessionId,
        fromAccountId: input.fromAccountId,
        toAccountId: input.toAccountId,
        amountCents: input.amountCents,
        currency: input.currency,
        succeeded,
        latencyMs,
      };
      record('transferFunds', true, { detail: result });
      return result;
    },

    async closeTreasury(input) {
      const session = treasury.get(input.sessionId);
      if (!session) {
        record('closeTreasury', false, { errorKind: 'treasury_session_not_found' });
        throw new Error('treasury_session_not_found');
      }
      session.closed = true;
      for (const [, account] of session.accounts) {
        closeAccountSem(account.embedded);
      }
      treasury.delete(input.sessionId);
      record('closeTreasury', true, { detail: { sessionId: input.sessionId } });
    },

    async startCard(input) {
      if (cards.has(input.sessionId)) {
        record('startCard', false, { errorKind: 'card_session_exists' });
        throw new Error('card_session_exists');
      }
      cards.set(input.sessionId, {
        sessionId: input.sessionId,
        accountId: input.accountId,
        cards: new Map(),
        closed: false,
      });
      record('startCard', true, {
        detail: { sessionId: input.sessionId, accountId: input.accountId },
      });
    },

    async issueCard(input) {
      const session = cards.get(input.sessionId);
      if (!session) {
        record('issueCard', false, { errorKind: 'card_session_not_found' });
        throw new Error('card_session_not_found');
      }
      if (session.closed) {
        record('issueCard', false, { errorKind: 'card_session_closed' });
        throw new Error('card_session_closed');
      }
      if (session.cards.has(input.cardId)) {
        record('issueCard', false, { errorKind: 'card_already_issued' });
        throw new Error('card_already_issued');
      }
      if (input.last4.length !== 4 || !/^\d{4}$/.test(input.last4)) {
        record('issueCard', false, { errorKind: 'last4_must_be_4_digits' });
        throw new Error('last4_must_be_4_digits');
      }
      session.cards.set(input.cardId, { last4: input.last4, status: 'inactive' });
      const result: CardIssueResult = {
        sessionId: input.sessionId,
        accountId: session.accountId,
        cardId: input.cardId,
        type: input.type,
        last4: input.last4,
        status: 'inactive',
        latencyMs,
      };
      record('issueCard', true, { detail: result });
      return result;
    },

    async activateCard(input) {
      const session = cards.get(input.sessionId);
      if (!session) {
        record('activateCard', false, { errorKind: 'card_session_not_found' });
        throw new Error('card_session_not_found');
      }
      const card = session.cards.get(input.cardId);
      if (!card) {
        record('activateCard', false, { errorKind: 'card_not_found' });
        throw new Error('card_not_found');
      }
      if (card.status === 'active') {
        record('activateCard', false, { errorKind: 'card_already_active' });
        throw new Error('card_already_active');
      }
      card.status = 'active';
      const result: CardActivateResult = {
        sessionId: input.sessionId,
        cardId: input.cardId,
        status: 'active',
        latencyMs,
      };
      record('activateCard', true, { detail: result });
      return result;
    },

    async spendCard(input) {
      const session = cards.get(input.sessionId);
      if (!session) {
        record('spendCard', false, { errorKind: 'card_session_not_found' });
        throw new Error('card_session_not_found');
      }
      const card = session.cards.get(input.cardId);
      if (!card) {
        record('spendCard', false, { errorKind: 'card_not_found' });
        throw new Error('card_not_found');
      }
      if (input.amountCents <= 0) {
        record('spendCard', false, { errorKind: 'amount_must_be_positive' });
        throw new Error('amount_must_be_positive');
      }
      let approved: boolean;
      let reason: string;
      if (card.status !== 'active') {
        approved = false;
        reason = 'card_inactive';
      } else if (input.amountCents > input.availableBalanceCents) {
        approved = false;
        reason = 'insufficient_funds';
      } else {
        approved = true;
        reason = 'approved';
      }
      const result: CardSpendResult = {
        sessionId: input.sessionId,
        cardId: input.cardId,
        amountCents: input.amountCents,
        currency: input.currency,
        approved,
        reason,
        latencyMs,
      };
      record('spendCard', true, { detail: result });
      return result;
    },

    async closeCard(input) {
      if (!cards.has(input.sessionId)) {
        record('closeCard', false, { errorKind: 'card_session_not_found' });
        throw new Error('card_session_not_found');
      }
      cards.delete(input.sessionId);
      record('closeCard', true, { detail: { sessionId: input.sessionId } });
    },

    async startKyc(input) {
      if (kyc.has(input.sessionId)) {
        record('startKyc', false, { errorKind: 'kyc_session_exists' });
        throw new Error('kyc_session_exists');
      }
      try {
        const { session: embedded } = await openAccountSem(webhookAdapter, {
          accountId: `${input.sessionId}-kyc-shell`,
          customerId: input.customerId,
          config: { requireKyb: true, minScore: 60 },
        });
        kyc.set(input.sessionId, {
          sessionId: input.sessionId,
          customerId: input.customerId,
          embedded,
          closed: false,
        });
        record('startKyc', true, {
          detail: {
            sessionId: input.sessionId,
            customerId: input.customerId,
            provider: input.provider,
          },
        });
      } catch (err) {
        record('startKyc', false, { errorKind: coerceErrorKind(err) });
        throw err;
      }
    },

    async verifyIndividual(input) {
      const session = kyc.get(input.sessionId);
      if (!session) {
        record('verifyIndividual', false, { errorKind: 'kyc_session_not_found' });
        throw new Error('kyc_session_not_found');
      }
      if (session.closed) {
        record('verifyIndividual', false, { errorKind: 'kyc_session_closed' });
        throw new Error('kyc_session_closed');
      }
      if (input.score < 0 || input.score > 100) {
        record('verifyIndividual', false, {
          errorKind: 'score_out_of_range',
        });
        throw new Error('score_out_of_range');
      }
      // Sync the semantics minScore with the caller so the semantics-side
      // pass/fail matches the adapter-side pass/fail.
      session.embedded.config.minScore = input.minScore;
      try {
        await verifyKycSem(webhookAdapter, session.embedded, { score: input.score });
        const passed = session.embedded.kycStatus === 'verified';
        const result: KycVerifyResult = {
          sessionId: input.sessionId,
          customerId: session.customerId,
          score: input.score,
          passed,
          latencyMs,
        };
        record('verifyIndividual', true, { detail: result });
        return result;
      } catch (err) {
        record('verifyIndividual', false, { errorKind: coerceErrorKind(err) });
        throw err;
      }
    },

    async verifyBusiness(input) {
      const session = kyc.get(input.sessionId);
      if (!session) {
        record('verifyBusiness', false, { errorKind: 'kyc_session_not_found' });
        throw new Error('kyc_session_not_found');
      }
      if (session.closed) {
        record('verifyBusiness', false, { errorKind: 'kyc_session_closed' });
        throw new Error('kyc_session_closed');
      }
      if (!input.businessId) {
        record('verifyBusiness', false, { errorKind: 'business_id_required' });
        throw new Error('business_id_required');
      }
      try {
        await verifyKybSem(webhookAdapter, session.embedded, {
          businessRegistryId: input.businessId,
          verified: input.registryOk,
        });
        const passed = session.embedded.kybStatus === 'verified';
        const result: KybVerifyResult = {
          sessionId: input.sessionId,
          businessId: input.businessId,
          registryOk: input.registryOk,
          passed,
          latencyMs,
        };
        record('verifyBusiness', true, { detail: result });
        return result;
      } catch (err) {
        record('verifyBusiness', false, { errorKind: coerceErrorKind(err) });
        throw err;
      }
    },

    async checkScoreThreshold(input) {
      const session = kyc.get(input.sessionId);
      if (!session) {
        record('checkScoreThreshold', false, { errorKind: 'kyc_session_not_found' });
        throw new Error('kyc_session_not_found');
      }
      if (input.minRequired < 0 || input.minRequired > 100) {
        record('checkScoreThreshold', false, {
          errorKind: 'min_required_out_of_range',
        });
        throw new Error('min_required_out_of_range');
      }
      const passed = input.aggregateScore >= input.minRequired;
      const result: KycThresholdResult = {
        sessionId: input.sessionId,
        aggregateScore: input.aggregateScore,
        minRequired: input.minRequired,
        passed,
        latencyMs,
      };
      record('checkScoreThreshold', true, { detail: result });
      return result;
    },

    async closeKyc(input) {
      const session = kyc.get(input.sessionId);
      if (!session) {
        record('closeKyc', false, { errorKind: 'kyc_session_not_found' });
        throw new Error('kyc_session_not_found');
      }
      session.closed = true;
      closeAccountSem(session.embedded);
      kyc.delete(input.sessionId);
      record('closeKyc', true, { detail: { sessionId: input.sessionId } });
    },

    traces() {
      return trace;
    },

    async reset() {
      trace.length = 0;
      treasury.clear();
      cards.clear();
      kyc.clear();
    },
  };
}
