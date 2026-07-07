export type {
  AxisStep,
  BillingAxis,
  NeutralEventName,
} from './types.js';
export { providerEventName } from './types.js';

export type { DunningConfig, DunningSession, DunningState } from './dunning.js';
export { startDunning, dunningAttempt, finalizeDunning } from './dunning.js';

export type { RetryConfig, RetrySession, RetryState } from './retry.js';
export { startRetry, retryDeliver, retryBackoffMs } from './retry.js';

export type { ThreeDsSession, ThreeDsState, ThreeDsTransStatus } from './three-ds.js';
export {
  startThreeDs,
  threeDsRequestChallenge,
  threeDsSubmitChallenge,
  threeDsFrictionless,
} from './three-ds.js';

export type { ScaExemption, ScaSession, ScaState } from './sca.js';
export { startSca, scaEvaluate, scaAuthenticate } from './sca.js';

export type { PsdMandate, PsdMandateScheme, PsdMandateState } from './psd2.js';
export { createMandate, revokeMandate, grantConsent } from './psd2.js';

export type { Subscription, SubscriptionState } from './subscription-lifecycle.js';
export {
  createSubscription,
  changePlan,
  pauseSubscription,
  resumeSubscription,
  cancelSubscription,
  reactivateSubscription,
} from './subscription-lifecycle.js';

export type { Invoice, InvoiceState } from './invoice.js';
export {
  draftInvoice,
  openInvoice,
  payInvoice,
  voidInvoice,
  markUncollectible,
  creditNoteInvoice,
} from './invoice.js';

export type { TaxCalcInput, TaxKind, TaxLine } from './tax.js';
export { calculateTax, emitTaxLine } from './tax.js';

export type { Chargeback, ChargebackReason, ChargebackState } from './chargeback.js';
export { openChargeback, submitEvidence, resolveChargeback } from './chargeback.js';

export type { FidelityCoverage, FidelityRow } from './fidelity.js';
export { collectFidelityCoverage } from './fidelity.js';

// v0.4 — advanced billing II 8 axis
export type {
  OrchestrationConfig,
  OrchestrationSession,
  OrchestrationState,
} from './orchestration.js';
export { startOrchestration, routeCharge, probeCircuit } from './orchestration.js';

export type { RecoveryConfig, RecoverySession, RecoveryState } from './revenue-recovery.js';
export {
  startRecovery,
  scheduleSmartRetry,
  advanceCascade,
  applyCardUpdate,
  applyNetworkToken,
  finalizeRecovery,
} from './revenue-recovery.js';

export type { RefundPolicy, RefundSession, RefundState } from './refund-advanced.js';
export {
  startRefund,
  partialRefund,
  fullRefund,
  denyByPolicy,
  markWindowExpired,
  preventChargeback,
} from './refund-advanced.js';

export type { DisputeSession, DisputeState } from './dispute.js';
export {
  openDispute,
  submitDisputeEvidence,
  representDispute,
  escalateArbitration,
  shiftLiability,
  finalizeDispute,
} from './dispute.js';

export type {
  WebhookIdempotencyConfig,
  WebhookIdempotencySession,
  WebhookState,
} from './webhook-idempotency.js';
export {
  startIdempotency,
  deliver,
  reportFailure,
  rotateSignature,
} from './webhook-idempotency.js';

export type {
  TaxJurisdiction,
  TaxKindLocalized,
  TaxLocalizationInput,
  TaxLocalizationLine,
  TaxLocalizationState,
} from './tax-localization.js';
export { calculateLocalizedTax, reportDac7 } from './tax-localization.js';

export type {
  CouponEntry,
  SubscriptionMachineSession,
  SubscriptionMachineState,
} from './subscription-state-machine.js';
export {
  startSubscriptionMachine,
  enterGracePeriod,
  exitGracePeriod,
  applyProration,
  stackCoupon,
} from './subscription-state-machine.js';

export type { VaultSession, VaultState, VaultToken } from './payment-method-vault.js';
export {
  startVault,
  tokenizeCard,
  revokeToken,
  migrateToken,
  verifyPciScope,
} from './payment-method-vault.js';

// v0.5 — advanced billing III 8 axis
export type {
  EmbeddedFinanceConfig,
  EmbeddedFinanceSession,
  EmbeddedFinanceState,
  KycStatus,
} from './embedded-finance.js';
export {
  openAccount,
  verifyKyc,
  verifyKyb,
  issueCard,
  closeAccount,
} from './embedded-finance.js';

export type { BnplConfig, BnplSession, BnplState } from './bnpl.js';
export {
  createBnplPlan,
  scheduleInstallment,
  scoreRisk,
  chargeLateFee,
  markInstallmentPaid,
} from './bnpl.js';

export type {
  Chain,
  CryptoInvoiceConfig,
  CryptoPaymentSession,
  CryptoPaymentState,
  Stablecoin,
} from './crypto-payment.js';
export {
  createCryptoInvoice,
  confirmTx,
  abstractGas,
  linkWallet,
} from './crypto-payment.js';

export type {
  FxConfig,
  FxRateQuote,
  FxSession,
  FxState,
  SettlementRail,
} from './fx-cross-border.js';
export {
  startFxTransfer,
  lockRate,
  initiateSettlement,
  completeSettlement,
  expireRate,
} from './fx-cross-border.js';

export type {
  RecurringRevenueSession,
  RecurringRevenueSnapshot,
  RecurringRevenueState,
} from './recurring-revenue-advanced.js';
export {
  startRecurringRevenue,
  computeMrr,
  recordChurn,
  recordExpansion,
  computeNrr,
  recordContraction,
} from './recurring-revenue-advanced.js';

export type {
  OrchestrationIIConfig,
  OrchestrationIISession,
  OrchestrationIIState,
} from './payment-orchestration-ii.js';
export {
  startOrchestrationII,
  smartRoute,
  scoreMl,
  triggerFallback,
} from './payment-orchestration-ii.js';

export type {
  FraudDetectionConfig,
  FraudDetectionSession,
  FraudDetectionState,
  FraudVerdict,
} from './fraud-detection-advanced.js';
export {
  startFraudDetection,
  scoreDevice,
  verifyBiometric,
  flagVelocity,
  scoreMlBlock,
} from './fraud-detection-advanced.js';

export type {
  Regulator,
  RegulatoryReportingSession,
  RegulatoryReportingState,
  ReportPeriod,
  ReportRecord,
} from './regulatory-reporting.js';
export {
  startRegulatoryReporting,
  reportPci,
  reportPsd2,
  reportDora,
  fileSar,
  lockForAudit,
} from './regulatory-reporting.js';
