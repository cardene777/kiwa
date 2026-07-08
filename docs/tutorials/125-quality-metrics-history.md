# quality-metrics v0.5 historical trend tracking + drift detection in 15 min

## What you'll build

A vitest suite wired to `@kiwa-test/quality-metrics` v0.5 (historical trend tracking + drift detection、 v1.65 で **depth-5 pattern 3 例目確定** = Mobile v1.55 + Desktop v1.61 + quality-metrics v1.65 で 3 例安定化到達、 **systematic pattern 40 度目適用**、 43 milestone streak)、 4 export (captureSnapshot + compareToBaseline + detectDrift + generateTrendReport) で release 品質 の 時系列 dimension を追加、 pass/fail 二値判定 の 手前で 「pass だが 前回より低下」 の regression signal を early warning 検知可能。

## Prerequisites

- Node.js ≥ 20 + pnpm
- `@kiwa-test/quality-metrics` v0.5 (`pnpm add -D @kiwa-test/quality-metrics@^0.5`)

## Step-by-step build

### 1. Snapshot capture

```ts
import { captureSnapshot } from '@kiwa-test/quality-metrics';

const snapshot = captureSnapshot({
  report: myReport, // QualityReport (既存 v0.4 shape そのまま)
  capturedAt: '2026-07-08T00:00:00Z',
  label: 'release-v1.65',
});
```

### 2. Baseline comparison

```ts
import { compareToBaseline } from '@kiwa-test/quality-metrics';

const comparison = compareToBaseline({
  current: currentSnapshot,
  baseline: baselineSnapshot,
});
// comparison.axisDeltas = per-axis delta + delta%
```

### 3. Drift detection

```ts
import { detectDrift } from '@kiwa-test/quality-metrics';

const drift = detectDrift({
  comparison,
  thresholdPct: 5.0, // default 5%
});
// drift.category = 'regression' | 'improvement' | 'stable'
// drift.regressions = 悪化 axis 一覧
// drift.improvements = 改善 axis 一覧
// drift.stable = 変動小 axis 一覧
```

### 4. Trend report (multi-snapshot)

```ts
import { generateTrendReport } from '@kiwa-test/quality-metrics';

const trend = generateTrendReport([snapshot1, snapshot2, snapshot3]);
// trend.axisSummary = axis 別 first / last / delta / trend ('up' | 'down' | 'flat')
```

### 5. 実行

```bash
pnpm exec vitest run
```

## 6 type SSOT

| type | 用途 |
|---|---|
| MetricSnapshot | capturedAt + label + report |
| AxisDelta | axis + currentValue + baselineValue + delta + deltaPct |
| BaselineComparison | currentLabel + baselineLabel + axisDeltas[] |
| DriftCategory | 'regression' \| 'improvement' \| 'stable' |
| DriftDetection | category + regressions + improvements + stable + threshold |
| TrendReport | snapshotCount + firstLabel + lastLabel + axisSummary |

## axis 別 上昇=改善/悪化 判定 SSOT

| axis prefix | 上昇 = 改善? |
|---|---|
| coverage.* / testCount.* / fidelity.* | 改善 |
| mutation.killRate / accuracy.score | 改善 |
| perf.p95Ms / cost.* / latency.* / token.* | 悪化 |
| a11y.* (violation count) | 悪化 |

## shape 契約 preserving 絶対維持

v0.5 = 既存 QualityReport 構造無変更、 v0.1-v0.4 API 変更 0、 additive のみ。

## 次の Step

- v1.65-2 dogfood-quality-metrics-history-app で 4 pattern workflow
- `docs/concepts/quality-metrics-history.md` で history layer + drift SSOT
- v1.66+ で release-gate に drift check opt-in 統合 検討
