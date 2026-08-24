export type {
  TestStatus,
  TestRunRecord,
  RunHistory,
  FlakyTest,
  SpecCoverageGap,
  DashboardInput,
} from './types.js';
export {
  collectRunHistory,
  fromPlaywrightJson,
  fromVitestJson,
  type CollectRunHistoryOptions,
  type FromPlaywrightJsonOptions,
  type FromVitestJsonOptions,
  type PlaywrightJsonReport,
  type PlaywrightJsonResult,
  type PlaywrightJsonSpec,
  type PlaywrightJsonSuite,
  type PlaywrightJsonTest,
  type VitestStyleAssertionResult,
  type VitestStyleReport,
  type VitestStyleTestResult,
} from './collect.js';
export {
  DEFAULT_FLAKY_MIN_RUNS,
  detectFlaky,
  flakyEligibility,
  type DetectFlakyOptions,
  type FlakyEligibility,
} from './flaky.js';
export { analyzeSpecCoverage, type AnalyzeSpecCoverageOptions } from './spec-coverage.js';
export {
  analyzeSlowest,
  type AnalyzeSlowestOptions,
  type SlowestAnalysis,
  type SlowestTest,
} from './slowest.js';
export { renderDashboard } from './dashboard.js';
export {
  fromIstanbulCoverageSummary,
  checkThresholds,
  type CoverageMetric,
  type CoverageFileEntry,
  type CoverageSummary,
  type CoverageThresholds,
  type ThresholdCheckResult,
  type IstanbulCoverageSummary,
} from './coverage.js';
export {
  TelemetryCollector,
  createOtelMock,
  createDatadogMock,
  createSentryMock,
  type TelemetryProvider,
  type SpanRecord,
  type MetricRecord,
  type LogRecord,
  type ExceptionRecord,
  type TransactionRecord,
  type OtelMock,
  type DatadogMock,
  type SentryMock,
} from './telemetry.js';
export {
  DashboardMock,
  buildDashboardMock,
  type DashboardConfig,
  type PanelConfig,
  type PanelKind,
  type PanelResult,
  type PanelThreshold,
  type MetricQuery,
  type MetricAggregation,
} from './dashboard-mock.js';
export {
  AlertRouter,
  metricsForRule,
  type AlertRule,
  type AlertOperator,
  type AlertSeverity,
  type AlertState,
  type AlertFire,
  type AlertReceiverEvent,
  type EscalationStep,
  type RouteEntry,
  type Silence,
} from './alert.js';
export {
  buildSpanTree,
  renderFlameGraph,
  drillDown,
  flattenFlame,
  type SpanNode,
  type FlameNode,
} from './trace-flame.js';
export {
  LogCorrelationIndex,
  correlateLogsAndSpans,
  type CorrelationKeys,
  type LogSpanLink,
} from './log-correlation.js';
export {
  panel_httpErrorRate,
  panel_p99Latency,
  panel_queueDepth,
  rule_errorRateCritical,
  rule_latencyDegraded,
  rule_queueBackpressure,
  defaultRoute,
  escalation_pagerDutyTwoStep,
  silence_maintenanceWindow,
  trace_httpHandler,
  trace_fanoutParallel,
  trace_nestedRetry,
  logs_forHttpTrace,
} from './fixtures.js';

// v2.1 advanced 8-axis semantics + real driver (namespaced via `semantics/` and
// `real-driver` to avoid name collisions with v2.0 exports).
export * as semantics from './semantics/index.js';
export {
  buildRealDriverConfig,
  explicitEnvKey,
  isKiwaModeReal,
  resolveObservabilityEndpoint,
  skipUnlessReal,
  type ObservabilityBackend,
  type RealDriverConfig,
} from './real-driver.js';
