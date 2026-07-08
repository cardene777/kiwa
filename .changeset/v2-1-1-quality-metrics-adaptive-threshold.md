---
"@kiwa/quality-metrics": minor
---

v2.1-1 quality-metrics v2.1 = adaptive drift threshold learning layer 新設。

v0.5 で historical trend tracking + drift detection、 v0.6 で evaluateReleaseGate 統合、 v2.1 で 「driftThresholdPct を 過去 N snapshot から 自動学習」 の adaptive layer を追加。 統計的異常検知 の 標準経路 = mean ± k*stdev で 「異常範囲」 を 動的算出、 default k=2 で 95% 信頼区間、 axis 別 threshold 独立学習で per-axis volatility を反映。

追加 API 3 export = `learnAdaptiveThreshold` (メイン API) + `pickThresholdForAxis` (axis 別 fallback SSOT) + `AdaptiveThreshold` / `AdaptiveThresholdReport` type SSOT。 shape 契約 preserving 絶対維持 = 既存 API (v0.5 の 4 export + v0.6 の ReleaseGateContext) 変更 0、 v2.1 は 新規 file `threshold-learning.ts` 追加 のみ、 v2.0 まで の consumer は 触らず、 v2.1 consumer は opt-in で利用。

13 behavior test 追加 (T-QM-AT-001 〜 T-QM-AT-013) = snapshot 数 boundary / minSampleCount filter / stable snapshot / 上昇 trend / volatile axis / stdevMultiplier / baseline=0 Infinity 除外 / aggregate 平均 / pickThresholdForAxis 3 経路 / shape 契約 preserving verify の 全経路 cover。

v2.0 rename 直後 の quality-metrics 深化継続、 depth-5 実運用継続 pattern 3 例目確定 の compound 深化、 systematic pattern 44 度目適用 (statistical inference variant)。
