---
title: quality-metrics v0.5 historical trend tracking + drift detection SSOT
---

# quality-metrics v0.5 historical trend tracking + drift detection SSOT

## What this covers

`@kiwa-lab/quality-metrics` v0.5 の historical trend tracking + drift detection SSOT。 v1.65 で v0.4 release-gate context → v0.5 history layer 追加、 quality-metrics 縦深化 pair の第 5 段、 **depth-5 pattern 3 例目確定** (Mobile v1.55 + Desktop v1.61 + quality-metrics v1.65 で 3 例安定化到達)、 v0.4 baseline (`docs/concepts/quality-metrics-tier-aware.md` 等) を extend。

## 6 type SSOT

```ts
export interface MetricSnapshot {
  capturedAt: string;    // ISO 8601 timestamp
  label: string | null;  // 'release-v1.65' 等
  report: QualityReport; // v0.4 shape そのまま
}

export interface AxisDelta {
  axis: string;         // 'coverage.line' 等
  currentValue: number;
  baselineValue: number;
  delta: number;        // current - baseline
  deltaPct: number;     // (delta / baseline) * 100
}

export interface BaselineComparison {
  currentLabel: string | null;
  baselineLabel: string | null;
  axisDeltas: AxisDelta[];
}

export type DriftCategory = 'regression' | 'improvement' | 'stable';

export interface DriftDetection {
  category: DriftCategory;
  regressions: AxisDelta[];  // 悪化 axis
  improvements: AxisDelta[]; // 改善 axis
  stable: AxisDelta[];       // 変動小 axis
  threshold: number;         // 判定 threshold (default 5.0)
}

export interface TrendReport {
  snapshotCount: number;
  firstLabel: string | null;
  lastLabel: string | null;
  axisSummary: { axis: string; first: number; last: number; delta: number; trend: 'up' | 'down' | 'flat' }[];
}
```

## 4 export function SSOT

| function | 用途 |
|---|---|
| captureSnapshot | 時点 QualityReport を MetricSnapshot 化 |
| compareToBaseline | current vs baseline の axis 別 delta 計算 |
| detectDrift | threshold 判定で regression / improvement / stable カテゴリ化 |
| generateTrendReport | multi-snapshot の trend (first / last / delta / up-down-flat) 集計 |

## axis 別 上昇=改善/悪化 判定 SSOT

- **上昇=改善** axis: coverage.* / testCount.* / fidelity.* / mutation.killRate / accuracy.score
- **上昇=悪化** axis: perf.* / cost.* / latency.* / token.* / a11y.* (violation count)

## detectDrift threshold default 5.0

`|deltaPct| < threshold` = stable、 それ以外は 上昇=改善/悪化 判定で regression/improvement 振り分け。 caller は release blocker として 「regression 検出時 fail-fast」 経路を選択可。

## shape 契約 preserving 絶対維持

v0.5 = 既存 QualityReport 構造無変更、 新規 file (history.ts) の追加のみ。 v0.1-v0.4 の 13-axis release gate + tier-aware mutation gate + release gate context 完全保持、 既存 test 全継続 PASS。

## release-gate integration (v1.66+ 予定)

現状 v0.5 は history + drift を pure library として提供、 release-gate との統合は opt-in 経路として v1.66+ で追加予定。 evaluateReleaseGate + drift の 二重 check で 「pass だが 前回より低下」 の regression を pass/fail に格上げ可能。

## systematic pattern 40 度目適用

v1.64 の 39 度目 (native invoke integration uniform) を 40 度目で history layer uniform 適用。 **40 度突入** = pattern が rule として認知される SSOT 節目、 v1.55 30 度突入以来の 10 度目 signal 到達。

## depth-5 pattern 3 例目確定 = 「絶対的 rule」 昇格 signal

- **1 例目** = Mobile v1.54-v1.55 (spawn stub → 実 spawn、 kiwa milestone 史上初 depth-5)
- **2 例目** = Desktop v1.60-v1.61 (spawn stub → 実 spawn、 3 例目 candidate → 確定)
- **3 例目** = quality-metrics v1.65 (13-axis gate → historical trend + drift、 3 例安定化 signal)

3 例安定化到達 = 「pattern 化 candidate → 確定 pattern → 絶対的 rule」 昇格 signal、 v1.66+ 他 pair depth-5 拡張時に SOP 引用可能。

## Phase 11 (v1.66+) 計画

- release-gate に drift check opt-in 統合
- 他 pair 6 段拡張 (Mobile + Desktop 以外の depth-6 拡張、 depth-6 pattern 3 例安定化 candidate)
- v2.0 milestone coverage 100% goal
