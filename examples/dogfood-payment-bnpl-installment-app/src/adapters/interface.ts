/**
 * Provider-neutral Payment Adapter surface for the BNPL installment
 * dogfood.
 *
 * The app talks to the plan + risk + collection surface only through this
 * interface. Two implementations exist —
 *  - {@link makeRealAdapter} — drives a real Klarna + Affirm + Afterpay
 *    style BNPL platform (KIWA_KLARNA_API_KEY + KIWA_AFFIRM_API_URL +
 *    KIWA_AFTERPAY_API_URL + KIWA_CREDIT_BUREAU_URL) when `KIWA_MODE=real`
 *    + `BNPL_STACK_READY=1` are set; otherwise every op reports
 *    `KIWA_BNPL_ENV_MISSING`.
 *  - {@link makeMockAdapter} — backed by `@kiwa-test/payment` v0.5 bnpl
 *    semantics (createBnplPlan / scheduleInstallment / scoreRisk /
 *    chargeLateFee / markInstallmentPaid).
 *
 * Both must satisfy the same 15-op contract so behavioural fidelity
 * between real vs mock can be measured side-by-side across the 3 axes
 * v1.41-3 dogfoods —
 *  - plan (plan creation + installment schedule + close)
 *  - risk (soft credit check + threshold check + close)
 *  - collection (late fee charge + mark paid + settle terminal + close)
 *
 * The AC anchors this contract on the 3 domain surfaces the harness runs
 * against both adapters —
 *  - plan-e2e (createPlan + scheduleInstallment)
 *  - risk-e2e (scoreCustomerRisk + checkRiskThreshold)
 *  - collection-e2e (chargeLateFee + markPaid + settlePlan +
 *    checkCollectionStatus)
 * Each spec exercises a distinct subset of the ops below so the fidelity
 * report can point at the ops that diverged.
 */

/** Result of creating a BNPL installment plan. */
export interface PlanCreateResult {
  sessionId: string;
  planId: string;
  customerId: string;
  totalCents: number;
  currency: string;
  installments: number;
  installmentAmountCents: number;
  state: string;
  latencyMs: number;
}

/** Result of scheduling one installment on an existing plan. */
export interface PlanScheduleResult {
  sessionId: string;
  planId: string;
  installmentIndex: number;
  installmentAmountCents: number;
  dueOffsetMs: number;
  state: string;
  latencyMs: number;
}

/** Result of running a soft credit-check risk score on a customer. */
export interface RiskScoreResult {
  sessionId: string;
  planId: string;
  customerId: string;
  score: number;
  minRequired: number;
  passed: boolean;
  creditBureau: string;
  state: string;
  latencyMs: number;
}

/** Result of comparing an aggregate risk score against a plan threshold. */
export interface RiskThresholdResult {
  sessionId: string;
  planId: string;
  aggregateScore: number;
  minRequired: number;
  passed: boolean;
  latencyMs: number;
}

/** Result of charging a late fee for a missed installment. */
export interface CollectionLateFeeResult {
  sessionId: string;
  planId: string;
  installmentIndex: number;
  lateFeeCents: number;
  totalLateFeesCents: number;
  state: string;
  latencyMs: number;
}

/** Result of marking an installment paid on an active plan. */
export interface CollectionMarkPaidResult {
  sessionId: string;
  planId: string;
  installmentsPaid: number;
  installmentsScheduled: number;
  state: string;
  latencyMs: number;
}

/** Result of settling a plan (paid off all installments). */
export interface CollectionSettleResult {
  sessionId: string;
  planId: string;
  installmentsPaid: number;
  totalLateFeesCents: number;
  state: string;
  latencyMs: number;
}

/** Snapshot of the current collection status of a plan. */
export interface CollectionStatusResult {
  sessionId: string;
  planId: string;
  installmentsPaid: number;
  installmentsScheduled: number;
  installmentsRemaining: number;
  totalLateFeesCents: number;
  state: string;
  latencyMs: number;
}

/** Neutral trace event — mock and real adapters emit the same shape. */
export interface TraceEvent {
  op:
    | 'startPlan'
    | 'createPlan'
    | 'scheduleInstallment'
    | 'closePlan'
    | 'startRisk'
    | 'scoreCustomerRisk'
    | 'checkRiskThreshold'
    | 'closeRisk'
    | 'startCollection'
    | 'chargeLateFee'
    | 'markPaid'
    | 'settlePlan'
    | 'checkCollectionStatus'
    | 'closeCollection';
  ok: boolean;
  errorKind?: string;
  detail?: unknown;
}

/** Input for opening a plan session. */
export interface PlanSessionInput {
  sessionId: string;
  provider: 'klarna' | 'affirm' | 'afterpay';
}

/** Input for opening a risk-scoring session. */
export interface RiskSessionInput {
  sessionId: string;
  planId: string;
  creditBureau: 'experian' | 'equifax' | 'transunion' | 'internal';
}

/** Input for opening a collection session. */
export interface CollectionSessionInput {
  sessionId: string;
  planId: string;
}

/** The Payment Adapter — 14 ops across 3 domain surfaces + 3 axes. */
export interface PaymentAdapter {
  readonly mode: 'real' | 'mock';

  // plan surface (plan-e2e axis: create + schedule installments)
  startPlan(input: PlanSessionInput): Promise<void>;
  createPlan(input: {
    sessionId: string;
    planId: string;
    customerId: string;
    totalCents: number;
    currency: string;
    installments: number;
    installmentIntervalMs?: number;
    minRiskScore?: number;
    lateFeeCents?: number;
  }): Promise<PlanCreateResult>;
  scheduleInstallment(input: {
    sessionId: string;
    planId: string;
  }): Promise<PlanScheduleResult>;
  closePlan(input: { sessionId: string }): Promise<void>;

  // risk surface (risk-e2e axis: score + threshold)
  startRisk(input: RiskSessionInput): Promise<void>;
  scoreCustomerRisk(input: {
    sessionId: string;
    planId: string;
    score: number;
    minRequired: number;
  }): Promise<RiskScoreResult>;
  checkRiskThreshold(input: {
    sessionId: string;
    planId: string;
    aggregateScore: number;
    minRequired: number;
  }): Promise<RiskThresholdResult>;
  closeRisk(input: { sessionId: string }): Promise<void>;

  // collection surface (collection-e2e axis: late fee + mark paid + settle)
  startCollection(input: CollectionSessionInput): Promise<void>;
  chargeLateFee(input: {
    sessionId: string;
    planId: string;
    installmentIndex: number;
  }): Promise<CollectionLateFeeResult>;
  markPaid(input: {
    sessionId: string;
    planId: string;
  }): Promise<CollectionMarkPaidResult>;
  settlePlan(input: {
    sessionId: string;
    planId: string;
  }): Promise<CollectionSettleResult>;
  checkCollectionStatus(input: {
    sessionId: string;
    planId: string;
  }): Promise<CollectionStatusResult>;
  closeCollection(input: { sessionId: string }): Promise<void>;

  /** trace snapshot — used by the fidelity harness. */
  traces(): readonly TraceEvent[];

  /** clear all state — invoked between test cases. */
  reset(): Promise<void>;
}
