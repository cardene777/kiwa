/**
 * Quality metrics harness — unified 5-axis score for every kiwa provider.
 *
 * v1.10 まで kiwa は「provider 数を増やす」 直交軸で拡張してきたが、
 * v1.11 (Issue #680 / #681) からは「release 品質を数値で判断可能にする」
 * 縦軸に思想シフトする。 本 harness は全 provider adapter が同一 shape の
 * quality score を出す統一 API を提供する。
 *
 * ## 5 測定軸
 *
 * - {@link CoverageMetric} — line / branch / function coverage %
 * - {@link TestCountMetric} — behavior test / integration test / e2e test count
 * - {@link FidelityMetric} — real provider の API surface vs mock cover 率
 * - {@link PerfMetric} — 100 回実行の p95 ms、 setup / teardown 分離
 * - {@link MutationMetric} — mutation testing kill rate (stryker / cargo-mutants)
 *
 * ## release gate 数値化
 *
 * {@link ReleaseGateThresholds} で 5 軸の閾値 SSOT を定義、
 * {@link evaluateReleaseGate} で `passed` / `blockers` を判定する。
 */

/** Line / branch / function coverage percentages, all 0–100. */
export interface CoverageMetric {
  /** Line coverage percentage (0–100). */
  line: number;
  /** Branch coverage percentage (0–100). */
  branch: number;
  /** Function coverage percentage (0–100). */
  function: number;
}

/** Test count broken down by kind. Sum = `total`. */
export interface TestCountMetric {
  /**
   * Unit-level behavior tests — direct exercise of a package's API surface
   * without external dependencies. Should be the majority of tests.
   */
  behavior: number;
  /**
   * Integration tests — package + workspace peers + framework glue.
   */
  integration: number;
  /**
   * E2E / dogfood app tests — a full flow against real user-facing shape.
   */
  e2e: number;
  /** Sum of the three kinds (derived, must equal behavior + integration + e2e). */
  total: number;
}

/**
 * Fidelity score — how faithfully the mock adapter matches the real provider.
 *
 * `mockCoveredMethods` = number of API methods the kiwa mock implements.
 * `realTotalMethods` = number of public methods on the real provider's SDK.
 * The score is the ratio expressed as a percentage (0–100).
 *
 * A high fidelity score does not guarantee semantic equivalence — a v1.11 dogfood
 * app run against both modes is the definitive source of truth for behavioral
 * fidelity. This shape captures surface fidelity as the objective proxy.
 */
export interface FidelityMetric {
  mockCoveredMethods: number;
  realTotalMethods: number;
  /**
   * Computed percentage = `mockCoveredMethods / realTotalMethods × 100`.
   * When `realTotalMethods = 0`, the ratio is defined as 100.
   */
  ratio: number;
  /**
   * Optional — count of behavioral divergences observed during dogfood test
   * comparison. Zero means real and mock modes produced identical results.
   */
  behavioralDivergences?: number | undefined;
}

/** Performance percentiles in milliseconds. */
export interface PerfMetric {
  /** 50th percentile latency in ms. */
  p50Ms: number;
  /** 95th percentile latency in ms. */
  p95Ms: number;
  /** 99th percentile latency in ms. */
  p99Ms: number;
  /** Total sample count that fed the percentiles. */
  samples: number;
}

/** Mutation testing kill rate. */
export interface MutationMetric {
  /** Total mutations generated. */
  mutations: number;
  /** Mutations killed by the test suite. */
  killed: number;
  /** Mutations that survived (indicate test gap). */
  survived: number;
  /** Kill rate percentage = killed / mutations × 100. */
  killRate: number;
}

/**
 * Full quality report for a single provider (or subject under test). All 5
 * axes are captured together so downstream consumers can diff two reports
 * from the same provider across versions.
 */
export interface QualityReport {
  /** Provider / package identifier — e.g. `@kiwa-test/auth`. */
  provider: string;
  /** Version string as declared in package.json. */
  version: string;
  /** ISO 8601 timestamp of the report. */
  reportedAt: string;
  coverage: CoverageMetric;
  testCount: TestCountMetric;
  fidelity: FidelityMetric;
  perf: PerfMetric;
  mutation: MutationMetric;
  /** Optional free-form notes surfaced in the emitted markdown report. */
  notes?: string | undefined;
}

/**
 * Release gate thresholds — the 5-axis SSOT that governs whether a provider
 * can graduate to a release. All fields are floors (must be at or above).
 *
 * These are conservative defaults chosen for the v1.11 milestone; a provider
 * can tighten by supplying overrides to {@link evaluateReleaseGate}.
 */
export interface ReleaseGateThresholds {
  /** Minimum line coverage percentage (default 85). */
  coverageLine: number;
  /** Minimum branch coverage percentage (default 80). */
  coverageBranch: number;
  /** Minimum function coverage percentage (default 90). */
  coverageFunction: number;
  /** Minimum fidelity ratio (default 70). */
  fidelityRatio: number;
  /** Maximum acceptable p95 latency in ms (default 100). */
  perfP95Ms: number;
  /** Minimum mutation kill rate percentage (default 60). */
  mutationKillRate: number;
  /** Minimum behavior test count (default 10). */
  behaviorTests: number;
}

/** Reason a report failed the release gate. Each blocker names the axis. */
export interface ReleaseGateBlocker {
  /** Axis name that failed — e.g. `coverage.line`, `perf.p95Ms`. */
  axis: string;
  /** Threshold that was violated. */
  threshold: number;
  /** Actual value observed in the report. */
  actual: number;
  /** Comparison operator that was applied — either `>=` (floor) or `<=` (ceiling). */
  op: '>=' | '<=';
}

/** Verdict of {@link evaluateReleaseGate}. */
export interface ReleaseGateVerdict {
  passed: boolean;
  blockers: ReleaseGateBlocker[];
  /** Number of axes evaluated. */
  axesEvaluated: number;
}

/**
 * Trend delta between two reports for the same provider — used by
 * {@link diffReports}. Values are (`current - previous`) so positive numbers
 * mean improvement for `coverage` / `test count` / `fidelity` / `mutation`,
 * and negative numbers mean improvement for `perf`.
 */
export interface QualityReportDiff {
  provider: string;
  from: string;
  to: string;
  coverage: CoverageMetric;
  testCount: TestCountMetric;
  fidelity: Pick<FidelityMetric, 'ratio'>;
  perf: PerfMetric;
  mutation: Pick<MutationMetric, 'killRate'>;
}
