# kiwa v2.1 x-thread (日本語)

## Tweet 1

kiwa v2.1 リリース — quality-metrics 深化 IV。 **@kiwa-lab/quality-metrics v2.1** で adaptive drift threshold learning 統合、 `learnAdaptiveThreshold` が 過去 N snapshot から axis 別 threshold を mean + k*stdev で 学習 (default k=2 = 95% 信頼区間)、 `pickThresholdForAxis` で axis 個別 / aggregate fallback。 v2.0 rename milestone 後 の **4 PR rhythm 復帰 milestone**、 **systematic pattern 44 度目適用** (statistical inference variant)、 **47 milestone streak 達成**。

## Tweet 2

統計的異常検知 SSOT = mean + k*stdev、 axis 別 独立学習で per-axis volatility 反映 (perf 変動大 → 広め threshold、 coverage 変動小 → 狭め threshold)。 baseline=0 Infinity sample 除外、 minSampleCount default=3 filter、 stable snapshot 列 で recommended=0。 shape 契約 preserving 絶対維持 = 既存 v0.5-v0.6 API 変更 0。

## Tweet 3

dogfood-quality-metrics-adaptive-threshold-app 新規、 4 pattern workflow (collectRolling + learnFromHistory + evaluateWithLearnedThreshold + explainLearnedGate)、 10 test 全 PASS。 depth-5 実運用継続 pattern 3 例目 compound 深化。

## Tweet 4

`pnpm add -D @kiwa-lab/quality-metrics@^2.1`。 migration: https://cardene777.github.io/kiwa/migrations/v2.0-to-v2.1

backward compat 絶対維持 = 既存 API 変更 0、 v2.1 consumer は opt-in。 既存 193 test 継続 pass。

4 sub 完遂 (v2.1-1 threshold-learning + 13 test / v2.1-2 dogfood 10 test / v2.1-3 docs 47 streak / v2.1-4 publish)。

#kiwa #quality-metrics #statistical-inference #adaptive-threshold #testing #vitest
