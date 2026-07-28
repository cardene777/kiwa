---
title: "@kiwa-lab/desktop semantics__webview の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/desktop</code> <code v-pre>semantics&#95;&#95;webview</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/webview.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>assertContextIsolation</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/webview.ts#L78) <code v-pre>packages/desktop/src/semantics/webview.ts</code>

```ts
export declare function assertContextIsolation(session: WebviewSession, isolated: boolean): AxisStep<WebviewState>;
```

#### <code v-pre>bindContextBridge</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/webview.ts#L52) <code v-pre>packages/desktop/src/semantics/webview.ts</code>

```ts
export declare function bindContextBridge(session: WebviewSession, apiName: string): AxisStep<WebviewState>;
```

#### <code v-pre>loadPreloadScript</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/webview.ts#L37) <code v-pre>packages/desktop/src/semantics/webview.ts</code>

```ts
export declare function loadPreloadScript(input: {
    target: DesktopTarget;
    webviewId: string;
}): WebviewSession;
```

#### <code v-pre>postWebviewMessage</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/webview.ts#L63) <code v-pre>packages/desktop/src/semantics/webview.ts</code>

```ts
export declare function postWebviewMessage(session: WebviewSession, input: {
    channel: string;
    payload: string;
}): AxisStep<WebviewState>;
```

### 型

#### <code v-pre>WebviewSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/webview.ts#L8) <code v-pre>packages/desktop/src/semantics/webview.ts</code>

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

#### <code v-pre>WebviewState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/webview.ts#L6) <code v-pre>packages/desktop/src/semantics/webview.ts</code>

Webview axis — preload script + contextBridge.exposeInMainWorld + postMessage + isolation assert。

```ts
export type WebviewState = 'idle' | 'preload-loaded' | 'bridge-bound' | 'message-posted' | 'isolation-asserted';
```
