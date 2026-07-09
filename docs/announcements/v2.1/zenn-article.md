---
title: "kiwa v2.1 リリース — quality-metrics 深化 IV (@kiwa-lab/quality-metrics v2.1 adaptive drift threshold learning、 statistical inference SSOT、 47 milestone streak、 4 PR rhythm 復帰、 systematic pattern 44 度目)"
emoji: "📈"
type: "tech"
topics: ["testing", "vitest", "quality-metrics", "statistics", "release-gate"]
published: false
---

# kiwa v2.1 リリース — quality-metrics 深化 IV

## Summary

**quality-metrics 深化 IV** 単軸 milestone、 v0.5 で historical trend、 v0.6 で drift-gate integration、 **v2.1 で 「driftThresholdPct を 過去 N snapshot から 自動学習」** の adaptive layer を追加。 統計的異常検知 (mean + k*stdev SSOT、 default k=2 = 95% 信頼区間) で per-axis volatility を吸収、 v2.0 rename milestone (5 PR 例外拡張) 後 の **4 PR rhythm 復帰 milestone**、 **systematic pattern 44 度目適用** (statistical inference variant)、 **47 milestone snippet streak 達成**。

## What's new

### 統計的異常検知 SSOT

過去 N snapshot の consecutive deltaPct 分布から mean + k*stdev で 「異常範囲」 を動的算出。

| k | 信頼区間 | 用途 |
|---|---|---|
| 1 | ~68% (1σ) | 検知感度優先 |
| 2 (default) | ~95% (2σ) | 標準 |
| 3 | ~99.7% (3σ) | 保守的 |

### API SSOT

```ts
// メイン API
learnAdaptiveThreshold({
  snapshots: MetricSnapshot[],
  stdevMultiplier?: number,  // default 2
  minSampleCount?: number,   // default 3
}): AdaptiveThresholdReport

// axis 別 fallback SSOT
pickThresholdForAxis(
  report: AdaptiveThresholdReport,
  axis?: string,
): number
```

### 4 code pattern

```ts
// Pattern 1 — Rolling history
let history: MetricSnapshot[] = [];
history = [...history, captureSnapshot({ report, capturedAt, label })].slice(-10);

// Pattern 2 — Adaptive learning
const learned = learnAdaptiveThreshold({ snapshots: history });

// Pattern 3 — 学習 threshold で release gate
const verdict = evaluateReleaseGate(current, {}, {
  driftEnabled: true,
  driftBaseline: history[history.length - 1]!,
  driftThresholdPct: learned.aggregateThresholdPct,
});

// Pattern 4 — Axis 別 threshold
const t = pickThresholdForAxis(learned, 'coverage.line');
```

### backward compat 絶対維持

- 既存 API (v0.5 の 4 export + v0.6 の ReleaseGateContext) 変更 0
- shape 契約 preserving = QualityReport 構造 変更 0
- 新規 file `threshold-learning.ts` 追加 のみ、 v2.0 まで の consumer は 触らず

### dogfood 新規

`dogfood-quality-metrics-adaptive-threshold-app` = 4 pattern workflow、 10 test 全 PASS。

### 47 milestone 連続 snippet validation streak

v1.23 → v2.1 = **47 milestone**、 kiwa 史上最長記録更新継続。

### depth-5 実運用継続 pattern 3 例目 の compound 深化

- **1 例目 (depth-5) confirmed** = Mobile / Desktop / quality-metrics (v1.65 「絶対的 rule」 昇格 signal 到達)
- **v1.66** = drift-gate integration (実運用継続 開始)
- **v2.1** = adaptive threshold learning (statistical inference で threshold 自動化、 継続深化)
- 4 例目化 は 別 pair の 自然 発生 待ち

## Install

```bash
pnpm add -D @kiwa-lab/quality-metrics@^2.1
```

## Migration guide

[v2.0 → v2.1](https://cardene777.github.io/kiwa/migrations/v2.0-to-v2.1)

## What's next

- v2.2+ = 別 pair の depth-5 拡張 or quality-metrics v2.2 継続深化
- 4 PR rhythm 継続、 systematic pattern 45 度目適用予定
- 48 milestone streak 継続
