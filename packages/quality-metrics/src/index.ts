export type {
  AccuracyMetric,
  CostMetric,
  CoverageMetric,
  FidelityMetric,
  LatencyMetric,
  MutationMetric,
  MutationTier,
  PerfMetric,
  QualityReport,
  QualityReportDiff,
  ReleaseGateBlocker,
  ReleaseGateContext,
  ReleaseGateThresholds,
  ReleaseGateVerdict,
  TestCountMetric,
  TokenMetric,
} from './types.js';

export { isAiLlmProvider } from './types.js';

export {
  accuracyFromSamples,
  assembleReport,
  costFromSamples,
  coverageFromV8Summary,
  fidelityFromMethodCounts,
  latencyFromSamples,
  mutationFromCounts,
  perfFromSamples,
  testCountFromCategories,
  tokenFromSamples,
} from './collect.js';

export {
  DEFAULT_MUTATION_TIER_THRESHOLDS,
  DEFAULT_RELEASE_GATE_THRESHOLDS,
  assertMutationTier,
  evaluateReleaseGate,
  resolveMutationTier,
} from './gate.js';

export { diffReports, emitJson, emitMarkdown } from './emit.js';
