---
title: "kiwa v1.62 リリース — Desktop 深化 VI (@kiwa/desktop v0.7 real behavior runner + fidelity harness behavior diff early warning、 depth-7 pattern 新設 candidate、 systematic pattern 37 度目、 40 milestone streak)"
emoji: "🔍"
type: "tech"
topics: ["testing", "vitest", "electron", "tauri", "desktop"]
published: false
---

# kiwa v1.62 リリース — Desktop 深化 VI

## Summary

**Desktop 深化 VI** 単軸 milestone、 v0.4 fidelity harness の設計思想 (「v1.62+ real 実装後 behavior diff early warning」) が **v1.62 で実運用開始**、 v0.7 で 12 axis 別 real 経路 behavior 差別化 pattern + fidelity harness 拡張。 v1.55-v1.61 4 PR rhythm 継承 (**9 milestone 連続 = 36 PR 連続同 rhythm**)、 **systematic pattern 37 度目適用**、 **40 milestone 連続 snippet validation streak** 達成、 shape 契約 preserving 絶対維持、 **depth-7 pattern 新設 candidate 到達**。

## What's new

### real-runner + fidelity harness 拡張

- **real-runner.ts 新設** = REAL_AXIS_RUNNERS + 12 axis 別 real behavior 差別化
- **fidelity-harness 拡張** = MetadataDiff + FidelityDiff.metadataDiffs + durationDiffMs + summarizeFidelityBehaviorDiff + FidelityBehaviorSummary
- **shape 契約 preserving** = neutralEvents + eventCount 一致で 36 pair matched 継続

### 3 code pattern

```ts
// Pattern 1 — shape 契約 preserving 検証
const diffs = await runFidelityCheck({});
const summary = summarizeFidelity(diffs);
// summary.matchedRatio === 1

// Pattern 2 — behavior diff early warning
const behaviorSummary = summarizeFidelityBehaviorDiff(diffs);
// behaviorSummary.axesWithBehaviorDiff = ['auto-updater', 'clipboard', ...]

// Pattern 3 — per-step drill-down
for (const d of diffs) {
  for (const m of d.metadataDiffs) {
    console.log(`${m.neutralEvent}[${m.stepIndex}] ${m.key}: mock=${m.mockValue} vs real=${m.realValue}`);
  }
}
```

### backward compat 絶対維持

v0.7 real behavior runner の追加は additive、 v0.1-v0.6 API 変更 0、 既存 fidelity-harness test 全継続 PASS。

### dogfood 新規

`dogfood-desktop-real-behavior-app` = 3 pattern workflow、 10 test 全 PASS、 kiwa package 46 個到達。

### 40 milestone 連続 snippet validation streak

### depth-7 pattern 新設 candidate 到達

## Install

```bash
pnpm add -D @kiwa/desktop@^0.7
```

## Migration guide

[v1.61 → v1.62](https://cardene777.github.io/kiwa/migrations/v1.61-to-v1.62)

## What's next

- v1.63+ = real adapter を native binding 実装
- 他 pair 5/6 段拡張
- v2.0 milestone coverage 100% goal

## 4 sub 完遂

- v1.62-1 = real-runner + fidelity 拡張 (17 test 追加、 170 test 全 PASS)
- v1.62-2 = dogfood-desktop-real-behavior-app 新規 (10 test 全 PASS、 46 package)
- v1.62-3 = tutorial 122 + migration + concept + snippet 40 streak (173 test 全 PASS)
- v1.62-4 = publish
