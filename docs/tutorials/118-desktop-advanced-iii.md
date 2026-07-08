# Desktop advanced III — Screen recording + Global shortcut + Clipboard + Dark-mode in 15 min

## What you'll build

A vitest suite wired to `@kiwa-test/desktop` v0.3 (advanced III 4 axis 追加、 v1.58 で kiwa 縦深化 pair 第 14 の第 3 段、 **systematic pattern 33 度目適用**、 36 milestone streak)、 v0.1 3 axis (Electron + Tauri + Webview) + v0.2 5 axis (Auto-updater + FS permissions + Notification + Menu-bar + Tray-icon) に v0.3 で advanced III 4 axis (Screen recording + Global shortcut + Clipboard + Dark-mode) を追加した **12 axis × 3 target = 36 spec** の workflow を deterministic に扱う pattern。

## Prerequisites

- Node.js ≥ 20
- `pnpm`
- `@kiwa-test/desktop` v0.3 (`pnpm add -D @kiwa-test/desktop@^0.3`)

## Step-by-step build

### 1. Bootstrap

```bash
mkdir kiwa-desktop-v03 && cd kiwa-desktop-v03
pnpm init
pnpm add -D @kiwa-test/desktop@^0.3 vitest typescript @types/node
```

### 2. Screen-recording axis (permission + start + chunk + stop)

```ts
import { describe, expect, it } from 'vitest';
import {
  captureScreenChunk,
  requestScreenRecordingPermission,
  startScreenRecording,
  stopScreenRecording,
} from '@kiwa-test/desktop';

describe('Screen-recording full path', () => {
  it('permission → start → chunk → stop', () => {
    const s = requestScreenRecordingPermission({
      target: 'macos',
      sessionId: 'rec-1',
      displayId: 'display-primary',
    });
    startScreenRecording(s, true);
    captureScreenChunk(s, 1_048_576);
    captureScreenChunk(s, 2_097_152);
    stopScreenRecording(s);
    expect(s.state).toBe('stopped');
    expect(s.chunksCaptured).toBe(2);
    expect(s.totalBytes).toBe(3_145_728);
  });
});
```

### 3. Global-shortcut axis (register + trigger + unregister + all-clear)

```ts
import { describe, expect, it } from 'vitest';
import {
  clearAllGlobalShortcuts,
  createGlobalShortcutSession,
  registerGlobalShortcut,
  triggerGlobalShortcut,
  unregisterGlobalShortcut,
} from '@kiwa-test/desktop';

describe('Global-shortcut flow', () => {
  it('register → trigger → unregister → clear', () => {
    const s = createGlobalShortcutSession({ target: 'windows', namespace: 'app' });
    registerGlobalShortcut(s, 'CmdOrCtrl+Shift+P');
    registerGlobalShortcut(s, 'F1');
    triggerGlobalShortcut(s, 'CmdOrCtrl+Shift+P');
    unregisterGlobalShortcut(s, 'F1');
    clearAllGlobalShortcuts(s);
    expect(s.state).toBe('all-cleared');
    expect(s.registered).toEqual([]);
  });
});
```

### 4. Clipboard axis (write + read + change + clear)

```ts
import { describe, expect, it } from 'vitest';
import {
  clearClipboard,
  notifyClipboardChange,
  openClipboard,
  readClipboard,
  writeClipboard,
} from '@kiwa-test/desktop';

describe('Clipboard lifecycle', () => {
  it('write → read → change → clear', () => {
    const s = openClipboard({ target: 'linux', clipboardId: 'cb-1' });
    writeClipboard(s, { contents: 'hello', format: 'text' });
    readClipboard(s);
    notifyClipboardChange(s, 'external value');
    clearClipboard(s);
    expect(s.state).toBe('cleared');
    expect(s.changeCount).toBe(2);
  });
});
```

### 5. Dark-mode axis (subscribe + theme-change + user-preferred + unsubscribe)

```ts
import { describe, expect, it } from 'vitest';
import {
  notifyThemeChange,
  recordUserPreference,
  subscribeDarkMode,
  unsubscribeDarkMode,
} from '@kiwa-test/desktop';

describe('Dark-mode lifecycle', () => {
  it('subscribe → theme-change → user-preferred → unsubscribe', () => {
    const s = subscribeDarkMode({
      target: 'macos',
      observerId: 'obs-1',
      initialTheme: 'light',
    });
    notifyThemeChange(s, 'dark');
    recordUserPreference(s, 'dark');
    unsubscribeDarkMode(s);
    expect(s.state).toBe('unsubscribed');
    expect(s.currentTheme).toBe('dark');
  });
});
```

### 6. 実行

```bash
pnpm exec vitest run
# ✓ 4 tests pass (v0.3 advanced III axis)
```

## Provider dialect (v0.3 拡張)

3 target × 12 axis × 4 event = **144 dialect mapping**。 v0.3 で追加された 4 axis の実 OS API は以下。

| axis | macos | windows | linux |
|---|---|---|---|
| screen-recording | ScreenCaptureKit (SCStream) | Windows.Graphics.Capture (WinRT) | xdg-portal ScreenCast + pipewire |
| global-shortcut | Carbon RegisterEventHotKey | User32 RegisterHotKey | xdg-portal GlobalShortcuts |
| clipboard | NSPasteboard | OpenClipboard + SetClipboardData | gtk_clipboard + wl_data_device |
| dark-mode | AppleInterfaceTheme | ImmersiveColorSet + AppsUseLightTheme | xdg-portal Settings color-scheme |

## 12 axis × 3 target = 36 spec fidelity grid

```ts
import { collectFidelityCoverage } from '@kiwa-test/desktop';

const coverage = collectFidelityCoverage();
console.log(coverage.rows.length); // 36 (3 target × 12 axis)
console.log(coverage.axes.length); // 12
```

## backward compat 絶対維持

v0.3 は additive、 v0.1 3 axis (electron/tauri/webview) + v0.2 5 axis (auto-updater/fs-permissions/notification/menu-bar/tray-icon) の 8 axis / 32 method / 32 event / 96 mapping は完全保持。 既存 code は無修正で v0.2 → v0.3 に upgrade 可能。

## 次の Step

- v1.58-2 dogfood app 拡張 (`examples/dogfood-desktop-electron-app`) で 12 axis × 3 target = 36 grid workflow
- `docs/concepts/desktop-advanced-iii.md` で v0.3 4 axis の設計 SSOT + fidelity harness 拡張
- v1.59+ で Desktop 深化 III (v0.4 adapter layer: KIWA_DESKTOP_MODE env-gate + mock/real switching) 検討
