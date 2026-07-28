---
title: "@kiwa-lab/dapp anvil-pool の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/dapp</code> <code v-pre>anvil-pool</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/anvil-pool.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>createAnvilPool</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/anvil-pool.ts#L38) <code v-pre>packages/dapp/src/anvil-pool.ts</code>

```ts
export declare function createAnvilPool(opts: AnvilPoolOptions): Promise<AnvilPool>;
```

### 型

#### <code v-pre>AnvilLease</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/anvil-pool.ts#L10) <code v-pre>packages/dapp/src/anvil-pool.ts</code>

```ts
export interface AnvilLease {
    handle: AnvilHandle;
    rpcUrl: string;
    /** return this anvil to the pool (anvil_reset is invoked before reuse) */
    release: () => Promise<void>;
}
```

#### <code v-pre>AnvilPool</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/anvil-pool.ts#L17) <code v-pre>packages/dapp/src/anvil-pool.ts</code>

```ts
export interface AnvilPool {
    size: number;
    /** take an anvil out of the pool, waiting if none are free */
    borrow: () => Promise<AnvilLease>;
    /** stop every anvil and clear the pool */
    stopAll: () => Promise<void>;
}
```

#### <code v-pre>AnvilPoolOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/anvil-pool.ts#L3) <code v-pre>packages/dapp/src/anvil-pool.ts</code>

```ts
export interface AnvilPoolOptions {
    /** number of anvil instances to pre-spawn */
    size: number;
    /** options applied to every anvil in the pool */
    anvil?: Omit<StartAnvilOptions, 'port'>;
}
```
