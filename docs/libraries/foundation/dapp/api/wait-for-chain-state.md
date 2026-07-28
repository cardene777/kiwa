---
title: "@kiwa-lab/dapp wait-for-chain-state の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/dapp</code> <code v-pre>wait-for-chain-state</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/wait-for-chain-state.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>waitForChainState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/wait-for-chain-state.ts#L40) <code v-pre>packages/dapp/src/wait-for-chain-state.ts</code>

Poll a contract view function until `predicate` returns true. Replaces `await page.waitForTimeout(N)` + UI text scraping by direct on-chain read with a deterministic stop condition. Used by examples to remove order-dependent assertion timing.

```ts
export declare function waitForChainState<TValue = unknown, TAbi extends Abi = Abi, TFunctionName extends ContractFunctionName<TAbi, 'pure' | 'view'> = ContractFunctionName<TAbi, 'pure' | 'view'>, TArgs extends ContractFunctionArgs<TAbi, 'pure' | 'view', TFunctionName> = ContractFunctionArgs<TAbi, 'pure' | 'view', TFunctionName>>(opts: WaitForChainStateOptions<TValue, TAbi, TFunctionName, TArgs>): Promise<TValue>;
```

### 型

#### <code v-pre>WaitForChainStateOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/wait-for-chain-state.ts#L8) <code v-pre>packages/dapp/src/wait-for-chain-state.ts</code>

```ts
export interface WaitForChainStateOptions<TValue, TAbi extends Abi = Abi, TFunctionName extends ContractFunctionName<TAbi, 'pure' | 'view'> = ContractFunctionName<TAbi, 'pure' | 'view'>, TArgs extends ContractFunctionArgs<TAbi, 'pure' | 'view', TFunctionName> = ContractFunctionArgs<TAbi, 'pure' | 'view', TFunctionName>> {
    publicClient: PublicClient;
    address: `0x${string}`;
    abi: TAbi;
    functionName: TFunctionName;
    args?: TArgs;
    predicate: (value: TValue) => boolean;
    timeoutMs?: number;
    pollIntervalMs?: number;
}
```
