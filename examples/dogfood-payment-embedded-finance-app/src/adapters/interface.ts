/**
 * Provider-neutral Payment Adapter surface for the embedded finance dogfood.
 *
 * The app talks to the treasury + card + kyc surface only through this
 * interface. Two implementations exist —
 *  - {@link makeRealAdapter} — drives a real Stripe Treasury + Unit + Column
 *    style BaaS platform (KIWA_STRIPE_TREASURY_KEY + KIWA_UNIT_API_URL +
 *    KIWA_COLUMN_API_URL + KIWA_KYC_PROVIDER_URL) when `KIWA_MODE=real` +
 *    `EMBEDDED_FINANCE_STACK_READY=1` are set; otherwise every op reports
 *    `KIWA_EMBEDDED_FINANCE_ENV_MISSING`.
 *  - {@link makeMockAdapter} — backed by `@kiwa-test/payment` v0.5
 *    embedded-finance semantics (openAccount / verifyKyc / verifyKyb /
 *    issueCard / closeAccount).
 *
 * Both must satisfy the same 15-op contract so behavioural fidelity between
 * real vs mock can be measured side-by-side across the 3 axes v1.41-2
 * dogfoods —
 *  - treasury (account open + funding transfers + close)
 *  - card (card issue + activate + spend)
 *  - kyc (individual verify + business verify + score threshold)
 *
 * The AC anchors this contract on the 3 domain surfaces the harness runs
 * against both adapters —
 *  - treasury-e2e (openAccount + fundAccount + transferFunds)
 *  - card-e2e (issueCard + activateCard + spendCard)
 *  - kyc-e2e (verifyIndividual + verifyBusiness + checkScoreThreshold)
 * Each spec exercises a distinct subset of the ops below so the fidelity
 * report can point at the ops that diverged.
 */

/** Result of opening a Treasury / BaaS account. */
export interface TreasuryOpenResult {
  sessionId: string;
  accountId: string;
  currency: string;
  latencyMs: number;
}

/** Result of funding a BaaS account with an initial balance. */
export interface TreasuryFundResult {
  sessionId: string;
  accountId: string;
  amountCents: number;
  currency: string;
  balanceCents: number;
  latencyMs: number;
}

/** Result of transferring funds between two BaaS accounts. */
export interface TreasuryTransferResult {
  sessionId: string;
  fromAccountId: string;
  toAccountId: string;
  amountCents: number;
  currency: string;
  succeeded: boolean;
  latencyMs: number;
}

/** Result of issuing a virtual or physical card against a BaaS account. */
export interface CardIssueResult {
  sessionId: string;
  accountId: string;
  cardId: string;
  type: 'virtual' | 'physical';
  last4: string;
  status: 'inactive' | 'active';
  latencyMs: number;
}

/** Result of activating a previously issued card. */
export interface CardActivateResult {
  sessionId: string;
  cardId: string;
  status: 'active';
  latencyMs: number;
}

/** Result of a card spend request (approve or decline). */
export interface CardSpendResult {
  sessionId: string;
  cardId: string;
  amountCents: number;
  currency: string;
  approved: boolean;
  reason: string;
  latencyMs: number;
}

/** Result of KYC (individual identity) verification. */
export interface KycVerifyResult {
  sessionId: string;
  customerId: string;
  score: number;
  passed: boolean;
  latencyMs: number;
}

/** Result of KYB (business identity) verification. */
export interface KybVerifyResult {
  sessionId: string;
  businessId: string;
  registryOk: boolean;
  passed: boolean;
  latencyMs: number;
}

/** Result of comparing an aggregate KYC / KYB score against a threshold. */
export interface KycThresholdResult {
  sessionId: string;
  aggregateScore: number;
  minRequired: number;
  passed: boolean;
  latencyMs: number;
}

/** Neutral trace event — mock and real adapters emit the same shape. */
export interface TraceEvent {
  op:
    | 'startTreasury'
    | 'openAccount'
    | 'fundAccount'
    | 'transferFunds'
    | 'closeTreasury'
    | 'startCard'
    | 'issueCard'
    | 'activateCard'
    | 'spendCard'
    | 'closeCard'
    | 'startKyc'
    | 'verifyIndividual'
    | 'verifyBusiness'
    | 'checkScoreThreshold'
    | 'closeKyc';
  ok: boolean;
  errorKind?: string;
  detail?: unknown;
}

/** Input for opening a treasury session. */
export interface TreasurySessionInput {
  sessionId: string;
  provider: 'stripe-treasury' | 'unit' | 'column';
}

/** Input for opening a card session. */
export interface CardSessionInput {
  sessionId: string;
  accountId: string;
}

/** Input for opening a KYC / KYB session. */
export interface KycSessionInput {
  sessionId: string;
  customerId: string;
  provider: 'stripe-treasury' | 'unit' | 'column' | 'persona';
}

/** The Payment Adapter — 15 ops across 3 domain surfaces + 3 axes. */
export interface PaymentAdapter {
  readonly mode: 'real' | 'mock';

  // treasury surface (treasury-e2e axis: account + fund + transfer)
  startTreasury(input: TreasurySessionInput): Promise<void>;
  openAccount(input: {
    sessionId: string;
    accountId: string;
    customerId: string;
    currency: string;
  }): Promise<TreasuryOpenResult>;
  fundAccount(input: {
    sessionId: string;
    accountId: string;
    amountCents: number;
    currency: string;
  }): Promise<TreasuryFundResult>;
  transferFunds(input: {
    sessionId: string;
    fromAccountId: string;
    toAccountId: string;
    amountCents: number;
    currency: string;
  }): Promise<TreasuryTransferResult>;
  closeTreasury(input: { sessionId: string }): Promise<void>;

  // card surface (card-e2e axis: issue + activate + spend)
  startCard(input: CardSessionInput): Promise<void>;
  issueCard(input: {
    sessionId: string;
    cardId: string;
    type: 'virtual' | 'physical';
    last4: string;
  }): Promise<CardIssueResult>;
  activateCard(input: {
    sessionId: string;
    cardId: string;
  }): Promise<CardActivateResult>;
  spendCard(input: {
    sessionId: string;
    cardId: string;
    amountCents: number;
    currency: string;
    availableBalanceCents: number;
  }): Promise<CardSpendResult>;
  closeCard(input: { sessionId: string }): Promise<void>;

  // kyc surface (kyc-e2e axis: individual + business + threshold)
  startKyc(input: KycSessionInput): Promise<void>;
  verifyIndividual(input: {
    sessionId: string;
    score: number;
    minScore: number;
  }): Promise<KycVerifyResult>;
  verifyBusiness(input: {
    sessionId: string;
    businessId: string;
    registryOk: boolean;
  }): Promise<KybVerifyResult>;
  checkScoreThreshold(input: {
    sessionId: string;
    aggregateScore: number;
    minRequired: number;
  }): Promise<KycThresholdResult>;
  closeKyc(input: { sessionId: string }): Promise<void>;

  /** trace snapshot — used by the fidelity harness. */
  traces(): readonly TraceEvent[];

  /** clear all state — invoked between test cases. */
  reset(): Promise<void>;
}
