---
title: "kiwa v1.57 リリース — Desktop 深化 I (@kiwa-lab/desktop v0.2 advanced 5 axis、 35 milestone streak、 systematic pattern 32 度目)"
emoji: "🖥️"
type: "tech"
topics: ["testing", "vitest", "electron", "tauri", "desktop"]
published: false
---

# kiwa v1.57 リリース — Desktop 深化 I

## Summary

**Desktop 深化 I** 単軸 milestone、 v1.56 で導入した Desktop base pair (v0.1 = 3 axis) を **v0.2 で advanced 5 axis 追加** し 8 axis 化、 v1.55/v1.56 4 PR rhythm 継承、 **systematic pattern 32 度目適用**、 **35 milestone 連続 snippet validation streak** 達成。

## What's new

### `@kiwa-lab/desktop` v0.2 minor bump

v0.1 3 axis (Electron + Tauri + Webview) に **advanced 5 axis 追加**。

- **[Tutorial 117 — Desktop advanced axis](https://cardene777.github.io/kiwa/tutorials/117-desktop-advanced-axis)**
- Migration v1.56 → v1.57 additive + 5 pattern SSOT + 縦深化 pair 第 14 の第 2 段
- Concept doc `desktop-advanced-axis.md` = v0.2 5 axis SSOT + 24 spec fidelity grid + systematic pattern 32 度目適用

### 5 axis semantics + 実 OS API

| axis | lifecycle | macos | windows | linux |
|---|---|---|---|---|
| auto-updater | check → download → apply → relaunch | Squirrel.Mac | Squirrel.Windows | AppImage update |
| fs-permissions | request → grant → revoke → audit | TCC | UAC / AppContainer | xdg-portal / polkit |
| notification | schedule → display → action → dismiss | UserNotifications | Toast Notification | libnotify |
| menu-bar | build → item → click → destroy | NSMenu | WM_MENU | GtkMenuBar / Ayatana |
| tray-icon | create → tooltip → click → remove | NSStatusItem | NotifyIcon | StatusNotifierItem |

### 3 target × 8 axis fidelity grid

- target = macos + windows + linux = 3 platform
- axis = v0.1 3 (electron + tauri + webview) + v0.2 5 (auto-updater + fs-permissions + notification + menu-bar + tray-icon) = 8
- 3 × 8 = **24 row grid**、 `collectFidelityCoverage()` で collect
- 3 target × 32 event = **96 dialect mapping** (v0.1 36 + v0.2 60)

### backward compat 絶対維持

v0.2 5 axis の追加は additive、 v0.1 3 axis の 12 method / 12 event / 36 mapping は完全保持。 依存関係も `@kiwa-lab/core` のみで v0.1 と同じ、 他 42 package への影響 0。

### dogfood 拡張

`dogfood-desktop-electron-app` に v0.2 5 axis workflow test 追加、 v0.1 11 test + v0.2 10 test = **21 test 全 PASS**。 `runFullDesktopWorkflowV02` で 8 axis × 3 target = 24 workflow 全走査、 既存 `runFullDesktopWorkflow` (v0.1 3 axis × 3 target = 9 workflow) は backward compat で保持。

### 35 milestone 連続 snippet validation streak

v1.23 → v1.57 = **35 milestone**、 kiwa 史上最長記録更新継続。

### systematic pattern 32 度目適用

v1.56 の 31 度目 (desktop v0.1 3 axis uniform = state machine + emit helper + 4 step 遷移) を継承、 desktop v0.2 5 axis に uniform 適用。 5 axis 全て `State` union type + `Session` interface + `emit` helper (internal) + `start/op/op/end` 4 export 関数 の統一構造。

## Install

```bash
pnpm add -D @kiwa-lab/desktop@^0.2
```

## Code sample (5 patterns)

### Pattern 1 — Auto-updater

```ts
import { applyDownloadedUpdate, recordUpdateDownloaded, scheduleRelaunch, startAutoUpdaterCheck } from '@kiwa-lab/desktop';

const s = startAutoUpdaterCheck({ target: 'macos', channel: 'stable' });
recordUpdateDownloaded(s, { version: '1.2.3', bytes: 42_000_000 });
applyDownloadedUpdate(s);
scheduleRelaunch(s, 5_000);
```

### Pattern 2 — File-system permissions

```ts
import { grantFsPermission, logFsPermissionAudit, requestFsPermission, revokeFsPermission } from '@kiwa-lab/desktop';

const s = requestFsPermission({ target: 'macos', path: '/Users/alice/Documents', scope: 'read-write' });
grantFsPermission(s, 'read');
grantFsPermission(s, 'write');
revokeFsPermission(s, 'read');
logFsPermissionAudit(s, 'user-revoke');
```

### Pattern 3 — Notification

```ts
import { dismissNotification, displayNotification, invokeNotificationAction, scheduleNotification } from '@kiwa-lab/desktop';

const s = scheduleNotification({ target: 'windows', notificationId: 'update-1', title: 'Update available', scheduledAtMs: 1_000 });
displayNotification(s, 1_500);
invokeNotificationAction(s, 'view-details');
dismissNotification(s);
```

### Pattern 4 — Menu-bar

```ts
import { appendMenuBarItem, buildMenuBar, clickMenuBarItem, destroyMenuBar } from '@kiwa-lab/desktop';

const s = buildMenuBar({ target: 'linux', menuId: 'main-menu' });
appendMenuBarItem(s, { id: 'file', label: 'File', accelerator: 'Cmd+F' });
clickMenuBarItem(s, 'file');
destroyMenuBar(s);
```

### Pattern 5 — Tray-icon

```ts
import { clickTrayIcon, createTrayIcon, removeTrayIcon, updateTrayTooltip } from '@kiwa-lab/desktop';

const s = createTrayIcon({ target: 'macos', trayId: 'tray-1', iconPath: '/app/icon.png' });
updateTrayTooltip(s, 'Sync in progress');
clickTrayIcon(s);
removeTrayIcon(s);
```

## Migration guide

[v1.56 → v1.57](https://cardene777.github.io/kiwa/migrations/v1.56-to-v1.57)

## What's next

- v1.58+ = Desktop 深化 II (v0.3 real driver: @electron/test-utils + tauri-driver + WebDriver)
- Desktop v0.4 adapter layer (KIWA_DESKTOP_MODE env-gate + mock/real switching)
- 他 pair depth-5 拡張 or v2.0 milestone 残 goal (coverage 100%)

## 4 sub 完遂

- v1.57-1 = desktop v0.2 5 axis 実装 (5 file 新規 + types.ts 拡張、 32 test 追加、 54 test 全 PASS)
- v1.57-2 = dogfood-desktop-electron-app に v0.2 5 axis workflow 追加 (10 test 追加、 21 test 全 PASS)
- v1.57-3 = tutorial 117 + migration + concept + snippet 35 streak (59 test 全 PASS)
- v1.57-4 = publish (plugin 1.57.0 + desktop v0.2 + announcement 5 + release-smoke + docs-e2e)
