# kiwa v1.57 released — Desktop 深化 I (v0.2 advanced 5 axis: Auto-updater + FS permissions + Notification + Menu-bar + Tray-icon、 35 milestone streak、 systematic pattern 32 度目)

## Summary

kiwa v1.57 is out。 **Desktop 深化 I** 単軸 milestone、 v1.56 で導入した Desktop base pair (v0.1 = 3 axis) を **v0.2 で advanced 5 axis 追加** し 8 axis 化、 v1.55/v1.56 4 PR rhythm 継承、 **systematic pattern 32 度目適用**。

## What's new

### `@kiwa-test/desktop` v0.2 minor bump

- v0.1 3 axis (Electron + Tauri + Webview) に **advanced 5 axis 追加**
  - **Auto-updater** = check → download → apply → relaunch (Squirrel.Mac / Squirrel.Windows / AppImage)
  - **File-system permissions** = request → grant → revoke → audit (TCC / UAC / xdg-portal)
  - **Notification** = schedule → display → action → dismiss (UserNotifications / Toast / libnotify)
  - **Menu-bar** = build → item → click → destroy (NSMenu / WM_MENU / GtkMenuBar)
  - **Tray-icon** = create → tooltip → click → remove (NSStatusItem / NotifyIcon / StatusNotifierItem)
- 3 target × 8 axis = **24 spec fidelity grid**、 3 target × 32 event = **96 dialect mapping** (v0.1 36 + v0.2 60)
- backward compat 絶対維持 = 既存 42 package + v0.1 3 axis API 変更 0

### dogfood 拡張

- `dogfood-desktop-electron-app` に v0.2 5 axis workflow test 追加、 v0.1 11 test + v0.2 10 test = **21 test 全 PASS**
- `runFullDesktopWorkflowV02` で 8 axis × 3 target = 24 workflow 全走査
- 既存 `runFullDesktopWorkflow` (v0.1 3 axis × 3 target = 9 workflow) は backward compat で保持

### 1 new tutorial + migration + concept

- **[Tutorial 117 — Desktop advanced axis](https://cardene777.github.io/kiwa/tutorials/117-desktop-advanced-axis)** = v0.2 5 axis × 15 min
- Migration v1.56 → v1.57 additive + 5 pattern SSOT + 縦深化 pair 第 14 の第 2 段 SSOT
- Concept doc `desktop-advanced-axis.md` = v0.2 5 axis SSOT + 24 spec fidelity grid + systematic pattern 32 度目適用

### 35-milestone consecutive snippet validation streak

v1.23 → v1.57 = **35 milestone**、 kiwa 史上最長記録更新継続。

### systematic root cause pattern SSOT 32 度目適用

desktop v0.2 5 axis に uniform state machine pattern 適用、 v1.56 の 31 度目 (desktop v0.1 3 axis uniform) を継承。

## Install

```bash
pnpm add -D @kiwa-test/desktop@^0.2
```

## Migration guide

[v1.56 → v1.57](https://cardene777.github.io/kiwa/migrations/v1.56-to-v1.57)

## What's next

- v1.58+ = Desktop 深化 II (v0.3 real driver: @electron/test-utils + tauri-driver + WebDriver)
- Desktop v0.4 adapter layer (KIWA_DESKTOP_MODE env-gate + mock/real switching)
- 他 pair depth-5 拡張 or v2.0 milestone 残 goal (coverage 100%)
