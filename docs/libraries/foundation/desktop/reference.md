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
| <code v-pre>invokeDesktopCli($&#123;inv.command&#125;): KIWA&#95;DESKTOP&#95;MODE must be 'real'</code> | [packages/desktop/src/adapters/spawn-driver.ts](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/adapters/spawn-driver.ts#L76) |
| <code v-pre>invokeDesktopCli($&#123;inv.command&#125;): args exceeds max 32 ($&#123;inv.args.length&#125;)</code> | [packages/desktop/src/adapters/spawn-driver.ts](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/adapters/spawn-driver.ts#L81) |
| <code v-pre>startAutoUpdaterCheck: channel must not be empty</code> | [packages/desktop/src/semantics/auto-updater.ts](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/auto-updater.ts#L48) |
| <code v-pre>recordUpdateDownloaded: check not started</code> | [packages/desktop/src/semantics/auto-updater.ts](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/auto-updater.ts#L67) |
| <code v-pre>recordUpdateDownloaded: version must not be empty</code> | [packages/desktop/src/semantics/auto-updater.ts](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/auto-updater.ts#L68) |
| <code v-pre>recordUpdateDownloaded: bytes must be non-negative</code> | [packages/desktop/src/semantics/auto-updater.ts](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/auto-updater.ts#L69) |
| <code v-pre>applyDownloadedUpdate: update not downloaded</code> | [packages/desktop/src/semantics/auto-updater.ts](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/auto-updater.ts#L81) |
| <code v-pre>scheduleRelaunch: update not applied</code> | [packages/desktop/src/semantics/auto-updater.ts](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/auto-updater.ts#L96) |
| <code v-pre>scheduleRelaunch: delayMs must be non-negative</code> | [packages/desktop/src/semantics/auto-updater.ts](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/auto-updater.ts#L98) |
| <code v-pre>openClipboard: clipboardId must not be empty</code> | [packages/desktop/src/semantics/clipboard.ts](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/clipboard.ts#L44) |
| <code v-pre>writeClipboard: contents must not be empty</code> | [packages/desktop/src/semantics/clipboard.ts](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/clipboard.ts#L60) |
| <code v-pre>readClipboard: clipboard empty</code> | [packages/desktop/src/semantics/clipboard.ts](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/clipboard.ts#L73) |
| <code v-pre>notifyClipboardChange: externalContents must not be empty</code> | [packages/desktop/src/semantics/clipboard.ts](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/clipboard.ts#L85) |
| <code v-pre>clearClipboard: already cleared</code> | [packages/desktop/src/semantics/clipboard.ts](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/clipboard.ts#L96) |
| <code v-pre>subscribeDarkMode: observerId must not be empty</code> | [packages/desktop/src/semantics/dark-mode.ts](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/dark-mode.ts#L50) |
| <code v-pre>notifyThemeChange: not subscribed</code> | [packages/desktop/src/semantics/dark-mode.ts](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/dark-mode.ts#L69) |
| <code v-pre>notifyThemeChange: theme unchanged ($&#123;newTheme&#125;)</code> | [packages/desktop/src/semantics/dark-mode.ts](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/dark-mode.ts#L72) |
| <code v-pre>recordUserPreference: not subscribed</code> | [packages/desktop/src/semantics/dark-mode.ts](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/dark-mode.ts#L88) |
| <code v-pre>unsubscribeDarkMode: already unsubscribed</code> | [packages/desktop/src/semantics/dark-mode.ts](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/dark-mode.ts#L99) |
| <code v-pre>startElectronApp: appId must not be empty</code> | [packages/desktop/src/semantics/electron.ts](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/electron.ts#L37) |
| <code v-pre>createBrowserWindow: app has quit</code> | [packages/desktop/src/semantics/electron.ts](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/electron.ts#L51) |
| <code v-pre>createBrowserWindow: windowId must not be empty</code> | [packages/desktop/src/semantics/electron.ts](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/electron.ts#L52) |
| <code v-pre>dispatchIpcMessage: app has quit</code> | [packages/desktop/src/semantics/electron.ts](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/electron.ts#L65) |
| <code v-pre>dispatchIpcMessage: channel must not be empty</code> | [packages/desktop/src/semantics/electron.ts](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/electron.ts#L66) |
| <code v-pre>quitElectronApp: already quit</code> | [packages/desktop/src/semantics/electron.ts](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/electron.ts#L77) |
| <code v-pre>requestFsPermission: path must not be empty</code> | [packages/desktop/src/semantics/fs-permissions.ts](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/fs-permissions.ts#L45) |
| <code v-pre>grantFsPermission: no request pending</code> | [packages/desktop/src/semantics/fs-permissions.ts](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/fs-permissions.ts#L63) |
| <code v-pre>revokeFsPermission: $&#123;scope&#125; not granted</code> | [packages/desktop/src/semantics/fs-permissions.ts](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/fs-permissions.ts#L77) |
| <code v-pre>logFsPermissionAudit: reason must not be empty</code> | [packages/desktop/src/semantics/fs-permissions.ts](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/fs-permissions.ts#L91) |
| <code v-pre>createGlobalShortcutSession: namespace must not be empty</code> | [packages/desktop/src/semantics/global-shortcut.ts](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/global-shortcut.ts#L46) |
| <code v-pre>registerGlobalShortcut: session cleared</code> | [packages/desktop/src/semantics/global-shortcut.ts](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/global-shortcut.ts#L61) |
| <code v-pre>registerGlobalShortcut: accelerator must not be empty</code> | [packages/desktop/src/semantics/global-shortcut.ts](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/global-shortcut.ts#L62) |
| <code v-pre>registerGlobalShortcut: $&#123;accelerator&#125; already registered</code> | [packages/desktop/src/semantics/global-shortcut.ts](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/global-shortcut.ts#L64) |
| <code v-pre>triggerGlobalShortcut: $&#123;accelerator&#125; not registered</code> | [packages/desktop/src/semantics/global-shortcut.ts](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/global-shortcut.ts#L80) |
| <code v-pre>unregisterGlobalShortcut: $&#123;accelerator&#125; not registered</code> | [packages/desktop/src/semantics/global-shortcut.ts](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/global-shortcut.ts#L95) |
| <code v-pre>buildMenuBar: menuId must not be empty</code> | [packages/desktop/src/semantics/menu-bar.ts](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/menu-bar.ts#L45) |
| <code v-pre>appendMenuBarItem: menu destroyed</code> | [packages/desktop/src/semantics/menu-bar.ts](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/menu-bar.ts#L63) |
| <code v-pre>appendMenuBarItem: id must not be empty</code> | [packages/desktop/src/semantics/menu-bar.ts](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/menu-bar.ts#L64) |
| <code v-pre>appendMenuBarItem: label must not be empty</code> | [packages/desktop/src/semantics/menu-bar.ts](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/menu-bar.ts#L65) |
| <code v-pre>appendMenuBarItem: duplicate id $&#123;item.id&#125;</code> | [packages/desktop/src/semantics/menu-bar.ts](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/menu-bar.ts#L67) |
| <code v-pre>clickMenuBarItem: menu destroyed</code> | [packages/desktop/src/semantics/menu-bar.ts](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/menu-bar.ts#L83) |
| <code v-pre>clickMenuBarItem: item $&#123;itemId&#125; not found</code> | [packages/desktop/src/semantics/menu-bar.ts](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/menu-bar.ts#L85) |
| <code v-pre>destroyMenuBar: already destroyed</code> | [packages/desktop/src/semantics/menu-bar.ts](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/menu-bar.ts#L96) |
| <code v-pre>dismissNotification: notification not displayed</code> | [packages/desktop/src/semantics/notification.ts](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/notification.ts#L110) |
| <code v-pre>scheduleNotification: notificationId must not be empty</code> | [packages/desktop/src/semantics/notification.ts](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/notification.ts#L52) |
| <code v-pre>scheduleNotification: title must not be empty</code> | [packages/desktop/src/semantics/notification.ts](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/notification.ts#L54) |
| <code v-pre>scheduleNotification: scheduledAtMs must be non-negative</code> | [packages/desktop/src/semantics/notification.ts](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/notification.ts#L55) |
| <code v-pre>displayNotification: not scheduled</code> | [packages/desktop/src/semantics/notification.ts](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/notification.ts#L78) |
| <code v-pre>displayNotification: displayedAtMs must be &gt;= scheduledAtMs</code> | [packages/desktop/src/semantics/notification.ts](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/notification.ts#L80) |
| <code v-pre>invokeNotificationAction: notification not displayed</code> | [packages/desktop/src/semantics/notification.ts](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/notification.ts#L95) |
| <code v-pre>invokeNotificationAction: actionId must not be empty</code> | [packages/desktop/src/semantics/notification.ts](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/notification.ts#L97) |
| <code v-pre>stopScreenRecording: already stopped</code> | [packages/desktop/src/semantics/screen-recording.ts](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/screen-recording.ts#L100) |
| <code v-pre>requestScreenRecordingPermission: sessionId must not be empty</code> | [packages/desktop/src/semantics/screen-recording.ts](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/screen-recording.ts#L49) |
| <code v-pre>requestScreenRecordingPermission: displayId must not be empty</code> | [packages/desktop/src/semantics/screen-recording.ts](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/screen-recording.ts#L50) |
| <code v-pre>startScreenRecording: permission not requested</code> | [packages/desktop/src/semantics/screen-recording.ts](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/screen-recording.ts#L70) |
| <code v-pre>startScreenRecording: permission denied</code> | [packages/desktop/src/semantics/screen-recording.ts](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/screen-recording.ts#L72) |
| <code v-pre>captureScreenChunk: not recording</code> | [packages/desktop/src/semantics/screen-recording.ts](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/screen-recording.ts#L83) |
| <code v-pre>captureScreenChunk: chunkBytes must be non-negative</code> | [packages/desktop/src/semantics/screen-recording.ts](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/screen-recording.ts#L85) |
| <code v-pre>stopScreenRecording: recording not started</code> | [packages/desktop/src/semantics/screen-recording.ts](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/screen-recording.ts#L98) |
| <code v-pre>startTauriApp: appName must not be empty</code> | [packages/desktop/src/semantics/tauri.ts](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/tauri.ts#L38) |
| <code v-pre>registerTauriCommand: commandName must not be empty</code> | [packages/desktop/src/semantics/tauri.ts](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/tauri.ts#L51) |
| <code v-pre>invokeTauriCommand: $&#123;input.commandName&#125; not registered</code> | [packages/desktop/src/semantics/tauri.ts](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/tauri.ts#L65) |
| <code v-pre>emitTauriEvent: eventName must not be empty</code> | [packages/desktop/src/semantics/tauri.ts](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/tauri.ts#L80) |
| <code v-pre>closeTauriWindow: windowLabel must not be empty</code> | [packages/desktop/src/semantics/tauri.ts](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/tauri.ts#L91) |
| <code v-pre>createTrayIcon: trayId must not be empty</code> | [packages/desktop/src/semantics/tray-icon.ts](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/tray-icon.ts#L44) |
| <code v-pre>createTrayIcon: iconPath must not be empty</code> | [packages/desktop/src/semantics/tray-icon.ts](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/tray-icon.ts#L45) |
| <code v-pre>updateTrayTooltip: tray removed</code> | [packages/desktop/src/semantics/tray-icon.ts](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/tray-icon.ts#L67) |
| <code v-pre>updateTrayTooltip: tooltip must not be empty</code> | [packages/desktop/src/semantics/tray-icon.ts](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/tray-icon.ts#L68) |
| <code v-pre>clickTrayIcon: tray removed</code> | [packages/desktop/src/semantics/tray-icon.ts](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/tray-icon.ts#L78) |
| <code v-pre>removeTrayIcon: already removed</code> | [packages/desktop/src/semantics/tray-icon.ts](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/tray-icon.ts#L88) |
| <code v-pre>loadPreloadScript: webviewId must not be empty</code> | [packages/desktop/src/semantics/webview.ts](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/webview.ts#L38) |
| <code v-pre>bindContextBridge: preload not loaded</code> | [packages/desktop/src/semantics/webview.ts](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/webview.ts#L53) |
| <code v-pre>bindContextBridge: apiName must not be empty</code> | [packages/desktop/src/semantics/webview.ts](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/webview.ts#L54) |
| <code v-pre>postWebviewMessage: preload not loaded</code> | [packages/desktop/src/semantics/webview.ts](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/webview.ts#L67) |
| <code v-pre>postWebviewMessage: channel must not be empty</code> | [packages/desktop/src/semantics/webview.ts](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/webview.ts#L68) |

## API 契約

[公開 entry point](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/index.ts) から同期しています。宣言元ごとにページを分けています。

| 宣言元 | 値 | 型 |
| --- | --- | --- |
| [adapters/fidelity-harness.ts](./api/adapters__fidelity-harness) | 4 | 6 |
| [adapters/invoke-cache.ts](./api/adapters__invoke-cache) | 3 | 4 |
| [adapters/mock-factory.ts](./api/adapters__mock-factory) | 4 | 0 |
| [adapters/native-invoke.ts](./api/adapters__native-invoke) | 2 | 4 |
| [adapters/probe.ts](./api/adapters__probe) | 4 | 4 |
| [adapters/real-runner.ts](./api/adapters__real-runner) | 1 | 0 |
| [adapters/spawn-driver.ts](./api/adapters__spawn-driver) | 4 | 3 |
| [adapters/spawn-executor.ts](./api/adapters__spawn-executor) | 2 | 3 |
| [adapters/types.ts](./api/adapters__types) | 0 | 4 |
| [semantics/auto-updater.ts](./api/semantics__auto-updater) | 4 | 2 |
| [semantics/clipboard.ts](./api/semantics__clipboard) | 5 | 3 |
| [semantics/dark-mode.ts](./api/semantics__dark-mode) | 4 | 3 |
| [semantics/electron.ts](./api/semantics__electron) | 4 | 2 |
| [semantics/fidelity.ts](./api/semantics__fidelity) | 2 | 2 |
| [semantics/fs-permissions.ts](./api/semantics__fs-permissions) | 4 | 3 |
| [semantics/global-shortcut.ts](./api/semantics__global-shortcut) | 5 | 2 |
| [semantics/menu-bar.ts](./api/semantics__menu-bar) | 4 | 3 |
| [semantics/notification.ts](./api/semantics__notification) | 4 | 2 |
| [semantics/screen-recording.ts](./api/semantics__screen-recording) | 4 | 2 |
| [semantics/tauri.ts](./api/semantics__tauri) | 5 | 2 |
| [semantics/tray-icon.ts](./api/semantics__tray-icon) | 4 | 2 |
| [semantics/types.ts](./api/semantics__types) | 1 | 4 |
| [semantics/webview.ts](./api/semantics__webview) | 4 | 2 |

<!-- kiwa-public-api:end -->
