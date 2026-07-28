# Desktop リファレンス

`@kiwa-lab/desktop` の root entry point は semantics と adapters を再公開します。以下は利用頻度の高い API の役割、状態、失敗条件です。引数と型の完全な一覧は [公開 entry point](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/index.ts) から辿れます。

## 共通の型

`DesktopTarget` は `macos`、`windows`、`linux` のいずれかです。Electron や Tauri は target ではありません。

多くの操作は `AxisStep` を返します。そこには中立イベント名の `neutralEvent`、対象 OS のイベント名である `providerEvent`、遷移後の `state`、補助情報の `metadata` が入ります。session には同じ step が `history` として蓄積されます。

## Electron

| API | 役割 | 主な失敗条件 |
| --- | --- | --- |
| `startElectronApp` | `app-ready` の session を作る | 空の `appId` |
| `createBrowserWindow` | window を作り `window-created` に進める | 空の ID、終了済み session |
| `dispatchIpcMessage` | IPC を記録し `ipc-dispatched` に進める | 空の channel、終了済み session |
| `quitElectronApp` | session を `quit` にする | すでに終了済み |

Electron API はプロセスや BrowserWindow を実際には作成しません。session と history の仕様を検証するための API です。

## Tauri

| API | 役割 | 主な失敗条件 |
| --- | --- | --- |
| `startTauriApp` | `idle` の session を作る | 空の `appName` |
| `registerTauriCommand` | command を登録する | 空の command 名 |
| `invokeTauriCommand` | 登録済み command の invoke を記録する | 未登録 command、空の command 名 |
| `emitTauriEvent` | event を記録する | 空の event 名 |
| `closeTauriWindow` | label を指定して window close を記録する | 空の label |

Tauri command の payload は文字列として扱われます。command handler の実装、JSON の妥当性、RPC 応答はこの API の対象外です。

## Webview と通知

`loadPreloadScript` で Webview session を開始します。`bindContextBridge` と `postWebviewMessage` は preload 後だけに使えます。`assertContextIsolation` は isolation の値を記録しますが、実ブラウザの isolation を保証しません。

通知は `scheduleNotification`、`displayNotification`、`invokeNotificationAction`、`dismissNotification` の順で使います。表示時刻は scheduled time 以上である必要があります。通知を表示する前に action や dismiss を行うと失敗します。

## native adapter

`probeAndInvoke` は対象 axis を確認して CLI を probe し、可能なときだけ spawn します。結果の `NativeInvokeResult` は次の status を返します。

| status | 意味 |
| --- | --- |
| `invoked` | 対応 CLI を確認して spawn 経路を実行した |
| `cli-unavailable` | 必要な CLI が見つからない |
| `axis-skipped` | 対象 OS では axis を実行しない |
| `no-cli-mapping` | semantics 専用の axis で CLI がない |

`probeAndInvokeAll` は既定で 12 axis と 3 OS の組み合わせを走査し、status ごとの配列と total を返します。CI では `cliUnavailable` と `axisSkipped` を分けてレポートし、実行できなかったケースを pass と集計しないでください。

`InvokeCache` は native invoke 結果の in-memory cache です。key は axis、target、args で構成され、env は含みません。`withCache` の返り値では、実行結果を `invokeResult`、cache の経路を `cacheStatus` として別に確認できます。

<!-- kiwa-public-api:start -->
## エラー診断

次の一覧は、公開 entry point から到達する実装が明示的に送出する Error と TypeError です。template literal の値は実行時の入力で置き換わります。

