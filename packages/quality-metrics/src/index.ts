export type {
  A11yMetric,
  A11yThreshold,
  A11yTier,
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
  a11yFromBaseline,
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
  DEFAULT_A11Y_TIER_THRESHOLDS,
  DEFAULT_MUTATION_TIER_THRESHOLDS,
  DEFAULT_RELEASE_GATE_THRESHOLDS,
  assertA11yTier,
  assertMutationTier,
  evaluateReleaseGate,
  resolveA11yTier,
  resolveMutationTier,
} from './gate.js';

export { diffReports, emitJson, emitMarkdown } from './emit.js';
