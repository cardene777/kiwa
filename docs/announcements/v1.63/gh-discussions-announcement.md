# kiwa v1.63 released — Desktop 深化 VII (v0.8 native binding availability probe + skip 経路、 depth-8 pattern 新設 candidate、 systematic pattern 38 度目、 41 milestone streak)

## Summary

kiwa v1.63 is out。 **Desktop 深化 VII** 単軸 milestone、 v1.62 real behavior runner + fidelity harness behavior diff early warning に **v0.8 で native binding availability probe + skip 経路** を追加、 which/where CLI check + platform gate + 12 axis 別 skip strategy + fidelity harness probe 統合、 実 CLI 未 install 環境でも決定的 test 成立。 v1.55-v1.62 4 PR rhythm 継承 (**10 milestone 連続 = 40 PR 連続同 rhythm**)、 **systematic pattern 38 度目適用**、 **41 milestone snippet streak 達成**、 shape 契約 preserving 絶対維持、 **depth-8 pattern 新設 candidate 到達**。

## What's new

### `@kiwa/desktop` v0.8 minor bump

- **probe.ts 新設** = ProbeInput + ProbeResult + PlatformGate + NodePlatform SSOT + probeCliAvailable + shouldSkipAxis + platformGate + computeSkipMatrix
- **fidelity-harness 拡張** = runFidelityCheckWithProbe + SkippedPair 統合 (skip した pair は diffs から除外、 skippedPairs metadata で追跡)
- **shape 契約 preserving 絶対維持** = 既存 fidelity-harness test 全継続 PASS
- backward compat 絶対維持 = v0.1-v0.7 API 変更 0

### dogfood 新規

- `dogfood-desktop-probe-app` = probeAllCliCommands + getSkipDecisionsForCurrentPlatform + runProbeAwareFidelityCheck + checkSkipForAxis の 4 pattern、 10 test 全 PASS
- kiwa package 47 個到達

### 1 new tutorial + migration + concept

- **[Tutorial 123 — Desktop v0.8 probe layer](https://cardene777.github.io/kiwa/tutorials/123-desktop-probe)**
- Migration v1.62 → v1.63 additive
- Concept doc `desktop-probe.md`

### 41-milestone consecutive snippet validation streak

v1.23 → v1.63 = **41 milestone**、 kiwa 史上最長記録更新継続。

### depth-8 pattern 新設 candidate 到達

Desktop pair v0.1 → v0.8 の 8 段拡張、 kiwa milestone 史上 depth-8 record 新設 candidate。

## Install

```bash
pnpm add -D @kiwa/desktop@^0.8
```

## Migration guide

[v1.62 → v1.63](https://cardene777.github.io/kiwa/migrations/v1.62-to-v1.63)

## What's next

- v1.64+ = 実 native binding 呼出 (probe availability 判定で 実 CLI 存在時のみ 呼出)
- 他 pair depth-5/6 拡張
- v2.0 milestone coverage 100% goal
