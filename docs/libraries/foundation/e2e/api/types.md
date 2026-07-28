---
title: "@kiwa-lab/e2e types の API 契約"
---

# <code v-pre>@kiwa-lab/e2e</code> <code v-pre>types</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/e2e/src/types.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)



### 型

#### <code v-pre>E2eMode</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/e2e/src/types.ts#L4) <code v-pre>packages/e2e/src/types.ts</code>

```ts
export type E2eMode = 'live' | 'static';
```

#### <code v-pre>E2eTestEnv</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/e2e/src/types.ts#L19) <code v-pre>packages/e2e/src/types.ts</code>

```ts
export interface E2eTestEnv extends TestEnvBase<'live'> {
    baseUrl: string;
    page: import('./browser-bridge.js').BrowserPageHandle;
    browser: 'chromium' | 'firefox' | 'webkit';
}
```

#### <code v-pre>SetupE2eEnvOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/e2e/src/types.ts#L6) <code v-pre>packages/e2e/src/types.ts</code>

```ts
export interface SetupE2eEnvOptions {
    /** Mount the app under the given baseUrl (default http://127.0.0.1:auto) */
    app?: ApiHandlerSource | NodeRequestHandler;
    /** Static HTML to serve at "/" when no app is given */
    staticHtml?: string;
    /** Playwright browser (default chromium) */
    browser?: 'chromium' | 'firefox' | 'webkit';
    /** headless launch flag (default true) */
    headless?: boolean;
    /** initial route to navigate after launch */
    initialPath?: string;
}
```
