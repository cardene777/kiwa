import {
  captureSnapshot,
  evaluateReleaseGate,
  learnAdaptiveThreshold,
  pickThresholdForAxis,
  type AdaptiveThresholdReport,
  type MetricSnapshot,
  type QualityReport,
  type ReleaseGateBlocker,
  type ReleaseGateVerdict,
} from '@kiwa/quality-metrics';

/**
 * Pattern 1 — collectRolling = 直近 N release 分 の snapshot を rolling 窓 で
 * 保持 する 標準経路。 window 溢れは 最古 削除、 新規追加は 末尾。 dogfood
 * consumer が release cycle 内 で snapshot 履歴 を メモリ管理する reference。
 */
export function collectRolling(input: {
  history: MetricSnapshot[];
  newSnapshot: MetricSnapshot;
  windowSize?: number;
}): MetricSnapshot[] {
  const window = input.windowSize ?? 10;
  const next = [...input.history, input.newSnapshot];
  if (next.length <= window) return next;
  return next.slice(next.length - window);
}

/**
 * Pattern 2 — learnFromHistory = 保持中 の history から adaptive threshold を
 * 学習する、 v2.1 の 標準 dogfood 経路。 stdevMultiplier / minSampleCount を
 * override 可能、 default k=2 (95% CI) + minSample=3。
 */
export function learnFromHistory(input: {
  history: MetricSnapshot[];
  stdevMultiplier?: number;
  minSampleCount?: number;
}): AdaptiveThresholdReport {
  return learnAdaptiveThreshold({
    snapshots: input.history,
    ...(input.stdevMultiplier !== undefined ? { stdevMultiplier: input.stdevMultiplier } : {}),
    ...(input.minSampleCount !== undefined ? { minSampleCount: input.minSampleCount } : {}),
  });
}

/**
 * Pattern 3 — evaluateWithLearnedThreshold = 学習 threshold を driftThresholdPct
 * に injection して evaluateReleaseGate を実行。 baseline は history 末尾 の
 * snapshot (直前 release) を使う、 aggregate threshold を 全体 fallback とする。
 * per-axis threshold は v0.6 API では 1 値 しか受けないので、 aggregate を採用
 * (consumer が axis 別 制御したい場合 は pickThresholdForAxis で個別評価する)。
 */
export function evaluateWithLearnedThreshold(input: {
  current: QualityReport;
  history: MetricSnapshot[];
  learned: AdaptiveThresholdReport;
}): { verdict: ReleaseGateVerdict; usedThresholdPct: number } {
  const baseline = input.history[input.history.length - 1];
  if (baseline === undefined) {
    return { verdict: evaluateReleaseGate(input.current), usedThresholdPct: 0 };
  }
  const usedThresholdPct = input.learned.aggregateThresholdPct;
  const verdict = evaluateReleaseGate(input.current, {}, {
    driftEnabled: true,
    driftBaseline: baseline,
    driftThresholdPct: usedThresholdPct,
  });
  return { verdict, usedThresholdPct };
}

/**
 * Pattern 4 — explainLearnedGate = drift blocker を axis 別 threshold と併記
 * して actionable message 化。 pickThresholdForAxis で axis 個別 threshold を
 * 引き、 aggregate との差 も 明示。 PR コメント / release note 出力 経路。
 */
export function explainLearnedGate(input: {
  verdict: ReleaseGateVerdict;
  learned: AdaptiveThresholdReport;
}): {
  axis: string;
  actualDeltaPct: number;
  aggregateThresholdPct: number;
  perAxisThresholdPct: number;
  message: string;
}[] {
  return input.verdict.blockers
    .filter((b) => b.axis.startsWith('drift.'))
    .map((b: ReleaseGateBlocker) => {
      const axis = b.axis.replace(/^drift\./, '');
      const perAxis = pickThresholdForAxis(input.learned, axis);
      const aggregate = input.learned.aggregateThresholdPct;
      return {
        axis: b.axis,
        actualDeltaPct: b.actual,
        aggregateThresholdPct: aggregate,
        perAxisThresholdPct: perAxis,
        message: `${b.axis} learned-gate breach: delta ${b.actual.toFixed(2)}% exceeded ${perAxis === aggregate ? 'aggregate' : 'per-axis'} threshold ${perAxis.toFixed(2)}% (aggregate ${aggregate.toFixed(2)}%)`,
      };
    });
}

/**
 * util — release cycle 開始時 の snapshot 生成 helper、 v0.5 の captureSnapshot
 * を dogfood 経路 で ラップ。 label は release tag、 timestamp は ISO 8601。
 */
export function snapshotForRelease(input: {
  report: QualityReport;
  timestamp: string;
  label: string;
}): MetricSnapshot {
  return captureSnapshot({
    report: input.report,
    capturedAt: input.timestamp,
    label: input.label,
  });
}
