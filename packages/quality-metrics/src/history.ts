/**
 * v0.5 Historical trend tracking + drift detection。
 *
 * v0.4 までは 「今の release 品質を数値化する」 point-in-time gate、
 * v0.5 で 「前回と比較して劣化しているか」 の 時系列 dimension を追加。
 * pass/fail 二値判定 の 手前で 「pass だが 前回より低下」 の regression signal を
 * early warning 検知可能に。
 *
 * shape 契約 preserving = 既存 QualityReport 構造無変更、 新規 file の追加 のみ。
 * release-gate integration は opt-in (drift-check flag)、 default off で backward compat。
 */
import type { QualityReport } from './types.js';

/** Time-point snapshot of QualityReport with fixed timestamp label. */
export interface MetricSnapshot {
  /** ISO 8601 timestamp for the snapshot (caller-provided). */
  capturedAt: string;
  /** Optional label (e.g., "release-v1.65", "main-2026-07-08"). */
  label: string | null;
  /** Full quality report at capture time. */
  report: QualityReport;
}

/** Per-axis delta between current and baseline. */
export interface AxisDelta {
  axis: string;
  currentValue: number;
  baselineValue: number;
  delta: number;
  deltaPct: number;
}

/** Comparison between current snapshot and baseline snapshot. */
export interface BaselineComparison {
  currentLabel: string | null;
  baselineLabel: string | null;
  axisDeltas: AxisDelta[];
}

/** Drift detection verdict category. */
export type DriftCategory = 'regression' | 'improvement' | 'stable';

/** Drift detection result for a single comparison. */
export interface DriftDetection {
  category: DriftCategory;
  regressions: AxisDelta[];
  improvements: AxisDelta[];
  stable: AxisDelta[];
  threshold: number;
}

/** Trend statistics across multiple snapshots. */
export interface TrendReport {
  snapshotCount: number;
  firstLabel: string | null;
  lastLabel: string | null;
  axisSummary: {
    axis: string;
    first: number;
    last: number;
    delta: number;
    trend: 'up' | 'down' | 'flat';
  }[];
}

/**
 * Capture a point-in-time snapshot. Caller passes ISO timestamp + optional label.
 * v0.5 = additive (既存 report 構造は変更しない)。
 */
export function captureSnapshot(input: {
  report: QualityReport;
  capturedAt: string;
  label?: string;
}): MetricSnapshot {
  const snapshot: MetricSnapshot = {
    capturedAt: input.capturedAt,
    label: input.label ?? null,
    report: input.report,
  };
  return snapshot;
}

/**
 * Extract per-axis numeric values from a QualityReport.
 * shape 契約 preserving = QualityReport 構造読取のみ、 変更しない。
 */
function extractAxisValues(report: QualityReport): Record<string, number> {
  const values: Record<string, number> = {};

  values['coverage.line'] = report.coverage.line;
  values['coverage.branch'] = report.coverage.branch;
  values['coverage.function'] = report.coverage.function;
  values['testCount.behavior'] = report.testCount.behavior;
  values['testCount.integration'] = report.testCount.integration;
  values['testCount.e2e'] = report.testCount.e2e;
  values['testCount.total'] = report.testCount.total;
  values['fidelity.ratio'] = report.fidelity.ratio;
  values['perf.p95Ms'] = report.perf.p95Ms;
  values['mutation.killRate'] = report.mutation.killRate;

  if (report.cost) {
    values['cost.perRequestUsd'] = report.cost.perRequestUsd;
    values['cost.totalUsd'] = report.cost.totalUsd;
  }
  if (report.latency) {
    values['latency.p50Ms'] = report.latency.p50Ms;
    values['latency.p95Ms'] = report.latency.p95Ms;
    values['latency.p99Ms'] = report.latency.p99Ms;
  }
  if (report.token) {
    values['token.promptTokens'] = report.token.promptTokens;
    values['token.completionTokens'] = report.token.completionTokens;
    values['token.totalTokens'] = report.token.totalTokens;
  }
  if (report.accuracy) {
    values['accuracy.score'] = report.accuracy.score;
  }
  if (report.a11y) {
    values['a11y.critical'] = report.a11y.critical;
    values['a11y.serious'] = report.a11y.serious;
    values['a11y.moderate'] = report.a11y.moderate;
    values['a11y.minor'] = report.a11y.minor;
  }

  return values;
}

