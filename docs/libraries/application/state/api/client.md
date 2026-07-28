---
title: "@kiwa-lab/state client の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/state</code> <code v-pre>client</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/state/src/client.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>createStore</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/state/src/client.ts#L29) <code v-pre>packages/state/src/client.ts</code>

```ts
export declare function createStore<S extends object>(options: StateStoreOptions<S>): StateStore<S>;
```

### 型

#### <code v-pre>StateProvider</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/state/src/client.ts#L3) <code v-pre>packages/state/src/client.ts</code>

```ts
export type StateProvider = 'zustand' | 'redux' | 'jotai' | 'valtio' | 'mobx';
```

#### <code v-pre>StateSnapshot</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/state/src/client.ts#L11) <code v-pre>packages/state/src/client.ts</code>

```ts
export interface StateSnapshot<S extends object> {
    provider: StateProvider;
    state: S;
    version: number;
}
```

#### <code v-pre>StateStore</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/state/src/client.ts#L17) <code v-pre>packages/state/src/client.ts</code>

```ts
export interface StateStore<S extends object> {
    provider: StateProvider;
    getState: () => S;
    setState: (updater: Partial<S> | ((prev: S) => Partial<S>)) => void;
    getSnapshot: () => StateSnapshot<S>;
    _subscribers: Set<StateListener<S>>;
    _reducer?: (state: S, action: {
        type: string;
        payload?: unknown;
    }) => S;
    _addSubscriber: (listener: StateListener<S>) => Unsubscribe;
    _notify: () => void;
    _incrementVersion: () => void;
}
```

#### <code v-pre>StateStoreOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/state/src/client.ts#L5) <code v-pre>packages/state/src/client.ts</code>

```ts
export interface StateStoreOptions<S extends object> {
    provider?: StateProvider;
    initialState: S;
    reducer?: (state: S, action: {
        type: string;
        payload?: unknown;
    }) => S;
}
```
