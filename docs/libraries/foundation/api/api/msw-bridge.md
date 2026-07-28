---
title: "@kiwa-lab/api msw-bridge の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/api</code> <code v-pre>msw-bridge</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/api/src/msw-bridge.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>startMockServer</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/api/src/msw-bridge.ts#L33) <code v-pre>packages/api/src/msw-bridge.ts</code>

```ts
export declare function startMockServer(opts: StartMockServerOptions): Promise<MockServerHandle>;
```

### 型

#### <code v-pre>MockServerHandle</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/api/src/msw-bridge.ts#L15) <code v-pre>packages/api/src/msw-bridge.ts</code>

```ts
export interface MockServerHandle {
    reset: () => void;
    close: () => void;
}
```

#### <code v-pre>StartMockServerOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/api/src/msw-bridge.ts#L10) <code v-pre>packages/api/src/msw-bridge.ts</code>

```ts
export interface StartMockServerOptions {
    handlers: MockHandler[];
    onUnhandledRequest?: 'error' | 'warn' | 'bypass';
}
```
