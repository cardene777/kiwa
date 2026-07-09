import {
  captureSnapshot,
  evaluateReleaseGate,
  type MetricSnapshot,
  type QualityReport,
  type ReleaseGateBlocker,
  type ReleaseGateContext,
  type ReleaseGateThresholds,
  type ReleaseGateVerdict,
} from '@kiwa-lab/quality-metrics';

/**
 * Pattern 1 — evaluateWithDriftGate = evaluateReleaseGate に driftEnabled +
 * driftBaseline を セット して 呼出す 標準経路。 dogfood consumer が v0.6 の
 * drift 統合 を 最短 で 使う ための 1 発 helper。
 */
export function evaluateWithDriftGate(input: {
  current: QualityReport;
  baseline: MetricSnapshot;
  overrides?: Partial<ReleaseGateThresholds>;
  thresholdPct?: number;
  extraContext?: Omit<
    ReleaseGateContext,
    'driftBaseline' | 'driftThresholdPct' | 'driftEnabled'
  >;
}): ReleaseGateVerdict {
  const context: ReleaseGateContext = {
    ...(input.extraContext ?? {}),
    driftEnabled: true,
    driftBaseline: input.baseline,
    ...(input.thresholdPct !== undefined ? { driftThresholdPct: input.thresholdPct } : {}),
  };
  return evaluateReleaseGate(input.current, input.overrides ?? {}, context);
}

/**
 * Pattern 2 — verifyReleaseWithDrift = release 前 の verdict 判定 で
 * baseline snapshot が 存在 する 場合 は drift 統合、 存在しない 場合 は
 * v0.5 まで の 標準 axis のみ で 判定 (baseline 未生成 の 初回 release で
 * 動作 する fallback 経路)。 realistic consumer flow の reference。
 */
export function verifyReleaseWithDrift(input: {
  current: QualityReport;
  baseline?: MetricSnapshot;
  thresholdPct?: number;
}): { verdict: ReleaseGateVerdict; usedDriftGate: boolean } {
  if (input.baseline !== undefined) {
    const verdict = evaluateWithDriftGate({
      current: input.current,
      baseline: input.baseline,
      ...(input.thresholdPct !== undefined ? { thresholdPct: input.thresholdPct } : {}),
    });
    return { verdict, usedDriftGate: true };
  }
  const verdict = evaluateReleaseGate(input.current);
  return { verdict, usedDriftGate: false };
}

/**
 * Pattern 3 — explainDriftBlockers = ReleaseGateBlocker の うち
 * drift.* prefix の 分 を 抽出、 axis / 実測 deltaPct / threshold%
 * を actionable message 3-field で 返す。 downstream の PR コメント /
 * release note 出力 に 使える 整形経路。
 */
export function explainDriftBlockers(verdict: ReleaseGateVerdict): {
  axis: string;
  deltaPct: number;
  thresholdPct: number;
  message: string;
}[] {
  return verdict.blockers
    .filter((b) => b.axis.startsWith('drift.'))
    .map((b: ReleaseGateBlocker) => ({
      axis: b.axis,
      deltaPct: b.actual,
      thresholdPct: -b.threshold,
      message: `${b.axis} regression detected: delta ${b.actual.toFixed(2)}% breached threshold -${(-b.threshold).toFixed(2)}%`,
    }));
}

/**
 * Pattern 4 — tryReleaseWithoutDrift = default off 経路 の consumer 動作
 * verify、 driftEnabled=false で v0.5 まで の 動作 に 戻す 経路 の reference。
 * backward compat 絶対 維持 を dogfood 経路 で 実証。
 */
export function tryReleaseWithoutDrift(input: {
  current: QualityReport;
  baseline: MetricSnapshot;
}): { verdict: ReleaseGateVerdict; driftBypassed: boolean } {
  const verdict = evaluateReleaseGate(input.current, {}, {
    driftBaseline: input.baseline,
    driftEnabled: false,
  });
  const driftBypassed = verdict.blockers.every((b) => !b.axis.startsWith('drift.'));
  return { verdict, driftBypassed };
}

/**
 * util — dogfood 経路 で baseline snapshot を build する 標準 helper。
 * timestamp は ISO 8601 期待、 label に release tag (`release-v1.65` 等) を
 * 渡す。 v0.5 dogfood (history-app) の captureReleaseSnapshot と shape 一致、
 * 統合 経路 で 再利用可。
 */
export function buildBaselineSnapshot(input: {
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
