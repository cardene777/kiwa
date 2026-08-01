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
  REFERENCE_IMPL_VERSION,
  REFERENCE_KINDS,
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
  BaselineRevisionConflictError,
  type BaselineSnapshot,
  CANONICAL_ENV_PROFILE,
  MEASUREMENT_PREMISE,
  captureEnv,
  envProfile,
  isCanonicalEnv,
  nonCanonicalEnvNotice,
  isComparableEnv,
  baselinePathFor,
  defaultBaselinePath,
  resolveBaselineRoot,
  loadBaseline,
  loadBaselineSnapshot,
  saveBaseline,
  saveBaselineEnvelope,
} from './baseline.js';
export { evaluatePerfGate } from './gate.js';
export { emitPerfReport } from './report.js';
export {
  PRUNE_MANIFEST_ENV,
  PRUNE_MANIFEST_PATH_ENV,
  pruneManifestPath,
  recordPruneManifest,
  shouldRecordPruneManifest,
  type PruneManifestRecord,
} from './prune-manifest.js';
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
