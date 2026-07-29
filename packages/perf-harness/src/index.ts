export type {
  MeasureInput,
  MeasureResult,
  PerfGateInput,
  PerfGateResult,
  RegressionInput,
  RegressionResult,
  Thresholds,
} from './types.js';

export { buildMeasureResult, measure } from './measure.js';
export { measureConcurrent, type ConcurrentInput } from './concurrent.js';
export { measureMemory, type MemoryInput, type MemorySample } from './memory.js';
export { detectRegression, detectRegressionStrict } from './regression.js';
export {
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
