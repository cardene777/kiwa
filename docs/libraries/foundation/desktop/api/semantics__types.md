---
title: "@kiwa-lab/desktop semantics__types の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/desktop</code> <code v-pre>semantics&#95;&#95;types</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/types.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>providerEventName</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/types.ts#L278) <code v-pre>packages/desktop/src/semantics/types.ts</code>

```ts
export declare function providerEventName(target: DesktopTarget, neutral: NeutralEventName): string;
```

### 型

#### <code v-pre>AxisStep</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/types.ts#L88) <code v-pre>packages/desktop/src/semantics/types.ts</code>

```ts
export interface AxisStep<TState extends string> {
    neutralEvent: NeutralEventName;
    providerEvent: string;
    state: TState;
    metadata: Record<string, string | number | boolean>;
}
```

#### <code v-pre>DesktopAxis</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/types.ts#L12) <code v-pre>packages/desktop/src/semantics/types.ts</code>

```ts
export type DesktopAxis = 'electron' | 'tauri' | 'webview' | 'auto-updater' | 'fs-permissions' | 'notification' | 'menu-bar' | 'tray-icon' | 'screen-recording' | 'global-shortcut' | 'clipboard' | 'dark-mode';
```

#### <code v-pre>DesktopTarget</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/types.ts#L10) <code v-pre>packages/desktop/src/semantics/types.ts</code>

```ts
export type DesktopTarget = 'macos' | 'windows' | 'linux';
```

#### <code v-pre>NeutralEventName</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/types.ts#L26) <code v-pre>packages/desktop/src/semantics/types.ts</code>

```ts
export type NeutralEventName = 'electron.app_ready' | 'electron.window_created' | 'electron.ipc_message_dispatched' | 'electron.app_quit' | 'tauri.command_registered' | 'tauri.command_invoked' | 'tauri.event_emitted' | 'tauri.window_closed' | 'webview.preload_loaded' | 'webview.bridge_bound' | 'webview.message_posted' | 'webview.isolation_asserted' | 'auto-updater.check_started' | 'auto-updater.update_downloaded' | 'auto-updater.update_applied' | 'auto-updater.relaunch_scheduled' | 'fs-permissions.request_submitted' | 'fs-permissions.permission_granted' | 'fs-permissions.permission_revoked' | 'fs-permissions.audit_logged' | 'notification.scheduled' | 'notification.displayed' | 'notification.action_invoked' | 'notification.dismissed' | 'menu-bar.built' | 'menu-bar.item_appended' | 'menu-bar.item_clicked' | 'menu-bar.destroyed' | 'tray-icon.created' | 'tray-icon.tooltip_updated' | 'tray-icon.clicked' | 'tray-icon.removed' | 'screen-recording.permission_requested' | 'screen-recording.started' | 'screen-recording.chunk_captured' | 'screen-recording.stopped' | 'global-shortcut.registered' | 'global-shortcut.triggered' | 'global-shortcut.unregistered' | 'global-shortcut.all_cleared' | 'clipboard.written' | 'clipboard.read' | 'clipboard.changed' | 'clipboard.cleared' | 'dark-mode.subscribed' | 'dark-mode.theme_changed' | 'dark-mode.user_preferred' | 'dark-mode.unsubscribed';
```