/**
 * Compare current snapshot to baseline. Per-axis delta + delta%.
 * 両方 snapshot に共通する axis のみ compare、 片方 のみの axis は skip。
 */
export function compareToBaseline(input: {
  current: MetricSnapshot;
  baseline: MetricSnapshot;
}): BaselineComparison {
  const currentValues = extractAxisValues(input.current.report);
  const baselineValues = extractAxisValues(input.baseline.report);

  const axisDeltas: AxisDelta[] = [];
  const commonAxes = Object.keys(currentValues).filter((axis) => axis in baselineValues);

  for (const axis of commonAxes) {
    const currentValue = currentValues[axis]!;
    const baselineValue = baselineValues[axis]!;
    const delta = currentValue - baselineValue;
    const deltaPct = baselineValue === 0 ? (delta === 0 ? 0 : Infinity) : (delta / baselineValue) * 100;

    axisDeltas.push({ axis, currentValue, baselineValue, delta, deltaPct });
  }

  return {
    currentLabel: input.current.label,
    baselineLabel: input.baseline.label,
    axisDeltas,
  };
}

/**
 * axis 名から 「上昇=改善」 か 「上昇=悪化」 かを判定。
 * coverage/testCount/fidelity/accuracy/mutation kill rate = 上昇=改善
 * perf/cost/latency/token/a11y violation = 上昇=悪化
 */
function isHigherBetter(axis: string): boolean {
  if (axis.startsWith('coverage.')) return true;
  if (axis.startsWith('testCount.')) return true;
  if (axis.startsWith('fidelity.')) return true;
  if (axis === 'mutation.killRate') return true;
  if (axis === 'accuracy.score') return true;
  // 上昇=悪化 axis (perf / cost / latency / token / a11y violations)
  return false;
}

/**
 * Detect drift from a BaselineComparison.
 * threshold = drift 判定 の 絶対値 delta%、 default 5.0 (5% 以上変動で drift 判定)。
 * category = axis 別 regression / improvement / stable 集計、 全体 category は
 * regression > 0 なら 'regression'、 improvement > 0 && regression == 0 なら 'improvement'、
 * 他は 'stable'。
 */
export function detectDrift(input: {
  comparison: BaselineComparison;
  thresholdPct?: number;
}): DriftDetection {
  const threshold = input.thresholdPct ?? 5.0;
  const regressions: AxisDelta[] = [];
  const improvements: AxisDelta[] = [];
  const stable: AxisDelta[] = [];

  for (const delta of input.comparison.axisDeltas) {
    const absDeltaPct = Math.abs(delta.deltaPct);
    if (absDeltaPct < threshold) {
      stable.push(delta);
      continue;
    }
    const higherBetter = isHigherBetter(delta.axis);
    if ((higherBetter && delta.delta < 0) || (!higherBetter && delta.delta > 0)) {
      regressions.push(delta);
    } else {
      improvements.push(delta);
    }
  }

  const category: DriftCategory =
    regressions.length > 0 ? 'regression' : improvements.length > 0 ? 'improvement' : 'stable';

  return { category, regressions, improvements, stable, threshold };
}

/**
 * Multi-snapshot trend report. snapshots は timeline 昇順で渡す前提。
 * 各 axis の first / last / delta / trend を集計。
 */
export function generateTrendReport(snapshots: MetricSnapshot[]): TrendReport {
  if (snapshots.length === 0) {
    return {
      snapshotCount: 0,
      firstLabel: null,
      lastLabel: null,
      axisSummary: [],
    };
  }

  const first = snapshots[0]!;
  const last = snapshots[snapshots.length - 1]!;
  const firstValues = extractAxisValues(first.report);
  const lastValues = extractAxisValues(last.report);

  const commonAxes = Object.keys(firstValues).filter((axis) => axis in lastValues);
  const axisSummary = commonAxes.map((axis) => {
    const firstVal = firstValues[axis]!;
    const lastVal = lastValues[axis]!;
    const delta = lastVal - firstVal;
    const trend: 'up' | 'down' | 'flat' = delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat';
    return { axis, first: firstVal, last: lastVal, delta, trend };
  });

  return {
    snapshotCount: snapshots.length,
    firstLabel: first.label,
    lastLabel: last.label,
    axisSummary,
  };
}
