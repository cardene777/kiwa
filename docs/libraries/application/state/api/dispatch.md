---
title: "@kiwa-lab/state dispatch の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/state</code> <code v-pre>dispatch</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/state/src/dispatch.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>dispatch</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/state/src/dispatch.ts#L19) <code v-pre>packages/state/src/dispatch.ts</code>

provider 別 dispatch。 Redux reducer / Zustand setState / Jotai atom write / Valtio proxy mutation / MobX action の 5 経路を統一 interface で叩く。

```ts
export declare function dispatch<S extends object>(store: StateStore<S>, action: Action): DispatchResult<S>;
```

### 型

#### <code v-pre>Action</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/state/src/dispatch.ts#L3) <code v-pre>packages/state/src/dispatch.ts</code>

```ts
export interface Action {
    type: string;
    payload?: unknown;
}
```

#### <code v-pre>DispatchResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/state/src/dispatch.ts#L8) <code v-pre>packages/state/src/dispatch.ts</code>

```ts
export interface DispatchResult<S extends object> {
    action: Action;
    prevState: S;
    nextState: S;
    version: number;
}
```
