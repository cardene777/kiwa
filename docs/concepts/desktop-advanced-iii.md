---
title: Desktop advanced III — v1.58 v0.3 4 axis SSOT
---

# Desktop advanced III — v1.58 v0.3 4 axis SSOT

## What this covers

`@kiwa-test/desktop` v0.3 の advanced III 4 axis (Screen recording + Global shortcut + Clipboard + Dark-mode) target-neutral state machine SSOT。 v1.58 で v0.2 8 axis → v0.3 12 axis に minor bump、 kiwa 縦深化 pair 第 14 の第 3 段、 v0.2 baseline (`docs/concepts/desktop-advanced-axis.md`) を extend。

## v0.3 4 axis 一覧

### Screen-recording axis

- lifecycle = idle → permission-requested → recording → chunk-captured → stopped (5 state)
- 4 method = requestScreenRecordingPermission + startScreenRecording + captureScreenChunk + stopScreenRecording
- 4 neutral event = permission_requested + started + chunk_captured + stopped
- OS = ScreenCaptureKit / SCStream (macos) / Windows.Graphics.Capture / Direct3D11CaptureFrame (windows) / xdg-portal ScreenCast + pipewire (linux)

### Global-shortcut axis

- lifecycle = idle → registered → triggered → unregistered → all-cleared (5 state)
- 5 method = createGlobalShortcutSession + registerGlobalShortcut + triggerGlobalShortcut + unregisterGlobalShortcut + clearAllGlobalShortcuts
- 4 neutral event = registered + triggered + unregistered + all_cleared
- OS = Carbon RegisterEventHotKey / kEventHotKeyPressed (macos) / User32.RegisterHotKey / WM_HOTKEY (windows) / xdg-portal GlobalShortcuts (linux)

### Clipboard axis

- lifecycle = idle → written → read → changed → cleared (5 state)
- 5 method = openClipboard + writeClipboard + readClipboard + notifyClipboardChange + clearClipboard
- 4 neutral event = written + read + changed + cleared
- 4 format 対応 = text / html / image / file-list
- OS = NSPasteboard (macos) / User32.SetClipboardData / WM_CLIPBOARDUPDATE (windows) / gtk_clipboard + wl_data_device (linux)

### Dark-mode axis

- lifecycle = idle → subscribed → theme-changed → user-preferred → unsubscribed (5 state)
- 4 method = subscribeDarkMode + notifyThemeChange + recordUserPreference + unsubscribeDarkMode
- 4 neutral event = subscribed + theme_changed + user_preferred + unsubscribed
- 3 theme mode = light / dark / no-preference
- OS = AppleInterfaceTheme + NSDistributedNotificationCenter (macos) / ImmersiveColorSet + AppsUseLightTheme registry + WM_SETTINGCHANGE (windows) / xdg-portal Settings color-scheme (linux)

## 3 target × 12 axis fidelity harness

- target = macos + windows + linux = 3 platform
- axis = v0.1 3 (electron + tauri + webview) + v0.2 5 (auto-updater + fs-permissions + notification + menu-bar + tray-icon) + v0.3 4 (screen-recording + global-shortcut + clipboard + dark-mode) = **12**
- 3 × 12 = **36 row grid**、 `collectFidelityCoverage()` で collect
- 3 target × 48 event = **144 dialect mapping** (v0.1 36 + v0.2 60 + v0.3 48)

## Provider dialect example (v0.3 抜粋)

```
macos.SCStream.start                          ← screen-recording.started (macos)
windows.GraphicsCaptureSession.startCapture   ← screen-recording.started (windows)
linux.xdgPortal.ScreenCast.Start              ← screen-recording.started (linux)
macos.RegisterEventHotKey                     ← global-shortcut.registered (macos)
windows.User32.RegisterHotKey                 ← global-shortcut.registered (windows)
linux.xdgPortal.GlobalShortcuts.BindShortcut  ← global-shortcut.registered (linux)
macos.NSPasteboard.setString                  ← clipboard.written (macos)
windows.User32.SetClipboardData               ← clipboard.written (windows)
linux.gtk.clipboard.set_text                  ← clipboard.written (linux)
macos.AppleInterfaceThemeChangedNotification  ← dark-mode.theme_changed (macos)
windows.ImmersiveColorSet                     ← dark-mode.theme_changed (windows)
linux.xdgPortal.Settings.color-scheme.changed ← dark-mode.theme_changed (linux)
```

## backward compat 絶対維持

v0.3 4 axis の追加は additive、 v0.1 + v0.2 の 8 axis / 32 method / 32 event / 96 mapping は完全保持。 依存関係も `@kiwa-test/core` のみで v0.1 + v0.2 と同じ、 他 42 package への影響 0。

## systematic pattern 33 度目適用

v1.57 の 32 度目 = desktop v0.2 5 axis uniform (state / session / emit helper / 4 step 遷移) を 33 度目で desktop v0.3 4 axis に uniform 適用。 4 axis 全て `State` union type + `Session` interface + `emit` helper (internal) + `start/op/op/end` 4-5 export 関数 の統一構造、 v0.1 + v0.2 pattern を 100% 継承。 「一度確立した pattern を N axis に再現するだけ」 = systematic pattern SSOT の本質。

## Mobile v1.50-v1.52 rhythm 完全再現

Mobile v1.50 (base 3 axis) → v1.51 (advanced II 4 axis) → v1.52 (advanced III 4 axis + New Architecture) の 3 milestone rhythm を Desktop pair (v1.56-v1.58) で完全再現、 depth-3 到達。 pair 導入 → advanced I → advanced III の 3 milestone rhythm が Mobile pair + Desktop pair の 2 base pair で成立、 kiwa の深化 rhythm SOP 完全定着。

## Phase 4 (v1.59+) 計画

- **Desktop v0.4 adapter layer** = KIWA_DESKTOP_MODE env-gate + mock/real switching、 Mobile v0.4 pattern (adapter interface + fidelity harness、 12 axis × 2 mode = 24 adapter pair) を Desktop に転用
- **Desktop v0.5 spawn stub** = Mobile v0.5 pattern (invokeDesktopCli + cliForAxis + buildSpawnInvocation + env-gate + args 上限 + fail-closed) 転用、 depth-5 pattern 2 例目 candidate
- **Desktop v0.6 real spawn** = Mobile v0.6 pattern (spawn-executor + env sanitize + timeout + buffer 上限 + DI) 転用、 depth-6 pattern 新設 candidate
- **v2.0 milestone coverage 100% goal** への合流
