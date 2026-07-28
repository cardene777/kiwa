---
title: "@kiwa-lab/dapp anvil-cluster の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/dapp</code> <code v-pre>anvil-cluster</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/anvil-cluster.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>startAnvilCluster</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/anvil-cluster.ts#L15) <code v-pre>packages/dapp/src/anvil-cluster.ts</code>

```ts
export declare function startAnvilCluster(opts: AnvilClusterConfig): Promise<AnvilClusterHandle>;
```

### 型

#### <code v-pre>AnvilClusterConfig</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/anvil-cluster.ts#L3) <code v-pre>packages/dapp/src/anvil-cluster.ts</code>

```ts
export interface AnvilClusterConfig {
    chains: Array<{
        chainId: number;
        port: number;
    }>;
}
```

#### <code v-pre>AnvilClusterHandle</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/anvil-cluster.ts#L10) <code v-pre>packages/dapp/src/anvil-cluster.ts</code>

```ts
export interface AnvilClusterHandle {
    chains: Array<AnvilHandle & {
        chainId: number;
    }>;
    stopAll: () => Promise<void>;
}
```
