# kiwa v1.65 released — quality-metrics 深化 II (v0.5 historical trend tracking + drift detection、 depth-5 pattern 3 例目確定、 systematic pattern 40 度目、 43 milestone streak)

## Summary

kiwa v1.65 is out。 **quality-metrics 深化 II** 単軸 milestone、 v0.4 tier-aware release gate + context に **v0.5 で historical trend tracking + drift detection** を追加、 pass/fail 二値判定 の 手前で 「pass だが 前回より低下」 の regression signal を early warning 検知可能。 v1.55-v1.64 4 PR rhythm 継承 (**12 milestone 連続 = 48 PR 連続同 rhythm**)、 **systematic pattern 40 度目適用** (40 度突入)、 **43 milestone snippet streak 達成**、 shape 契約 preserving 絶対維持、 **depth-5 pattern 3 例目確定** (Mobile v1.55 + Desktop v1.61 + quality-metrics v1.65 で 3 例安定化到達 = 「絶対的 rule」 昇格 signal)。

## What's new

### `@kiwa/quality-metrics` v0.5 minor bump

- **history.ts 新設** = MetricSnapshot + AxisDelta + BaselineComparison + DriftCategory + DriftDetection + TrendReport SSOT
- **4 export** = captureSnapshot + compareToBaseline + detectDrift + generateTrendReport
- **shape 契約 preserving 絶対維持** = 既存 QualityReport 構造無変更、 v0.1-v0.4 API 変更 0

### dogfood 新規

- `dogfood-quality-metrics-history-app` = captureReleaseSnapshot + verifyNoRegression + generateReleaseTrend + findRegressions の 4 pattern、 10 test 全 PASS
- kiwa package 49 個到達

### 1 new tutorial + migration + concept

- **[Tutorial 125 — quality-metrics v0.5 historical trend + drift](https://cardene777.github.io/kiwa/tutorials/125-quality-metrics-history)**
- Migration v1.64 → v1.65 additive
- Concept doc `quality-metrics-history.md`

### 43-milestone consecutive snippet validation streak

v1.23 → v1.65 = **43 milestone**、 kiwa 史上最長記録更新継続。

### depth-5 pattern 3 例目確定 = 「絶対的 rule」 昇格 signal

- 1 例目 = Mobile v1.54-v1.55 (spawn stub → 実 spawn)
- 2 例目 = Desktop v1.60-v1.61 (spawn stub → 実 spawn)
- **3 例目確定 = quality-metrics v1.65** (13-axis gate → historical trend + drift)

3 例安定化到達 = 「pattern 化 candidate → 確定 pattern → 絶対的 rule」 昇格 signal、 v1.66+ 他 pair depth-5 拡張時に SOP 引用可能。

## Install

```bash
pnpm add -D @kiwa/quality-metrics@^0.5
```

## Migration guide

[v1.64 → v1.65](https://cardene777.github.io/kiwa/migrations/v1.64-to-v1.65)

## What's next

- v1.66+ = release-gate に drift check opt-in 統合
- 他 pair 6 段拡張 (depth-6 pattern 3 例安定化)
- v2.0 milestone coverage 100% goal
