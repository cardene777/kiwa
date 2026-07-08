---
"@kiwa-test/quality-metrics": minor
---

v1.66-1 quality-metrics v0.6 = evaluateReleaseGate に drift check opt-in 統合。

ReleaseGateContext に 3 field 追加 (driftBaseline / driftThresholdPct / driftEnabled)、 driftEnabled === true かつ driftBaseline 存在時のみ v0.5 の captureSnapshot + compareToBaseline + detectDrift の chain を release gate 内部で実行、 regression 検知 axis を drift.{axis名} の ReleaseGateBlocker に 1:1 格上げ。 axesEvaluated は drift lane を +1 の 単一 lane で 加算 (mutation.tier / a11y.tier と 同一 設計、 blocker 数と 独立)。

Default off で v0.5 まで の 7 / 11 / 13 axis 動作を 厳密に 維持、 v0.1-v0.5 API 変更 0、 shape 契約 preserving = QualityReport 構造 変更 0、 additive のみ、 backward compat 絶対維持。

9 behavior test 追加 (T-QM-GT-013 〜 T-QM-GT-021) で 発火条件 / skip 経路 / regression 1:1 blocker 化 / improvement pass / stable pass / default threshold / 複数 regression / 既存 axis 並存 の 全経路 cover。

depth-5 pattern 3 例目確定 (Mobile v1.54-v1.55 + Desktop v1.60-v1.61 + quality-metrics v1.65) の 実運用 継続 = 「絶対的 rule」 昇格 signal 到達済、 systematic pattern 41 度目。
