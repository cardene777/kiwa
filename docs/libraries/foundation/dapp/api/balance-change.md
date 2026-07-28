---
title: "@kiwa-lab/dapp balance-change の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/dapp</code> <code v-pre>balance-change</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/balance-change.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>expectBalanceChange</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/balance-change.ts#L4) <code v-pre>packages/dapp/src/balance-change.ts</code>

```ts
export declare function expectBalanceChange(client: PublicClient, token: Address, account: Address, delta: bigint, action: () => Promise<void>): Promise<void>;
```

#### <code v-pre>expectEthBalanceChange</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/balance-change.ts#L30) <code v-pre>packages/dapp/src/balance-change.ts</code>

```ts
export declare function expectEthBalanceChange(client: PublicClient, account: Address, delta: bigint, action: () => Promise<void>): Promise<void>;
```


