# quality-metrics v0.6 evaluateReleaseGate に drift check opt-in 統合 in 15 min

## What you'll build

A vitest suite wired to `@kiwa-lab/quality-metrics` v0.6 (evaluateReleaseGate に drift check opt-in 統合、 v1.66 で **depth-5 pattern 3 例目確定 実運用 継続** = Mobile v1.55 + Desktop v1.61 + quality-metrics v1.65 の 3 例安定化到達 = 「絶対的 rule」 昇格 signal 到達済、 **systematic pattern 41 度目適用**、 **44 milestone streak**、 4 PR rhythm 13 milestone 連続 = 52 PR 連続)、 v0.5 で pure library として提供した historical trend tracking + drift detection を release gate の judgment path に格上げ、 regression 検知 axis を `drift.{axis名}` の ReleaseGateBlocker に 1:1 格上げ、 pass/fail 判定 と 前回比較 判定 を 1 経路 で 統合。

## Prerequisites

- Node.js ≥ 20 + pnpm
- `@kiwa-lab/quality-metrics` v0.6 (`pnpm add -D @kiwa-lab/quality-metrics@^0.6`)

## Step-by-step build

### 1. Baseline snapshot 準備

前回 release の QualityReport を MetricSnapshot に record する。

```ts
import { captureSnapshot } from '@kiwa-lab/quality-metrics';

const baseline = captureSnapshot({
  report: previousReleaseReport,
  capturedAt: '2026-06-01T00:00:00Z',
  label: 'release-v1.65',
});
```

### 2. driftEnabled + driftBaseline セット で evaluateReleaseGate

`ReleaseGateContext` の 3 新 field を セット して 呼出す。

```ts
import { evaluateReleaseGate } from '@kiwa-lab/quality-metrics';

const verdict = evaluateReleaseGate(currentReport, {}, {
  driftEnabled: true,
  driftBaseline: baseline,
  driftThresholdPct: 5.0, // default 5%、 省略可
});
// verdict.axesEvaluated = 8 (base 7 + drift lane 1)
// verdict.blockers = [...既存 axis, ...drift.* axis]
```

### 3. drift.* blocker のみ 抽出

```ts
const driftBlockers = verdict.blockers.filter((b) => b.axis.startsWith('drift.'));
// [{ axis: 'drift.coverage.line', threshold: -5.0, actual: -20.0, op: '>=' }, ...]
```

### 4. Backward compat 経路 (v0.5 まで の 挙動 に 戻す)

`driftEnabled: false` または `driftBaseline` 省略で v0.5 まで の 7 / 11 / 13 axis 動作 に 戻る。

```ts
const legacyVerdict = evaluateReleaseGate(currentReport); // context 省略で v0.5 挙動
// verdict.axesEvaluated = 7 (drift lane 加算なし)
```

## systematic pattern 41 度目適用

- shape 契約 preserving = QualityReport 構造 変更 0
- additive-only = ReleaseGateContext に 3 field 追加 のみ、 既存 field 変更なし
- backward compat 絶対維持 = v0.1-v0.5 API 変更 0、 default off で 既存 挙動 維持

## depth-5 pattern 3 例目確定 実運用 継続

- Mobile v1.51-v1.55 (native storage adapter 5 段深化) → depth-5 到達
- Desktop v1.57-v1.61 (native process spawn 5 段深化) → depth-5 到達
- quality-metrics v0.1-v0.5 (release gate 5 段深化) → depth-5 到達
- 3 例安定化 = 「pattern 化 → 確定 pattern → 絶対的 rule」 昇格 signal 到達済
- v0.6 は 実運用 継続 = drift 統合 で v0.5 pure library を release gate 経路 に 統合、 3 例目 の 実運用 深化

## Reference: dogfood-quality-metrics-drift-gate-app

4 pattern workflow (`evaluateWithDriftGate` + `verifyReleaseWithDrift` + `explainDriftBlockers` + `tryReleaseWithoutDrift`) の実装は `examples/dogfood-quality-metrics-drift-gate-app/` を参照。

## What's next

- v1.66 で v0.6 の 実運用 経路 が 確立 = 次 v1.67 は depth-6 単軸拡張 or 別 pair の depth-5 拡張、 4 例目 は 自然 発生 待ち (無理な 4 例目化 は 避ける、 3 例目 実績 消費 禁止)。
