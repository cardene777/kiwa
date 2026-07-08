---
title: quality-metrics v0.6 evaluateReleaseGate に drift check opt-in 統合 SSOT
---

# quality-metrics v0.6 evaluateReleaseGate に drift check opt-in 統合 SSOT

## What this covers

`@kiwa/quality-metrics` v0.6 の evaluateReleaseGate に drift check opt-in 統合 SSOT。 v1.66 で v0.5 pure library (historical trend tracking + drift detection) を release gate の judgment path に格上げ、 quality-metrics 縦深化 pair の第 6 段、 **depth-5 pattern 3 例目確定 実運用 継続** (Mobile v1.55 + Desktop v1.61 + quality-metrics v1.65 で 3 例安定化到達 = 「絶対的 rule」 昇格 signal 到達済 の 継続深化)、 v0.5 baseline (`docs/concepts/quality-metrics-history.md`) を extend。

## 3 新 context field SSOT

```ts
export interface ReleaseGateContext {
  // v0.3-v0.5 の既存 field (mutationTier / a11yTier / etc) は そのまま
  mutationTier?: MutationTier;
  mutationTierThreshold?: number;
  a11yTier?: A11yTier;
  a11yTierThreshold?: A11yThreshold;
  // v0.6 で 追加された 3 field
  driftBaseline?: MetricSnapshot;    // 前回 release snapshot
  driftThresholdPct?: number;        // default 5.0
  driftEnabled?: boolean;            // default undefined = off
}
```

## 発火条件 SSOT

`driftEnabled === true` かつ `driftBaseline !== undefined` の 両立 時のみ drift check 発火。 それ以外 の 組合せは 全て skip (default off で backward compat 絶対維持)。

| driftEnabled | driftBaseline | 挙動 |
|---|---|---|
| undefined | undefined | v0.5 まで の 挙動 (drift lane skip) |
| undefined | 存在 | v0.5 まで の 挙動 (skip) |
| true | undefined | v0.5 まで の 挙動 (skip) |
| true | 存在 | drift check 発火、 axesEvaluated +1 |
| false | 存在 | v0.5 まで の 挙動 (skip) |

## drift.regressions → ReleaseGateBlocker 格上げ SSOT

detectDrift の regression 検知 axis を drift.{axis名} 形式 の ReleaseGateBlocker に 1:1 変換。

```ts
{
  axis: `drift.${regression.axis}`,       // e.g. 'drift.coverage.line'
  threshold: -drift.threshold,             // e.g. -5.0 (下限違反 semantics)
  actual: regression.deltaPct,             // e.g. -20.0
  op: '>=' as const,                       // deltaPct >= -threshold で pass
}
```

- `threshold = -thresholdPct` = 「下限違反 semantics」 = deltaPct が -threshold より 上 でなければ 悪化
- `op = '>='` = floor 検査、 regression = actual < -threshold で fail
- 各 regression axis を 1 blocker に 1:1 変換、 blocker 数 = drift.regressions.length

## axesEvaluated 加算 rule SSOT

drift lane は tier axis (mutation.tier / a11y.tier) と 同一 設計 = +1 の 単一 lane 加算 (blocker 数と 独立)。

| context 設定 | axesEvaluated |
|---|---|
| context 省略 | 7 (base) |
| driftEnabled + driftBaseline のみ | 8 (base 7 + drift 1) |
| driftEnabled + driftBaseline + mutationTier | 9 (base 7 + drift 1 + mutation.tier 1) |
| driftEnabled + driftBaseline + a11yTier | 9 (base 7 + drift 1 + a11y.tier 1) |
| driftEnabled + driftBaseline + mutationTier + a11yTier | 10 (base 7 + drift 1 + mutation.tier 1 + a11y.tier 1) |
| AI-LLM provider + driftEnabled + driftBaseline | 12 (base 11 + drift 1) |

## Internal implementation SSOT

```ts
if (context.driftEnabled === true && context.driftBaseline !== undefined) {
  axesEvaluated += 1;
  const current = captureSnapshot({
    report,
    capturedAt: report.reportedAt,
    label: `current-${report.version}`,
  });
  const comparison = compareToBaseline({
    current,
    baseline: context.driftBaseline,
  });
  const drift = detectDrift(
    context.driftThresholdPct !== undefined
      ? { comparison, thresholdPct: context.driftThresholdPct }
      : { comparison },
  );
  for (const regression of drift.regressions) {
    blockers.push({
      axis: `drift.${regression.axis}`,
      threshold: -drift.threshold,
      actual: regression.deltaPct,
      op: '>=',
    });
  }
}
```

## Backward compat 絶対維持 SSOT

- v0.1-v0.5 の 4 export (captureSnapshot / compareToBaseline / detectDrift / generateTrendReport) signature 変更 0
- QualityReport interface 変更 0 (shape 契約 preserving)
- ReleaseGateContext の 既存 field (mutationTier / a11yTier / etc) 順序 変更 0
- default off = driftEnabled 省略 or driftBaseline 省略で v0.5 まで の 挙動 に 戻る
- 既存 test の signature 変更 0、 追加 9 test (T-QM-GT-013-021) のみ で v0.6 統合 cover

## depth-5 pattern 3 例目確定 実運用 継続

- Mobile v1.51-v1.55 (native storage adapter 5 段深化) → depth-5 到達
- Desktop v1.57-v1.61 (native process spawn 5 段深化) → depth-5 到達
- quality-metrics v0.1-v0.5 (release gate 5 段深化) → depth-5 到達
- 3 例安定化 = 「pattern 化 → 確定 pattern → 絶対的 rule」 昇格 signal 到達済
- v0.6 は 実運用 継続 = 「絶対的 rule」 の 実運用 深化、 4 例目化 は 無理に 狙わず 自然 発生 待ち

## systematic pattern 41 度目適用

- shape 契約 preserving (QualityReport 変更 0)
- additive-only (ReleaseGateContext に 3 field 追加 のみ)
- backward compat 絶対維持 (default off で 既存 挙動 維持)

## Reference

- 実装 = `packages/quality-metrics/src/gate.ts` § `evaluateReleaseGate` § v0.6 drift 統合 axis 群
- test = `packages/quality-metrics/tests/gate.test.ts` § T-QM-GT-013-021 (9 test)
- dogfood = `examples/dogfood-quality-metrics-drift-gate-app/` (4 pattern workflow)
- tutorial = `docs/tutorials/126-quality-metrics-drift-gate.md`
- migration = `docs/migrations/v1.65-to-v1.66.md`
