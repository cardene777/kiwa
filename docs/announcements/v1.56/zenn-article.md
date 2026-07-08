# kiwa v1.56 リリース — Desktop 新規 base pair 第 14 導入 (42 package 到達、 v2.0 milestone desktop + mobile adapters goal 達成、 34 milestone snippet streak)

## 概要

kiwa v1.56 をリリースしました。 **Desktop 新規 base pair 第 14 導入** 単軸 milestone、 **42 package 到達** (v1.55 41 + desktop 1)、 v1.50 Mobile と対で **v2.0 milestone 「desktop (Electron / Tauri) + mobile (React Native / Expo) adapters」 goal 達成**、 34 milestone snippet streak 継続。

## 何が変わったか

### `@kiwa/desktop` v0.1 新規

- 3 axis semantics = Electron (main + BrowserWindow + IPC + quit、 5 state) + Tauri (invoke command + event listen + window mgmt、 5 state) + Webview (preload + contextBridge + postMessage + isolation、 5 state)
- 3 target (macos + windows + linux) × 3 axis = 9 row fidelity grid
- 36 dialect mapping = macos Electron / windows webview2 / linux webkit の 3 provider dialect 統一、 target-neutral test の裏に platform-specific dialect 保持
- backward compat 絶対維持 = 既存 41 package API 変更 0

### v2.0 milestone desktop + mobile adapters goal 達成

kiwa v2.0 milestone の core deliverable の 1 つ = 「desktop (Electron / Tauri) + mobile (React Native / Expo) adapters」 が v1.50 Mobile + v1.56 Desktop の 2 milestone セットで **達成**。 kiwa の adapter 拡張戦略 SSOT 完成、 kiwa Web + Backend + SaaS + Mobile + Desktop の 5 領域完全 coverage 到達。

### 1 new dogfood app + 1 tutorial + migration + concept

- **dogfood-desktop-electron-app** = 3 axis × 3 target workflow、 11 test
- **[Tutorial 116 — Desktop testing baseline](https://cardene777.github.io/kiwa/tutorials/116-desktop-testing)**
- Migration guide v1.55 → v1.56 additive + 3 pattern (Electron + Tauri + Webview) SSOT + Desktop 新規 base pair 導入 SSOT
- Concept doc `desktop-testing-baseline.md` = 3 axis SSOT + 3 target × 3 axis = 9 row fidelity grid + 36 dialect mapping + Phase 2 計画

## 34 milestone 連続 snippet validation streak 達成

v1.23 → v1.56 = 34 milestone 連続、 kiwa 史上最長記録更新継続。 systematic root cause pattern SSOT (release script filter 存在確認) は 31 度目適用。

## インストール

```bash
pnpm add -D @kiwa/desktop@^0.1
```

## Migration guide

[v1.55 → v1.56](https://cardene777.github.io/kiwa/migrations/v1.55-to-v1.56)

## 次に何が来るか

v1.57 前後 = 4 候補。

- **Desktop 深化 (v0.2 advanced axis)** = Auto-updater (electron-updater) + File system permissions + Notification + Menu bar + Tray icon
- **Desktop v0.3 real driver** = Electron testing (@electron/test-utils) + Tauri test framework (tauri-driver + WebDriver)
- **他 pair 5 段拡張** = v1.40 AI/LLM / v1.41 Payment / v1.42 Observability depth-4 record から depth-5 拡張 candidate
- **他 pair 4 段化** = Search / Auth / Realtime / Frontend の 3 段記録から 4 段拡張
