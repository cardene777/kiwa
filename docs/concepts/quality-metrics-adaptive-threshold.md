---
title: quality-metrics v2.1 adaptive drift threshold learning SSOT
---

# quality-metrics v2.1 adaptive drift threshold learning SSOT

## What this covers

`@kiwa-lab/quality-metrics` v2.1 の adaptive drift threshold learning SSOT。 v0.5 で historical trend、 v0.6 で drift-gate integration、 v2.1 で 「driftThresholdPct を 過去 N snapshot から 自動学習」 の adaptive layer。 quality-metrics 縦深化 pair の第 7 段、 depth-5 実運用継続 pattern 3 例目 の compound 深化、 systematic pattern 44 度目適用 (statistical inference variant)。

## 統計的異常検知 SSOT

過去 N snapshot の consecutive deltaPct 分布 から mean + k*stdev で 「異常範囲」 を 動的算出。

| k | 信頼区間 | 用途 |
|---|---|---|
| 1 | ~68% (1σ) | 検知感度優先 (小さな drift も検知) |
| 2 (default) | ~95% (2σ) | 標準異常検知 の bar |
| 3 | ~99.7% (3σ) | 保守的、 false positive 抑制 |

axis 別 独立学習で per-axis volatility 反映 (perf は 変動大 = 広め threshold、 coverage は 変動小 = 狭め threshold)。

## API SSOT

### `learnAdaptiveThreshold`

```ts
learnAdaptiveThreshold({
  snapshots: MetricSnapshot[],           // timeline 昇順、 最低 2 個必要
  stdevMultiplier?: number,              // default 2 = 95% 信頼区間
  minSampleCount?: number,               // default 3 = 統計的信頼性下限
}): AdaptiveThresholdReport
```

### `pickThresholdForAxis`

```ts
pickThresholdForAxis(
  report: AdaptiveThresholdReport,
  axis?: string,
): number
// axis in perAxis → 個別 threshold
// axis not in perAxis → aggregate fallback
// axis undefined → aggregate 直接
```

## AdaptiveThreshold shape SSOT

```ts
export interface AdaptiveThreshold {
  axis: string;
  sampleCount: number;
  meanDeltaPct: number;         // 平均 deltaPct (0 なら stable、 !=0 なら 走行 drift)
  stdevDeltaPct: number;        // 母集団標準偏差 (N-1 補正なし、 保守的)
  recommendedThresholdPct: number; // |mean| + k * stdev の絶対値
}

export interface AdaptiveThresholdReport {
  perAxis: Record<string, AdaptiveThreshold>;
  aggregateThresholdPct: number;   // 全 perAxis 平均、 fallback 用
  usedSnapshotCount: number;
}
```

## 学習経路 5 step

1. **consecutive delta 抽出** = snapshots[i-1] → snapshots[i] の deltaPct を各 axis で 収集
2. **Infinity 除外** = baseline=0 で deltaPct=Infinity になる sample は 除外
3. **minSampleCount filter** = axis 別 sample 数 が 閾値未満 なら perAxis に含めない
4. **mean + stdev 計算** = 母集団標準偏差 (N-1 補正なし)
5. **recommended 算出** = |mean| + k * stdev、 mean 自体が 0 でない (走行 drift) 状態も threshold に反映

## 判定 mean の 意味

- mean=0 = 完全 stable、 threshold = k * stdev (variance のみ)
- mean>0 = 上昇 trend (coverage/testCount では 改善方向)、 threshold = mean + k * stdev
- mean<0 = 下降 trend (coverage で 劣化方向)、 threshold = |mean| + k * stdev

`|mean|` を取ることで、 走行 drift 分 も 「異常」 検知の base に含めない = 「trend に沿った 徐々な劣化」 は blocker 化しない。 急落 は stdev を 超えるので 検知される。

## edge case 5 経路

- snapshots < 2 = 空 perAxis + aggregate=0
- minSampleCount 未満 = perAxis から 除外
- stable 全同値 = mean=stdev=recommended=0
- baseline=0 = Infinity 除外
- axis が report に存在しない = series 生成時 skip

## Backward compat 絶対維持

- 既存 API (v0.5 の 4 export + v0.6 の ReleaseGateContext) 変更 0
- shape 契約 preserving = QualityReport 構造 変更 0
- 新規 file `threshold-learning.ts` 追加 のみ、 v2.0 まで の consumer は 触らず
- 既存 193 test 継続 pass、 追加 13 test で v2.1 統合 cover

## depth-5 実運用継続 pattern 3 例目 の compound 深化 SSOT

- **1 例目 (depth-5) confirmed** = Mobile / Desktop / quality-metrics の 3 例安定化到達済 (v1.65 「絶対的 rule」 昇格 signal 到達)
- **v1.66** = drift-gate integration (v0.5 pure library → release gate 統合、 depth-5 実運用継続開始)
- **v2.1** = adaptive threshold learning (statistical inference で threshold 自動化、 継続深化)
- 4 例目化 は 別 pair の 自然 発生 待ち (Mobile / Desktop の depth-6 拡張 or 別 pair の depth-5 到達)

## systematic pattern 44 度目適用 の 5 原則

- shape 契約 preserving (既存 API 変更 0)
- additive-only (新規 file 追加のみ)
- backward compat 絶対維持 (opt-in、 使わない consumer は v2.0 相当)
- statistical inference (mean + k*stdev SSOT)
- observability additive (perAxis + aggregate + sampleCount で 学習信頼性可視化)

## Reference

- 実装 = `packages/quality-metrics/src/threshold-learning.ts`
- test = `packages/quality-metrics/tests/threshold-learning.test.ts` § T-QM-AT-001-013 (13 test)
- dogfood = `examples/dogfood-quality-metrics-adaptive-threshold-app/` (4 pattern workflow)
- tutorial = `docs/tutorials/128-quality-metrics-adaptive-threshold.md`
- migration = `docs/migrations/v2.0-to-v2.1.md`
