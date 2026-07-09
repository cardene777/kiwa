---
title: "kiwa v1.58 リリース — Desktop 深化 II (@kiwa-lab/desktop v0.3 advanced III 4 axis、 36 milestone streak、 systematic pattern 33 度目、 Mobile v1.50→v1.52 rhythm 再現)"
emoji: "🎥"
type: "tech"
topics: ["testing", "vitest", "electron", "tauri", "desktop"]
published: false
---

# kiwa v1.58 リリース — Desktop 深化 II

## Summary

**Desktop 深化 II** 単軸 milestone、 v1.56 で導入した Desktop base pair (v0.1 3 axis) + v1.57 で拡張した v0.2 5 advanced axis を **v0.3 で advanced III 4 axis 追加** し 12 axis 化、 v1.55-v1.57 4 PR rhythm 継承 (**5 milestone 連続**)、 **systematic pattern 33 度目適用**、 **36 milestone 連続 snippet validation streak** 達成、 **Mobile v1.50-v1.52 rhythm 完全再現**。

## What's new

### `@kiwa-lab/desktop` v0.3 minor bump

v0.1 3 axis (Electron + Tauri + Webview) + v0.2 5 axis (Auto-updater + FS permissions + Notification + Menu-bar + Tray-icon) に **advanced III 4 axis 追加**。

- **[Tutorial 118 — Desktop advanced III](https://cardene777.github.io/kiwa/tutorials/118-desktop-advanced-iii)**
- Migration v1.57 → v1.58 additive + 4 pattern SSOT + 縦深化 pair 第 14 の第 3 段
- Concept doc `desktop-advanced-iii.md` = v0.3 4 axis SSOT + 36 spec fidelity grid + systematic pattern 33 度目適用 + Mobile v1.50-v1.52 rhythm 再現 SSOT

### 4 axis semantics + 実 OS API

| axis | lifecycle | macos | windows | linux |
|---|---|---|---|---|
| screen-recording | permission → start → chunk → stop | ScreenCaptureKit / SCStream | Windows.Graphics.Capture (WinRT) | xdg-portal ScreenCast + pipewire |
| global-shortcut | register → trigger → unregister → all-clear | Carbon RegisterEventHotKey | User32 RegisterHotKey | xdg-portal GlobalShortcuts |
| clipboard | write → read → change → clear | NSPasteboard | OpenClipboard + SetClipboardData | gtk_clipboard + wl_data_device |
| dark-mode | subscribe → theme-change → user-preferred → unsubscribe | AppleInterfaceTheme | ImmersiveColorSet + AppsUseLightTheme | xdg-portal Settings color-scheme |

### 3 target × 12 axis fidelity grid

- target = macos + windows + linux = 3 platform
- axis = v0.1 3 + v0.2 5 + v0.3 4 = **12**
- 3 × 12 = **36 row grid**、 `collectFidelityCoverage()` で collect
- 3 target × 48 event = **144 dialect mapping** (v0.1 36 + v0.2 60 + v0.3 48)

### backward compat 絶対維持

v0.3 4 axis の追加は additive、 v0.1 + v0.2 の 8 axis / 32 method / 32 event / 96 mapping は完全保持。

### dogfood 拡張

`dogfood-desktop-electron-app` に v0.3 4 axis workflow test 追加、 v0.1 11 + v0.2 10 + v0.3 9 = **30 test 全 PASS**。 `runFullDesktopWorkflowV03` で 12 axis × 3 target = 36 workflow 全走査。

### 36 milestone 連続 snippet validation streak

v1.23 → v1.58 = **36 milestone**、 kiwa 史上最長記録更新継続。

### systematic pattern 33 度目適用

v1.57 の 32 度目 (desktop v0.2 5 axis uniform) を継承、 desktop v0.3 4 axis に uniform 適用。

### Mobile v1.50-v1.52 rhythm 完全再現

Mobile v1.50 (base 3 axis) → v1.51 (advanced II 4 axis) → v1.52 (advanced III 4 axis) の 3 milestone rhythm を Desktop pair (v1.56-v1.58) で完全再現、 depth-3 到達。 pair 導入 → advanced I → advanced III の 3 milestone rhythm が Mobile pair + Desktop pair の 2 base pair で成立、 kiwa の深化 rhythm SOP 完全定着。

## Install

```bash
pnpm add -D @kiwa-lab/desktop@^0.3
```

## Code sample (4 patterns)

### Pattern 1 — Screen-recording

```ts
import { captureScreenChunk, requestScreenRecordingPermission, startScreenRecording, stopScreenRecording } from '@kiwa-lab/desktop';

const s = requestScreenRecordingPermission({ target: 'macos', sessionId: 'rec-1', displayId: 'display-primary' });
startScreenRecording(s, true);
captureScreenChunk(s, 1_048_576);
stopScreenRecording(s);
```

### Pattern 2 — Global-shortcut

```ts
import { clearAllGlobalShortcuts, createGlobalShortcutSession, registerGlobalShortcut, triggerGlobalShortcut } from '@kiwa-lab/desktop';

const s = createGlobalShortcutSession({ target: 'windows', namespace: 'app' });
registerGlobalShortcut(s, 'CmdOrCtrl+Shift+P');
triggerGlobalShortcut(s, 'CmdOrCtrl+Shift+P');
clearAllGlobalShortcuts(s);
```

### Pattern 3 — Clipboard

```ts
import { clearClipboard, notifyClipboardChange, openClipboard, readClipboard, writeClipboard } from '@kiwa-lab/desktop';

const s = openClipboard({ target: 'linux', clipboardId: 'cb-1' });
writeClipboard(s, { contents: 'hello', format: 'text' });
readClipboard(s);
notifyClipboardChange(s, 'external');
clearClipboard(s);
```

### Pattern 4 — Dark-mode

```ts
import { notifyThemeChange, recordUserPreference, subscribeDarkMode, unsubscribeDarkMode } from '@kiwa-lab/desktop';

const s = subscribeDarkMode({ target: 'macos', observerId: 'obs-1', initialTheme: 'light' });
notifyThemeChange(s, 'dark');
recordUserPreference(s, 'dark');
unsubscribeDarkMode(s);
```

## Migration guide

[v1.57 → v1.58](https://cardene777.github.io/kiwa/migrations/v1.57-to-v1.58)

## What's next

- v1.59+ = Desktop 深化 III (v0.4 adapter layer: KIWA_DESKTOP_MODE env-gate + mock/real switching)
- Desktop v0.5 spawn stub (Mobile v0.5 pattern 転用、 depth-5 pattern 2 例目 candidate)
- Desktop v0.6 real spawn (Mobile v0.6 pattern 転用、 depth-6 pattern 新設 candidate)
- v2.0 milestone coverage 100% goal

## 4 sub 完遂

- v1.58-1 = desktop v0.3 4 axis 実装 (4 file 新規 + types.ts 拡張、 30 test 追加、 89 test 全 PASS)
- v1.58-2 = dogfood-desktop-electron-app に v0.3 4 axis workflow 追加 (9 test 追加、 30 test 全 PASS)
- v1.58-3 = tutorial 118 + migration + concept + snippet 36 streak (93 test 全 PASS)
- v1.58-4 = publish (plugin 1.58.0 + desktop v0.3 + announcement 6 + release-smoke + docs-e2e)
