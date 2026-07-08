---
title: "kiwa v1.60 リリース — Desktop 深化 IV (@kiwa/desktop v0.5 child_process.spawn stub 契約層、 depth-5 pattern 2 例目 candidate、 systematic pattern 35 度目、 38 milestone streak、 Mobile v1.54 rhythm 完全再現)"
emoji: "🛠"
type: "tech"
topics: ["testing", "vitest", "electron", "tauri", "desktop"]
published: false
---

# kiwa v1.60 リリース — Desktop 深化 IV

## Summary

**Desktop 深化 IV** 単軸 milestone、 v1.56-v1.59 で構築した Desktop 12 axis semantics + adapter layer + fidelity harness に **v0.5 で spawn stub 契約層を追加**、 v1.55-v1.59 4 PR rhythm 継承 (**7 milestone 連続 = 28 PR 連続同 rhythm**)、 **systematic pattern 35 度目適用**、 **38 milestone 連続 snippet validation streak** 達成、 **Mobile v1.50-v1.54 5 milestone rhythm 完全再現**、 **depth-5 pattern 2 例目 candidate 到達**。

## What's new

### `@kiwa/desktop` v0.5 minor bump

- **[Tutorial 120 — Desktop spawn stub 契約層](https://cardene777.github.io/kiwa/tutorials/120-desktop-spawn-stub)**
- Migration v1.59 → v1.60 additive + 4 pattern SSOT + 縦深化 pair 第 14 の第 5 段 + depth-5 pattern 2 例目 candidate
- Concept doc `desktop-spawn-stub.md` = v0.5 spawn stub 3 type SSOT + 12 axis → 8 CLI mapping + env-gate 設計思想 + Mobile v1.54 rhythm 再現 SSOT

### spawn stub 契約層 3 type SSOT

| type | 用途 |
|---|---|
| DesktopCliCommand | 8 CLI 種類 (electron-builder / electron-updater / ffmpeg / xclip / osascript / notify-send / defaults / reg) |
| SpawnInvocation | command + args + env + optional cwd |
| SpawnResult | command + args + invoked + exitCode + stdout + stderr + durationMs |

### 12 axis → 8 CLI + 4 non-CLI mapping

- **8 CLI-backed axis** = auto-updater → electron-updater / fs-permissions → osascript / notification → notify-send / menu-bar → electron-builder / tray-icon → electron-builder / screen-recording → ffmpeg / global-shortcut → defaults / clipboard → xclip
- **4 non-CLI axis** = electron / tauri / webview / dark-mode (native process 経路、 CLI 不要)

### KIWA_DESKTOP_MODE env-gate + args 上限 + fail-closed

- `real` = 実 spawn 実行前提の signal
- 未設定 / `mock` = throw で fail-closed
- args >32 = throw
- v1.61+ v0.6 実 spawn 実装後 shape 契約継承基盤確立

### backward compat 絶対維持

v0.5 spawn stub 契約層の追加は additive、 v0.1 + v0.2 + v0.3 + v0.4 の 12 axis / 48 method / 48 event / 144 mapping + adapter interface + fidelity harness は完全保持。

### dogfood 新規

`dogfood-desktop-spawn-app` = 8 CLI stub workflow + env-gate 3 pattern + fail-closed、 11 test 全 PASS。 kiwa package 44 個到達 (v1.59 43 + dogfood 1)。

### 38 milestone 連続 snippet validation streak

v1.23 → v1.60 = **38 milestone**、 kiwa 史上最長記録更新継続。

### systematic pattern 35 度目適用

v1.59 34 度目 (desktop v0.4 adapter interface uniform) を継承、 desktop v0.5 spawn stub に uniform 適用。

### Mobile v1.50-v1.54 5 milestone rhythm 完全再現

Mobile v1.50 (base 3 axis) → v1.51 (advanced II 4 axis) → v1.52 (advanced III 4 axis) → v1.53 (v0.4 adapter layer + fidelity harness) → v1.54 (v0.5 spawn stub 契約層) の 5 milestone rhythm を Desktop pair (v1.56-v1.60) で完全再現、 depth-5 到達。

### depth-5 pattern 2 例目 candidate 到達

pair 深度 5 段拡張達成 (v0.1 → v0.2 → v0.3 → v0.4 → v0.5) の 2 例目 candidate。

- depth-5 pattern 1 例目 = Mobile v1.54 stub + v1.55 実 spawn (kiwa milestone 史上初 depth-5 record)
- **depth-5 pattern 2 例目 candidate = Desktop v1.60** ← v1.60
- v1.61+ v0.6 実 spawn 実装完成で 2 例目確定予定

## Install

```bash
pnpm add -D @kiwa/desktop@^0.5
```

## Code sample (4 patterns)

### Pattern 1 — invokeDesktopCli stub

```ts
import { invokeDesktopCli, type SpawnInvocation } from '@kiwa/desktop';

const inv: SpawnInvocation = {
  command: 'ffmpeg',
  args: ['-i', 'input.mp4', 'output.webm'],
  env: { KIWA_DESKTOP_MODE: 'real' },
};
const result = await invokeDesktopCli(inv);
console.log(result.stdout); // "[v0.5 stub] ffmpeg -i input.mp4 output.webm"
```

### Pattern 2 — cliForAxis mapping

```ts
import { cliForAxis } from '@kiwa/desktop';

console.log(cliForAxis('auto-updater'));    // 'electron-updater'
console.log(cliForAxis('screen-recording')); // 'ffmpeg'
console.log(cliForAxis('electron'));         // null
```

### Pattern 3 — buildSpawnInvocation factory

```ts
import { buildSpawnInvocation } from '@kiwa/desktop';

const inv = buildSpawnInvocation({
  command: 'xclip',
  args: ['-selection', 'clipboard'],
  env: { KIWA_DESKTOP_MODE: 'real' },
  cwd: '/tmp/work',
});
```

### Pattern 4 — env-gate + fail-closed

```ts
import { invokeDesktopCli } from '@kiwa/desktop';

await invokeDesktopCli({ command: 'ffmpeg', args: [], env: {} }); // throws
await invokeDesktopCli({ command: 'ffmpeg', args: new Array(33).fill('a'), env: { KIWA_DESKTOP_MODE: 'real' } }); // throws
```

## Migration guide

[v1.59 → v1.60](https://cardene777.github.io/kiwa/migrations/v1.59-to-v1.60)

## What's next

- v1.61+ = Desktop 深化 V (v0.6 実 spawn 実装完成、 depth-6 pattern 新設 candidate)
- v0.4 real adapter を実 OS API 呼出に置換
- v2.0 milestone coverage 100% goal

## 4 sub 完遂

- v1.60-1 = desktop v0.5 spawn stub 契約層実装 (1 new file、 20 test 追加、 128 test 全 PASS)
- v1.60-2 = dogfood-desktop-spawn-app 新規 (5 file、 8 CLI stub + env-gate 3 pattern、 11 test 全 PASS)
- v1.60-3 = tutorial 120 + migration + concept + snippet 38 streak (136 test 全 PASS)
- v1.60-4 = publish (plugin 1.60.0 + desktop v0.5 + announcement 8 + release-smoke + docs-e2e)
