---
title: "@kiwa-lab/desktop semantics-electron の API 契約"
---

# <code v-pre>@kiwa-lab/desktop</code> <code v-pre>semantics-electron</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/electron.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>createBrowserWindow</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/electron.ts#L50) <code v-pre>packages/desktop/src/semantics/electron.ts</code>

```ts
export declare function createBrowserWindow(session: ElectronSession, windowId: string): AxisStep<ElectronState>;
```

#### <code v-pre>dispatchIpcMessage</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/electron.ts#L61) <code v-pre>packages/desktop/src/semantics/electron.ts</code>

```ts
export declare function dispatchIpcMessage(session: ElectronSession, input: {
    channel: string;
    payload: string;
}): AxisStep<ElectronState>;
```

#### <code v-pre>quitElectronApp</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/electron.ts#L76) <code v-pre>packages/desktop/src/semantics/electron.ts</code>

```ts
export declare function quitElectronApp(session: ElectronSession): AxisStep<ElectronState>;
```

#### <code v-pre>startElectronApp</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/electron.ts#L36) <code v-pre>packages/desktop/src/semantics/electron.ts</code>

```ts
export declare function startElectronApp(input: {
    target: DesktopTarget;
    appId: string;
}): ElectronSession;
```

### 型

#### <code v-pre>ElectronSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/electron.ts#L8) <code v-pre>packages/desktop/src/semantics/electron.ts</code>

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

#### <code v-pre>ElectronState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/electron.ts#L6) <code v-pre>packages/desktop/src/semantics/electron.ts</code>

Electron axis — app.ready + BrowserWindow.create + ipcMain.on + app.quit の 4 step。

```ts
export type ElectronState = 'idle' | 'app-ready' | 'window-created' | 'ipc-dispatched' | 'quit';
```
