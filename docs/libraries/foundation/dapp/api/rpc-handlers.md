---
title: "@kiwa-lab/dapp rpc-handlers の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/dapp</code> <code v-pre>rpc-handlers</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/rpc-handlers.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>DEFAULT&#95;CONTRACT&#95;ACCOUNT&#95;EXECUTE&#95;ABI</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/rpc-handlers.ts#L62) <code v-pre>packages/dapp/src/rpc-handlers.ts</code>

```ts
export declare const DEFAULT_CONTRACT_ACCOUNT_EXECUTE_ABI: readonly ["function execute(address target, uint256 value, bytes data) returns (bytes)"];
```

#### <code v-pre>handleRpcRequest</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/rpc-handlers.ts#L185) <code v-pre>packages/dapp/src/rpc-handlers.ts</code>

Handle a single EIP-1193 JSON-RPC request from the injected provider. personal_sign accepts either: - A 0x-prefixed even-length hex string (signed as raw bytes, MetaMask compatible) - A plain UTF-8 string (signed with the \x19Ethereum Signed Message:\n prefix) Strings prefixed with 0x that contain non-hex characters or have odd length are rejected with EIP-1193 code -32602 (invalid params).

```ts
export declare function handleRpcRequest(ctx: RpcContext, request: Eip1193Request): Promise<unknown>;
```

#### <code v-pre>parseEip712TypedDataJson</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/rpc-handlers.ts#L543) <code v-pre>packages/dapp/src/rpc-handlers.ts</code>

```ts
export declare function parseEip712TypedDataJson(typedDataJson: string): NormalizedEip712TypedData;
```

#### <code v-pre>resolveActiveAddress</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/rpc-handlers.ts#L136) <code v-pre>packages/dapp/src/rpc-handlers.ts</code>

```ts
export declare function resolveActiveAddress(ctx: RpcContext): Address;
```

#### <code v-pre>resolveActivePrivateKey</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/rpc-handlers.ts#L120) <code v-pre>packages/dapp/src/rpc-handlers.ts</code>

現在 active な private key を返す。accounts / activeIndex が設定されていればそこから解決、 なければ ctx.privateKey にフォールバックする (下位互換)。

```ts
export declare function resolveActivePrivateKey(ctx: RpcContext): Hex;
```

#### <code v-pre>verifyAnvilChainId</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/rpc-handlers.ts#L574) <code v-pre>packages/dapp/src/rpc-handlers.ts</code>

```ts
export declare function verifyAnvilChainId(anvilPort: number, expectedChainId: number): Promise<void>;
```

### 型

#### <code v-pre>RpcContext</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/rpc-handlers.ts#L28) <code v-pre>packages/dapp/src/rpc-handlers.ts</code>

```ts
export interface RpcContext {
    privateKey: Hex;
    /**
     * setActiveAccount(index) で切替可能な複数 dev account の private key 配列。
     * 未指定の場合は `[privateKey]` 相当として扱い (下位互換)、activeIndex も常に 0 に固定。
     */
    accounts?: readonly Hex[];
    /**
     * accounts 配列内の active な index。setActiveAccount で更新される。
     * 範囲は `[0, accounts.length - 1]`、accounts 未指定なら 0 固定。
     */
    activeIndex?: {
        current: number;
    };
    chainState: {
        current: number;
    };
    approvalMode?: {
        current: ApprovalMode;
    };
    approvalPolicy?: {
        current: ApprovalPolicy;
    };
    anvilPort?: number;
    emitter?: DappE2eEventEmitter;
    /**
     * 登録済 chain の registry。
     * `wallet_switchEthereumChain` が参照し、未登録 chainId は EIP-1193 code 4902 で reject する。
     * 未指定 (undefined) の場合は registry チェック自体が無効化される (下位互換、従来挙動)。
     */
    chainRegistry?: {
        current: ChainConfig[];
    };
    contractAccount?: ContractAccountRpcConfig;
    /**
     * true の場合 `eth_requestAccounts` を approval policy の対象とし、
     * approvalPolicy.default === 'reject' (または approvalMode === 'reject') のとき
     * EIP-1193 code 4001 で reject する。connect reject UI flow の検証用 opt-in。
     * `eth_accounts` は EIP-1193 上 read-only (現在 connected account の確認) のため対象外。
     * 未指定 (undefined) または false の場合は従来挙動 (常に accounts を返す) を維持。
     */
    rejectConnect?: {
        current: boolean;
    };
}
```
