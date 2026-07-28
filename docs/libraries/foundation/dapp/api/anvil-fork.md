---
title: "@kiwa-lab/dapp anvil-fork の API 契約"
---

# <code v-pre>@kiwa-lab/dapp</code> <code v-pre>anvil-fork</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/anvil-fork.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>startAnvilFork</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/anvil-fork.ts#L9) <code v-pre>packages/dapp/src/anvil-fork.ts</code>

```ts
export declare function startAnvilFork(options: ForkOptions): Promise<AnvilHandle>;
```

### 型

#### <code v-pre>ForkOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/anvil-fork.ts#L3) <code v-pre>packages/dapp/src/anvil-fork.ts</code>

```ts
export interface ForkOptions {
    forkUrl: string;
    forkBlockNumber?: bigint;
    port?: number;
}
```
