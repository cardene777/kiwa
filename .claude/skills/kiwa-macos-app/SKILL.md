---
name: kiwa-macos-app
description: |
  @kiwa-lab/macos-app (SwiftUI / AppKit / XCTest / accessibility / screencap / notification 統合 mock harness) を使った macOS native app の test 生成 skill。
  `createMacOSAppTestEnv` + `mountView` (SwiftUI) / `mountWindow` (AppKit) で UI mount、 `runAccessibilityAudit` で a11y 検証、 `captureScreenshot` で snapshot、 `dispatchNotification` で NSUserNotification 経路を in-process で叩ける。 real macOS Xcode runtime 不要で design-time に近い test を書く。
user_invocable: true
context: conversation
agent: general-purpose
allowed-tools: Bash, Read, Glob, Grep, Write, Edit
---

# /kiwa-macos-app — macOS native app (SwiftUI / AppKit) test 生成

`@kiwa-lab/macos-app` の SwiftUI / AppKit / accessibility / screencap / notification 統合 mock を使った macOS app test を Vitest 形式で生成する。 real Xcode / simulator 不要で view mount / a11y audit / screenshot / notification dispatch の test を書く。

## 目的

macOS デスクトップアプリ (Menubar app / Preferences pane / Document based app / Widget 等) で「view render → user interaction → state 変化 → accessibility label 検証 → screenshot 保存 → NSUserNotification dispatch」 の complete path を test 化する。 SwiftUI と AppKit の両 UI framework を統一 interface で試す。

## 前提

- `pnpm add -D @kiwa-lab/macos-app` install 済
- Vitest 環境 (Node 経路、 real Xcode 不要)
- 対象 module に macOS view / window / notification 経路が存在

## オプション

- `--module {name}` — test 対象 module (preferences-pane / menubar / doc-window 等)
- `--framework {swiftui|appkit|both}` — 対象 UI framework (省略時 = both)
- `--output {path}` — 生成 test の path

## 実行フロー

### Step 1: view mount test 生成

`createMacOSAppTestEnv()` で env、 SwiftUI = `mountView(env, { type: 'ContentView', props: { count: 0 } })`、 AppKit = `mountWindow(env, { title: 'Pref', contentSize: [400, 300] })` で mount、 return の `tree` / `label` / `bounds` を assert。 state 変化 → view update path も cover。

### Step 2: accessibility audit test 生成

`runAccessibilityAudit(env, view)` で label 欠落 / role 未指定 / focus order 違反 等の violation 検出、 `violations.length` + severity を assert。 clean view と dirty view の 2 case を cover。

### Step 3: screencap + notification test 生成

`captureScreenshot(env, view, { path: 'tmp/x.png' })` で snapshot 保存、 file 存在 + bytes 数を assert。 `dispatchNotification(env, { title: 'Done', body: '...' })` で NSUserNotification 発火、 `env.listDispatched()` で送信履歴を verify。

## 使用例

```bash
/kiwa-macos-app --module preferences-pane --framework swiftui
/kiwa-macos-app --module menubar --framework appkit
```
