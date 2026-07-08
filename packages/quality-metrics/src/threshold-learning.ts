/**
 * v2.1 Adaptive drift threshold learning。
 *
 * v0.5 で historical trend tracking (MetricSnapshot / BaselineComparison /
 * DriftDetection / TrendReport) を追加、 v0.6 で evaluateReleaseGate に
 * drift check opt-in 統合 (driftEnabled + driftBaseline + driftThresholdPct)、
 * v2.1 で 「driftThresholdPct を 過去 N snapshot から 自動学習」 の
 * adaptive layer を追加。
 *
 * 統計的 異常検知 の 標準経路 = 過去 N sample の deltaPct 分布から
 * mean ± k*stdev で 「異常範囲」 を 動的算出、 k=2 で 95% 信頼区間、
 * k=3 で 99.7% 信頼区間 相当。 axis 別 threshold 独立学習で per-axis
 * volatility を反映、 「perf は 変動大、 coverage は 変動小」 の
 * pair 特性を 自動的に 吸収する。
 *
 * shape 契約 preserving 絶対維持 = 既存 API (v0.5 の 4 export + v0.6 の
 * ReleaseGateContext) 変更 0、 v2.1 は 新規 export の additive のみ、
 * v2.0 まで の consumer は 触らず、 v2.1 consumer は opt-in で利用。
 */
import type { QualityReport } from './types.js';
import type { MetricSnapshot } from './history.js';

/**
 * axis 別 の adaptive threshold 学習結果。 mean + stdev + sampleCount で
 * 学習 の 統計的信頼性 を verify 可能、 recommendedThresholdPct が最終出力。
 */
export interface AdaptiveThreshold {
  axis: string;
  sampleCount: number;
  meanDeltaPct: number;
  stdevDeltaPct: number;
  /** mean + k * stdev の絶対値、 k は input.stdevMultiplier (default 2)。 */
  recommendedThresholdPct: number;
}

/** 全 axis 分 の 学習結果集計。 axis 名 → AdaptiveThreshold の map と 平均値。 */
export interface AdaptiveThresholdReport {
  perAxis: Record<string, AdaptiveThreshold>;
  /** 全 axis 平均 recommendedThresholdPct、 fallback threshold として使う。 */
  aggregateThresholdPct: number;
  usedSnapshotCount: number;
}

/**
 * QualityReport から axis 別 数値 を抽出する SSOT helper (v0.5 history.ts
 * の extractAxisValues と同じ shape、 module 境界の pure fn として re-export)。
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
  if (report.cost) values['cost.perRequestUsd'] = report.cost.perRequestUsd;
  if (report.latency) values['latency.p95Ms'] = report.latency.p95Ms;
  if (report.token) values['token.totalTokens'] = report.token.totalTokens;
  if (report.accuracy) values['accuracy.score'] = report.accuracy.score;
  if (report.a11y) {
    values['a11y.critical'] = report.a11y.critical;
    values['a11y.serious'] = report.a11y.serious;
    values['a11y.moderate'] = report.a11y.moderate;
  }
  return values;
}

/**
 * 過去 N snapshot から axis 別 の deltaPct 列 を 抽出。
 * snapshots[0] → snapshots[1] の deltaPct、 snapshots[1] → snapshots[2] の
 * deltaPct 、 ... の N-1 個 の delta% サンプル を 各 axis で 収集。
 *
 * baseline 側 が 0 の場合 の deltaPct は Infinity になり得るので filter で
 * 除外、 有効 sample のみで stat 計算する (Infinity が 混入すると mean/stdev
 * が Infinity 化して 学習不能になる)。
 */
function collectAxisDeltaSeries(
  snapshots: MetricSnapshot[],
): Record<string, number[]> {
  const series: Record<string, number[]> = {};
  for (let i = 1; i < snapshots.length; i++) {
    const prev = extractAxisValues(snapshots[i - 1]!.report);
    const curr = extractAxisValues(snapshots[i]!.report);
    for (const axis of Object.keys(curr)) {
      if (!(axis in prev)) continue;
      const p = prev[axis]!;
      const c = curr[axis]!;
      if (p === 0) continue;
      const deltaPct = ((c - p) / p) * 100;
      if (!Number.isFinite(deltaPct)) continue;
      if (!(axis in series)) series[axis] = [];
      series[axis]!.push(deltaPct);
    }
  }
  return series;
}

