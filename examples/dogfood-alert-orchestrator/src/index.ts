export type {
  AlertFireEvent,
  AlertOrchestratorAdapter,
  AlertOrchestratorConfig,
  AlertOrchestratorMetrics,
  AlertRuleDef,
  AlertSeverity,
  EscalationDelivery,
  EscalationLadderStep,
  MetricSample,
  RouteDecision,
  RouteNode,
  RuleKind,
  RuleOperator,
  SilenceDef,
  TraceEvent,
} from './adapters/interface.js';
export { makeMockAdapter } from './adapters/mock.js';
export { makeRealAdapter, detectRealEnv, SkippedError } from './adapters/real.js';
export {
  ruleById,
  ruleCpuUsageAnomaly,
  ruleDiskUsageHigh,
  ruleErrorRatePerRoute,
  ruleGcPauseAnomaly,
  ruleHttp5xxRate,
  ruleHttpErrorsCritical,
  ruleLatencyDegraded,
  ruleMemoryRssAnomaly,
  ruleQueueBackpressure,
  ruleRequestRate,
  seededRules,
} from './rules/index.js';
export { seededRoute, walkRoute } from './routing/index.js';
export { SilenceStore, seededSilences } from './silence/index.js';
export { seededEscalation, stepFor } from './escalation/index.js';
export {
  runEscalationFlow,
  runEvaluateFlow,
  runFullMatrix,
  runIngestFlow,
  runRouteFlow,
  OPS_UNDER_TEST,
} from './flows/orchestrator-flows.js';
export {
  runAdapterMatrix,
  runFidelityHarness,
  type FidelityRunInput,
  type FidelityRunOutput,
} from './flows/fidelity.js';
export {
  createOrchestratorService,
  resolveKiwaMode,
  type KiwaMode,
  type OrchestratorService,
  type OrchestratorServiceState,
} from './app/orchestrator-service.js';
