---
title: "@kiwa-lab/expo router の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/expo</code> <code v-pre>router</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/expo/src/router.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>mockExpoRouter</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/expo/src/router.ts#L23) <code v-pre>packages/expo/src/router.ts</code>

expo-router (file-based routing) mock。 push / replace / back の 3 navigation を 内部 stack で管理、 history を snapshot 経由で verify 可能にする。

```ts
export declare function mockExpoRouter(options?: ExpoRouterOptions): ExpoRouterMock;
```

### 型

#### <code v-pre>ExpoRouterMock</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/expo/src/router.ts#L8) <code v-pre>packages/expo/src/router.ts</code>

```ts
export interface ExpoRouterMock {
    push: (path: string, params?: Record<string, string>) => void;
    replace: (path: string, params?: Record<string, string>) => void;
    back: () => void;
    getCurrentPath: () => string;
    getCurrentParams: () => Record<string, string>;
    getSegments: () => string[];
    getHistory: () => RouterNavigation[];
    clear: () => void;
}
```

#### <code v-pre>ExpoRouterOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/expo/src/router.ts#L3) <code v-pre>packages/expo/src/router.ts</code>

```ts
export interface ExpoRouterOptions {
    initialPath?: string;
    initialParams?: Record<string, string>;
}
```

#### <code v-pre>RouterNavigation</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/expo/src/router.ts#L1) <code v-pre>packages/expo/src/router.ts</code>

```ts
export type RouterNavigation = {
    type: 'push' | 'replace' | 'back';
    path?: string;
    params?: Record<string, string>;
};
```
