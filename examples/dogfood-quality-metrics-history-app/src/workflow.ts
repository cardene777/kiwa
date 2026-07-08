import {
  captureSnapshot,
  compareToBaseline,
  detectDrift,
  generateTrendReport,
  type BaselineComparison,
  type DriftDetection,
  type MetricSnapshot,
  type QualityReport,
  type TrendReport,
} from '@kiwa/quality-metrics';

/** Pattern 1 — snapshot 単発 capture */
export function captureReleaseSnapshot(input: {
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

/** Pattern 2 — current vs baseline の drift 判定 */
export function verifyNoRegression(input: {
  current: MetricSnapshot;
  baseline: MetricSnapshot;
  thresholdPct?: number;
}): {
  comparison: BaselineComparison;
  drift: DriftDetection;
  passed: boolean;
} {
  const comparison = compareToBaseline({ current: input.current, baseline: input.baseline });
  const drift = detectDrift(
    input.thresholdPct !== undefined ? { comparison, thresholdPct: input.thresholdPct } : { comparison },
  );
  const passed = drift.category !== 'regression';
  return { comparison, drift, passed };
}

/** Pattern 3 — 複数 release の trend 生成 */
export function generateReleaseTrend(snapshots: MetricSnapshot[]): TrendReport {
  return generateTrendReport(snapshots);
}

/** Pattern 4 — regression axis のみ抽出 (release blocker 候補) */
export function findRegressions(input: {
  current: MetricSnapshot;
  baseline: MetricSnapshot;
  thresholdPct?: number;
}): { axis: string; deltaPct: number }[] {
  const { drift } = verifyNoRegression(input);
  return drift.regressions.map((r) => ({ axis: r.axis, deltaPct: r.deltaPct }));
}
