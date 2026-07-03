export type {
  AdapterLog,
  AdapterSpan,
  FlameExplorerAdapter,
  FlameExplorerConfig,
  FlameExplorerMetrics,
  FlameGraphNode,
  FlameNameStats,
  LoadedTrace,
  LogJoinEntry,
  LogLevel,
  SpanTreeNode,
  TraceEvent,
} from './adapters/interface.js';
export { makeMockAdapter } from './adapters/mock.js';
export { makeRealAdapter, detectRealEnv, SkippedError } from './adapters/real.js';
export {
  seededTraces,
  traceApiGateway,
  traceBackgroundJob,
  traceBatchWrite,
  traceById,
  traceCacheCycle,
  traceChunkedUpload,
  traceEventBus,
  traceFanoutParallel,
  traceHttpHandler,
  traceNestedRetry,
  traceSsrTree,
} from './traces/index.js';
export { TraceLogIndex } from './correlation/index.js';
export {
  layoutFlameGraph,
  summariseFlameGraph,
  type FlameLayout,
  type FlameLayoutNode,
  type FlameSummaryRow,
} from './components/FlameGraph.js';
export {
  buildSpanTreeRows,
  collapseSubtree,
  type SpanTreeRow,
} from './components/SpanTree.js';
export {
  buildLogPanelRows,
  filterByLevel,
  filterBySpan,
  type LogPanelRow,
} from './components/LogPanel.js';
export {
  buildDrilldownView,
  type DrilldownView,
} from './components/Drilldown.js';
export {
  runDrillDownFlow,
  runFilterFlow,
  runFullMatrix,
  runLoadFlow,
  runLogJoinFlow,
  runRenderFlow,
  DEFAULT_TRACES,
  DEFAULT_DRILLDOWN_NAMES,
  DEFAULT_FILTER_NAMES,
  OPS_UNDER_TEST,
} from './flows/flame-flows.js';
export {
  runAdapterMatrix,
  runFidelityHarness,
  type FidelityRunInput,
  type FidelityRunOutput,
} from './flows/fidelity.js';
export {
  createFlameService,
  resolveKiwaMode,
  type FlameService,
  type FlameServiceState,
  type KiwaMode,
} from './app/flame-service.js';
