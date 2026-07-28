---
title: "@kiwa-lab/state subscribe の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/state</code> <code v-pre>subscribe</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/state/src/subscribe.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>subscribe</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/state/src/subscribe.ts#L16) <code v-pre>packages/state/src/subscribe.ts</code>

store の state 変更に listener を登録。 unsubscribe 関数と callCount helper を返却。 Redux subscribe / Zustand subscribe / Jotai atom subscribe / Valtio subscribe / MobX autorun 相当。

```ts
export declare function subscribe<S extends object>(store: StateStore<S>, listener: StateListener<S>): Subscription<S>;
```

### 型

#### <code v-pre>StateListener</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/state/src/subscribe.ts#L4) <code v-pre>packages/state/src/subscribe.ts</code>

```ts
export type StateListener<S extends object> = (state: S) => void;
```

#### <code v-pre>Subscription</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/state/src/subscribe.ts#L6) <code v-pre>packages/state/src/subscribe.ts</code>

```ts
export interface Subscription<S extends object> {
    listener: StateListener<S>;
    unsubscribe: Unsubscribe;
    callCount: () => number;
}
```

#### <code v-pre>Unsubscribe</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/state/src/subscribe.ts#L3) <code v-pre>packages/state/src/subscribe.ts</code>

```ts
export type Unsubscribe = () => void;
```
