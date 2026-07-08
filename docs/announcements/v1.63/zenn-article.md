---
title: "kiwa v1.63 リリース — Desktop 深化 VII (@kiwa-test/desktop v0.8 native binding availability probe + skip 経路、 depth-8 pattern 新設 candidate、 systematic pattern 38 度目、 41 milestone streak)"
emoji: "🧭"
type: "tech"
topics: ["testing", "vitest", "electron", "tauri", "desktop"]
published: false
---

# kiwa v1.63 リリース — Desktop 深化 VII

## Summary

**Desktop 深化 VII** 単軸 milestone、 v0.8 で native binding availability probe + skip 経路 実装、 which/where CLI check + platform gate + 12 axis 別 skip strategy + fidelity harness probe 統合。 v1.55-v1.62 4 PR rhythm 継承 (**10 milestone 連続 = 40 PR 連続同 rhythm**)、 **systematic pattern 38 度目適用**、 **41 milestone 連続 snippet validation streak** 達成、 shape 契約 preserving 絶対維持、 **depth-8 pattern 新設 candidate 到達**。

## What's new

### probe layer 5 type SSOT

| type | 用途 |
|---|---|
| ProbeInput | command + platform (optional) + spawnFn (optional DI) |
| ProbeResult | command + platform + available + probePath + durationMs |
| PlatformGate | target + platform + compatible |
| NodePlatform | 'darwin' \| 'linux' \| 'win32' \| 'other' |
| SkippedPair | axis + target + reason (fidelity 経路) |

### 12 axis 別 skip strategy

- **electron / tauri / webview / dark-mode** = semantics-only、 常に skip=false
- **auto-updater / menu-bar / tray-icon / screen-recording** = platform mismatch のみで skip
- **fs-permissions / global-shortcut** = darwin 以外で skip
- **notification / clipboard** = linux 以外で skip

### 3 code pattern

```ts
// Pattern 1 — CLI probe
import { probeCliAvailable } from '@kiwa-test/desktop';
const result = await probeCliAvailable({ command: 'ffmpeg' });

// Pattern 2 — Skip decision
import { shouldSkipAxis } from '@kiwa-test/desktop';
const decision = shouldSkipAxis('clipboard', 'linux');

// Pattern 3 — Probe-aware fidelity check
import { runFidelityCheckWithProbe } from '@kiwa-test/desktop';
const { diffs, skippedPairs } = await runFidelityCheckWithProbe({});
```

### backward compat 絶対維持

v0.8 probe layer の追加は additive、 v0.1-v0.7 API 変更 0、 shape 契約 preserving 継続。

### dogfood 新規

`dogfood-desktop-probe-app` = 4 pattern、 10 test 全 PASS、 kiwa package 47 到達。

### depth-8 pattern 新設 candidate

pair 深度 8 段拡張 (v0.1 → v0.2 → ... → v0.8) の kiwa milestone 史上 depth-8 record 新設 candidate。

## Install

```bash
pnpm add -D @kiwa-test/desktop@^0.8
```

## Migration guide

[v1.62 → v1.63](https://cardene777.github.io/kiwa/migrations/v1.62-to-v1.63)

## What's next

- v1.64+ = 実 native binding 呼出
- 他 pair depth-5/6 拡張
- v2.0 milestone coverage 100% goal

## 4 sub 完遂

- v1.63-1 = probe + fidelity 統合 (20 test 追加、 193 test 全 PASS)
- v1.63-2 = dogfood-desktop-probe-app 新規 (10 test 全 PASS、 47 package)
- v1.63-3 = tutorial 123 + migration + concept + snippet 41 streak (196 test 全 PASS)
- v1.63-4 = publish
