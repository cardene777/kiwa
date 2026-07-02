export type {
  AccuracyMetric,
  CostMetric,
  CoverageMetric,
  FidelityMetric,
  LatencyMetric,
  MutationMetric,
  PerfMetric,
  QualityReport,
  QualityReportDiff,
  ReleaseGateBlocker,
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
  DEFAULT_RELEASE_GATE_THRESHOLDS,
  evaluateReleaseGate,
} from './gate.js';

export { diffReports, emitJson, emitMarkdown } from './emit.js';
