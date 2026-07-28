---
title: "@kiwa-lab/ui browser の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/ui</code> <code v-pre>browser</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/ui/src/browser.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>setupBrowserComponentEnv</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ui/src/browser.ts#L95) <code v-pre>packages/ui/src/browser.ts</code>

```ts
export declare function setupBrowserComponentEnv(opts: SetupBrowserComponentEnvOptions): Promise<BrowserTestEnvUi>;
```

### 型

#### <code v-pre>BrowserLocator</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ui/src/browser.ts#L33) <code v-pre>packages/ui/src/browser.ts</code>

```ts
export interface BrowserLocator {
    textContent: () => Promise<string | null>;
    click: () => Promise<void>;
    isVisible: () => Promise<boolean>;
    count: () => Promise<number>;
}
```

#### <code v-pre>BrowserPageHandle</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ui/src/browser.ts#L21) <code v-pre>packages/ui/src/browser.ts</code>

```ts
export interface BrowserPageHandle {
    setContent: (html: string, opts?: {
        waitUntil?: 'load' | 'domcontentloaded' | 'networkidle';
    }) => Promise<void>;
    getByTestId: (id: string) => BrowserLocator;
    getByRole: (role: string, opts?: {
        name?: string;
    }) => BrowserLocator;
    getByText: (text: string) => BrowserLocator;
    evaluate: <T>(fn: () => T | Promise<T>) => Promise<T>;
    click: (selector: string) => Promise<void>;
    screenshot: (opts?: {
        path?: string;
    }) => Promise<Buffer>;
    close: () => Promise<void>;
    content: () => Promise<string>;
}
```

#### <code v-pre>BrowserTestEnvUi</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ui/src/browser.ts#L50) <code v-pre>packages/ui/src/browser.ts</code>

```ts
export interface BrowserTestEnvUi {
    mode: 'live';
    kind: 'browser';
    browser: BrowserName;
    page: BrowserPageHandle;
    markup: string;
    stop: () => Promise<void>;
}
```

#### <code v-pre>SetupBrowserComponentEnvOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ui/src/browser.ts#L40) <code v-pre>packages/ui/src/browser.ts</code>

```ts
export interface SetupBrowserComponentEnvOptions {
    ui: ReactElement;
    /** which browser engine to launch (default chromium) */
    browser?: BrowserName;
    /** headless flag forwarded to playwright launch (default true) */
    headless?: boolean;
    /** optional HTML wrapper template (`{{children}}` is replaced with the rendered React markup) */
    template?: string;
}
```
