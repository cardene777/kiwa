# kiwa v1.66 x-thread (日本語)

## Tweet 1

kiwa v1.66 リリース — quality-metrics 深化 III。 **@kiwa-lab/quality-metrics v0.6** で `evaluateReleaseGate` に drift check opt-in 統合、 ReleaseGateContext に 3 field (driftBaseline / driftThresholdPct / driftEnabled) 追加、 regression 検知 axis を `drift.{axis名}` の ReleaseGateBlocker に 1:1 格上げ。 v1.55-v1.65 4 PR rhythm 継承 (**13 milestone 連続 = 52 PR 連続同 rhythm**)、 **systematic pattern 41 度目適用**、 **depth-5 pattern 3 例目確定 実運用継続**。

## Tweet 2

driftEnabled === true かつ driftBaseline 存在時のみ発火、 default off で v0.5 まで の 7 / 11 / 13 axis 動作を 厳密に 維持。 axesEvaluated は drift lane を +1 の 単一 lane で 加算 (mutation.tier / a11y.tier と 同一 設計)。 shape 契約 preserving 絶対維持 = QualityReport 構造無変更で v0.1-v0.5 API 変更 0。

## Tweet 3

dogfood-quality-metrics-drift-gate-app 新規、 4 pattern workflow (evaluateWithDriftGate + verifyReleaseWithDrift + explainDriftBlockers + tryReleaseWithoutDrift)、 11 test 全 PASS。 **44 milestone 連続 snippet validation streak** (v1.23-v1.66) 達成。

## Tweet 4

`pnpm add -D @kiwa-lab/quality-metrics@^0.6`。 migration: https://cardene777.github.io/kiwa/migrations/v1.65-to-v1.66

**depth-5 pattern 3 例目確定 実運用継続** = Mobile v1.55 + Desktop v1.61 + quality-metrics v1.65 で 3 例安定化到達 + v1.66 実運用継続。 4 例目 は 自然 発生 待ち (無理な 4 例目化 は 避ける)。

4 sub 完遂 (v1.66-1 v0.6 drift-gate integration + 9 test / v1.66-2 dogfood 11 test / v1.66-3 docs 44 streak / v1.66-4 publish)。

#kiwa #quality-metrics #drift-gate #release-gate #testing #vitest
