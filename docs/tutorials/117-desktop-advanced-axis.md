# Desktop advanced axis — Auto-updater + File system permissions + Notification + Menu-bar + Tray-icon in 15 min

## What you'll build

A vitest suite wired to `@kiwa-lab/desktop` v0.2 (advanced 5 axis 追加、 v1.57 で kiwa 縦深化 pair 第 14 の第 2 段、 **systematic pattern 32 度目適用**、 35 milestone streak)、 v0.1 3 axis (Electron + Tauri + Webview) に v0.2 で advanced 5 axis (Auto-updater + File-system permissions + Notification + Menu-bar + Tray-icon) を追加した 8 axis × 3 target = 24 spec の workflow を deterministic に扱う pattern。

## Prerequisites

- Node.js ≥ 20
- `pnpm`
- `@kiwa-lab/desktop` v0.2 (`pnpm add -D @kiwa-lab/desktop@^0.2`)

## Step-by-step build

### 1. Bootstrap

```bash
mkdir kiwa-desktop-v02 && cd kiwa-desktop-v02
pnpm init
pnpm add -D @kiwa-lab/desktop@^0.2 vitest typescript @types/node
```

### 2. Auto-updater axis (check + download + apply + relaunch)

```ts
import { describe, expect, it } from 'vitest';
import {
  applyDownloadedUpdate,
  recordUpdateDownloaded,
  scheduleRelaunch,
  startAutoUpdaterCheck,
} from '@kiwa-lab/desktop';

describe('Auto-updater full path', () => {
  it('check → download → apply → relaunch', () => {
    const s = startAutoUpdaterCheck({ target: 'macos', channel: 'stable' });
    recordUpdateDownloaded(s, { version: '1.2.3', bytes: 42_000_000 });
    applyDownloadedUpdate(s);
    scheduleRelaunch(s, 5_000);
    expect(s.state).toBe('relaunch-scheduled');
    expect(s.applied).toBe(true);
    expect(s.relaunchDelayMs).toBe(5_000);
  });
});
```

### 3. File-system permissions axis (request + grant + revoke + audit)

```ts
import { describe, expect, it } from 'vitest';
import {
  grantFsPermission,
  logFsPermissionAudit,
  requestFsPermission,
  revokeFsPermission,
} from '@kiwa-lab/desktop';

describe('FS permissions flow', () => {
  it('request → grant → revoke → audit', () => {
    const s = requestFsPermission({
      target: 'macos',
      path: '/Users/alice/Documents',
      scope: 'read-write',
    });
    grantFsPermission(s, 'read');
    grantFsPermission(s, 'write');
    revokeFsPermission(s, 'read');
    logFsPermissionAudit(s, 'user-revoke');
    expect(s.state).toBe('audited');
    expect(s.grantedScopes).toEqual(['write']);
  });
});
```

### 4. Notification axis (schedule + display + action + dismiss)

```ts
import { describe, expect, it } from 'vitest';
import {
  dismissNotification,
  displayNotification,
  invokeNotificationAction,
  scheduleNotification,
} from '@kiwa-lab/desktop';

describe('Notification lifecycle', () => {
  it('schedule → display → action → dismiss', () => {
    const s = scheduleNotification({
      target: 'windows',
      notificationId: 'update-1',
      title: 'Update available',
      scheduledAtMs: 1_000,
    });
    displayNotification(s, 1_500);
    invokeNotificationAction(s, 'view-details');
    dismissNotification(s);
    expect(s.state).toBe('dismissed');
    expect(s.actions).toEqual(['view-details']);
  });
});
```

### 5. Menu-bar axis (build + item + click + destroy)

```ts
import { describe, expect, it } from 'vitest';
import {
  appendMenuBarItem,
  buildMenuBar,
  clickMenuBarItem,
  destroyMenuBar,
} from '@kiwa-lab/desktop';

describe('Menu-bar lifecycle', () => {
  it('build → append → click → destroy', () => {
    const s = buildMenuBar({ target: 'linux', menuId: 'main-menu' });
    appendMenuBarItem(s, { id: 'file', label: 'File', accelerator: 'Cmd+F' });
    appendMenuBarItem(s, { id: 'edit', label: 'Edit', accelerator: null });
    clickMenuBarItem(s, 'file');
    destroyMenuBar(s);
    expect(s.state).toBe('destroyed');
    expect(s.items.length).toBe(2);
    expect(s.clickCount).toBe(1);
  });
});
```

### 6. Tray-icon axis (create + tooltip + click + remove)

```ts
import { describe, expect, it } from 'vitest';
import {
  clickTrayIcon,
  createTrayIcon,
  removeTrayIcon,
  updateTrayTooltip,
} from '@kiwa-lab/desktop';

describe('Tray-icon lifecycle', () => {
  it('create → tooltip → click → remove', () => {
    const s = createTrayIcon({
      target: 'macos',
      trayId: 'tray-1',
      iconPath: '/app/icon.png',
    });
    updateTrayTooltip(s, 'Sync in progress');
    clickTrayIcon(s);
    clickTrayIcon(s);
    removeTrayIcon(s);
    expect(s.state).toBe('removed');
    expect(s.clickCount).toBe(2);
  });
});
```

### 7. 実行

```bash
pnpm exec vitest run
# ✓ 5 tests pass (v0.2 advanced axis)
```

## Provider dialect (v0.2 拡張)

3 target × 8 axis × 4 event = 96 dialect mapping。 v0.2 で追加された 5 axis の実 OS API は以下。

| axis | macos | windows | linux |
|---|---|---|---|
| auto-updater | Squirrel.Mac | Squirrel.Windows | AppImage update |
| fs-permissions | TCC | UAC | xdg-portal / polkit |
| notification | UserNotifications | Toast Notification | libnotify |
| menu-bar | NSMenu | WM_MENU | GtkMenuBar |
| tray-icon | NSStatusItem | NotifyIcon | StatusNotifierItem |

## 8 axis × 3 target = 24 spec fidelity grid

```ts
import { collectFidelityCoverage } from '@kiwa-lab/desktop';

const coverage = collectFidelityCoverage();
console.log(coverage.rows.length); // 24 (3 target × 8 axis)
console.log(coverage.axes.length); // 8
```

## backward compat 絶対維持

v0.2 は additive、 v0.1 3 axis (electron/tauri/webview) の 12 method / 12 event / 36 mapping は完全保持。 既存 code は無修正で v0.1 → v0.2 に upgrade 可能。

## 次の Step

- v1.57-2 dogfood app 拡張 (`examples/dogfood-desktop-electron-app`) で 8 axis × 3 target = 24 grid workflow
- `docs/concepts/desktop-advanced-axis.md` で v0.2 5 axis の設計 SSOT + fidelity harness 拡張
- v1.58+ で Desktop 深化 II (v0.3 real driver: @electron/test-utils + tauri-driver + WebDriver) 検討
