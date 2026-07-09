# kiwa v1.66 released — quality-metrics 深化 III (v0.6 evaluateReleaseGate に drift check opt-in 統合、 depth-5 pattern 3 例目確定 実運用継続、 systematic pattern 41 度目、 44 milestone streak)

## Summary

kiwa v1.66 is out。 **quality-metrics 深化 III** 単軸 milestone、 v0.5 で pure library として提供した historical trend tracking + drift detection を **v0.6 で evaluateReleaseGate に opt-in 統合**、 regression 検知 axis を `drift.{axis名}` の ReleaseGateBlocker に 1:1 格上げ、 pass/fail 判定 と 前回比較 判定 を 1 経路 で 統合。 v1.55-v1.65 4 PR rhythm 継承 (**13 milestone 連続 = 52 PR 連続同 rhythm**)、 **systematic pattern 41 度目適用**、 **44 milestone snippet streak 達成**、 shape 契約 preserving 絶対維持、 **depth-5 pattern 3 例目確定 実運用継続** (Mobile v1.55 + Desktop v1.61 + quality-metrics v1.65 3 例安定化到達 = 「絶対的 rule」 昇格 signal 到達済 の 継続深化)。

## What's new

### `@kiwa-lab/quality-metrics` v0.6 minor bump

- **ReleaseGateContext に 3 field 追加** = driftBaseline (MetricSnapshot) / driftThresholdPct (default 5.0) / driftEnabled (default undefined = off)
- **drift 統合 axis 群** = driftEnabled === true かつ driftBaseline 存在時のみ発火、 evaluateReleaseGate 内部で v0.5 の captureSnapshot + compareToBaseline + detectDrift chain 実行、 regression 検知 axis を drift.{axis名} の ReleaseGateBlocker に 1:1 格上げ
- **axesEvaluated 加算 rule** = drift lane を +1 の 単一 lane で 加算 (mutation.tier / a11y.tier と 同一 設計、 blocker 数と 独立)
- **shape 契約 preserving 絶対維持** = QualityReport 構造 変更 0、 v0.1-v0.5 API 変更 0、 additive のみ

### dogfood 新規

- `dogfood-quality-metrics-drift-gate-app` = evaluateWithDriftGate + verifyReleaseWithDrift + explainDriftBlockers + tryReleaseWithoutDrift の 4 pattern workflow、 11 test 全 PASS
- kiwa dogfood app 追加 (v0.5 pure library dogfood を release gate 統合経路に拡張)

### 1 new tutorial + migration + concept

- **[Tutorial 126 — quality-metrics v0.6 drift-gate](https://cardene777.github.io/kiwa/tutorials/126-quality-metrics-drift-gate)**
- Migration v1.65 → v1.66 additive
- Concept doc `quality-metrics-drift-gate.md`

### 44-milestone consecutive snippet validation streak

v1.23 → v1.66 = **44 milestone**、 kiwa 史上最長記録更新継続。

### depth-5 pattern 3 例目確定 実運用継続

- 1 例目 = Mobile v1.54-v1.55 (spawn stub → 実 spawn)
- 2 例目 = Desktop v1.60-v1.61 (spawn stub → 実 spawn)
- **3 例目 = quality-metrics v1.65** (13-axis gate → historical trend + drift)
- **v1.66 = 実運用継続** = drift 統合で v0.5 pure library を release gate 経路に統合、 「絶対的 rule」 の 実運用 深化

4 例目化 は 無理に 狙わず 自然 発生 待ち (3 例目 実績 消費 禁止)。

## Install

```bash
pnpm add -D @kiwa-lab/quality-metrics@^0.6
```

## Migration guide

[v1.65 → v1.66](https://cardene777.github.io/kiwa/migrations/v1.65-to-v1.66)

## What's next

- v1.67+ = depth-6 単軸拡張 or 別 pair の depth-5 拡張
- 4 例目 は 自然 発生 待ち (3 例目 実績 消費 禁止)
- v2.0 milestone coverage 100% goal
