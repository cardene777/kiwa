---
title: "@kiwa-lab/dapp types の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/dapp</code> <code v-pre>types</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/types.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>Eip1193Error</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/types.ts#L14) <code v-pre>packages/dapp/src/types.ts</code>

```ts
export declare class Eip1193Error extends Error {
    readonly code: number;
    constructor(code: number, message: string);
}
```

### 型

#### <code v-pre>Address</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/types.ts#L2) <code v-pre>packages/dapp/src/types.ts</code>

```ts
export type Address = `0x${string}`;
```

#### <code v-pre>ApprovalMode</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/types.ts#L113) <code v-pre>packages/dapp/src/types.ts</code>

```ts
export type ApprovalMode = 'approve' | 'reject';
```

#### <code v-pre>ApprovalPolicy</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/types.ts#L115) <code v-pre>packages/dapp/src/types.ts</code>

```ts
export interface ApprovalPolicy {
    default: ApprovalMode;
    perToken?: Record<Hex, {
        mode: ApprovalMode;
        limit?: bigint;
    }>;
}
```

#### <code v-pre>ChainConfig</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/types.ts#L52) <code v-pre>packages/dapp/src/types.ts</code>

EIP-3085 (wallet_addEthereumChain) parameters の subset。 chain registry に登録されるエントリの最小形式。

```ts
export interface ChainConfig {
    chainId: Hex;
    chainName?: string;
    rpcUrls?: readonly string[];
    nativeCurrency?: {
        name: string;
        symbol: string;
        decimals: number;
    };
    blockExplorerUrls?: readonly string[];
}
```

#### <code v-pre>ContractAccountRpcConfig</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/types.ts#L106) <code v-pre>packages/dapp/src/types.ts</code>

```ts
export interface ContractAccountRpcConfig {
    address: Address;
    executeAbi: readonly string[];
}
```

#### <code v-pre>DappE2eApi</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/types.ts#L154) <code v-pre>packages/dapp/src/types.ts</code>

```ts
export interface DappE2eApi {
    triggerEvent(event: Eip1193EventName, ...args: unknown[]): Promise<void>;
    getAnvilPort(): number;
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    switchChain(chainIdHex: Hex): Promise<void>;
    setApprovalMode(mode: ApprovalMode): Promise<void>;
    setApprovalModeForToken?(tokenAddress: Hex, policy: {
        mode: ApprovalMode;
        limit?: bigint;
    }): Promise<void>;
    /**
     * 複数 account を持つ wallet で active account を切替える (primary wallet 経由)。
     * 内部で `accountsChanged` event を自動発火する。
     */
    setActiveAccount?(index: number): Promise<void>;
    /**
     * chain registry を test 内から書き換える (primary wallet 経由)。
     * 以後の `wallet_switchEthereumChain` で未登録 chainId は EIP-1193 code 4902 で reject。
     */
    setChainRegistry?(chains: readonly ChainConfig[]): Promise<void>;
    /**
     * `eth_requestAccounts` を approval policy の対象に含めるか切替える (primary wallet 経由)。
     * `setApprovalMode('reject')` と組み合わせて connect reject UI flow を検証する。
     */
    setRejectConnect?(enabled: boolean): Promise<void>;
    waitForRpcIdle?(timeoutMs?: number): Promise<void>;
    wallets?: Record<string, WalletApi>;
}
```

#### <code v-pre>DappE2eEventEmitter</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/types.ts#L147) <code v-pre>packages/dapp/src/types.ts</code>

```ts
export interface DappE2eEventEmitter {
    on(event: Eip1193EventName, handler: Eip1193EventHandler): void;
    off(event: Eip1193EventName, handler: Eip1193EventHandler): void;
    emit(event: Eip1193EventName, ...args: unknown[]): void;
    listenerCount(event: Eip1193EventName): number;
}
```

#### <code v-pre>Eip1193EventHandler</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/types.ts#L111) <code v-pre>packages/dapp/src/types.ts</code>

```ts
export type Eip1193EventHandler = (...args: unknown[]) => void;
```

#### <code v-pre>Eip1193EventName</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/types.ts#L64) <code v-pre>packages/dapp/src/types.ts</code>

```ts
export type Eip1193EventName = 'accountsChanged' | 'chainChanged' | 'connect' | 'disconnect';
```

