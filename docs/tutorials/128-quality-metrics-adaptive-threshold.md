# quality-metrics v2.1 adaptive drift threshold learning in 15 min

## What you'll build

`@kiwa/quality-metrics` v2.1 (adaptive drift threshold learning、 v0.5 historical trend + v0.6 drift-gate integration → v2.1 で 「driftThresholdPct を 過去 N snapshot から 自動学習」)。 統計的異常検知 (mean + k*stdev) で per-axis volatility を吸収、 kiwa 47 milestone streak 継続、 4 PR rhythm 復帰 milestone、 systematic pattern 44 度目 (statistical inference variant)。

## Prerequisites

- Node.js ≥ 20 + pnpm
- `@kiwa/quality-metrics` v2.1 (`pnpm add -D @kiwa/quality-metrics@^2.1`)

## Step-by-step build

### 1. Rolling history 保持

release cycle ごとに snapshot を rolling window で 蓄積。

```ts
import { captureSnapshot, type MetricSnapshot } from '@kiwa/quality-metrics';

let history: MetricSnapshot[] = [];
const snap = captureSnapshot({
  report: currentReport,
  capturedAt: new Date().toISOString(),
  label: 'release-v2.0',
});
history = [...history, snap].slice(-10); // rolling window 10
```

### 2. Adaptive threshold 学習

過去 N snapshot から axis 別 の deltaPct 分布 を 学習、 mean + k*stdev で 推奨 threshold を算出。

```ts
import { learnAdaptiveThreshold } from '@kiwa/quality-metrics';

const learned = learnAdaptiveThreshold({
  snapshots: history,
  stdevMultiplier: 2, // default 2 = 95% 信頼区間
  minSampleCount: 3,  // default 3 = 統計的信頼性 の 下限
});
// learned.perAxis['coverage.line'] = { mean, stdev, recommendedThresholdPct, ... }
// learned.aggregateThresholdPct = 全 axis 平均、 fallback 用
```

### 3. 学習 threshold で release gate 実行

v0.6 の `evaluateReleaseGate` に learned aggregate を driftThresholdPct として injection。

```ts
import { evaluateReleaseGate } from '@kiwa/quality-metrics';

const verdict = evaluateReleaseGate(currentReport, {}, {
  driftEnabled: true,
  driftBaseline: history[history.length - 1]!, // 直前 release
  driftThresholdPct: learned.aggregateThresholdPct,
});
```

### 4. Axis 別 threshold 個別評価

`pickThresholdForAxis` で axis 個別 threshold を lookup、 aggregate と perAxis の 差別化。

```ts
import { pickThresholdForAxis } from '@kiwa/quality-metrics';

const coverageThreshold = pickThresholdForAxis(learned, 'coverage.line');
const perfThreshold = pickThresholdForAxis(learned, 'perf.p95Ms');
// 学習外 axis は aggregate fallback
const fallback = pickThresholdForAxis(learned, 'nonexistent.axis');
```

## systematic pattern 44 度目適用 の 5 原則

- shape 契約 preserving = 既存 API (v0.5 の 4 export + v0.6 の ReleaseGateContext) 変更 0
- additive-only = 新規 file `threshold-learning.ts` 追加 のみ、 既存 file 触らず
- backward compat 絶対維持 = v2.0 まで の consumer は 触らず、 v2.1 consumer は opt-in
- statistical inference (mean + k*stdev SSOT) を per-axis 独立学習で 適用
- observability additive (perAxis + aggregate + sampleCount で 学習信頼性可視化)

## depth-5 実運用継続 pattern 3 例目 の compound 深化

- 3 例目確定 pattern (Mobile v1.55 depth-5 + Desktop v1.61 depth-5 + quality-metrics v0.5 depth-5) は v1.65 で 「絶対的 rule」 昇格 signal 到達
- v1.66 で drift-gate integration (実運用継続 開始)、 v2.1 で adaptive threshold learning (継続深化)
- 4 例目化 は 別 pair の 自然 発生 待ち、 単軸 継続深化 は SOP 通り

## Reference: dogfood-quality-metrics-adaptive-threshold-app

4 pattern workflow (`collectRolling` + `learnFromHistory` + `evaluateWithLearnedThreshold` + `explainLearnedGate`) の実装は `examples/dogfood-quality-metrics-adaptive-threshold-app/` を参照。

## What's next

- v2.2+ = 別 pair の depth-5 拡張 (4 例目 自然 発生 待ち) or quality-metrics v2.2 (multi-baseline comparison or automatic outlier detection)
