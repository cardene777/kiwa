# kiwa v1.66 x-thread (English)

## Tweet 1

kiwa v1.66 is out — quality-metrics deepening III. **@kiwa-lab/quality-metrics v0.6** integrates drift check opt-in into `evaluateReleaseGate`, ReleaseGateContext gets 3 new fields (driftBaseline / driftThresholdPct / driftEnabled), regression detected axes are promoted to `drift.{axis}` ReleaseGateBlocker 1:1. Inherits v1.55-v1.65 4-PR rhythm (**13 milestones = 52 PRs same rhythm**), **systematic pattern 41st application**, **depth-5 pattern 3rd case confirmed continued operation**.

## Tweet 2

Fires only when driftEnabled === true AND driftBaseline present. Default off keeps v0.5-and-earlier 7/11/13 axis behavior strictly intact. axesEvaluated adds +1 single lane (mirrors mutation.tier / a11y.tier). shape contract preserving absolute (QualityReport unchanged, v0.1-v0.5 API 0 changes).

## Tweet 3

dogfood-quality-metrics-drift-gate-app new, 4-pattern workflow (evaluateWithDriftGate + verifyReleaseWithDrift + explainDriftBlockers + tryReleaseWithoutDrift), 11 tests all pass. **44-milestone consecutive snippet-validation streak** (v1.23-v1.66) achieved.

## Tweet 4

`pnpm add -D @kiwa-lab/quality-metrics@^0.6`. Migration: https://cardene777.github.io/kiwa/migrations/v1.65-to-v1.66

**depth-5 pattern 3rd case confirmed = continued operation** = Mobile v1.55 + Desktop v1.61 + quality-metrics v1.65 = 3-case stabilization + v1.66 continued deepening. 4th case = natural emergence wait (do not force).

4 subs completed (v1.66-1 v0.6 drift-gate integration + 9 tests / v1.66-2 dogfood 11 tests / v1.66-3 docs 44 streak / v1.66-4 publish).

#kiwa #quality-metrics #drift-gate #release-gate #testing #vitest
