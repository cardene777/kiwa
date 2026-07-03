export {
  type ReorgAdapter,
  type ReorgOp,
  type ReorgScenarioResult,
  type TraceEvent,
  type AdapterMetrics,
  SkippedError,
  OPS_UNDER_TEST,
} from './adapters/interface.js';
export { makeMockAdapter, MockChainState } from './adapters/mock.js';
export {
  makeRealAdapter,
  detectRealEnv,
  type RealAdapterEnv,
} from './adapters/real.js';
export { runAllScenarios } from './flows/scenarios.js';
export {
  runFidelityHarness,
  emitMarkdown,
  emitJson,
  type FidelityInput,
  type FidelityAxis,
  type FidelityReport,
} from './flows/fidelity.js';
