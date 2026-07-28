---
title: "@kiwa-lab/react-native navigation の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/react-native</code> <code v-pre>navigation</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/react-native/src/navigation.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>mockNavigation</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/react-native/src/navigation.ts#L19) <code v-pre>packages/react-native/src/navigation.ts</code>

```ts
export declare function mockNavigation(initialRoute: NavigationRoute): NavigationMock;
```

### 型

#### <code v-pre>NavigationMock</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/react-native/src/navigation.ts#L6) <code v-pre>packages/react-native/src/navigation.ts</code>

```ts
export interface NavigationMock {
    currentRoute: () => NavigationRoute;
    navigate: (name: string, params?: Record<string, unknown>) => void;
    goBack: () => boolean;
    reset: (route: NavigationRoute) => void;
    history: () => NavigationRoute[];
    addListener: (event: 'focus' | 'blur' | 'state', cb: (payload: NavigationRoute) => void) => () => void;
}
```

#### <code v-pre>NavigationRoute</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/react-native/src/navigation.ts#L1) <code v-pre>packages/react-native/src/navigation.ts</code>

```ts
export interface NavigationRoute {
    name: string;
    params?: Record<string, unknown>;
}
```
