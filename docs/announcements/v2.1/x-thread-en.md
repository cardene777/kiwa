# kiwa v2.1 x-thread (English)

## Tweet 1

kiwa v2.1 is out — quality-metrics deepening IV. **@kiwa-lab/quality-metrics v2.1** adds adaptive drift threshold learning: `learnAdaptiveThreshold` learns per-axis threshold from history using mean + k*stdev (default k=2 = 95% CI), `pickThresholdForAxis` returns per-axis or aggregate fallback. First **4 PR rhythm milestone after v2.0 rename**, **systematic pattern 44th application (statistical inference variant)**, **47 milestone streak** achieved.

## Tweet 2

Statistical inference SSOT: mean + k*stdev with axis-independent learning captures per-axis volatility (perf variance high → wider threshold, coverage variance low → narrower). baseline=0 Infinity samples excluded, minSampleCount=3 filter default. shape contract preserving absolute (existing v0.5-v0.6 API unchanged).

## Tweet 3

dogfood-quality-metrics-adaptive-threshold-app new, 4-pattern workflow (collectRolling + learnFromHistory + evaluateWithLearnedThreshold + explainLearnedGate), 10 tests pass. depth-5 operation-continuation pattern 3rd case compound deepening.

## Tweet 4

`pnpm add -D @kiwa-lab/quality-metrics@^2.1`. Migration: https://cardene777.github.io/kiwa/migrations/v2.0-to-v2.1

Backward compat absolute: 既存 API 変更 0, opt-in for v2.1 consumers. Existing 193 tests continue passing.

4 subs completed (v2.1-1 v2.1 threshold-learning + 13 tests / v2.1-2 dogfood 10 tests / v2.1-3 docs 47 streak / v2.1-4 publish).

#kiwa #quality-metrics #statistical-inference #adaptive-threshold #testing #vitest
