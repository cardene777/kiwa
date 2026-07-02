export type {
  CoverageMetric,
  FidelityMetric,
  MutationMetric,
  PerfMetric,
  QualityReport,
  QualityReportDiff,
  ReleaseGateBlocker,
  ReleaseGateThresholds,
  ReleaseGateVerdict,
  TestCountMetric,
} from './types.js';

export {
  assembleReport,
  coverageFromV8Summary,
  fidelityFromMethodCounts,
  mutationFromCounts,
  perfFromSamples,
  testCountFromCategories,
} from './collect.js';

export {
  DEFAULT_RELEASE_GATE_THRESHOLDS,
  evaluateReleaseGate,
} from './gate.js';

export { diffReports, emitJson, emitMarkdown } from './emit.js';
