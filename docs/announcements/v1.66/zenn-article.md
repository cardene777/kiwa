---
title: "kiwa v1.66 リリース — quality-metrics 深化 III (@kiwa-lab/quality-metrics v0.6 evaluateReleaseGate に drift check opt-in 統合、 depth-5 pattern 3 例目確定 実運用継続、 systematic pattern 41 度目、 44 milestone streak)"
emoji: "🔐"
type: "tech"
topics: ["testing", "vitest", "quality-metrics", "release-gate", "drift-detection"]
published: false
---

# kiwa v1.66 リリース — quality-metrics 深化 III

## Summary

**quality-metrics 深化 III** 単軸 milestone、 v0.5 で pure library として提供した historical trend tracking + drift detection を **v0.6 で `evaluateReleaseGate` に opt-in 統合**、 regression 検知 axis を `drift.{axis名}` の ReleaseGateBlocker に 1:1 格上げ、 pass/fail 判定 と 前回比較 判定 を 1 経路 で 統合。 v1.55-v1.65 4 PR rhythm 継承 (**13 milestone 連続 = 52 PR 連続同 rhythm**)、 **systematic pattern 41 度目適用**、 **44 milestone 連続 snippet validation streak** 達成、 shape 契約 preserving 絶対維持、 **depth-5 pattern 3 例目確定 実運用継続** (Mobile v1.55 + Desktop v1.61 + quality-metrics v1.65 3 例安定化到達 = 「絶対的 rule」 昇格 signal 到達済 の 継続深化)。

## What's new

### 3 新 context field SSOT

| field | 用途 |
|---|---|
| driftBaseline | 前回 release の MetricSnapshot |
| driftThresholdPct | drift 判定 の 絶対値 delta% 閾値 (default 5.0) |
| driftEnabled | drift check opt-in flag (default undefined = off) |

### 発火条件 SSOT

| driftEnabled | driftBaseline | 挙動 |
|---|---|---|
| undefined / false | any | v0.5 まで の 挙動 (skip、 axesEvaluated +0) |
| true | undefined | v0.5 まで の 挙動 (skip) |
| true | 存在 | drift check 発火、 axesEvaluated +1 |

### 4 code pattern

```ts
// Pattern 1 — Baseline snapshot 準備
const baseline = captureSnapshot({
  report: previousRelease,
  capturedAt: '2026-06-01T00:00:00Z',
  label: 'release-v1.65',
});

// Pattern 2 — driftEnabled + driftBaseline セット
const verdict = evaluateReleaseGate(currentReport, {}, {
  driftEnabled: true,
  driftBaseline: baseline,
  driftThresholdPct: 5.0,
});
// verdict.axesEvaluated = 8 (base 7 + drift lane 1)

// Pattern 3 — drift.* blocker のみ 抽出
const driftBlockers = verdict.blockers.filter((b) => b.axis.startsWith('drift.'));

// Pattern 4 — backward compat (context 省略で v0.5 挙動)
const legacyVerdict = evaluateReleaseGate(currentReport);
// verdict.axesEvaluated = 7
```

### backward compat 絶対維持

v0.6 = 既存 QualityReport 構造無変更、 v0.1-v0.5 API 変更 0、 additive のみ、 default off で v0.5 まで の 挙動 を 厳密に 維持。

### dogfood 新規

`dogfood-quality-metrics-drift-gate-app` = 4 pattern workflow (evaluateWithDriftGate + verifyReleaseWithDrift + explainDriftBlockers + tryReleaseWithoutDrift)、 11 test 全 PASS。 v0.5 pure library dogfood (history-app) を release gate 統合経路に拡張。

### 44 milestone 連続 snippet validation streak

v1.23 → v1.66 = **44 milestone**、 kiwa 史上最長記録更新継続。

### depth-5 pattern 3 例目確定 実運用継続

- 1 例目 = Mobile v1.54-v1.55 (native storage adapter 5 段深化)
- 2 例目 = Desktop v1.60-v1.61 (native process spawn 5 段深化)
- **3 例目 = quality-metrics v1.65** (release gate 5 段深化)
- **v1.66 = 実運用継続** = drift 統合で v0.5 pure library を release gate 経路に統合、 「絶対的 rule」 の 実運用 深化

4 例目化 は 無理に 狙わず 自然 発生 待ち (3 例目 実績 消費 禁止)。

## Install

```bash
pnpm add -D @kiwa-lab/quality-metrics@^0.6
```

## Migration guide

[v1.65 → v1.66](https://cardene777.github.io/kiwa/migrations/v1.65-to-v1.66)

## What's next

- v1.67+ = depth-6 単軸拡張 or 別 pair の depth-5 拡張
- 4 例目 は 自然 発生 待ち (3 例目 実績 消費 禁止)
- v2.0 milestone coverage 100% goal
