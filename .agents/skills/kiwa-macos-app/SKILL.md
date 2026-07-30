---
name: kiwa-macos-app
description: |
  @kiwa-lab/macos-app (SwiftUI / AppKit / XCTest / accessibility / screencap / notification 統合 mock harness) を使った macOS native app の test 生成 skill。
  `createMacAppEnv` で view tree を作り、 `simulateUserInteraction`、 `captureAccessibilityTree`、 `mockScreencap`、 `emitUserNotification` を in-process で検証する。 real macOS Xcode runtime 不要で native API へ渡す契約を test にできる。
user_invocable: true
context: conversation
agent: general-purpose
allowed-tools: Bash, Read, Glob, Grep, Write, Edit
---

# /kiwa-macos-app — macOS native app test 生成

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

### view tree の操作 test を生成

`createMacAppEnv({ mode: 'swiftui' })` または `createMacAppEnv({ mode: 'appkit' })` で environment を作り、 `simulateUserInteraction(env, { type: 'click', target: 'action' })` の `targetFound`、 `dispatched`、 `handled` と event log を assert。app 固有の view tree は `initialView` と実際の node id を渡して検証する。

### accessibility tree の test を生成

`captureAccessibilityTree(env)` で view tree から推定した accessibility role と label を取得する。Button が `AXButton`、Text が `AXStaticText` として表現されること、disabled node を interaction が dispatch しないことを assert。実 AX API と VoiceOver は統合 test に分ける。

### screencap と notification の test を生成

`mockScreencap(env, { format: 'png' })` の format magic、region、byte length を assert。 `emitUserNotification(env, { title: 'Done', body: '...' })` は scheduled result と event log を返し、空白だけの title または body は rejected result を返す。実 OS notification callback は統合 test に分ける。

## 使用例

```bash
/kiwa-macos-app --module preferences-pane --framework swiftui
/kiwa-macos-app --module menubar --framework appkit
```
