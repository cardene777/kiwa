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

// v0.5 Historical trend tracking + drift detection
export {
  captureSnapshot,
  compareToBaseline,
  detectDrift,
  generateTrendReport,
  type AxisDelta,
  type BaselineComparison,
  type DriftCategory,
  type DriftDetection,
  type MetricSnapshot,
  type TrendReport,
} from './history.js';

// v2.1 Adaptive drift threshold learning
export {
  learnAdaptiveThreshold,
  pickThresholdForAxis,
  type AdaptiveThreshold,
  type AdaptiveThresholdReport,
} from './threshold-learning.js';

// Q2 = fidelity 実行 assertion primitive (docs/concepts/test-taxonomy.md § fidelity)
export {
  assertFidelity,
  type FidelityAssertInput,
  type FidelityAssertResult,
  type FidelityCase,
  type FidelityDivergence,
} from './fidelity-assert.js';

// Q6 = real driver env-gate primitive (docs/concepts/test-taxonomy.md § fidelity real driver)
export {
  resolveRealFidelityMode,
  type EnvSource,
  type RealFidelityGateInput,
  type RealFidelityGateResult,
} from './real-fidelity-gate.js';
