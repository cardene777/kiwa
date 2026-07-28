---
title: "@kiwa-lab/dapp deploy-contract の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/dapp</code> <code v-pre>deploy-contract</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/deploy-contract.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>deployContract</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/deploy-contract.ts#L45) <code v-pre>packages/dapp/src/deploy-contract.ts</code>

```ts
export declare function deployContract<TAbi extends Abi | readonly unknown[] = Abi>(opts: DeployContractOptions<TAbi>): Promise<DeployContractResult>;
```

#### <code v-pre>loadForgeArtifact</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/deploy-contract.ts#L78) <code v-pre>packages/dapp/src/deploy-contract.ts</code>

```ts
export declare function loadForgeArtifact(opts: LoadForgeArtifactOptions): {
    abi: readonly unknown[];
    bytecode: `0x${string}`;
};
```

### 型

#### <code v-pre>DeployContractOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/deploy-contract.ts#L14) <code v-pre>packages/dapp/src/deploy-contract.ts</code>

```ts
export interface DeployContractOptions<TAbi extends Abi | readonly unknown[] = Abi> {
    account: PrivateKeyAccount | {
        address: `0x${string}`;
    };
    wallet: WalletClient;
    publicClient: PublicClient;
    abi: TAbi;
    bytecode: `0x${string}`;
    args?: ContractConstructorArgs<TAbi>;
}
```

#### <code v-pre>DeployContractResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/deploy-contract.ts#L23) <code v-pre>packages/dapp/src/deploy-contract.ts</code>

```ts
export interface DeployContractResult {
    address: `0x${string}`;
    txHash: `0x${string}`;
    receipt: TransactionReceipt;
}
```

#### <code v-pre>LoadForgeArtifactOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/deploy-contract.ts#L29) <code v-pre>packages/dapp/src/deploy-contract.ts</code>

```ts
export interface LoadForgeArtifactOptions {
    exampleRoot: string;
    contractSlug: string;
}
```
