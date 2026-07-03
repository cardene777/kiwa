export type {
  ChartType,
  DashboardAdapter,
  DashboardAdapterConfig,
  DashboardMetrics,
  DashboardQuery,
  PanelDef,
  PanelRenderResult,
  PanelThresholdDef,
  QueryResult,
  TraceEvent,
} from './adapters/interface.js';
export { makeMockAdapter, chartTypeToPanelKind } from './adapters/mock.js';
export { makeRealAdapter, detectRealEnv, SkippedError, queryToPromQL } from './adapters/real.js';
export {
  seededPanels,
  linePanel,
  barPanel,
  gaugePanel,
  statPanel,
  tablePanel,
  panelByChartType,
} from './panels/index.js';
export {
  errorRateQuery,
  p99LatencyQuery,
  queueDepthQuery,
  requestCountQuery,
  requestRateQuery,
} from './queries/index.js';
export {
  runInitialLoadFlow,
  runRefreshCycleFlow,
  runQueryMatrixFlow,
  runAlertBadgeFlow,
  runFullMatrix,
  OPS_UNDER_TEST,
} from './flows/dashboard-flows.js';
export {
  runFidelityHarness,
  runAdapterMatrix,
  type FidelityRunInput,
  type FidelityRunOutput,
} from './flows/fidelity.js';
export {
  createDashboardPageController,
  resolveKiwaMode,
  type DashboardPageController,
  type DashboardPageState,
  type KiwaMode,
} from './app/dashboard-page.js';
