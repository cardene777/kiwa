---
title: "@kiwa-lab/desktop semantics-tray-icon の API 契約"
---

# <code v-pre>@kiwa-lab/desktop</code> <code v-pre>semantics-tray-icon</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/tray-icon.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>clickTrayIcon</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/tray-icon.ts#L77) <code v-pre>packages/desktop/src/semantics/tray-icon.ts</code>

```ts
export declare function clickTrayIcon(session: TrayIconSession): AxisStep<TrayIconState>;
```

#### <code v-pre>createTrayIcon</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/tray-icon.ts#L39) <code v-pre>packages/desktop/src/semantics/tray-icon.ts</code>

```ts
export declare function createTrayIcon(input: {
    target: DesktopTarget;
    trayId: string;
    iconPath: string;
}): TrayIconSession;
```

#### <code v-pre>removeTrayIcon</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/tray-icon.ts#L87) <code v-pre>packages/desktop/src/semantics/tray-icon.ts</code>

```ts
export declare function removeTrayIcon(session: TrayIconSession): AxisStep<TrayIconState>;
```

#### <code v-pre>updateTrayTooltip</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/tray-icon.ts#L63) <code v-pre>packages/desktop/src/semantics/tray-icon.ts</code>

```ts
export declare function updateTrayTooltip(session: TrayIconSession, tooltip: string): AxisStep<TrayIconState>;
```

### 型

#### <code v-pre>TrayIconSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/tray-icon.ts#L9) <code v-pre>packages/desktop/src/semantics/tray-icon.ts</code>

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

#### <code v-pre>TrayIconState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/tray-icon.ts#L7) <code v-pre>packages/desktop/src/semantics/tray-icon.ts</code>

Tray-icon axis (v0.2) — created + tooltip + click + removed の 4 step 遷移。 macOS NSStatusItem + Windows NotifyIcon + Linux StatusNotifierItem の 3 target を uniform 扱い。

```ts
export type TrayIconState = 'idle' | 'created' | 'tooltip-updated' | 'clicked' | 'removed';
```