| 送出する message | 発生箇所 |
| --- | --- |
| &#96;invokeDesktopCli($&#123;inv.command&#125;): KIWA&#95;DESKTOP&#95;MODE must be 'real'&#96; | [packages/desktop/src/adapters/spawn-driver.ts](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/adapters/spawn-driver.ts#L76) |
| &#96;invokeDesktopCli($&#123;inv.command&#125;): args exceeds max 32 ($&#123;inv.args.length&#125;)&#96; | [packages/desktop/src/adapters/spawn-driver.ts](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/adapters/spawn-driver.ts#L81) |
| 'startAutoUpdaterCheck: channel must not be empty' | [packages/desktop/src/semantics/auto-updater.ts](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/auto-updater.ts#L48) |
| 'recordUpdateDownloaded: check not started' | [packages/desktop/src/semantics/auto-updater.ts](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/auto-updater.ts#L67) |
| 'recordUpdateDownloaded: version must not be empty' | [packages/desktop/src/semantics/auto-updater.ts](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/auto-updater.ts#L68) |
| 'recordUpdateDownloaded: bytes must be non-negative' | [packages/desktop/src/semantics/auto-updater.ts](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/auto-updater.ts#L69) |
| 'applyDownloadedUpdate: update not downloaded' | [packages/desktop/src/semantics/auto-updater.ts](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/auto-updater.ts#L81) |
| 'scheduleRelaunch: update not applied' | [packages/desktop/src/semantics/auto-updater.ts](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/auto-updater.ts#L96) |
| 'scheduleRelaunch: delayMs must be non-negative' | [packages/desktop/src/semantics/auto-updater.ts](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/auto-updater.ts#L98) |
| 'openClipboard: clipboardId must not be empty' | [packages/desktop/src/semantics/clipboard.ts](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/clipboard.ts#L44) |
| 'writeClipboard: contents must not be empty' | [packages/desktop/src/semantics/clipboard.ts](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/clipboard.ts#L60) |
| 'readClipboard: clipboard empty' | [packages/desktop/src/semantics/clipboard.ts](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/clipboard.ts#L73) |
| 'notifyClipboardChange: externalContents must not be empty' | [packages/desktop/src/semantics/clipboard.ts](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/clipboard.ts#L85) |
| 'clearClipboard: already cleared' | [packages/desktop/src/semantics/clipboard.ts](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/clipboard.ts#L96) |
| 'subscribeDarkMode: observerId must not be empty' | [packages/desktop/src/semantics/dark-mode.ts](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/dark-mode.ts#L50) |
| 'notifyThemeChange: not subscribed' | [packages/desktop/src/semantics/dark-mode.ts](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/dark-mode.ts#L69) |
| &#96;notifyThemeChange: theme unchanged ($&#123;newTheme&#125;)&#96; | [packages/desktop/src/semantics/dark-mode.ts](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/dark-mode.ts#L72) |
| 'recordUserPreference: not subscribed' | [packages/desktop/src/semantics/dark-mode.ts](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/dark-mode.ts#L88) |
| 'unsubscribeDarkMode: already unsubscribed' | [packages/desktop/src/semantics/dark-mode.ts](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/dark-mode.ts#L99) |
| 'startElectronApp: appId must not be empty' | [packages/desktop/src/semantics/electron.ts](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/electron.ts#L37) |
| 'createBrowserWindow: app has quit' | [packages/desktop/src/semantics/electron.ts](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/electron.ts#L51) |
| 'createBrowserWindow: windowId must not be empty' | [packages/desktop/src/semantics/electron.ts](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/electron.ts#L52) |
| 'dispatchIpcMessage: app has quit' | [packages/desktop/src/semantics/electron.ts](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/electron.ts#L65) |
| 'dispatchIpcMessage: channel must not be empty' | [packages/desktop/src/semantics/electron.ts](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/electron.ts#L66) |
| 'quitElectronApp: already quit' | [packages/desktop/src/semantics/electron.ts](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/electron.ts#L77) |
| 'requestFsPermission: path must not be empty' | [packages/desktop/src/semantics/fs-permissions.ts](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/fs-permissions.ts#L45) |
| 'grantFsPermission: no request pending' | [packages/desktop/src/semantics/fs-permissions.ts](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/fs-permissions.ts#L63) |
| &#96;revokeFsPermission: $&#123;scope&#125; not granted&#96; | [packages/desktop/src/semantics/fs-permissions.ts](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/fs-permissions.ts#L77) |
| 'logFsPermissionAudit: reason must not be empty' | [packages/desktop/src/semantics/fs-permissions.ts](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/fs-permissions.ts#L91) |
| 'createGlobalShortcutSession: namespace must not be empty' | [packages/desktop/src/semantics/global-shortcut.ts](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/global-shortcut.ts#L46) |
| 'registerGlobalShortcut: session cleared' | [packages/desktop/src/semantics/global-shortcut.ts](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/global-shortcut.ts#L61) |
| 'registerGlobalShortcut: accelerator must not be empty' | [packages/desktop/src/semantics/global-shortcut.ts](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/global-shortcut.ts#L62) |
| &#96;registerGlobalShortcut: $&#123;accelerator&#125; already registered&#96; | [packages/desktop/src/semantics/global-shortcut.ts](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/global-shortcut.ts#L64) |
| &#96;triggerGlobalShortcut: $&#123;accelerator&#125; not registered&#96; | [packages/desktop/src/semantics/global-shortcut.ts](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/global-shortcut.ts#L80) |
| &#96;unregisterGlobalShortcut: $&#123;accelerator&#125; not registered&#96; | [packages/desktop/src/semantics/global-shortcut.ts](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/global-shortcut.ts#L95) |
| 'buildMenuBar: menuId must not be empty' | [packages/desktop/src/semantics/menu-bar.ts](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/menu-bar.ts#L45) |
| 'appendMenuBarItem: menu destroyed' | [packages/desktop/src/semantics/menu-bar.ts](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/menu-bar.ts#L63) |
| 'appendMenuBarItem: id must not be empty' | [packages/desktop/src/semantics/menu-bar.ts](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/menu-bar.ts#L64) |
| 'appendMenuBarItem: label must not be empty' | [packages/desktop/src/semantics/menu-bar.ts](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/menu-bar.ts#L65) |
| &#96;appendMenuBarItem: duplicate id $&#123;item.id&#125;&#96; | [packages/desktop/src/semantics/menu-bar.ts](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/menu-bar.ts#L67) |
| 'clickMenuBarItem: menu destroyed' | [packages/desktop/src/semantics/menu-bar.ts](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/menu-bar.ts#L83) |
| &#96;clickMenuBarItem: item $&#123;itemId&#125; not found&#96; | [packages/desktop/src/semantics/menu-bar.ts](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/menu-bar.ts#L85) |
| 'destroyMenuBar: already destroyed' | [packages/desktop/src/semantics/menu-bar.ts](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/menu-bar.ts#L96) |
| 'dismissNotification: notification not displayed' | [packages/desktop/src/semantics/notification.ts](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/notification.ts#L110) |
| 'scheduleNotification: notificationId must not be empty' | [packages/desktop/src/semantics/notification.ts](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/notification.ts#L52) |
| 'scheduleNotification: title must not be empty' | [packages/desktop/src/semantics/notification.ts](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/notification.ts#L54) |
| 'scheduleNotification: scheduledAtMs must be non-negative' | [packages/desktop/src/semantics/notification.ts](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/notification.ts#L55) |
| 'displayNotification: not scheduled' | [packages/desktop/src/semantics/notification.ts](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/notification.ts#L78) |
| 'displayNotification: displayedAtMs must be &gt;= scheduledAtMs' | [packages/desktop/src/semantics/notification.ts](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/notification.ts#L80) |
| 'invokeNotificationAction: notification not displayed' | [packages/desktop/src/semantics/notification.ts](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/notification.ts#L95) |
| 'invokeNotificationAction: actionId must not be empty' | [packages/desktop/src/semantics/notification.ts](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/notification.ts#L97) |
| 'stopScreenRecording: already stopped' | [packages/desktop/src/semantics/screen-recording.ts](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/screen-recording.ts#L100) |
| 'requestScreenRecordingPermission: sessionId must not be empty' | [packages/desktop/src/semantics/screen-recording.ts](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/screen-recording.ts#L49) |
| 'requestScreenRecordingPermission: displayId must not be empty' | [packages/desktop/src/semantics/screen-recording.ts](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/screen-recording.ts#L50) |
| 'startScreenRecording: permission not requested' | [packages/desktop/src/semantics/screen-recording.ts](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/screen-recording.ts#L70) |
| 'startScreenRecording: permission denied' | [packages/desktop/src/semantics/screen-recording.ts](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/screen-recording.ts#L72) |
| 'captureScreenChunk: not recording' | [packages/desktop/src/semantics/screen-recording.ts](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/screen-recording.ts#L83) |
| 'captureScreenChunk: chunkBytes must be non-negative' | [packages/desktop/src/semantics/screen-recording.ts](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/screen-recording.ts#L85) |
| 'stopScreenRecording: recording not started' | [packages/desktop/src/semantics/screen-recording.ts](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/screen-recording.ts#L98) |
| 'startTauriApp: appName must not be empty' | [packages/desktop/src/semantics/tauri.ts](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/tauri.ts#L38) |
| 'registerTauriCommand: commandName must not be empty' | [packages/desktop/src/semantics/tauri.ts](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/tauri.ts#L51) |
| &#96;invokeTauriCommand: $&#123;input.commandName&#125; not registered&#96; | [packages/desktop/src/semantics/tauri.ts](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/tauri.ts#L65) |
| 'emitTauriEvent: eventName must not be empty' | [packages/desktop/src/semantics/tauri.ts](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/tauri.ts#L80) |
| 'closeTauriWindow: windowLabel must not be empty' | [packages/desktop/src/semantics/tauri.ts](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/tauri.ts#L91) |
| 'createTrayIcon: trayId must not be empty' | [packages/desktop/src/semantics/tray-icon.ts](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/tray-icon.ts#L44) |
| 'createTrayIcon: iconPath must not be empty' | [packages/desktop/src/semantics/tray-icon.ts](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/tray-icon.ts#L45) |
| 'updateTrayTooltip: tray removed' | [packages/desktop/src/semantics/tray-icon.ts](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/tray-icon.ts#L67) |
| 'updateTrayTooltip: tooltip must not be empty' | [packages/desktop/src/semantics/tray-icon.ts](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/tray-icon.ts#L68) |
| 'clickTrayIcon: tray removed' | [packages/desktop/src/semantics/tray-icon.ts](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/tray-icon.ts#L78) |
| 'removeTrayIcon: already removed' | [packages/desktop/src/semantics/tray-icon.ts](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/tray-icon.ts#L88) |
| 'loadPreloadScript: webviewId must not be empty' | [packages/desktop/src/semantics/webview.ts](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/webview.ts#L38) |
| 'bindContextBridge: preload not loaded' | [packages/desktop/src/semantics/webview.ts](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/webview.ts#L53) |
| 'bindContextBridge: apiName must not be empty' | [packages/desktop/src/semantics/webview.ts](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/webview.ts#L54) |
| 'postWebviewMessage: preload not loaded' | [packages/desktop/src/semantics/webview.ts](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/webview.ts#L67) |
| 'postWebviewMessage: channel must not be empty' | [packages/desktop/src/semantics/webview.ts](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/webview.ts#L68) |

## API 契約

この section は [公開 entry point](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/index.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

### 値

#### `appendMenuBarItem`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/menu-bar.ts#L59) `packages/desktop/src/semantics/menu-bar.ts`

```ts
export declare function appendMenuBarItem(session: MenuBarSession, item: MenuBarItem): AxisStep<MenuBarState>;
```

#### `applyDownloadedUpdate`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/auto-updater.ts#L79) `packages/desktop/src/semantics/auto-updater.ts`

```ts
export declare function applyDownloadedUpdate(session: AutoUpdaterSession): AxisStep<AutoUpdaterState>;
```

#### `assertContextIsolation`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/webview.ts#L78) `packages/desktop/src/semantics/webview.ts`

```ts
export declare function assertContextIsolation(session: WebviewSession, isolated: boolean): AxisStep<WebviewState>;
```

#### `bindContextBridge`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/webview.ts#L52) `packages/desktop/src/semantics/webview.ts`

```ts
export declare function bindContextBridge(session: WebviewSession, apiName: string): AxisStep<WebviewState>;
```

#### `buildCacheKey`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/adapters/invoke-cache.ts#L58) `packages/desktop/src/adapters/invoke-cache.ts`

axis + target + args を 決定的 に key 化 する SSOT helper。 args は 順序を 保持 (spawn 引数 の semantics 依存)、 env は cache key に 含めない (env は sanitize 済 で spawn 副作用のみ、 result semantics に 影響しない 前提、 v1.62 real behavior SSOT に 準拠)。

```ts
export declare function buildCacheKey(input: {
    axis: DesktopAxis;
    target: DesktopTarget;
    args?: string[];
}): string;
```

#### `buildMenuBar`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/menu-bar.ts#L44) `packages/desktop/src/semantics/menu-bar.ts`

```ts
export declare function buildMenuBar(input: {
    target: DesktopTarget;
    menuId: string;
}): MenuBarSession;
```

#### `buildSpawnInvocation`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/adapters/spawn-driver.ts#L121) `packages/desktop/src/adapters/spawn-driver.ts`

```ts
export declare function buildSpawnInvocation(input: {
    command: DesktopCliCommand;
    args?: string[];
    env?: Record<string, string>;
    cwd?: string;
}): SpawnInvocation;
```

#### `captureScreenChunk`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/screen-recording.ts#L78) `packages/desktop/src/semantics/screen-recording.ts`

```ts
export declare function captureScreenChunk(session: ScreenRecordingSession, chunkBytes: number): AxisStep<ScreenRecordingState>;
```

#### `clearAllGlobalShortcuts`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/global-shortcut.ts#L106) `packages/desktop/src/semantics/global-shortcut.ts`

```ts
export declare function clearAllGlobalShortcuts(session: GlobalShortcutSession): AxisStep<GlobalShortcutState>;
```

#### `clearClipboard`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/clipboard.ts#L95) `packages/desktop/src/semantics/clipboard.ts`

```ts
export declare function clearClipboard(session: ClipboardSession): AxisStep<ClipboardState>;
```

#### `clickMenuBarItem`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/menu-bar.ts#L79) `packages/desktop/src/semantics/menu-bar.ts`

```ts
export declare function clickMenuBarItem(session: MenuBarSession, itemId: string): AxisStep<MenuBarState>;
```

#### `clickTrayIcon`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/tray-icon.ts#L77) `packages/desktop/src/semantics/tray-icon.ts`

```ts
export declare function clickTrayIcon(session: TrayIconSession): AxisStep<TrayIconState>;
```

#### `cliForAxis`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/adapters/spawn-driver.ts#L117) `packages/desktop/src/adapters/spawn-driver.ts`

```ts
export declare function cliForAxis(axis: DesktopAxis): DesktopCliCommand | null;
```

#### `closeTauriWindow`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/tauri.ts#L90) `packages/desktop/src/semantics/tauri.ts`

```ts
export declare function closeTauriWindow(session: TauriSession, windowLabel: string): AxisStep<TauriState>;
```

#### `collectFidelityCoverage`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/fidelity.ts#L94) `packages/desktop/src/semantics/fidelity.ts`

```ts
export declare function collectFidelityCoverage(providers?: DesktopTarget[]): FidelityCoverage;
```

#### `computeSkipMatrix`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/adapters/probe.ts#L169) `packages/desktop/src/adapters/probe.ts`

全 12 axis × 3 target の skip decision matrix を計算。 v0.8 fidelity harness で skip した pair を追跡するのに使用。

```ts
export declare function computeSkipMatrix(): {
    axis: DesktopAxis;
    target: DesktopTarget;
    skip: boolean;
    reason: string | null;
}[];
```

#### `createBrowserWindow`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/electron.ts#L50) `packages/desktop/src/semantics/electron.ts`

```ts
export declare function createBrowserWindow(session: ElectronSession, windowId: string): AxisStep<ElectronState>;
```

#### `createGlobalShortcutSession`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/global-shortcut.ts#L42) `packages/desktop/src/semantics/global-shortcut.ts`

```ts
export declare function createGlobalShortcutSession(input: {
    target: DesktopTarget;
    namespace: string;
}): GlobalShortcutSession;
```

#### `createTrayIcon`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/tray-icon.ts#L39) `packages/desktop/src/semantics/tray-icon.ts`

```ts
export declare function createTrayIcon(input: {
    target: DesktopTarget;
    trayId: string;
    iconPath: string;
}): TrayIconSession;
```

#### `DESKTOP_AXIS_TO_EVENTS`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/fidelity.ts#L16) `packages/desktop/src/semantics/fidelity.ts`

```ts
export declare const DESKTOP_AXIS_TO_EVENTS: Record<DesktopAxis, NeutralEventName[]>;
```

#### `destroyMenuBar`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/menu-bar.ts#L95) `packages/desktop/src/semantics/menu-bar.ts`

```ts
export declare function destroyMenuBar(session: MenuBarSession): AxisStep<MenuBarState>;
```

#### `dismissNotification`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/notification.ts#L106) `packages/desktop/src/semantics/notification.ts`

```ts
export declare function dismissNotification(session: NotificationSession): AxisStep<NotificationState>;
```

#### `dispatchIpcMessage`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/electron.ts#L61) `packages/desktop/src/semantics/electron.ts`

```ts
export declare function dispatchIpcMessage(session: ElectronSession, input: {
    channel: string;
    payload: string;
}): AxisStep<ElectronState>;
```

#### `displayNotification`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/notification.ts#L74) `packages/desktop/src/semantics/notification.ts`

```ts
export declare function displayNotification(session: NotificationSession, displayedAtMs: number): AxisStep<NotificationState>;
```

#### `emitTauriEvent`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/tauri.ts#L76) `packages/desktop/src/semantics/tauri.ts`

```ts
export declare function emitTauriEvent(session: TauriSession, input: {
    eventName: string;
    payload: string;
}): AxisStep<TauriState>;
```

#### `executeSpawn`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/adapters/spawn-executor.ts#L57) `packages/desktop/src/adapters/spawn-executor.ts`

```ts
export declare function executeSpawn(input: SpawnExecutorInput, spawnFn?: SpawnFn): Promise<SpawnExecutorResult>;
```

#### `grantFsPermission`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/fs-permissions.ts#L59) `packages/desktop/src/semantics/fs-permissions.ts`

```ts
export declare function grantFsPermission(session: FsPermissionsSession, scope: FsPermissionScope): AxisStep<FsPermissionsState>;
```

#### `InvokeCache`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/adapters/invoke-cache.ts#L75) `packages/desktop/src/adapters/invoke-cache.ts`

v1.0 InvokeCache class = LRU + TTL 両立 の in-memory cache。 test で new InvokeCache() 直接生成、 dogfood consumer は withCache helper を使う。 LRU 実装 = Map の insertion order (JS spec で保証) を再挿入 で 更新、 eviction 時は 最古 key を 削除。 TTL 判定 は get 時に entry.capturedAt + ttlMs を 現在時刻 と 比較。

```ts
/**
 * v1.0 InvokeCache class = LRU + TTL 両立 の in-memory cache。 test で
 * new InvokeCache() 直接生成、 dogfood consumer は withCache helper を使う。
 *
 * LRU 実装 = Map の insertion order (JS spec で保証) を再挿入 で 更新、
 * eviction 時は 最古 key を 削除。 TTL 判定 は get 時に entry.capturedAt +
 * ttlMs を 現在時刻 と 比較。
 */
export declare class InvokeCache {
    constructor(config?: InvokeCacheConfig, clock?: () => number);
    /** cache 全体 の enable 状態。 disabled なら 全 op で cache-disabled 返却。 */
    isEnabled(): boolean;
    /** cache 現状 の entry 数、 test / dogfood consumer で observability に使う。 */
    size(): number;
    /** 内部 clock を dogfood consumer に 露出、 withCache helper が 使用。 */
    getClockValue(): number;
    /**
     * cache から 取り出す。 TTL 超過 は cache-invalidated として entry 削除 +
     * null 返却、 未 hit は null 返却、 hit は entry を Map 末尾に 再挿入 (LRU)。
     */
    get(key: string): {
        entry: CachedInvokeEntry;
        status: 'cache-hit';
    } | {
        status: 'cache-miss' | 'cache-invalidated' | 'cache-disabled';
    };
    /** cache に 書込 む。 maxEntries 超過 時 は 最古 (Map 先頭) を evict。 */
    set(key: string, result: NativeInvokeResult): CachedInvokeEntry;
    /** 手動 invalidate、 特定 key の entry を 削除。 存在しない key は no-op。 */
    invalidate(key: string): boolean;
    /** cache 全体 clear、 dogfood 経路 で release 前 に 呼出。 */
    clear(): void;
}
```

#### `invokeDesktopCli`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/adapters/spawn-driver.ts#L62) `packages/desktop/src/adapters/spawn-driver.ts`

v0.6 実 spawn 実行 = env-gate 通過確認 + args 上限 32 + 実 child_process.spawn 実行。 `KIWA_DESKTOP_MODE=real` + 対応 axis env 未設定なら throw で fail-closed。 `KIWA_DESKTOP_SPAWN=dry-run` の時は v0.5 stub 相当の shape 契約を返す (実 CLI 未 install 環境向け backward compat 経路)。

```ts
export declare function invokeDesktopCli(inv: SpawnInvocation): Promise<SpawnResult>;
```

#### `invokeDesktopCliWith`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/adapters/spawn-driver.ts#L70) `packages/desktop/src/adapters/spawn-driver.ts`

DI 経路 = spawnFn を注入可能、 test で dummy spawn を差し込んで 決定的挙動を検証できる。 default は nodeSpawn。

```ts
export declare function invokeDesktopCliWith(inv: SpawnInvocation, spawnFn: SpawnFn): Promise<SpawnResult>;
```

#### `invokeNotificationAction`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/notification.ts#L90) `packages/desktop/src/semantics/notification.ts`

```ts
export declare function invokeNotificationAction(session: NotificationSession, actionId: string): AxisStep<NotificationState>;
```

#### `invokeTauriCommand`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/tauri.ts#L60) `packages/desktop/src/semantics/tauri.ts`

```ts
export declare function invokeTauriCommand(session: TauriSession, input: {
    commandName: string;
    payload: string;
}): AxisStep<TauriState>;
```

#### `loadPreloadScript`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/webview.ts#L37) `packages/desktop/src/semantics/webview.ts`

```ts
export declare function loadPreloadScript(input: {
    target: DesktopTarget;
    webviewId: string;
}): WebviewSession;
```

#### `logFsPermissionAudit`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/fs-permissions.ts#L87) `packages/desktop/src/semantics/fs-permissions.ts`

```ts
export declare function logFsPermissionAudit(session: FsPermissionsSession, reason: string): AxisStep<FsPermissionsState>;
```

#### `makeMockAdapter`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/adapters/mock-factory.ts#L247) `packages/desktop/src/adapters/mock-factory.ts`

```ts
export declare function makeMockAdapter(axis: DesktopAxis): DesktopAdapter;
```

#### `makeRealAdapter`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/adapters/mock-factory.ts#L256) `packages/desktop/src/adapters/mock-factory.ts`

```ts
export declare function makeRealAdapter(axis: DesktopAxis): DesktopAdapter;
```

#### `MOCK_ADAPTERS`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/adapters/mock-factory.ts#L282) `packages/desktop/src/adapters/mock-factory.ts`

```ts
export declare const MOCK_ADAPTERS: Record<DesktopAxis, DesktopAdapter>;
```

#### `notifyClipboardChange`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/clipboard.ts#L81) `packages/desktop/src/semantics/clipboard.ts`

```ts
export declare function notifyClipboardChange(session: ClipboardSession, externalContents: string): AxisStep<ClipboardState>;
```

#### `notifyThemeChange`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/dark-mode.ts#L64) `packages/desktop/src/semantics/dark-mode.ts`

```ts
export declare function notifyThemeChange(session: DarkModeSession, newTheme: ThemeMode): AxisStep<DarkModeState>;
```

#### `openClipboard`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/clipboard.ts#L40) `packages/desktop/src/semantics/clipboard.ts`

```ts
export declare function openClipboard(input: {
    target: DesktopTarget;
    clipboardId: string;
}): ClipboardSession;
```

#### `platformGate`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/adapters/probe.ts#L44) `packages/desktop/src/adapters/probe.ts`

DesktopTarget と NodePlatform の互換性 gate。 macOS target = darwin のみ、 windows target = win32 のみ、 linux target = linux のみ。

```ts
export declare function platformGate(target: DesktopTarget): PlatformGate;
```

#### `postWebviewMessage`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/webview.ts#L63) `packages/desktop/src/semantics/webview.ts`

```ts
export declare function postWebviewMessage(session: WebviewSession, input: {
    channel: string;
    payload: string;
}): AxisStep<WebviewState>;
```

#### `probeAndInvoke`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/adapters/native-invoke.ts#L46) `packages/desktop/src/adapters/native-invoke.ts`

probeAndInvoke = probe + invoke 統合経路。 1. shouldSkipAxis(axis, target) = skip 判定 → 'axis-skipped' 2. cliForAxis(axis) = null (semantics-only axis) → 'no-cli-mapping' 3. probeCliAvailable(cmd) = 実 CLI 存在確認 → 未 install 時 'cli-unavailable' 4. 実 CLI 存在確認 OK → invokeDesktopCliWith で 実 spawn 呼出 → 'invoked' shape 契約 preserving = SpawnResult 構造保持、 skip 時は spawnResult=null で明示。

```ts
export declare function probeAndInvoke(input: NativeInvokeInput): Promise<NativeInvokeResult>;
```

#### `probeAndInvokeAll`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/adapters/native-invoke.ts#L118) `packages/desktop/src/adapters/native-invoke.ts`

```ts
export declare function probeAndInvokeAll(input?: {
    axes?: DesktopAxis[];
    targets?: DesktopTarget[];
    args?: string[];
    env?: Record<string, string>;
    spawnFn?: SpawnFn;
}): Promise<NativeInvokeMatrixSummary>;
```

#### `probeCliAvailable`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/adapters/probe.ts#L65) `packages/desktop/src/adapters/probe.ts`

CLI availability probe = which (unix) / where (windows) で CLI 存在確認。 DI 経路 = spawnFn 注入で test 環境で decode 可能。

```ts
export declare function probeCliAvailable(input: ProbeInput): Promise<ProbeResult>;
```

#### `providerEventName`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/types.ts#L278) `packages/desktop/src/semantics/types.ts`

```ts
export declare function providerEventName(target: DesktopTarget, neutral: NeutralEventName): string;
```

#### `quitElectronApp`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/electron.ts#L76) `packages/desktop/src/semantics/electron.ts`

```ts
export declare function quitElectronApp(session: ElectronSession): AxisStep<ElectronState>;
```

#### `readClipboard`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/clipboard.ts#L72) `packages/desktop/src/semantics/clipboard.ts`

```ts
export declare function readClipboard(session: ClipboardSession): AxisStep<ClipboardState>;
```

#### `REAL_ADAPTERS`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/adapters/mock-factory.ts#L290) `packages/desktop/src/adapters/mock-factory.ts`

```ts
export declare const REAL_ADAPTERS: Record<DesktopAxis, DesktopAdapter>;
```

#### `REAL_AXIS_RUNNERS`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/adapters/real-runner.ts#L254) `packages/desktop/src/adapters/real-runner.ts`

```ts
export declare const REAL_AXIS_RUNNERS: Record<DesktopAxis, (inv: AdapterInvocation) => Promise<AdapterResult>>;
```

#### `recordUpdateDownloaded`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/auto-updater.ts#L63) `packages/desktop/src/semantics/auto-updater.ts`

```ts
export declare function recordUpdateDownloaded(session: AutoUpdaterSession, input: {
    version: string;
    bytes: number;
}): AxisStep<AutoUpdaterState>;
```

#### `recordUserPreference`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/dark-mode.ts#L83) `packages/desktop/src/semantics/dark-mode.ts`

```ts
export declare function recordUserPreference(session: DarkModeSession, preference: ThemeMode): AxisStep<DarkModeState>;
```

#### `registerGlobalShortcut`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/global-shortcut.ts#L57) `packages/desktop/src/semantics/global-shortcut.ts`

```ts
export declare function registerGlobalShortcut(session: GlobalShortcutSession, accelerator: string): AxisStep<GlobalShortcutState>;
```

#### `registerTauriCommand`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/tauri.ts#L50) `packages/desktop/src/semantics/tauri.ts`

```ts
export declare function registerTauriCommand(session: TauriSession, commandName: string): AxisStep<TauriState>;
```

#### `removeTrayIcon`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/tray-icon.ts#L87) `packages/desktop/src/semantics/tray-icon.ts`

```ts
export declare function removeTrayIcon(session: TrayIconSession): AxisStep<TrayIconState>;
```

#### `requestFsPermission`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/fs-permissions.ts#L40) `packages/desktop/src/semantics/fs-permissions.ts`

```ts
export declare function requestFsPermission(input: {
    target: DesktopTarget;
    path: string;
    scope: FsPermissionScope;
}): FsPermissionsSession;
```

#### `requestScreenRecordingPermission`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/screen-recording.ts#L44) `packages/desktop/src/semantics/screen-recording.ts`

```ts
export declare function requestScreenRecordingPermission(input: {
    target: DesktopTarget;
    sessionId: string;
    displayId: string;
}): ScreenRecordingSession;
```

#### `revokeFsPermission`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/fs-permissions.ts#L72) `packages/desktop/src/semantics/fs-permissions.ts`

```ts
export declare function revokeFsPermission(session: FsPermissionsSession, scope: FsPermissionScope): AxisStep<FsPermissionsState>;
```

#### `runFidelityCheck`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/adapters/fidelity-harness.ts#L89) `packages/desktop/src/adapters/fidelity-harness.ts`

```ts
export declare function runFidelityCheck(input: {
    scanIdPrefix?: string;
    axes?: DesktopAxis[];
    targets?: DesktopTarget[];
}): Promise<FidelityDiff[]>;
```

#### `runFidelityCheckWithProbe`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/adapters/fidelity-harness.ts#L186) `packages/desktop/src/adapters/fidelity-harness.ts`

```ts
export declare function runFidelityCheckWithProbe(input: {
    scanIdPrefix?: string;
    axes?: DesktopAxis[];
    targets?: DesktopTarget[];
}): Promise<FidelityCheckWithProbeResult>;
```

#### `sanitizeEnv`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/adapters/spawn-executor.ts#L45) `packages/desktop/src/adapters/spawn-executor.ts`

```ts
export declare function sanitizeEnv(command: DesktopCliCommand, env: Record<string, string>): Record<string, string>;
```

#### `scheduleNotification`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/notification.ts#L45) `packages/desktop/src/semantics/notification.ts`

```ts
export declare function scheduleNotification(input: {
    target: DesktopTarget;
    notificationId: string;
    title: string;
    scheduledAtMs: number;
}): NotificationSession;
```

#### `scheduleRelaunch`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/auto-updater.ts#L91) `packages/desktop/src/semantics/auto-updater.ts`

```ts
export declare function scheduleRelaunch(session: AutoUpdaterSession, delayMs: number): AxisStep<AutoUpdaterState>;
```

#### `shouldSkipAxis`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/adapters/probe.ts#L121) `packages/desktop/src/adapters/probe.ts`

axis + target の組合せで skip 判定。 platform-specific CLI (osascript = darwin only / defaults = darwin only / reg = win32 only) は 該当 platform 以外の target で常に skip。

```ts
export declare function shouldSkipAxis(axis: DesktopAxis, target: DesktopTarget): {
    skip: boolean;
    reason: string | null;
};
```

#### `startAutoUpdaterCheck`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/auto-updater.ts#L44) `packages/desktop/src/semantics/auto-updater.ts`

```ts
export declare function startAutoUpdaterCheck(input: {
    target: DesktopTarget;
    channel: string;
}): AutoUpdaterSession;
```

#### `startElectronApp`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/electron.ts#L36) `packages/desktop/src/semantics/electron.ts`

```ts
export declare function startElectronApp(input: {
    target: DesktopTarget;
    appId: string;
}): ElectronSession;
```

#### `startScreenRecording`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/screen-recording.ts#L65) `packages/desktop/src/semantics/screen-recording.ts`

```ts
export declare function startScreenRecording(session: ScreenRecordingSession, granted: boolean): AxisStep<ScreenRecordingState>;
```

#### `startTauriApp`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/tauri.ts#L37) `packages/desktop/src/semantics/tauri.ts`

```ts
export declare function startTauriApp(input: {
    target: DesktopTarget;
    appName: string;
}): TauriSession;
```

#### `stopScreenRecording`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/screen-recording.ts#L96) `packages/desktop/src/semantics/screen-recording.ts`

```ts
export declare function stopScreenRecording(session: ScreenRecordingSession): AxisStep<ScreenRecordingState>;
```

#### `subscribeDarkMode`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/dark-mode.ts#L45) `packages/desktop/src/semantics/dark-mode.ts`

```ts
export declare function subscribeDarkMode(input: {
    target: DesktopTarget;
    observerId: string;
    initialTheme: ThemeMode;
}): DarkModeSession;
```

#### `summarizeFidelity`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/adapters/fidelity-harness.ts#L130) `packages/desktop/src/adapters/fidelity-harness.ts`

```ts
export declare function summarizeFidelity(diffs: FidelityDiff[]): FidelitySummary;
```

#### `summarizeFidelityBehaviorDiff`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/adapters/fidelity-harness.ts#L226) `packages/desktop/src/adapters/fidelity-harness.ts`

```ts
export declare function summarizeFidelityBehaviorDiff(diffs: FidelityDiff[]): FidelityBehaviorSummary;
```

#### `triggerGlobalShortcut`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/global-shortcut.ts#L75) `packages/desktop/src/semantics/global-shortcut.ts`

```ts
export declare function triggerGlobalShortcut(session: GlobalShortcutSession, accelerator: string): AxisStep<GlobalShortcutState>;
```

#### `unregisterGlobalShortcut`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/global-shortcut.ts#L90) `packages/desktop/src/semantics/global-shortcut.ts`

```ts
export declare function unregisterGlobalShortcut(session: GlobalShortcutSession, accelerator: string): AxisStep<GlobalShortcutState>;
```

#### `unsubscribeDarkMode`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/dark-mode.ts#L98) `packages/desktop/src/semantics/dark-mode.ts`

```ts
export declare function unsubscribeDarkMode(session: DarkModeSession): AxisStep<DarkModeState>;
```

#### `updateTrayTooltip`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/tray-icon.ts#L63) `packages/desktop/src/semantics/tray-icon.ts`

```ts
export declare function updateTrayTooltip(session: TrayIconSession, tooltip: string): AxisStep<TrayIconState>;
```

#### `withCache`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/adapters/invoke-cache.ts#L167) `packages/desktop/src/adapters/invoke-cache.ts`

withCache = probeAndInvoke を cache 経由 で 呼出す 統合 helper。 cache-miss / cache-invalidated / cache-disabled 時 は 実 probeAndInvoke を 実行 して 結果 を cache に 書込む、 cache-hit 時 は そのまま 返却。 shape 契約 preserving = NativeInvokeResult は そのまま 保持、 cache 経由 判定 は cacheStatus field で 別軸 露出。 dogfood consumer は invokeResult を 触るだけ で v0.9 相当 の 動作、 cacheStatus は observability 目的。

```ts
export declare function withCache(input: {
    cache: InvokeCache;
    invokeInput: NativeInvokeInput;
}): Promise<CachedNativeInvokeResult>;
```

#### `writeClipboard`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/clipboard.ts#L56) `packages/desktop/src/semantics/clipboard.ts`

```ts
export declare function writeClipboard(session: ClipboardSession, input: {
    contents: string;
    format: ClipboardFormat;
}): AxisStep<ClipboardState>;
```

### 型

#### `AdapterInvocation`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/adapters/types.ts#L20) `packages/desktop/src/adapters/types.ts`

```ts
export interface AdapterInvocation {
    scanId: string;
    target: DesktopTarget;
    mode: AdapterMode;
    metadata?: Record<string, string | number | boolean>;
}
```

#### `AdapterMode`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/adapters/types.ts#L12) `packages/desktop/src/adapters/types.ts`

```ts
export type AdapterMode = 'mock' | 'real';
```

#### `AdapterResult`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/adapters/types.ts#L27) `packages/desktop/src/adapters/types.ts`

```ts
export interface AdapterResult {
    axis: DesktopAxis;
    target: DesktopTarget;
    mode: AdapterMode;
    completed: boolean;
    eventCount: number;
    durationMs: number;
    history: AxisStep<string>[];
    neutralEvents: NeutralEventName[];
}
```

#### `AutoUpdaterSession`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/auto-updater.ts#L14) `packages/desktop/src/semantics/auto-updater.ts`

```ts
export interface AutoUpdaterSession {
    target: DesktopTarget;
    channel: string;
    state: AutoUpdaterState;
    latestVersion: string | null;
    downloadedBytes: number;
    applied: boolean;
    relaunchDelayMs: number;
    history: AxisStep<AutoUpdaterState>[];
}
```

#### `AutoUpdaterState`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/auto-updater.ts#L7) `packages/desktop/src/semantics/auto-updater.ts`

Auto-updater axis (v0.2) — check + download + apply + relaunch の 4 step 状態遷移。 Squirrel.Mac / Squirrel.Windows / AppImage の 3 target を uniform state machine で扱う。

```ts
export type AutoUpdaterState = 'idle' | 'check-started' | 'update-downloaded' | 'update-applied' | 'relaunch-scheduled';
```

#### `AxisStep`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/types.ts#L88) `packages/desktop/src/semantics/types.ts`

```ts
export interface AxisStep<TState extends string> {
    neutralEvent: NeutralEventName;
    providerEvent: string;
    state: TState;
    metadata: Record<string, string | number | boolean>;
}
```

#### `CachedInvokeEntry`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/adapters/invoke-cache.ts#L24) `packages/desktop/src/adapters/invoke-cache.ts`

cache 済 invoke 結果 の envelope、 TTL 判定 用 の capturedAt 保持。

```ts
export interface CachedInvokeEntry {
    key: string;
    capturedAt: number;
    result: NativeInvokeResult;
}
```

#### `CachedNativeInvokeResult`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/adapters/invoke-cache.ts#L31) `packages/desktop/src/adapters/invoke-cache.ts`

v1.0 invoke-cache の 結果、 NativeInvokeResult 拡張 additive。

```ts
export interface CachedNativeInvokeResult {
    invokeResult: NativeInvokeResult;
    cacheStatus: CacheStatus;
    cacheKey: string;
    cachedAt: number | null;
    cacheAgeMs: number | null;
}
```

#### `CacheStatus`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/adapters/invoke-cache.ts#L21) `packages/desktop/src/adapters/invoke-cache.ts`

```ts
export type CacheStatus = 'cache-hit' | 'cache-miss' | 'cache-invalidated' | 'cache-disabled';
```

#### `ClipboardFormat`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/clipboard.ts#L9) `packages/desktop/src/semantics/clipboard.ts`

```ts
export type ClipboardFormat = 'text' | 'html' | 'image' | 'file-list';
```

#### `ClipboardSession`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/clipboard.ts#L11) `packages/desktop/src/semantics/clipboard.ts`

```ts
export interface ClipboardSession {
    target: DesktopTarget;
    clipboardId: string;
    state: ClipboardState;
    contents: string | null;
    format: ClipboardFormat | null;
    changeCount: number;
    history: AxisStep<ClipboardState>[];
}
```

#### `ClipboardState`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/clipboard.ts#L7) `packages/desktop/src/semantics/clipboard.ts`

Clipboard axis (v0.3) — write + read + change + clear の 4 step 遷移。 macOS NSPasteboard + Windows OpenClipboard + Linux gtk_clipboard を uniform 扱い。

```ts
export type ClipboardState = 'idle' | 'written' | 'read' | 'changed' | 'cleared';
```

#### `DarkModeSession`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/dark-mode.ts#L16) `packages/desktop/src/semantics/dark-mode.ts`

```ts
export interface DarkModeSession {
    target: DesktopTarget;
    observerId: string;
    state: DarkModeState;
    currentTheme: ThemeMode;
    userPreference: ThemeMode;
    changeCount: number;
    history: AxisStep<DarkModeState>[];
}
```

#### `DarkModeState`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/dark-mode.ts#L7) `packages/desktop/src/semantics/dark-mode.ts`

Dark-mode axis (v0.3) — subscribe + theme-change + user-preferred + unsubscribe の 4 step 遷移。 macOS AppleInterfaceTheme + Windows ImmersiveColorSet + Linux xdg-portal Settings color-scheme を uniform 扱い。

```ts
export type DarkModeState = 'idle' | 'subscribed' | 'theme-changed' | 'user-preferred' | 'unsubscribed';
```

#### `DesktopAdapter`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/adapters/types.ts#L38) `packages/desktop/src/adapters/types.ts`

```ts
export interface DesktopAdapter {
    axis: DesktopAxis;
    scan(input: AdapterInvocation): Promise<AdapterResult>;
}
```

#### `DesktopAxis`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/types.ts#L12) `packages/desktop/src/semantics/types.ts`

```ts
export type DesktopAxis = 'electron' | 'tauri' | 'webview' | 'auto-updater' | 'fs-permissions' | 'notification' | 'menu-bar' | 'tray-icon' | 'screen-recording' | 'global-shortcut' | 'clipboard' | 'dark-mode';
```

#### `DesktopCliCommand`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/adapters/spawn-driver.ts#L14) `packages/desktop/src/adapters/spawn-driver.ts`

```ts
export type DesktopCliCommand = 'electron-builder' | 'electron-updater' | 'ffmpeg' | 'xclip' | 'osascript' | 'notify-send' | 'defaults' | 'reg';
```

#### `DesktopTarget`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/types.ts#L10) `packages/desktop/src/semantics/types.ts`

```ts
export type DesktopTarget = 'macos' | 'windows' | 'linux';
```

#### `ElectronSession`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/electron.ts#L8) `packages/desktop/src/semantics/electron.ts`

```ts
export interface ElectronSession {
    target: DesktopTarget;
    appId: string;
    state: ElectronState;
    windowIds: string[];
    ipcMessages: number;
    history: AxisStep<ElectronState>[];
}
```

#### `ElectronState`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/electron.ts#L6) `packages/desktop/src/semantics/electron.ts`

Electron axis — app.ready + BrowserWindow.create + ipcMain.on + app.quit の 4 step。

```ts
export type ElectronState = 'idle' | 'app-ready' | 'window-created' | 'ipc-dispatched' | 'quit';
```

#### `FidelityBehaviorSummary`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/adapters/fidelity-harness.ts#L156) `packages/desktop/src/adapters/fidelity-harness.ts`

v0.7 behavior diff summary — shape 契約 preserving (matched=true) を保ったまま、 mock/real で異なる behavior (metadata + duration) を per-axis で集計。 v1.62+ real 実装後の behavior drift を early warning 検知する経路。

```ts
export interface FidelityBehaviorSummary {
    total: number;
    axesWithBehaviorDiff: DesktopAxis[];
    totalMetadataDiffs: number;
    perAxis: Record<DesktopAxis, {
        metadataDiffCount: number;
        maxDurationDiffMs: number;
        hasBehaviorDiff: boolean;
    }>;
}
```

#### `FidelityCheckWithProbeResult`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/adapters/fidelity-harness.ts#L181) `packages/desktop/src/adapters/fidelity-harness.ts`

```ts
export interface FidelityCheckWithProbeResult {
    diffs: FidelityDiff[];
    skippedPairs: SkippedPair[];
}
```

#### `FidelityCoverage`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/fidelity.ts#L10) `packages/desktop/src/semantics/fidelity.ts`

```ts
export interface FidelityCoverage {
    providers: DesktopTarget[];
    axes: DesktopAxis[];
    rows: FidelityRow[];
}
```

#### `FidelityDiff`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/adapters/fidelity-harness.ts#L14) `packages/desktop/src/adapters/fidelity-harness.ts`

```ts
export interface FidelityDiff {
    axis: DesktopAxis;
    target: DesktopTarget;
    mockEvents: NeutralEventName[];
    realEvents: NeutralEventName[];
    matched: boolean;
    mockCompleted: boolean;
    realCompleted: boolean;
    /** v0.7: mock/real の metadata 差異検知 (step 別) */
    metadataDiffs: MetadataDiff[];
    /** v0.7: mock/real の duration 差異 (絶対値 ms) */
    durationDiffMs: number;
}
```

#### `FidelityRow`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/fidelity.ts#L3) `packages/desktop/src/semantics/fidelity.ts`

```ts
export interface FidelityRow {
    provider: DesktopTarget;
    axis: DesktopAxis;
    neutralEvents: NeutralEventName[];
    providerEvents: string[];
}
```

#### `FidelitySummary`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/adapters/fidelity-harness.ts#L122) `packages/desktop/src/adapters/fidelity-harness.ts`

```ts
export interface FidelitySummary {
    total: number;
    matched: number;
    unmatched: number;
    matchedRatio: number;
    perAxis: Record<DesktopAxis, {
        matched: number;
        total: number;
    }>;
}
```

#### `FsPermissionScope`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/fs-permissions.ts#L9) `packages/desktop/src/semantics/fs-permissions.ts`

```ts
export type FsPermissionScope = 'read' | 'write' | 'read-write' | 'execute';
```

#### `FsPermissionsSession`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/fs-permissions.ts#L11) `packages/desktop/src/semantics/fs-permissions.ts`

```ts
export interface FsPermissionsSession {
    target: DesktopTarget;
    path: string;
    scope: FsPermissionScope;
    state: FsPermissionsState;
    grantedScopes: FsPermissionScope[];
    auditEntries: number;
    history: AxisStep<FsPermissionsState>[];
}
```

#### `FsPermissionsState`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/fs-permissions.ts#L7) `packages/desktop/src/semantics/fs-permissions.ts`

File-system permissions axis (v0.2) — request + grant + revoke + audit の 4 step 遷移。 macOS TCC + Windows UAC + Linux xdg-portal の 3 target を uniform state machine で扱う。

```ts
export type FsPermissionsState = 'idle' | 'requested' | 'granted' | 'revoked' | 'audited';
```

#### `GlobalShortcutSession`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/global-shortcut.ts#L14) `packages/desktop/src/semantics/global-shortcut.ts`

```ts
export interface GlobalShortcutSession {
    target: DesktopTarget;
    namespace: string;
    state: GlobalShortcutState;
    registered: string[];
    triggerCounts: Record<string, number>;
    history: AxisStep<GlobalShortcutState>[];
}
```

#### `GlobalShortcutState`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/global-shortcut.ts#L7) `packages/desktop/src/semantics/global-shortcut.ts`

Global-shortcut axis (v0.3) — register + trigger + unregister + all-clear の 4 step 遷移。 macOS Carbon RegisterEventHotKey + Windows User32.RegisterHotKey + Linux xdg-portal GlobalShortcuts を uniform 扱い。

```ts
export type GlobalShortcutState = 'idle' | 'registered' | 'triggered' | 'unregistered' | 'all-cleared';
```

#### `InvokeCacheConfig`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/adapters/invoke-cache.ts#L40) `packages/desktop/src/adapters/invoke-cache.ts`

cache 設定 SSOT、 全 field default 明示。

```ts
export interface InvokeCacheConfig {
    /** TTL (ms)、 default 5 分。 0 = 無期限、 負値 = disabled。 */
    ttlMs?: number;
    /** LRU 最大 entry 数、 default 128。 0 = 無制限、 負値 = disabled。 */
    maxEntries?: number;
    /** cache 全体 の enable flag、 default true。 */
    enabled?: boolean;
}
```

#### `InvokeStatus`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/adapters/native-invoke.ts#L18) `packages/desktop/src/adapters/native-invoke.ts`

```ts
export type InvokeStatus = 'invoked' | 'cli-unavailable' | 'axis-skipped' | 'no-cli-mapping';
```

#### `MenuBarItem`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/menu-bar.ts#L9) `packages/desktop/src/semantics/menu-bar.ts`

```ts
export interface MenuBarItem {
    id: string;
    label: string;
    accelerator: string | null;
}
```

#### `MenuBarSession`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/menu-bar.ts#L15) `packages/desktop/src/semantics/menu-bar.ts`

```ts
export interface MenuBarSession {
    target: DesktopTarget;
    menuId: string;
    state: MenuBarState;
    items: MenuBarItem[];
    clickCount: number;
    destroyed: boolean;
    history: AxisStep<MenuBarState>[];
}
```

#### `MenuBarState`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/menu-bar.ts#L7) `packages/desktop/src/semantics/menu-bar.ts`

Menu-bar axis (v0.2) — build + item + click + destroy の 4 step 遷移。 macOS NSMenu + Windows WM_MENU + Linux GTK menubar の 3 target を uniform 扱い。

```ts
export type MenuBarState = 'idle' | 'built' | 'item-appended' | 'item-clicked' | 'destroyed';
```

#### `MetadataDiff`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/adapters/fidelity-harness.ts#L28) `packages/desktop/src/adapters/fidelity-harness.ts`

```ts
export interface MetadataDiff {
    stepIndex: number;
    neutralEvent: NeutralEventName;
    key: string;
    mockValue: string | number | boolean | undefined;
    realValue: string | number | boolean | undefined;
}
```

#### `NativeInvokeInput`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/adapters/native-invoke.ts#L28) `packages/desktop/src/adapters/native-invoke.ts`

```ts
export interface NativeInvokeInput {
    axis: DesktopAxis;
    target: DesktopTarget;
    args?: string[];
    env?: Record<string, string>;
    spawnFn?: SpawnFn;
}
```

#### `NativeInvokeMatrixSummary`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/adapters/native-invoke.ts#L110) `packages/desktop/src/adapters/native-invoke.ts`

probeAndInvokeAll = 12 axis × 3 target の probe + invoke matrix 集計。 status 別に集計、 dogfood workflow で使用。

```ts
export interface NativeInvokeMatrixSummary {
    total: number;
    invoked: NativeInvokeResult[];
    cliUnavailable: NativeInvokeResult[];
    axisSkipped: NativeInvokeResult[];
    noCliMapping: NativeInvokeResult[];
}
```

#### `NativeInvokeResult`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/adapters/native-invoke.ts#L20) `packages/desktop/src/adapters/native-invoke.ts`

```ts
export interface NativeInvokeResult {
    axis: DesktopAxis;
    target: DesktopTarget;
    status: InvokeStatus;
    reason: string | null;
    spawnResult: SpawnResult | null;
}
```

#### `NeutralEventName`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/types.ts#L26) `packages/desktop/src/semantics/types.ts`

```ts
export type NeutralEventName = 'electron.app_ready' | 'electron.window_created' | 'electron.ipc_message_dispatched' | 'electron.app_quit' | 'tauri.command_registered' | 'tauri.command_invoked' | 'tauri.event_emitted' | 'tauri.window_closed' | 'webview.preload_loaded' | 'webview.bridge_bound' | 'webview.message_posted' | 'webview.isolation_asserted' | 'auto-updater.check_started' | 'auto-updater.update_downloaded' | 'auto-updater.update_applied' | 'auto-updater.relaunch_scheduled' | 'fs-permissions.request_submitted' | 'fs-permissions.permission_granted' | 'fs-permissions.permission_revoked' | 'fs-permissions.audit_logged' | 'notification.scheduled' | 'notification.displayed' | 'notification.action_invoked' | 'notification.dismissed' | 'menu-bar.built' | 'menu-bar.item_appended' | 'menu-bar.item_clicked' | 'menu-bar.destroyed' | 'tray-icon.created' | 'tray-icon.tooltip_updated' | 'tray-icon.clicked' | 'tray-icon.removed' | 'screen-recording.permission_requested' | 'screen-recording.started' | 'screen-recording.chunk_captured' | 'screen-recording.stopped' | 'global-shortcut.registered' | 'global-shortcut.triggered' | 'global-shortcut.unregistered' | 'global-shortcut.all_cleared' | 'clipboard.written' | 'clipboard.read' | 'clipboard.changed' | 'clipboard.cleared' | 'dark-mode.subscribed' | 'dark-mode.theme_changed' | 'dark-mode.user_preferred' | 'dark-mode.unsubscribed';
```

#### `NodePlatform`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/adapters/probe.ts#L18) `packages/desktop/src/adapters/probe.ts`

```ts
export type NodePlatform = 'darwin' | 'linux' | 'win32' | 'other';
```

#### `NotificationSession`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/notification.ts#L14) `packages/desktop/src/semantics/notification.ts`

```ts
export interface NotificationSession {
    target: DesktopTarget;
    notificationId: string;
    title: string;
    state: NotificationState;
    scheduledAtMs: number;
    displayedAtMs: number;
    actions: string[];
    dismissed: boolean;
    history: AxisStep<NotificationState>[];
}
```

#### `NotificationState`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/notification.ts#L7) `packages/desktop/src/semantics/notification.ts`

Notification axis (v0.2) — schedule + display + action + dismiss の 4 step 遷移。 macOS UserNotifications + Windows Toast + Linux libnotify の 3 target を uniform 扱い。

```ts
export type NotificationState = 'idle' | 'scheduled' | 'displayed' | 'action-invoked' | 'dismissed';
```

#### `PlatformGate`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/adapters/probe.ts#L34) `packages/desktop/src/adapters/probe.ts`

```ts
export interface PlatformGate {
    target: DesktopTarget;
    platform: NodePlatform;
    compatible: boolean;
}
```

#### `ProbeInput`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/adapters/probe.ts#L20) `packages/desktop/src/adapters/probe.ts`

```ts
export interface ProbeInput {
    command: DesktopCliCommand;
    platform?: NodePlatform;
    spawnFn?: SpawnFn;
}
```

#### `ProbeResult`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/adapters/probe.ts#L26) `packages/desktop/src/adapters/probe.ts`

```ts
export interface ProbeResult {
    command: DesktopCliCommand;
    platform: NodePlatform;
    available: boolean;
    probePath: string | null;
    durationMs: number;
}
```

#### `ScreenRecordingSession`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/screen-recording.ts#L14) `packages/desktop/src/semantics/screen-recording.ts`

```ts
export interface ScreenRecordingSession {
    target: DesktopTarget;
    sessionId: string;
    displayId: string;
    state: ScreenRecordingState;
    permissionGranted: boolean;
    chunksCaptured: number;
    totalBytes: number;
    history: AxisStep<ScreenRecordingState>[];
}
```

#### `ScreenRecordingState`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/screen-recording.ts#L7) `packages/desktop/src/semantics/screen-recording.ts`

Screen-recording axis (v0.3) — permission + start + chunk + stop の 4 step 遷移。 macOS ScreenCaptureKit + Windows Windows.Graphics.Capture + Linux xdg-portal ScreenCast を uniform 扱い。

```ts
export type ScreenRecordingState = 'idle' | 'permission-requested' | 'recording' | 'chunk-captured' | 'stopped';
```

#### `SkippedPair`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/adapters/fidelity-harness.ts#L175) `packages/desktop/src/adapters/fidelity-harness.ts`

v0.8 = probe integration 経路の fidelity check。 shouldSkipAxis で skip 判定された pair は skippedPairs に記録、 diffs から除外。 shape 契約 preserving 絶対維持 = skip 経路は skippedPairs 経由で追跡可能。

```ts
export interface SkippedPair {
    axis: DesktopAxis;
    target: DesktopTarget;
    reason: string;
}
```

#### `SpawnExecutorInput`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/adapters/spawn-executor.ts#L20) `packages/desktop/src/adapters/spawn-executor.ts`

```ts
export interface SpawnExecutorInput {
    command: DesktopCliCommand;
    args: string[];
    env: Record<string, string>;
    cwd?: string;
    timeoutMs?: number;
    maxBufferBytes?: number;
}
```

#### `SpawnExecutorResult`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/adapters/spawn-executor.ts#L11) `packages/desktop/src/adapters/spawn-executor.ts`

```ts
export interface SpawnExecutorResult {
    stdout: string;
    stderr: string;
    exitCode: number | null;
    signal: NodeJS.Signals | null;
    timedOut: boolean;
    durationMs: number;
}
```

#### `SpawnFn`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/adapters/spawn-executor.ts#L29) `packages/desktop/src/adapters/spawn-executor.ts`

```ts
export type SpawnFn = typeof nodeSpawn;
```

#### `SpawnInvocation`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/adapters/spawn-driver.ts#L24) `packages/desktop/src/adapters/spawn-driver.ts`

```ts
export interface SpawnInvocation {
    command: DesktopCliCommand;
    args: string[];
    env: Record<string, string>;
    cwd?: string;
}
```

#### `SpawnResult`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/adapters/spawn-driver.ts#L31) `packages/desktop/src/adapters/spawn-driver.ts`

```ts
export interface SpawnResult {
    command: DesktopCliCommand;
    args: string[];
    invoked: boolean;
    exitCode: number | null;
    stdout: string;
    stderr: string;
    durationMs: number;
}
```

#### `TauriSession`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/tauri.ts#L8) `packages/desktop/src/semantics/tauri.ts`

```ts
export interface TauriSession {
    target: DesktopTarget;
    appName: string;
    state: TauriState;
    registeredCommands: string[];
    invocations: number;
    emittedEvents: number;
    history: AxisStep<TauriState>[];
}
```

#### `TauriState`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/tauri.ts#L6) `packages/desktop/src/semantics/tauri.ts`

Tauri axis — invoke_handler register + invoke command + emit event + window close。

```ts
export type TauriState = 'idle' | 'command-registered' | 'command-invoked' | 'event-emitted' | 'window-closed';
```

#### `ThemeMode`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/dark-mode.ts#L14) `packages/desktop/src/semantics/dark-mode.ts`

```ts
export type ThemeMode = 'light' | 'dark' | 'no-preference';
```

#### `TrayIconSession`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/tray-icon.ts#L9) `packages/desktop/src/semantics/tray-icon.ts`

```ts
export interface TrayIconSession {
    target: DesktopTarget;
    trayId: string;
    iconPath: string;
    tooltip: string;
    state: TrayIconState;
    clickCount: number;
    removed: boolean;
    history: AxisStep<TrayIconState>[];
}
```

#### `TrayIconState`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/tray-icon.ts#L7) `packages/desktop/src/semantics/tray-icon.ts`

Tray-icon axis (v0.2) — created + tooltip + click + removed の 4 step 遷移。 macOS NSStatusItem + Windows NotifyIcon + Linux StatusNotifierItem の 3 target を uniform 扱い。

```ts
export type TrayIconState = 'idle' | 'created' | 'tooltip-updated' | 'clicked' | 'removed';
```

#### `WebviewSession`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/webview.ts#L8) `packages/desktop/src/semantics/webview.ts`

```ts
export interface WebviewSession {
    target: DesktopTarget;
    webviewId: string;
    state: WebviewState;
    exposedApis: string[];
    postedMessages: number;
    contextIsolated: boolean;
    history: AxisStep<WebviewState>[];
}
```

#### `WebviewState`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/webview.ts#L6) `packages/desktop/src/semantics/webview.ts`

Webview axis — preload script + contextBridge.exposeInMainWorld + postMessage + isolation assert。

```ts
export type WebviewState = 'idle' | 'preload-loaded' | 'bridge-bound' | 'message-posted' | 'isolation-asserted';
```
<!-- kiwa-public-api:end -->