/**
 * 数値列 から mean + stdev を算出、 population stdev (母集団標準偏差) を
 * 使う (sample stdev の N-1 補正はしない、 sample size が 小さくなる
 * quality-metrics 用途では population stdev の方が 保守的な threshold を
 * 導く = 少し 広め の threshold で 過剰 fail を抑制)。
 */
function computeMeanStdev(values: number[]): { mean: number; stdev: number } {
  if (values.length === 0) return { mean: 0, stdev: 0 };
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance =
    values.reduce((acc, v) => acc + (v - mean) * (v - mean), 0) /
    values.length;
  return { mean, stdev: Math.sqrt(variance) };
}

/**
 * v2.1 メイン API = 過去 N snapshot から axis 別 の adaptive threshold を
 * 学習する。 snapshots は timeline 昇順で渡す、 内部で consecutive delta の
 * 分布を計算、 axis 別 mean + stdev から k*stdev 幅 の 推奨 threshold を出力。
 *
 * @param input.snapshots timeline 昇順 の N snapshot、 最低 2 個必要
 * @param input.stdevMultiplier k=2 (default) で 95% 信頼区間、 k=3 で 99.7%
 * @param input.minSampleCount axis 別 学習の 最小 sample 数 (default 3)、
 *   sample 数不足 axis は perAxis に含めず aggregate も 反映されない
 * @returns axis 別 threshold + aggregate 平均
 *
 * axis の recommendedThresholdPct = |mean| + k * stdev の絶対値、 「mean
 * 自体が 0 でなく 走行 drift している」 状態も 吸収 (mean だけ で 判定
 * すると mean 分 の drift が missed threshold になる)。
 */
export function learnAdaptiveThreshold(input: {
  snapshots: MetricSnapshot[];
  stdevMultiplier?: number;
  minSampleCount?: number;
}): AdaptiveThresholdReport {
  const k = input.stdevMultiplier ?? 2.0;
  const minSample = input.minSampleCount ?? 3;
  const perAxis: Record<string, AdaptiveThreshold> = {};

  if (input.snapshots.length < 2) {
    return { perAxis, aggregateThresholdPct: 0, usedSnapshotCount: input.snapshots.length };
  }

  const series = collectAxisDeltaSeries(input.snapshots);
  for (const [axis, values] of Object.entries(series)) {
    if (values.length < minSample) continue;
    const { mean, stdev } = computeMeanStdev(values);
    const recommended = Math.abs(mean) + k * stdev;
    perAxis[axis] = {
      axis,
      sampleCount: values.length,
      meanDeltaPct: mean,
      stdevDeltaPct: stdev,
      recommendedThresholdPct: recommended,
    };
  }

  const thresholds = Object.values(perAxis).map((t) => t.recommendedThresholdPct);
  const aggregate =
    thresholds.length === 0
      ? 0
      : thresholds.reduce((a, b) => a + b, 0) / thresholds.length;

  return {
    perAxis,
    aggregateThresholdPct: aggregate,
    usedSnapshotCount: input.snapshots.length,
  };
}

/**
 * axis 名 が AdaptiveThresholdReport の perAxis に存在すれば 個別 threshold、
 * 存在しなければ aggregate fallback を返す SSOT helper。 evaluateReleaseGate
 * の driftThresholdPct 決定経路 と consumer の per-axis fallback lookup を
 * 統一する。
 *
 * axis 名 未指定 (undefined) の場合 は aggregate を返す (全体 fallback 用途)。
 */
export function pickThresholdForAxis(
  report: AdaptiveThresholdReport,
  axis?: string,
): number {
  if (axis === undefined) return report.aggregateThresholdPct;
  const entry = report.perAxis[axis];
  return entry?.recommendedThresholdPct ?? report.aggregateThresholdPct;
}
