export type {
  MeasureInput,
  MeasureReference,
  MeasureResult,
  PerfGateInput,
  PerfGateResult,
  PerfReferenceKind,
  RegressionInput,
  RegressionResult,
  Thresholds,
} from './types.js';

export {
  buildMeasureResult,
  measure,
  measureAlternating,
  measureHarnessResolution,
  type AlternatingMeasureResult,
  type MeasureAlternatingInput,
} from './measure.js';
export {
  DEFAULT_REFERENCE_KIND,
  createReferenceOps,
  referenceOpName,
  type PerfReferenceOp,
  type PerfReferenceSet,
} from './reference.js';
export { measureConcurrent, type ConcurrentInput } from './concurrent.js';
export { measureMemory, type MemoryInput, type MemorySample } from './memory.js';
export {
  REGRESSION_JUDGED_PERCENTILE,
  RESOLUTION_FLOOR_MULTIPLE,
  detectRegression,
  detectRegressionStrict,
  resolveNormalization,
} from './regression.js';
export {
  BASELINE_SCHEMA,
  MEASUREMENT_PREMISE,
  captureEnv,
  isComparableEnv,
  defaultBaselinePath,
  resolveBaselineRoot,
  loadBaseline,
  saveBaseline,
  saveBaselineEnvelope,
} from './baseline.js';
export { evaluatePerfGate } from './gate.js';
export { emitPerfReport } from './report.js';
export {
  runPerf3Layer,
  runPerf3LayerStrict,
  resolveKiwaRepoRoot,
  pruneStaleOps,
  type PerfOpSpec,
  type RunPerf3LayerInput,
  type RunPerf3LayerResult,
  type OpOutcome,
} from './three-layer.js';
export {
  runPerf3LayerLive,
  type LivePerfOpSpec,
  type LiveOpOutcome,
  type RunPerf3LayerLiveInput,
  type RunPerf3LayerLiveResult,
} from './live.js';
