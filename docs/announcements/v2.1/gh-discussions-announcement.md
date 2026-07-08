# kiwa v2.1 released — quality-metrics 深化 IV (adaptive drift threshold learning、 statistical inference SSOT、 47 milestone streak、 4 PR rhythm 復帰、 systematic pattern 44 度目)

## Summary

kiwa v2.1 is out。 **quality-metrics 深化 IV** 単軸 milestone、 v0.5 historical trend + v0.6 drift-gate integration → v2.1 で 「driftThresholdPct を 過去 N snapshot から 自動学習」 の adaptive layer を追加。 統計的異常検知 (mean + k*stdev SSOT、 default k=2 = 95% 信頼区間) で per-axis volatility を吸収、 v2.0 rename milestone (5 PR 例外拡張) 後 の **4 PR rhythm 復帰 milestone**、 **systematic pattern 44 度目適用** (statistical inference variant)、 **47 milestone snippet streak 到達**、 shape 契約 preserving 絶対維持、 depth-5 実運用継続 pattern 3 例目 の compound 深化。

## What's new

### `@kiwa/quality-metrics` v2.0 → v2.1 minor bump

- **`learnAdaptiveThreshold`** = 過去 N snapshot から axis 別 adaptive threshold 学習
- **`pickThresholdForAxis`** = axis 別 fallback SSOT helper (perAxis 存在 → 個別 / 不在 → aggregate)
- **`AdaptiveThreshold` + `AdaptiveThresholdReport`** type SSOT
- **統計的異常検知** = mean + k*stdev、 axis 別 独立学習、 baseline=0 Infinity 除外
- **shape 契約 preserving 絶対維持** = 既存 API (v0.5 の 4 export + v0.6 の ReleaseGateContext) 変更 0

### dogfood 新規

- `dogfood-quality-metrics-adaptive-threshold-app` = 4 pattern workflow (collectRolling + learnFromHistory + evaluateWithLearnedThreshold + explainLearnedGate)、 10 test 全 PASS

### 1 new tutorial + migration + concept

- **[Tutorial 128 — quality-metrics v2.1 adaptive threshold](https://cardene777.github.io/kiwa/tutorials/128-quality-metrics-adaptive-threshold)**
- Migration v2.0 → v2.1 additive
- Concept doc `quality-metrics-adaptive-threshold.md`

### 47-milestone consecutive snippet validation streak

v1.23 → v2.1 = **47 milestone**、 kiwa 史上最長記録更新継続。

### 4 PR rhythm 復帰

v2.0 rename milestone (5 PR 例外拡張) の 直後、 v2.1 で 4 PR rhythm 復帰、 v1.55-v1.67 の 14 milestone 連続 rhythm を継承 (v2.1 で **15 milestone 目 = 60 PR 連続同 rhythm** ...ただし v2.0 の 5 PR 例外を挟んでいるため rhythm streak は v2.1 で 1 milestone 目 として reset)。

## Install

```bash
pnpm add -D @kiwa/quality-metrics@^2.1
```

## Migration guide

[v2.0 → v2.1](https://cardene777.github.io/kiwa/migrations/v2.0-to-v2.1)

## What's next

- v2.2+ = 別 pair の depth-5 拡張 (4 例目 自然 発生 待ち) or quality-metrics v2.2 (multi-baseline comparison or automatic outlier detection)
