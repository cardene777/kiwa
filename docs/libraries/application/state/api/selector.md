---
title: "@kiwa-lab/state selector の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/state</code> <code v-pre>selector</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/state/src/selector.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>selectState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/state/src/selector.ts#L9) <code v-pre>packages/state/src/selector.ts</code>

store から state slice を抽出。 Zustand selector / Redux useSelector / Jotai atom read / Valtio snapshot read / MobX computed 相当。

```ts
export declare function selectState<S extends object, R>(store: StateStore<S>, selector: Selector<S, R>): R;
```

### 型

#### <code v-pre>Selector</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/state/src/selector.ts#L3) <code v-pre>packages/state/src/selector.ts</code>

```ts
export type Selector<S extends object, R> = (state: S) => R;
```
