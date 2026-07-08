---
title: Desktop advanced axis — v1.57 v0.2 5 axis SSOT
---

# Desktop advanced axis — v1.57 v0.2 5 axis SSOT

## What this covers

`@kiwa-test/desktop` v0.2 の advanced 5 axis (Auto-updater + File-system permissions + Notification + Menu-bar + Tray-icon) target-neutral state machine SSOT。 v1.57 で v0.1 3 axis → v0.2 8 axis に minor bump、 kiwa 縦深化 pair 第 14 の第 2 段、 v0.1 baseline (`docs/concepts/desktop-testing-baseline.md`) を extend。

## v0.2 5 axis 一覧

### Auto-updater axis

- lifecycle = idle → check-started → update-downloaded → update-applied → relaunch-scheduled (5 state)
- 4 method = startAutoUpdaterCheck + recordUpdateDownloaded + applyDownloadedUpdate + scheduleRelaunch
- 4 neutral event = check_started + update_downloaded + update_applied + relaunch_scheduled
- OS = Squirrel.Mac (macos) / Squirrel.Windows (windows) / AppImage update (linux)

### File-system permissions axis

- lifecycle = idle → requested → granted → revoked → audited (5 state)
- 4 method = requestFsPermission + grantFsPermission + revokeFsPermission + logFsPermissionAudit
- 4 neutral event = request_submitted + permission_granted + permission_revoked + audit_logged
- OS = TCC (macos) / UAC + AppContainer (windows) / xdg-portal + polkit (linux)

### Notification axis

- lifecycle = idle → scheduled → displayed → action-invoked → dismissed (5 state)
- 4 method = scheduleNotification + displayNotification + invokeNotificationAction + dismissNotification
- 4 neutral event = scheduled + displayed + action_invoked + dismissed
- OS = UserNotifications (macos) / Toast Notification (windows) / libnotify (linux)

### Menu-bar axis

- lifecycle = idle → built → item-appended → item-clicked → destroyed (5 state)
- 4 method = buildMenuBar + appendMenuBarItem + clickMenuBarItem + destroyMenuBar
- 4 neutral event = built + item_appended + item_clicked + destroyed
- OS = NSMenu (macos) / WM_MENU (windows) / GtkMenuBar + Ayatana (linux)

### Tray-icon axis

- lifecycle = idle → created → tooltip-updated → clicked → removed (5 state)
- 4 method = createTrayIcon + updateTrayTooltip + clickTrayIcon + removeTrayIcon
- 4 neutral event = created + tooltip_updated + clicked + removed
- OS = NSStatusItem (macos) / NotifyIcon + Shell_NotifyIcon (windows) / StatusNotifierItem (linux)

## 3 target × 8 axis fidelity harness

- target = macos + windows + linux = 3 platform
- axis = v0.1 3 (electron + tauri + webview) + v0.2 5 (auto-updater + fs-permissions + notification + menu-bar + tray-icon) = 8
- 3 × 8 = **24 row grid**、 `collectFidelityCoverage()` で collect
- 3 target × 32 event = **96 dialect mapping** (v0.1 36 + v0.2 60)

## Provider dialect example (v0.2 抜粋)

```
macos.autoUpdater.checkForUpdates   ← auto-updater.check_started (macos)
windows.autoUpdater.checkForUpdates ← auto-updater.check_started (windows)
linux.autoUpdater.checkForUpdates   ← auto-updater.check_started (linux)
macos.tcc.requestAccess             ← fs-permissions.request_submitted (macos)
windows.uac.request                 ← fs-permissions.request_submitted (windows)
linux.xdgPortal.request             ← fs-permissions.request_submitted (linux)
macos.userNotifications.display     ← notification.displayed (macos)
windows.toastNotification.show      ← notification.displayed (windows)
linux.libnotify.show                ← notification.displayed (linux)
macos.NSStatusItem.create           ← tray-icon.created (macos)
windows.notifyIcon.NIM_ADD          ← tray-icon.created (windows)
linux.statusNotifierItem.Register   ← tray-icon.created (linux)
```

## backward compat 絶対維持

v0.2 5 axis の追加は additive、 v0.1 3 axis の 12 method / 12 event / 36 mapping は完全保持。 依存関係も `@kiwa-test/core` のみで v0.1 と同じ、 他 42 package への影響 0。

## systematic pattern 32 度目適用

v1.56 の 31 度目 = desktop v0.1 3 axis uniform (state / session / emit helper / 4 step 遷移) を 32 度目で desktop v0.2 5 axis に uniform 適用。 5 axis 全て `State` union type + `Session` interface + `emit` helper (internal) + `start/op/op/end` 4 export 関数 の統一構造、 v0.1 pattern を 100% 継承。

## Phase 3 (v1.58+) 計画

- **Desktop v0.3 real driver** = @electron/test-utils (Electron testing framework) + tauri-driver + WebDriver 経路
- **Desktop v0.4 adapter layer** = KIWA_DESKTOP_MODE env-gate で mock/real switching、 mobile v0.4 pattern を desktop に転用
- **Desktop v0.5-v0.6 depth-5 拡張** = Mobile v0.5 stub → v0.6 real spawn の 2 段拡張を desktop に適用、 depth-5 pattern 2 例目 candidate
- **v2.0 milestone coverage 100% goal** への合流
