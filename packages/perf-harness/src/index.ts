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
export { detectRegression } from './regression.js';
export { defaultBaselinePath, loadBaseline, saveBaseline } from './baseline.js';
export { evaluatePerfGate } from './gate.js';
export { emitPerfReport } from './report.js';
