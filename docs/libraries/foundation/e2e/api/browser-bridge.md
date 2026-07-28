---
title: "@kiwa-lab/e2e browser-bridge の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/e2e</code> <code v-pre>browser-bridge</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/e2e/src/browser-bridge.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)



### 型

#### <code v-pre>BrowserContextHandle</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/e2e/src/browser-bridge.ts#L14) <code v-pre>packages/e2e/src/browser-bridge.ts</code>

```ts
export interface BrowserContextHandle {
    newPage: () => Promise<BrowserPageHandle>;
    close: () => Promise<void>;
}
```

#### <code v-pre>BrowserHandle</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/e2e/src/browser-bridge.ts#L9) <code v-pre>packages/e2e/src/browser-bridge.ts</code>

```ts
export interface BrowserHandle {
    close: () => Promise<void>;
    newContext: () => Promise<BrowserContextHandle>;
}
```

#### <code v-pre>BrowserLocator</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/e2e/src/browser-bridge.ts#L34) <code v-pre>packages/e2e/src/browser-bridge.ts</code>

```ts
export interface BrowserLocator {
    textContent: () => Promise<string | null>;
    click: () => Promise<void>;
    fill: (value: string) => Promise<void>;
    isVisible: () => Promise<boolean>;
    count: () => Promise<number>;
}
```

#### <code v-pre>BrowserPageHandle</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/e2e/src/browser-bridge.ts#L19) <code v-pre>packages/e2e/src/browser-bridge.ts</code>

```ts
export interface BrowserPageHandle {
    goto: (url: string, opts?: {
        waitUntil?: 'load' | 'domcontentloaded' | 'networkidle';
    }) => Promise<unknown>;
    setContent: (html: string, opts?: {
        waitUntil?: 'load' | 'domcontentloaded' | 'networkidle';
    }) => Promise<void>;
    getByTestId: (id: string) => BrowserLocator;
    getByRole: (role: string, opts?: {
        name?: string;
    }) => BrowserLocator;
    getByText: (text: string) => BrowserLocator;
    fill: (selector: string, value: string) => Promise<void>;
    click: (selector: string) => Promise<void>;
    evaluate: <T>(fn: () => T | Promise<T>) => Promise<T>;
    screenshot: (opts?: {
        path?: string;
    }) => Promise<Buffer>;
    content: () => Promise<string>;
    url: () => string;
    close: () => Promise<void>;
}
```
