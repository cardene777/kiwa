---
title: "@kiwa-lab/core pool の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/core</code> <code v-pre>pool</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/core/src/pool.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>createPool</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/core/src/pool.ts#L15) <code v-pre>packages/core/src/pool.ts</code>

```ts
export declare function createPool<T>(opts: PoolFactoryOptions<T>): Promise<Pool<T>>;
```

### 型

#### <code v-pre>PoolFactoryOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/core/src/pool.ts#L3) <code v-pre>packages/core/src/pool.ts</code>

```ts
export interface PoolFactoryOptions<T> {
    size: number;
    acquire: () => Promise<T>;
    reset?: (value: T) => Promise<void>;
    release?: (value: T) => Promise<void>;
}
```
