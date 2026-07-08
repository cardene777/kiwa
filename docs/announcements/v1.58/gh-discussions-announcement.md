# kiwa v1.58 released — Desktop 深化 II (v0.3 advanced III 4 axis: Screen recording + Global shortcut + Clipboard + Dark-mode、 36 milestone streak、 systematic pattern 33 度目、 Mobile v1.50→v1.52 rhythm 再現)

## Summary

kiwa v1.58 is out。 **Desktop 深化 II** 単軸 milestone、 v1.56 で導入した Desktop base pair (v0.1 3 axis) + v1.57 で拡張した v0.2 5 advanced axis を **v0.3 で advanced III 4 axis 追加** し 12 axis 化、 v1.55/v1.56/v1.57 4 PR rhythm 継承 (**5 milestone 連続**)、 **systematic pattern 33 度目適用**、 **36 milestone snippet streak 達成**。

## What's new

### `@kiwa/desktop` v0.3 minor bump

- v0.1 3 axis + v0.2 5 axis に **advanced III 4 axis 追加**
  - **Screen-recording** = permission → start → chunk → stop (ScreenCaptureKit / Windows.Graphics.Capture / xdg-portal ScreenCast)
  - **Global-shortcut** = register → trigger → unregister → all-clear (Carbon RegisterEventHotKey / User32.RegisterHotKey / xdg-portal GlobalShortcuts)
  - **Clipboard** = write → read → change → clear (NSPasteboard / OpenClipboard / gtk_clipboard、 4 format 対応)
  - **Dark-mode** = subscribe → theme-change → user-preferred → unsubscribe (AppleInterfaceTheme / ImmersiveColorSet / xdg-portal Settings、 3 theme mode)
- 3 target × 12 axis = **36 spec fidelity grid**、 3 target × 48 event = **144 dialect mapping** (v0.1 36 + v0.2 60 + v0.3 48)
- backward compat 絶対維持 = 既存 42 package + v0.1 + v0.2 API 変更 0

### dogfood 拡張

- `dogfood-desktop-electron-app` に v0.3 4 axis workflow test 追加、 v0.1 11 test + v0.2 10 test + v0.3 9 test = **30 test 全 PASS**
- `runFullDesktopWorkflowV03` で 12 axis × 3 target = 36 workflow 全走査
- 既存 `runFullDesktopWorkflow` (9) + `runFullDesktopWorkflowV02` (24) は backward compat で保持

### 1 new tutorial + migration + concept

- **[Tutorial 118 — Desktop advanced III](https://cardene777.github.io/kiwa/tutorials/118-desktop-advanced-iii)** = v0.3 4 axis × 15 min
- Migration v1.57 → v1.58 additive + 4 pattern SSOT + 縦深化 pair 第 14 の第 3 段 SSOT
- Concept doc `desktop-advanced-iii.md` = v0.3 4 axis SSOT + 36 spec fidelity grid + systematic pattern 33 度目適用 + Mobile v1.50-v1.52 rhythm 再現 SSOT

### 36-milestone consecutive snippet validation streak

v1.23 → v1.58 = **36 milestone**、 kiwa 史上最長記録更新継続。

### systematic root cause pattern SSOT 33 度目適用

desktop v0.3 4 axis に uniform state machine pattern 適用、 v1.57 の 32 度目 (desktop v0.2 5 axis uniform) を継承。

### Mobile v1.50-v1.52 rhythm 完全再現

Mobile v1.50 (base 3 axis) → v1.51 (advanced II 4 axis) → v1.52 (advanced III 4 axis) の 3 milestone rhythm を Desktop pair (v1.56-v1.58) で完全再現、 depth-3 到達。

## Install

```bash
pnpm add -D @kiwa/desktop@^0.3
```

## Migration guide

[v1.57 → v1.58](https://cardene777.github.io/kiwa/migrations/v1.57-to-v1.58)

## What's next

- v1.59+ = Desktop 深化 III (v0.4 adapter layer: KIWA_DESKTOP_MODE env-gate + mock/real switching、 Mobile v0.4 pattern 転用)
- Desktop v0.5 spawn stub (Mobile v0.5 pattern 転用、 depth-5 pattern 2 例目 candidate)
- Desktop v0.6 real spawn (Mobile v0.6 pattern 転用、 depth-6 pattern 新設 candidate)
- v2.0 milestone coverage 100% goal
