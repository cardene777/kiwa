---
title: Desktop spawn stub 契約層 — v1.60 v0.5 8 CLI stub + env-gate SSOT
---

# Desktop spawn stub 契約層 — v1.60 v0.5 8 CLI stub + env-gate SSOT

## What this covers

`@kiwa-lab/desktop` v0.5 の spawn stub 契約層 SSOT。 v1.60 で v0.4 adapter layer → v0.5 spawn stub 追加、 kiwa 縦深化 pair 第 14 の第 5 段、 **depth-5 record 2 例目 candidate**、 Mobile v1.54 pattern (v0.5 spawn-driver 契約層) 転用、 v0.4 baseline (`docs/concepts/desktop-adapter-layer.md`) を extend。

## spawn stub 契約層 3 type SSOT

```ts
export type DesktopCliCommand =
  | 'electron-builder'
  | 'electron-updater'
  | 'ffmpeg'
  | 'xclip'
  | 'osascript'
  | 'notify-send'
  | 'defaults'
  | 'reg';

export interface SpawnInvocation {
  command: DesktopCliCommand;
  args: string[];
  env: Record<string, string>;
  cwd?: string;
}

export interface SpawnResult {
  command: DesktopCliCommand;
  args: string[];
  invoked: boolean;
  exitCode: number | null;
  stdout: string;
  stderr: string;
  durationMs: number;
}
```

## 12 axis → 8 CLI + 4 non-CLI mapping (AXIS_TO_CLI)

- 12 axis = v0.1 3 (electron/tauri/webview) + v0.2 5 (auto-updater/fs-permissions/notification/menu-bar/tray-icon) + v0.3 4 (screen-recording/global-shortcut/clipboard/dark-mode)
- **8 CLI-backed axis** = electron-builder × 2 (menu-bar + tray-icon 共有) + electron-updater / ffmpeg / xclip / osascript / notify-send / defaults の 7 CLI にまとめると 7 unique CLI + electron-builder 重複 1 = 8 CLI 種類
- **4 non-CLI axis** = electron / tauri / webview / dark-mode (native process、 OS notification 経路)

### mapping 詳細

| axis | CLI | mapping 理由 |
|---|---|---|
| auto-updater | electron-updater | Squirrel.Mac / Squirrel.Windows / AppImage update 共通 CLI |
| fs-permissions | osascript | macOS TCC 系 (Windows UAC / Linux polkit は別 CLI 候補) |
| notification | notify-send | Linux libnotify (macOS terminal-notifier / Windows PowerShell は別) |
| menu-bar | electron-builder | packaging 時 template file 生成 |
| tray-icon | electron-builder | packaging 時 template file 生成 (menu-bar と CLI 共有) |
| screen-recording | ffmpeg | cross-platform screen capture の de facto standard |
| global-shortcut | defaults | macOS accessibility 系 (Windows PowerShell / Linux xdg-portal は別) |
| clipboard | xclip | Linux (macOS = pbcopy、 Windows = clip、 別 CLI 候補) |
| electron | null | native process、 CLI 不要 (invokeDesktopCli で null return) |
| tauri | null | native process、 CLI 不要 |
| webview | null | native process、 CLI 不要 |
| dark-mode | null | OS notification 経路、 CLI なし |

## env-gate `KIWA_DESKTOP_MODE=real` の設計思想

- **`real`** = 実 spawn 実行前提の signal、 CI 環境で 実 CLI が install されている想定
- **未設定 / `mock`** = throw で fail-closed、 mock adapter (v0.4) 経路と混同を防ぐ
- **v1.61+ v0.6 実 spawn 実装後** = `KIWA_DESKTOP_MODE=real` かつ CLI install 済で 実 child_process.spawn 実行、 未 install 環境は `KIWA_DESKTOP_SPAWN=dry-run` (v0.6 で追加予定) で v0.5 shape 契約 復元

## args 上限 32 + fail-closed の安全性設計

