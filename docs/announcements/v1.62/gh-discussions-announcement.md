# kiwa v1.62 released — Desktop 深化 VI (v0.7 real behavior runner + fidelity harness behavior diff early warning、 depth-7 pattern 新設 candidate、 systematic pattern 37 度目、 40 milestone streak)

## Summary

kiwa v1.62 is out。 **Desktop 深化 VI** 単軸 milestone、 v0.4 fidelity harness の設計思想 (「v1.62+ real 実装後の behavior diff early warning」) が **v1.62 で実運用開始**、 v0.7 で 12 axis 別 real 経路 behavior 差別化 pattern + fidelity harness 拡張 (metadataDiffs + durationDiffMs + summarizeFidelityBehaviorDiff)。 v1.55-v1.61 4 PR rhythm 継承 (**9 milestone 連続 = 36 PR 連続同 rhythm**)、 **systematic pattern 37 度目適用**、 **40 milestone snippet streak 達成**、 shape 契約 preserving 絶対維持 (36 pair 全 matched 継続)、 **depth-7 pattern 新設 candidate 到達**。

## What's new

### `@kiwa-test/desktop` v0.7 minor bump

- **real-runner.ts 新設** = 12 axis 別 real 経路 behavior 差別化 (electron real app / auto-updater 128MB / screen-recording 4K / clipboard URL 等)
- **fidelity-harness 拡張** = FidelityDiff に metadataDiffs + durationDiffMs 追加、 summarizeFidelityBehaviorDiff 新設
- **shape 契約 preserving 絶対維持** = neutralEvents + eventCount 一致で 36 pair matched 継続
- backward compat 絶対維持 = v0.1-v0.6 API 変更 0

### dogfood 新規

- `dogfood-desktop-real-behavior-app` = verifyShapeContract + runEarlyWarningReport + drillDownAxisDiff の 3 pattern、 10 test 全 PASS
- kiwa package 46 個到達

### 1 new tutorial + migration + concept

- **[Tutorial 122 — Desktop v0.7 real behavior](https://cardene777.github.io/kiwa/tutorials/122-desktop-real-behavior)**
- Migration v1.61 → v1.62 additive
- Concept doc `desktop-real-behavior.md`

### 40-milestone consecutive snippet validation streak

v1.23 → v1.62 = **40 milestone**、 kiwa 史上最長記録更新継続。

### systematic pattern 37 度目適用

### depth-7 pattern 新設 candidate 到達

v1.61 depth-6 record (kiwa milestone 史上初) 直後の v1.62 で depth-7 拡張 candidate、 3 例安定化まで v1.75+ 前後で candidate。

## Install

```bash
pnpm add -D @kiwa-test/desktop@^0.7
```

## Migration guide

[v1.61 → v1.62](https://cardene777.github.io/kiwa/migrations/v1.61-to-v1.62)

## What's next

- v1.63+ = real adapter を native binding 実装 (electron-updater 実 network call / SCStream 実 permission check / NSPasteboard 実 write-read cycle 等)
- 他 pair 5 段拡張 / 6 段拡張 (depth-5 / depth-6 pattern 3 例安定化)
- v2.0 milestone coverage 100% goal
