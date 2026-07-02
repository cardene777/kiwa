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
  fromVitestJson,
  type CollectRunHistoryOptions,
  type FromVitestJsonOptions,
  type VitestStyleAssertionResult,
  type VitestStyleReport,
  type VitestStyleTestResult,
} from './collect.js';
export { detectFlaky, type DetectFlakyOptions } from './flaky.js';
export { analyzeSpecCoverage, type AnalyzeSpecCoverageOptions } from './spec-coverage.js';
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
