---
title: Desktop testing baseline — v1.56 3 axis SSOT
---

# Desktop testing baseline — v1.56 3 axis SSOT

## What this covers

`@kiwa-lab/desktop` v0.1 の 3 axis (Electron + Tauri + Webview) target-neutral state machine SSOT。 v1.56 で kiwa 縦深化 pair 第 14 新規 base pair として導入、 **42 package 到達**、 v1.50 Mobile と対で **v2.0 milestone 「desktop + mobile adapters」 goal 達成**。

## 3 axis 一覧

### Electron axis

- App lifecycle = idle → app-ready → window-created → ipc-dispatched → quit (5 state)
- 4 method = startElectronApp + createBrowserWindow + dispatchIpcMessage + quitElectronApp
- 4 neutral event = app_ready + window_created + ipc_message_dispatched + app_quit

### Tauri axis

- Command + Event lifecycle = idle → command-registered → command-invoked → event-emitted → window-closed (5 state)
- 4 method = startTauriApp + registerTauriCommand + invokeTauriCommand + emitTauriEvent + closeTauriWindow
- 4 neutral event = command_registered + command_invoked + event_emitted + window_closed

### Webview axis

- Bridge + Isolation lifecycle = idle → preload-loaded → bridge-bound → message-posted → isolation-asserted (5 state)
- 4 method = loadPreloadScript + bindContextBridge + postWebviewMessage + assertContextIsolation
- 4 neutral event = preload_loaded + bridge_bound + message_posted + isolation_asserted

## 3 target × 3 axis fidelity harness

- target = macos + windows + linux = 3 platform
- axis = electron + tauri + webview = 3
- 3 × 3 = 9 row grid、 `collectFidelityCoverage()` で collect
- 3 target × 12 event = 36 dialect mapping

## Provider dialect example

```
macos.electron.app.ready       ← electron.app_ready (macos)
windows.electron.app.ready     ← electron.app_ready (windows)
linux.electron.app.ready       ← electron.app_ready (linux)
macos.webview.preload          ← webview.preload_loaded (macos)
windows.webview2.preload       ← webview.preload_loaded (windows)
linux.webkit.preload           ← webview.preload_loaded (linux)
macos.tauri.invoke             ← tauri.command_invoked (macos)
```

## backward compat 絶対維持

新 package `@kiwa-lab/desktop` の追加は additive、 既存 41 package 全部 API 変更 0。 依存関係も `@kiwa-lab/core` のみ、 他 package への影響なし。

## 縦深化 pair 第 14 新規 base pair 導入 = v2.0 milestone goal 達成

kiwa 縦深化 pair pattern の 14 番目、 v1.50 Mobile (pair 第 13) と対で v2.0 milestone 「desktop (Electron / Tauri) + mobile (React Native / Expo) adapters」 goal 達成。 pair 深度拡張 pattern (Mobile v1.50-v1.55 6 段拡張) と **広さ拡張 pattern (base pair 導入)** の 2 軸 rhythm を並行運用。

## Phase 2 (v1.57+) 計画

- **Desktop v0.2 advanced axis** = Auto-updater (electron-updater) + File system permissions + Notification + Menu bar + Tray icon
- **Desktop v0.3 real driver** = Electron testing (@electron/test-utils) + Tauri test framework (tauri-driver + WebDriver)
- **v2.0 desktop adapter 深化 4 段目 candidate** = depth-4 record 4 例目 (Mobile depth-5 に続く depth-4 5 例目 candidate)