- **args 上限 32** = 実 CLI 呼出時の buffer overflow / command injection 対策
- **fail-closed** = env / args 不正時に silently skip でなく throw、 test で必ず検知される設計
- **defensive copy** = SpawnResult.args = [...inv.args] で caller side mutation 影響なし

## shape 契約 preserving (Mobile v0.5 と 1:1)

Desktop v0.5 SpawnResult = Mobile v0.5 SpawnResult と 6 field 完全一致 (command / args / invoked / exitCode / stdout / stderr / durationMs)。 v1.61+ v0.6 実 spawn 実装後も同じ shape 契約を維持、 stdout/stderr/exitCode/durationMs は 実 spawn からの実測値に置換される (mock/stub → real の shape 契約 preserving)。

## backward compat 絶対維持

v0.5 spawn stub 契約層の追加は additive、 v0.1 + v0.2 + v0.3 + v0.4 の 12 axis / 48 method / 48 event / 144 mapping + adapter interface + fidelity harness は完全保持。 依存関係も `@kiwa-lab/core` のみで v0.1-v0.4 と同じ、 他 43 package への影響 0、 semantics + adapters 既存 layer からの API export 完全保持。

## systematic pattern 35 度目適用

v1.59 の 34 度目 = desktop v0.4 adapter interface uniform を 35 度目で desktop v0.5 spawn stub に uniform 適用。 8 CLI 全て単一 invokeDesktopCli pattern から呼出、 SpawnInvocation → SpawnResult の shape 契約統一、 KIWA_DESKTOP_MODE env-gate + args 上限 + fail-closed の安全性 pattern 統一。 「pattern 化 = axis 数 + CLI 数 + interface layer に独立」 の pattern SSOT が確立。

## Mobile v1.54 rhythm 完全再現

Mobile v1.50 (base 3 axis) → v1.51 (advanced II 4 axis) → v1.52 (advanced III 4 axis) → v1.53 (v0.4 adapter layer + fidelity harness) → v1.54 (v0.5 spawn stub 契約層) の 5 milestone rhythm を Desktop pair (v1.56-v1.60) で完全再現、 depth-5 到達。 pair 間 pattern 転用の 5 例目 (1 例目 = advanced axis rhythm、 2 例目 = adapter interface、 3 例目 = fidelity harness、 4 例目 = dogfood adapter workflow、 5 例目 = spawn-driver)。

## depth-5 pattern 2 例目 candidate 到達

pair 深度 5 段拡張達成 (v0.1 → v0.2 → v0.3 → v0.4 → v0.5) の 2 例目 candidate。

- **depth-5 pattern 1 例目** = Mobile v1.54 stub + v1.55 実 spawn (kiwa milestone 史上初 depth-5 record)
- **depth-5 pattern 2 例目 candidate** = Desktop v1.60 stub、 v1.61+ v0.6 実 spawn で 2 例目確定予定

depth-5 pattern の 2 例安定化まで v1.61+ で完成予定、 2 例安定化で「pattern 化 candidate → 確定 pattern」 に昇格する signal。

## Phase 6 (v1.61+) 計画

- **Desktop v0.6 実 spawn 実装完成** = Mobile v0.6 pattern (spawn-executor + env sanitize + timeout + buffer 上限 + DI) を Desktop に転用、 `KIWA_DESKTOP_SPAWN=dry-run` env で v0.5 shape 契約復元経路追加、 **depth-6 pattern 新設 candidate**
- **spawn-executor + per-command env allowlist** = 8 CLI 別 env allowlist (electron-builder: ELECTRON_MIRROR + BUILD_TARGET / ffmpeg: FFMPEG_PATH / xclip: DISPLAY 等)、 secret 漏洩防止
- **v0.4 real adapter を実 OS API 呼出に置換** = electron-updater / SCStream / NSPasteboard 等、 fidelity harness の behavior diff early warning 実運用開始
- **v2.0 milestone coverage 100% goal** への合流
