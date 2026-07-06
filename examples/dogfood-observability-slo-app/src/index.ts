/**
 * Public surface for dogfood-observability-slo-app v0.0.1 (v1.35-2).
 *
 * A dogfood app that drives the `@kiwa-test/observability` v2.1 SLO
 * axis (session start → open window → query request counts → record
 * → compute error budget → evaluate burn rate → fire MWMBR alert →
 * evaluate error-budget policy → route alert → silence) behind a
 * provider-neutral 14-op contract, satisfied by both a deterministic
 * mock adapter and a `KIWA_MODE=real` testcontainers-driven Grafana
 * OSS + Prometheus + Alertmanager real adapter. The fidelity harness
 * diffs both traces and feeds the divergence count into the
 * `@kiwa-test/quality-metrics` 13-axis release gate.
 */

export { makeMockAdapter } from './adapters/mock.js';
export { makeRealAdapter, type RealAdapterConfig } from './adapters/real.js';
export {
  KIWA_SLO_ENV_MISSING,
  SLO_HARNESS_OPS,
  type AlertRouteResult,
  type ComputeBudgetResult,
  type ErrorBudgetPolicy,
  type EvaluateBurnRateResult,
  type MwmbrAlertResult,
  type MwmbrThreshold,
  type PolicyEvaluationResult,
  type PromQlQueryResult,
  type SLOTarget,
  type SloAdapter,
  type SloHarnessOp,
  type StartSLOResult,
  type TraceEvent,
} from './adapters/interface.js';

export {
  ALL_SLO_TARGETS,
  SLO_TARGET_99_9,
  SLO_TARGET_99_95,
  SLO_TARGET_99_99,
} from './policies/objectives.js';

export {
  ALL_MWMBR_THRESHOLDS,
  MWMBR_FAST_BURN,
  MWMBR_SLOW_BURN,
  MWMBR_TICKET_BURN,
} from './policies/thresholds.js';

export {
  ALL_POLICIES,
  POLICY_99_9,
  POLICY_99_95,
  POLICY_99_99,
} from './policies/error-budget.js';

export {
  ALL_LIFECYCLE_POLICIES,
  OPS_UNDER_TEST,
  diffTraces,
  runFullSloLifecycle,
  runMultiObjectiveMatrix,
  type LifecycleInput,
} from './flows/slo-flows.js';

export {
  runAdapterMatrix,
  runFidelityHarness,
  type FidelityRunInput,
  type FidelityRunOutput,
} from './flows/fidelity.js';
