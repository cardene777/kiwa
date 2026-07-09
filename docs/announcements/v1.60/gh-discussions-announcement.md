# kiwa v1.60 released — Desktop 深化 IV (v0.5 child_process.spawn stub 契約層、 depth-5 pattern 2 例目 candidate、 systematic pattern 35 度目、 38 milestone streak、 Mobile v1.54 rhythm 完全再現)

## Summary

kiwa v1.60 is out。 **Desktop 深化 IV** 単軸 milestone、 v1.56-v1.59 で構築した Desktop 12 axis + adapter layer + fidelity harness に **v0.5 で spawn stub 契約層を追加**、 12 axis から 8 CLI-backed axis 抽出 (electron-builder / electron-updater / ffmpeg / xclip / osascript / notify-send / defaults / reg) + 4 non-CLI axis (electron / tauri / webview / dark-mode)、 KIWA_DESKTOP_MODE env-gate + args 上限 32 + fail-closed。 v1.55-v1.59 4 PR rhythm 継承 (**7 milestone 連続 = 28 PR 連続同 rhythm**)、 **systematic pattern 35 度目適用**、 **38 milestone snippet streak 達成**、 **Mobile v1.50-v1.54 5 milestone rhythm 完全再現**、 **depth-5 pattern 2 例目 candidate 到達**。

## What's new

### `@kiwa-lab/desktop` v0.5 minor bump

- **spawn stub 契約層** 追加 = DesktopCliCommand 8 種 + SpawnInvocation + SpawnResult (Mobile v0.5 と 1:1 shape 契約) + AXIS_TO_CLI mapping (12 axis) + invokeDesktopCli + cliForAxis + buildSpawnInvocation factory
- **8 CLI 抽出** = electron-builder / electron-updater / ffmpeg / xclip / osascript / notify-send / defaults / reg
- **4 non-CLI axis** = electron / tauri / webview / dark-mode (native process 経路)
- **env-gate** `KIWA_DESKTOP_MODE=real` + args 上限 32 + fail-closed
- backward compat 絶対維持 = 既存 43 package + v0.1 + v0.2 + v0.3 + v0.4 の 12 axis / 48 method + adapter + fidelity 完全保持

### dogfood 新規

- `dogfood-desktop-spawn-app` 新規、 8 CLI stub workflow (runAllCliStubs) + axis-backed CLI chain (runAxisBackedCliChain) + non-CLI 列挙 (listNonCliAxes)、 env-gate 3 pattern verify、 **11 test 全 PASS**
- kiwa package 44 個到達 (v1.59 43 + dogfood-desktop-spawn-app 1、 dogfood は private で npm publish 対象外)

### 1 new tutorial + migration + concept

- **[Tutorial 120 — Desktop spawn stub 契約層](https://cardene777.github.io/kiwa/tutorials/120-desktop-spawn-stub)** = v0.5 spawn stub × 15 min
- Migration v1.59 → v1.60 additive + 4 pattern SSOT + 縦深化 pair 第 14 の第 5 段 + depth-5 pattern 2 例目 candidate SSOT
- Concept doc `desktop-spawn-stub.md` = v0.5 spawn stub 3 type SSOT + 12 axis → 8 CLI mapping + env-gate 設計思想 + Mobile v1.54 rhythm 再現 + depth-5 pattern 2 例目 candidate pattern SSOT

### 38-milestone consecutive snippet validation streak

v1.23 → v1.60 = **38 milestone**、 kiwa 史上最長記録更新継続。

### systematic root cause pattern SSOT 35 度目適用

desktop v0.5 spawn stub に uniform 適用、 v1.59 の 34 度目 (desktop v0.4 adapter interface uniform) を継承。

### Mobile v1.50-v1.54 5 milestone rhythm 完全再現

Mobile v1.50 (base 3 axis) → v1.51 (advanced II 4 axis) → v1.52 (advanced III 4 axis) → v1.53 (v0.4 adapter layer + fidelity harness) → v1.54 (v0.5 spawn stub 契約層) の 5 milestone rhythm を Desktop pair (v1.56-v1.60) で完全再現、 **depth-5 到達 = 2 例目 candidate**。

### depth-5 pattern 2 例目 candidate 到達

pair 深度 5 段拡張達成 (v0.1 → v0.2 → v0.3 → v0.4 → v0.5) の 2 例目 candidate、 v1.61+ v0.6 実 spawn 実装完成後に 2 例目確定予定。

## Install

```bash
pnpm add -D @kiwa-lab/desktop@^0.5
```

## Migration guide

[v1.59 → v1.60](https://cardene777.github.io/kiwa/migrations/v1.59-to-v1.60)

## What's next

- v1.61+ = Desktop 深化 V (v0.6 実 spawn 実装完成、 depth-6 pattern 新設 candidate)
- v0.4 real adapter を実 OS API 呼出に置換
- 他 pair 5 段拡張 (v1.40 AI/LLM / v1.41 Payment / v1.42 Observability depth-4 → depth-5)
- v2.0 milestone coverage 100% goal
