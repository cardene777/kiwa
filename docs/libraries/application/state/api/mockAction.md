---
title: "@kiwa-lab/state mockAction の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/state</code> <code v-pre>mockAction</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/state/src/mockAction.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>mockAction</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/state/src/mockAction.ts#L12) <code v-pre>packages/state/src/mockAction.ts</code>

action creator mock。 Redux Toolkit createAction 相当、 type 判定 helper (match) を含む。

```ts
export declare function mockAction<P = unknown>(name: string): MockActionCreator<P>;
```

### 型

#### <code v-pre>MockActionCreator</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/state/src/mockAction.ts#L3) <code v-pre>packages/state/src/mockAction.ts</code>

```ts
export interface MockActionCreator<P = unknown> {
    type: string;
    (payload?: P): Action;
    match: (action: Action) => boolean;
}
```
