---
title: "kiwa v1.65 リリース — quality-metrics 深化 II (@kiwa-test/quality-metrics v0.5 historical trend tracking + drift detection、 depth-5 pattern 3 例目確定 = 絶対的 rule 昇格 signal、 systematic pattern 40 度目、 43 milestone streak)"
emoji: "📈"
type: "tech"
topics: ["testing", "vitest", "quality-metrics", "release-gate"]
published: false
---

# kiwa v1.65 リリース — quality-metrics 深化 II

## Summary

**quality-metrics 深化 II** 単軸 milestone、 v0.5 で historical trend tracking + drift detection 実装、 pass/fail 二値判定 の 手前で 「pass だが 前回より低下」 の regression signal を early warning 検知可能。 v1.55-v1.64 4 PR rhythm 継承 (**12 milestone 連続 = 48 PR 連続同 rhythm**)、 **systematic pattern 40 度目適用** (**40 度突入**)、 **43 milestone 連続 snippet validation streak** 達成、 shape 契約 preserving 絶対維持、 **depth-5 pattern 3 例目確定** (Mobile v1.55 + Desktop v1.61 + quality-metrics v1.65 で 3 例安定化到達 = 「絶対的 rule」 昇格 signal)。

## What's new

### 6 type SSOT

| type | 用途 |
|---|---|
| MetricSnapshot | capturedAt + label + report |
| AxisDelta | axis + currentValue + baselineValue + delta + deltaPct |
| BaselineComparison | currentLabel + baselineLabel + axisDeltas[] |
| DriftCategory | 'regression' \| 'improvement' \| 'stable' |
| DriftDetection | category + regressions + improvements + stable + threshold |
| TrendReport | snapshotCount + firstLabel + lastLabel + axisSummary |

### 3 code pattern

```ts
// Pattern 1 — Snapshot capture
const snapshot = captureSnapshot({ report, capturedAt: '2026-07-08T00:00:00Z', label: 'v1.65' });

// Pattern 2 — Regression detection
const drift = detectDrift({ comparison: compareToBaseline({ current, baseline }), thresholdPct: 5.0 });
if (drift.category === 'regression') console.log('Blockers:', drift.regressions);

// Pattern 3 — Trend across releases
const trend = generateTrendReport([snap1, snap2, snap3]);
```

### backward compat 絶対維持

v0.5 = 既存 QualityReport 構造無変更、 v0.1-v0.4 API 変更 0、 additive のみ。

### dogfood 新規

`dogfood-quality-metrics-history-app` = 4 pattern、 10 test 全 PASS、 kiwa package 49 到達。

### 43 milestone 連続 snippet validation streak

### depth-5 pattern 3 例目確定

- **1 例目** = Mobile v1.54-v1.55
- **2 例目** = Desktop v1.60-v1.61
- **3 例目** = quality-metrics v1.65 ← v1.65

3 例安定化到達 = 「pattern 化 candidate → 確定 pattern → 絶対的 rule」 昇格 signal。

### systematic pattern 40 度突入

v1.55 30 度突入以来の 10 度目 signal 到達。

## Install

```bash
pnpm add -D @kiwa-test/quality-metrics@^0.5
```

## Migration guide

[v1.64 → v1.65](https://cardene777.github.io/kiwa/migrations/v1.64-to-v1.65)

## What's next

- v1.66+ = release-gate に drift check opt-in 統合
- 他 pair 6 段拡張
- v2.0 milestone coverage 100% goal

## 4 sub 完遂

- v1.65-1 = history.ts + 17 test (175 test 全 PASS)
- v1.65-2 = dogfood-quality-metrics-history-app 新規 (10 test 全 PASS、 49 package)
- v1.65-3 = tutorial 125 + migration + concept + snippet 43 streak (179 test 全 PASS)
- v1.65-4 = publish