#### <code v-pre>Eip1193Provider</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/types.ts#L9) <code v-pre>packages/dapp/src/types.ts</code>

```ts
export interface Eip1193Provider {
    request(args: Eip1193Request): Promise<unknown>;
    isMetaMask?: boolean;
}
```

#### <code v-pre>Eip1193Request</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/types.ts#L4) <code v-pre>packages/dapp/src/types.ts</code>

```ts
export interface Eip1193Request {
    method: string;
    params?: readonly unknown[];
}
```

#### <code v-pre>Eip6963ProviderInfo</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/types.ts#L24) <code v-pre>packages/dapp/src/types.ts</code>

```ts
export interface Eip6963ProviderInfo {
    uuid: string;
    name: string;
    icon: string;
    rdns: string;
}
```

#### <code v-pre>Eip712Domain</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/types.ts#L70) <code v-pre>packages/dapp/src/types.ts</code>

```ts
export interface Eip712Domain {
    name?: string;
    version?: string;
    chainId?: number;
    verifyingContract?: Hex;
    salt?: Hex;
}
```

#### <code v-pre>Eip712TypedData</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/types.ts#L78) <code v-pre>packages/dapp/src/types.ts</code>

```ts
export interface Eip712TypedData {
    domain: Eip712Domain;
    types: Record<string, ReadonlyArray<{
        readonly name: string;
        readonly type: string;
    }>>;
    primaryType: string;
    message: Record<string, unknown>;
}
```

#### <code v-pre>Hex</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/types.ts#L1) <code v-pre>packages/dapp/src/types.ts</code>

```ts
export type Hex = `0x${string}`;
```

#### <code v-pre>InjectorOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/types.ts#L42) <code v-pre>packages/dapp/src/types.ts</code>

```ts
export interface InjectorOptions {
    privateKey: Hex;
    chainId: number;
    wallets?: WalletConfig[];
}
```

#### <code v-pre>SendTxParams</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/types.ts#L88) <code v-pre>packages/dapp/src/types.ts</code>

```ts
export interface SendTxParams {
    to?: Hex;
    value?: Hex | bigint;
    data?: Hex;
    from?: Hex;
    gas?: Hex | bigint;
}
```

#### <code v-pre>TxBroadcastCtx</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/types.ts#L96) <code v-pre>packages/dapp/src/types.ts</code>

```ts
export interface TxBroadcastCtx {
    privateKey: Hex;
    chainId: number;
    anvilPort: number;
    /** viem http transport timeout in ms (default 5000) */
    transportTimeoutMs?: number;
    /** viem http transport retry count (default 0, fail-fast for transport errors) */
    transportRetryCount?: number;
}
```

#### <code v-pre>WalletApi</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/types.ts#L120) <code v-pre>packages/dapp/src/types.ts</code>

```ts
export interface WalletApi {
    triggerEvent(event: Eip1193EventName, ...args: unknown[]): Promise<void>;
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    switchChain(chainIdHex: Hex): Promise<void>;
    setApprovalMode(mode: ApprovalMode): Promise<void>;
    setApprovalModeForToken?(tokenAddress: Hex, policy: {
        mode: ApprovalMode;
        limit?: bigint;
    }): Promise<void>;
    /**
     * 複数 account を持つ wallet で active account を切替える。
     * 範囲外 index で throw、内部で `accountsChanged` event を自動発火する。
     */
    setActiveAccount?(index: number): Promise<void>;
    /**
     * chain registry を test 内から書き換える。
     * 以後の `wallet_switchEthereumChain` は本 registry を参照し、未登録 chainId は 4902 で reject する。
     */
    setChainRegistry?(chains: readonly ChainConfig[]): Promise<void>;
    /**
     * `eth_requestAccounts` を approval policy (reject mode) の対象に含めるかを切替える。
     * 試用先で connect reject UI flow を検証するときに `true` にする。default は `false` (従来挙動)。
     */
    setRejectConnect?(enabled: boolean): Promise<void>;
}
```

#### <code v-pre>WalletConfig</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/types.ts#L31) <code v-pre>packages/dapp/src/types.ts</code>

```ts
export interface WalletConfig {
    name: string;
    rdns: string;
    icon: string;
    privateKey: Hex;
    chainId?: number;
    isContractAccount?: boolean;
    contractAccountAddress?: Address;
    contractAccountExecuteAbi?: string[];
}
```
