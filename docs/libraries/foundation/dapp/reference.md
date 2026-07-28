# @kiwa-lab/dapp リファレンス

## Playwright fixture

### `dappE2eTest`

`@playwright/test` の `test` を拡張した fixture です。別名 `test` としても export されます。

```ts
import { dappE2eTest as test } from "@kiwa-lab/dapp";
```

オプション fixture は `privateKey`、`chainId`、`wallets` です。既定の `chainId` は `31337`、既定の private key は Anvil の最初の既定 key です。

| fixture | 内容 |
| --- | --- |
| `wallet` | primary wallet の `viem` `PrivateKeyAccount` |
| `anvilPort` | fixture が起動した Anvil のポート番号 |
| `dappE2e` | provider と wallet を操作する helper |

`dappE2e` は `triggerEvent`、`getAnvilPort`、`connect`、`disconnect`、`switchChain`、`setApprovalMode`、`setApprovalModeForToken?`、`setActiveAccount?`、`setChainRegistry?`、`setRejectConnect?`、`waitForRpcIdle?` を持ちます。複数 wallet を構成したときは `wallets?: Record<string, WalletApi>` も利用できます。

`waitForRpcIdle` の既定 timeout は 10 秒です。pending RPC が残ったまま timeout すると、未完了 request の要約を含む error で reject します。page を操作して provider request を起こした test では、UI assertion の前に待機を入れてください。

実装: [`fixture.ts`](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/fixture.ts)、型: [`types.ts`](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/types.ts)。

## Anvil とテスト環境

| API | 説明 |
| --- | --- |
| `startAnvil(options?)` | Anvil を起動し、`{ port, pid, stop }` を返す |
| `getFreePort()` | 利用可能なポートを予約して返す |
| `setupTestEnv(options?)` | mock または Anvil の `TestEnv` を作る |
| `withAnvil(options?)` | Vitest の `beforeAll` / `afterAll` に環境の開始・停止を登録する |
| `createAnvilPool(options)` | Anvil を事前起動し、返却時に `anvil_reset` するプールを作る |
| `startAnvilFork(options)` | fork 用 Anvil を起動する |
| `startAnvilCluster(config)` | 複数 Anvil を起動する |

`setupTestEnv()` は既定で mock 環境を返します。`{ anvil: true }` を渡すと clean chain の Anvil 環境を返します。`anvil` と `pool` は同時に指定できません。

実装: [`anvil.ts`](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/anvil.ts)、[`vitest.ts`](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/vitest.ts)、[`anvil-pool.ts`](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/anvil-pool.ts)。

## チェーン操作と検証 helper

| API | 説明 |
| --- | --- |
| `snapshotChain(client)` / `revertChain(client, id)` | `evm_snapshot` と `evm_revert` を呼ぶ |
| `increaseTime(client, seconds)` | `evm_increaseTime` の後に `evm_mine` を呼ぶ |
| `mineBlock(client, count?)` | 指定回数 `evm_mine` を呼ぶ |
| `setNextBlockTimestamp(client, timestamp)` | 次ブロック時刻を設定する |
| `setBalance(client, address, wei)` | アカウント残高を設定する |
| `impersonateAccount(client, address)` / `stopImpersonateAccount(client, address)` | Anvil で account impersonation を切り替える |
| `expectEvent(...)` / `expectCustomError(...)` | event / custom error を検証する |
| `expectBalanceChange(...)` / `expectEthBalanceChange(...)` | 残高変化を検証する |

そのほか、`deployContract`、`loadForgeArtifact`、`waitForChainState`、`waitForWalletConnected`、`injectMultipleWallets`、`createInjectorScript`、`runE2EPrepareEnv`、`sendTransaction`、`verifyEip1271Signature` がルートから export されています。

## RPC と型

`handleRpcRequest(context, request)` は EIP-1193 request を処理し、`createRpcHandler` はページとつなぐ handler を作成します。型として `Eip1193Provider`、`Eip1193Request`、`Eip1193Error`、`WalletConfig`、`WalletApi`、`ApprovalMode`、`Eip6963ProviderInfo` が export されています。

公開 export の完全な一覧は [`packages/dapp/src/index.ts`](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/index.ts) を参照してください。個々の引数・戻り値は同じリポジトリの [型定義](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/types.ts) と実装を一次情報として扱ってください。

<!-- kiwa-public-api:start -->
## エラー診断

次の一覧は、公開 entry point から到達する実装が明示的に送出する Error と TypeError です。template literal の値は実行時の入力で置き換わります。

| 送出する message | 発生箇所 |
| --- | --- |
| &#96;createAnvilPool: size must be a positive integer, got $&#123;opts.size&#125;&#96; | [packages/dapp/src/anvil-pool.ts](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/anvil-pool.ts#L40) |
| &#96;anvil failed to listen within $&#123;STARTUP&#95;TIMEOUT&#95;MS&#125;ms&#96; | [packages/dapp/src/anvil.ts](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/anvil.ts#L158) |
| 'Could not determine free port' | [packages/dapp/src/anvil.ts](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/anvil.ts#L31) |
| &#96;deployContract did not return contractAddress for tx $&#123;txHash&#125;&#96; | [packages/dapp/src/deploy-contract.ts](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/deploy-contract.ts#L69) |
| &#96;forge artifact abi missing or invalid: $&#123;artifactPath&#125;&#96; | [packages/dapp/src/deploy-contract.ts](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/deploy-contract.ts#L86) |
| &#96;forge artifact bytecode missing or invalid: $&#123;artifactPath&#125;&#96; | [packages/dapp/src/deploy-contract.ts](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/deploy-contract.ts#L92) |
| 'kiwa: page script runner is unavailable' | [packages/dapp/src/fixture.ts](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/fixture.ts#L289) |
| &#96;kiwa: WalletConfig at index $&#123;index&#125; must be an object&#96; | [packages/dapp/src/fixture.ts](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/fixture.ts#L393) |
| &#96;kiwa: WalletConfig.name must be a non-empty string, got $&#123;typeof name&#125;&#96; | [packages/dapp/src/fixture.ts](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/fixture.ts#L399) |
| &#96;kiwa: WalletConfig.rdns must be a reverse-DNS name (alnum/./-), got "$&#123;String(rdns)&#125;"&#96; | [packages/dapp/src/fixture.ts](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/fixture.ts#L402) |
| &#96;kiwa: WalletConfig.icon must be a data URI (data:image/...), got "$&#123;typeof icon === 'string' ? icon.slice(0, 30) : typeof icon&#125;"&#96; | [packages/dapp/src/fixture.ts](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/fixture.ts#L407) |
| &#96;kiwa: WalletConfig.privateKey at index $&#123;index&#125; must be a 0x-prefixed 64-char hex string (32 bytes), got "$&#123;typeof privateKey === 'string' ? privateKey.slice(0, 20) : typeof privateKey&#125;"&#96; | [packages/dapp/src/fixture.ts](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/fixture.ts#L412) |
| &#96;kiwa: WalletConfig.chainId at index $&#123;index&#125; must be a positive integer when specified, got $&#123;typeof wallet.chainId === 'number' ? wallet.chainId : typeof wallet.chainId&#125;&#96; | [packages/dapp/src/fixture.ts](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/fixture.ts#L422) |
| &#96;kiwa: WalletConfig.isContractAccount at index $&#123;index&#125; must be a boolean when specified, got $&#123;typeof wallet.isContractAccount&#125;&#96; | [packages/dapp/src/fixture.ts](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/fixture.ts#L431) |
| &#96;kiwa: WalletConfig.contractAccountAddress at index $&#123;index&#125; must be a 0x-prefixed 40-char address when specified, got "$&#123;typeof wallet.contractAccountAddress === 'string' ? wallet.contractAccountAddress : typeof wallet.contractAccountAddress&#125;"&#96; | [packages/dapp/src/fixture.ts](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/fixture.ts#L440) |
| &#96;kiwa: WalletConfig.contractAccountExecuteAbi at index $&#123;index&#125; must be a non-empty string&#91;&#93; when specified&#96; | [packages/dapp/src/fixture.ts](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/fixture.ts#L450) |
| &#96;kiwa: WalletConfig.contractAccountAddress at index $&#123;index&#125; is required when isContractAccount=true&#96; | [packages/dapp/src/fixture.ts](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/fixture.ts#L456) |
| &#96;kiwa: wallet rdns collision after sanitization: "$&#123;rdns&#125;" -&gt; "$&#123;sanitizedRdns&#125;" (already used by "$&#123;existingRdns&#125;")&#96; | [packages/dapp/src/fixture.ts](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/fixture.ts#L464) |
| &#96;kiwa: unknown wallet rdns "$&#123;prop&#125;"&#96; | [packages/dapp/src/fixture.ts](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/fixture.ts#L599) |
| &#96;kiwa: missing $&#123;label&#125;&#96; | [packages/dapp/src/fixture.ts](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/fixture.ts#L660) |
| &#96;kiwa: setStorageSlot value must be a 32-byte hex (0x + 64 hex chars), got "$&#123;value&#125;"&#96; | [packages/dapp/src/set-storage-slot.ts](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/set-storage-slot.ts#L17) |
| &#96;kiwa: setStorageSlot RPC failed with HTTP $&#123;response.status&#125; ($&#123;response.statusText&#125;)&#96; | [packages/dapp/src/set-storage-slot.ts](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/set-storage-slot.ts#L36) |
| &#96;kiwa: setStorageSlot RPC error $&#123;payload.error.code&#125;: $&#123;payload.error.message&#125;&#96; | [packages/dapp/src/set-storage-slot.ts](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/set-storage-slot.ts#L47) |
| &#96;kiwa: setStorageSlot slot number must be a non-negative integer, got $&#123;slot&#125;&#96; | [packages/dapp/src/set-storage-slot.ts](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/set-storage-slot.ts#L56) |
| &#96;kiwa: setStorageSlot slot bigint must be non-negative, got $&#123;slot&#125;&#96; | [packages/dapp/src/set-storage-slot.ts](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/set-storage-slot.ts#L62) |
| &#96;kiwa: setStorageSlot slot hex must match /^0x&#91;0-9a-fA-F&#93;+$/, got "$&#123;slot&#125;"&#96; | [packages/dapp/src/set-storage-slot.ts](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/set-storage-slot.ts#L67) |
| 'withAnvil must be called inside a vitest test file (beforeAll / afterAll missing)' | [packages/dapp/src/vitest.ts](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/vitest.ts#L101) |
| 'withAnvil env() called before beforeAll resolved' | [packages/dapp/src/vitest.ts](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/vitest.ts#L114) |
| 'setupTestEnv: anvil and pool options are mutually exclusive' | [packages/dapp/src/vitest.ts](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/vitest.ts#L54) |
| &#96;waitForChainState timeout after $&#123;timeoutMs&#125;ms: $&#123;String(functionName)&#125; did not satisfy predicate (last value: $&#123;String(lastValue)&#125;)&#96; | [packages/dapp/src/wait-for-chain-state.ts](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/wait-for-chain-state.ts#L90) |
| &#96;kiwa: waitForWalletConnected timed out after $&#123;timeout&#125;ms (testId=$&#123;testId&#125;, expected="$&#123;expectedText&#125;", lastSeen="$&#123;lastSeen&#125;")&#96; | [packages/dapp/src/wait-for-wallet-connected.ts](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/wait-for-wallet-connected.ts#L42) |

## API 契約

この section は [公開 entry point](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/index.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

### 値

#### `ANVIL_DEFAULT_PRIVATE_KEYS`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/anvil-default-keys.ts#L11) `packages/dapp/src/anvil-default-keys.ts`

anvil default mnemonic から生成される 10 個の dev account private keys。 anvil は `--mnemonic "test test test test test test test test test test test junk"` を default に持ち、固定 10 account の private key を生成する。これらは public で安全な値。 `setActiveAccount(index)` で 0-9 のいずれかに切替えて test 内で account picker UI を検証する。

```ts
export declare const ANVIL_DEFAULT_PRIVATE_KEYS: readonly Hex[];
```

#### `createAnvilPool`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/anvil-pool.ts#L38) `packages/dapp/src/anvil-pool.ts`

```ts
export declare function createAnvilPool(opts: AnvilPoolOptions): Promise<AnvilPool>;
```

#### `createEventEmitter`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/event-emitter.ts#L8) `packages/dapp/src/event-emitter.ts`

```ts
export declare function createEventEmitter(): DappE2eEventEmitter;
```

#### `createInjectorScript`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/injector-script.ts#L6) `packages/dapp/src/injector-script.ts`

```ts
export declare function createInjectorScript(opts: InjectorOptions): string;
```

#### `createRpcHandler`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/fixture.ts#L472) `packages/dapp/src/fixture.ts`

```ts
export declare function createRpcHandler(ctx: RpcContext, tracker: InternalFixtures['_rpcTracker']): (request: {
    method: string;
    params?: unknown[];
}) => Promise<unknown>;
```

#### `dappE2eTest`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/fixture.ts#L82) `packages/dapp/src/fixture.ts`

```ts
export declare const dappE2eTest: import("@playwright/test").TestType<import("@playwright/test").PlaywrightTestArgs & import("@playwright/test").PlaywrightTestOptions & DappE2eOptions & DappE2eFixtures & InternalFixtures, import("@playwright/test").PlaywrightWorkerArgs & import("@playwright/test").PlaywrightWorkerOptions>;
```

#### `DEFAULT_CONTRACT_ACCOUNT_EXECUTE_ABI`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/rpc-handlers.ts#L62) `packages/dapp/src/rpc-handlers.ts`

```ts
export declare const DEFAULT_CONTRACT_ACCOUNT_EXECUTE_ABI: readonly ["function execute(address target, uint256 value, bytes data) returns (bytes)"];
```

#### `deployContract`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/deploy-contract.ts#L45) `packages/dapp/src/deploy-contract.ts`

```ts
export declare function deployContract<TAbi extends Abi | readonly unknown[] = Abi>(opts: DeployContractOptions<TAbi>): Promise<DeployContractResult>;
```

#### `Eip1193Error`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/types.ts#L14) `packages/dapp/src/types.ts`

```ts
export declare class Eip1193Error extends Error {
    readonly code: number;
    constructor(code: number, message: string);
}
```

#### `EIP1271_MAGIC_VALUE`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/eip1271.ts#L17) `packages/dapp/src/eip1271.ts`

```ts
export declare const EIP1271_MAGIC_VALUE: "0x1626ba7e";
```

#### `expectBalanceChange`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/balance-change.ts#L4) `packages/dapp/src/balance-change.ts`

```ts
export declare function expectBalanceChange(client: PublicClient, token: Address, account: Address, delta: bigint, action: () => Promise<void>): Promise<void>;
```

#### `expectCustomError`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/expect-custom-error.ts#L52) `packages/dapp/src/expect-custom-error.ts`

```ts
export declare function expectCustomError(error: unknown, errorName: string, expectedArgs?: readonly unknown[]): void;
```

#### `expectEthBalanceChange`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/balance-change.ts#L30) `packages/dapp/src/balance-change.ts`

```ts
export declare function expectEthBalanceChange(client: PublicClient, account: Address, delta: bigint, action: () => Promise<void>): Promise<void>;
```

#### `expectEvent`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/expect-event.ts#L4) `packages/dapp/src/expect-event.ts`

```ts
export declare function expectEvent<TAbi extends Abi>(receipt: TransactionReceipt, abi: TAbi, eventName: string, expectedArgs?: Record<string, unknown>): void;
```

#### `getFreePort`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/anvil.ts#L22) `packages/dapp/src/anvil.ts`

```ts
export declare function getFreePort(): Promise<number>;
```

#### `handleRpcRequest`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/rpc-handlers.ts#L185) `packages/dapp/src/rpc-handlers.ts`

Handle a single EIP-1193 JSON-RPC request from the injected provider. personal_sign accepts either: - A 0x-prefixed even-length hex string (signed as raw bytes, MetaMask compatible) - A plain UTF-8 string (signed with the \x19Ethereum Signed Message:\n prefix) Strings prefixed with 0x that contain non-hex characters or have odd length are rejected with EIP-1193 code -32602 (invalid params).

```ts
export declare function handleRpcRequest(ctx: RpcContext, request: Eip1193Request): Promise<unknown>;
```

#### `impersonateAccount`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/impersonate.ts#L12) `packages/dapp/src/impersonate.ts`

```ts
export declare function impersonateAccount(client: PublicClient, address: Address): Promise<void>;
```

#### `increaseTime`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/time.ts#L12) `packages/dapp/src/time.ts`

```ts
export declare function increaseTime(client: PublicClient, seconds: number | bigint): Promise<void>;
```

#### `injectMultipleWallets`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/inject-multiple-wallets.ts#L24) `packages/dapp/src/inject-multiple-wallets.ts`

```ts
export declare function injectMultipleWallets<TName extends string>(browser: Browser, entries: Record<TName, InjectMultipleWalletsEntry>, options?: InjectMultipleWalletsOptions): Promise<Record<TName, InjectMultipleWalletsResult>>;
```

#### `killAnvilFromPidFile`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/e2e-prepare-env.ts#L157) `packages/dapp/src/e2e-prepare-env.ts`

Kill anvil whose pid was recorded by previous prepare-env run. Used by `tests/global-teardown.ts` (and idempotently by prepare-env itself before respawn).

```ts
export declare function killAnvilFromPidFile(pidFilePath: string): void;
```

#### `loadForgeArtifact`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/deploy-contract.ts#L78) `packages/dapp/src/deploy-contract.ts`

```ts
export declare function loadForgeArtifact(opts: LoadForgeArtifactOptions): {
    abi: readonly unknown[];
    bytecode: `0x${string}`;
};
```

#### `mineBlock`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/time.ts#L20) `packages/dapp/src/time.ts`

```ts
export declare function mineBlock(client: PublicClient, count?: number): Promise<void>;
```

#### `parseEip712TypedDataJson`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/rpc-handlers.ts#L543) `packages/dapp/src/rpc-handlers.ts`

```ts
export declare function parseEip712TypedDataJson(typedDataJson: string): NormalizedEip712TypedData;
```

#### `parseSpec`

公開 entry point から解決しています。

```ts
export { parseSpec } from '@kiwa-lab/core';
```

#### `resolveActiveAddress`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/rpc-handlers.ts#L136) `packages/dapp/src/rpc-handlers.ts`

```ts
export declare function resolveActiveAddress(ctx: RpcContext): Address;
```

#### `resolveActivePrivateKey`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/rpc-handlers.ts#L120) `packages/dapp/src/rpc-handlers.ts`

現在 active な private key を返す。accounts / activeIndex が設定されていればそこから解決、 なければ ctx.privateKey にフォールバックする (下位互換)。

```ts
export declare function resolveActivePrivateKey(ctx: RpcContext): Hex;
```

#### `revertChain`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/snapshot.ts#L16) `packages/dapp/src/snapshot.ts`

```ts
export declare function revertChain(client: PublicClient, snapshotId: Hex): Promise<boolean>;
```

#### `runE2EPrepareEnv`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/e2e-prepare-env.ts#L79) `packages/dapp/src/e2e-prepare-env.ts`

Prepare anvil + contracts + .env.local before Next.js build. Designed to be invoked from `playwright.config.ts` webServer.command as `tsx tests/prepare-env.ts && pnpm build && pnpm start`. After deploy finishes the anvil child is detached so the prepare-env Node process can exit (event loop empty), letting `pnpm build` start next.

```ts
export declare function runE2EPrepareEnv(opts: PrepareEnvOptions): Promise<void>;
```

#### `sendTransaction`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/tx.ts#L79) `packages/dapp/src/tx.ts`

```ts
export declare function sendTransaction(ctx: TxBroadcastCtx, params: SendTxParams): Promise<Hex>;
```

#### `setBalance`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/impersonate.ts#L23) `packages/dapp/src/impersonate.ts`

```ts
export declare function setBalance(client: PublicClient, address: Address, wei: bigint): Promise<void>;
```

#### `setNextBlockTimestamp`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/time.ts#L26) `packages/dapp/src/time.ts`

```ts
export declare function setNextBlockTimestamp(client: PublicClient, ts: number | bigint): Promise<void>;
```

#### `setStorageSlot`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/set-storage-slot.ts#L13) `packages/dapp/src/set-storage-slot.ts`

```ts
export declare function setStorageSlot(params: SetStorageSlotParams): Promise<void>;
```

#### `setupTestEnv`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/vitest.ts#L51) `packages/dapp/src/vitest.ts`

```ts
export declare function setupTestEnv(opts?: SetupTestEnvOptions): Promise<TestEnv>;
```

#### `snapshotChain`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/snapshot.ts#L12) `packages/dapp/src/snapshot.ts`

```ts
export declare function snapshotChain(client: PublicClient): Promise<Hex>;
```

#### `startAnvil`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/anvil.ts#L80) `packages/dapp/src/anvil.ts`

```ts
export declare function startAnvil(opts?: StartAnvilOptions): Promise<AnvilHandle>;
```

#### `startAnvilCluster`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/anvil-cluster.ts#L15) `packages/dapp/src/anvil-cluster.ts`

```ts
export declare function startAnvilCluster(opts: AnvilClusterConfig): Promise<AnvilClusterHandle>;
```

#### `startAnvilFork`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/anvil-fork.ts#L9) `packages/dapp/src/anvil-fork.ts`

```ts
export declare function startAnvilFork(options: ForkOptions): Promise<AnvilHandle>;
```

#### `stopImpersonateAccount`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/impersonate.ts#L16) `packages/dapp/src/impersonate.ts`

```ts
export declare function stopImpersonateAccount(client: PublicClient, address: Address): Promise<void>;
```

#### `verifyAnvilChainId`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/rpc-handlers.ts#L574) `packages/dapp/src/rpc-handlers.ts`

```ts
export declare function verifyAnvilChainId(anvilPort: number, expectedChainId: number): Promise<void>;
```

#### `verifyEip1271Signature`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/eip1271.ts#L26) `packages/dapp/src/eip1271.ts`

```ts
export declare function verifyEip1271Signature(params: VerifyEip1271SignatureParams): Promise<boolean>;
```

#### `verifySignature`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/fixture.ts#L688) `packages/dapp/src/fixture.ts`

```ts
export declare function verifySignature(address: Hex, signature: Hex, message: string | {
    raw: Hex;
}): Promise<boolean>;
```

#### `waitForChainState`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/wait-for-chain-state.ts#L40) `packages/dapp/src/wait-for-chain-state.ts`

Poll a contract view function until `predicate` returns true. Replaces `await page.waitForTimeout(N)` + UI text scraping by direct on-chain read with a deterministic stop condition. Used by examples to remove order-dependent assertion timing.

```ts
export declare function waitForChainState<TValue = unknown, TAbi extends Abi = Abi, TFunctionName extends ContractFunctionName<TAbi, 'pure' | 'view'> = ContractFunctionName<TAbi, 'pure' | 'view'>, TArgs extends ContractFunctionArgs<TAbi, 'pure' | 'view', TFunctionName> = ContractFunctionArgs<TAbi, 'pure' | 'view', TFunctionName>>(opts: WaitForChainStateOptions<TValue, TAbi, TFunctionName, TArgs>): Promise<TValue>;
```

#### `waitForPendingRpcs`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/fixture.ts#L331) `packages/dapp/src/fixture.ts`

```ts
export declare function waitForPendingRpcs(page: Page, pendingRpcs: Map<number, PendingRpcEntry>, timeoutMs?: number): Promise<void>;
```

#### `waitForWalletConnected`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/wait-for-wallet-connected.ts#L15) `packages/dapp/src/wait-for-wallet-connected.ts`

```ts
export declare function waitForWalletConnected(page: Page, options?: WaitForWalletConnectedOptions): Promise<void>;
```

#### `withAnvil`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/vitest.ts#L94) `packages/dapp/src/vitest.ts`

```ts
export declare function withAnvil(opts?: SetupTestEnvOptions): WithAnvilLifecycle;
```

#### `writePidEntry`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/e2e-prepare-env.ts#L165) `packages/dapp/src/e2e-prepare-env.ts`

```ts
export declare function writePidEntry(pidFilePath: string, entry: PidEntry): void;
```

### 型

#### `Address`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/types.ts#L2) `packages/dapp/src/types.ts`

```ts
export type Address = `0x${string}`;
```

#### `AnvilClusterConfig`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/anvil-cluster.ts#L3) `packages/dapp/src/anvil-cluster.ts`

```ts
export interface AnvilClusterConfig {
    chains: Array<{
        chainId: number;
        port: number;
    }>;
}
```

#### `AnvilClusterHandle`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/anvil-cluster.ts#L10) `packages/dapp/src/anvil-cluster.ts`

```ts
export interface AnvilClusterHandle {
    chains: Array<AnvilHandle & {
        chainId: number;
    }>;
    stopAll: () => Promise<void>;
}
```

#### `AnvilHandle`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/anvil.ts#L16) `packages/dapp/src/anvil.ts`

```ts
export interface AnvilHandle {
    port: number;
    pid: number;
    stop: () => Promise<void>;
}
```

#### `AnvilLease`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/anvil-pool.ts#L10) `packages/dapp/src/anvil-pool.ts`

```ts
export interface AnvilLease {
    handle: AnvilHandle;
    rpcUrl: string;
    /** return this anvil to the pool (anvil_reset is invoked before reuse) */
    release: () => Promise<void>;
}
```

#### `AnvilModeOption`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/vitest.ts#L5) `packages/dapp/src/vitest.ts`

```ts
export type AnvilModeOption = boolean | (StartAnvilOptions & {
    enabled?: boolean;
});
```

#### `AnvilPool`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/anvil-pool.ts#L17) `packages/dapp/src/anvil-pool.ts`

```ts
export interface AnvilPool {
    size: number;
    /** take an anvil out of the pool, waiting if none are free */
    borrow: () => Promise<AnvilLease>;
    /** stop every anvil and clear the pool */
    stopAll: () => Promise<void>;
}
```

#### `AnvilPoolOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/anvil-pool.ts#L3) `packages/dapp/src/anvil-pool.ts`

```ts
export interface AnvilPoolOptions {
    /** number of anvil instances to pre-spawn */
    size: number;
    /** options applied to every anvil in the pool */
    anvil?: Omit<StartAnvilOptions, 'port'>;
}
```

#### `AnvilTestEnv`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/vitest.ts#L32) `packages/dapp/src/vitest.ts`

```ts
export interface AnvilTestEnv {
    mode: 'anvil';
    rpcUrl: string;
    port: number;
    anvil: AnvilHandle;
    privateKeys: readonly string[];
    stop: () => Promise<void>;
}
```

#### `ApprovalMode`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/types.ts#L113) `packages/dapp/src/types.ts`

```ts
export type ApprovalMode = 'approve' | 'reject';
```

#### `ApprovalPolicy`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/types.ts#L115) `packages/dapp/src/types.ts`

```ts
export interface ApprovalPolicy {
    default: ApprovalMode;
    perToken?: Record<Hex, {
        mode: ApprovalMode;
        limit?: bigint;
    }>;
}
```

#### `ChainConfig`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/types.ts#L52) `packages/dapp/src/types.ts`

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

#### `ContractAccountRpcConfig`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/types.ts#L106) `packages/dapp/src/types.ts`

```ts
export interface ContractAccountRpcConfig {
    address: Address;
    executeAbi: readonly string[];
}
```

#### `DappE2eApi`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/types.ts#L154) `packages/dapp/src/types.ts`

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

#### `DappE2eEventEmitter`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/types.ts#L147) `packages/dapp/src/types.ts`

```ts
export interface DappE2eEventEmitter {
    on(event: Eip1193EventName, handler: Eip1193EventHandler): void;
    off(event: Eip1193EventName, handler: Eip1193EventHandler): void;
    emit(event: Eip1193EventName, ...args: unknown[]): void;
    listenerCount(event: Eip1193EventName): number;
}
```

#### `DeployContractOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/deploy-contract.ts#L14) `packages/dapp/src/deploy-contract.ts`

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

#### `DeployContractResult`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/deploy-contract.ts#L23) `packages/dapp/src/deploy-contract.ts`

```ts
export interface DeployContractResult {
    address: `0x${string}`;
    txHash: `0x${string}`;
    receipt: TransactionReceipt;
}
```

#### `Eip1193EventHandler`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/types.ts#L111) `packages/dapp/src/types.ts`

```ts
export type Eip1193EventHandler = (...args: unknown[]) => void;
```

#### `Eip1193EventName`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/types.ts#L64) `packages/dapp/src/types.ts`

```ts
export type Eip1193EventName = 'accountsChanged' | 'chainChanged' | 'connect' | 'disconnect';
```

#### `Eip1193Provider`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/types.ts#L9) `packages/dapp/src/types.ts`

```ts
export interface Eip1193Provider {
    request(args: Eip1193Request): Promise<unknown>;
    isMetaMask?: boolean;
}
```

#### `Eip1193Request`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/types.ts#L4) `packages/dapp/src/types.ts`

```ts
export interface Eip1193Request {
    method: string;
    params?: readonly unknown[];
}
```

#### `Eip6963ProviderInfo`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/types.ts#L24) `packages/dapp/src/types.ts`

```ts
export interface Eip6963ProviderInfo {
    uuid: string;
    name: string;
    icon: string;
    rdns: string;
}
```

#### `Eip712Domain`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/types.ts#L70) `packages/dapp/src/types.ts`

```ts
export interface Eip712Domain {
    name?: string;
    version?: string;
    chainId?: number;
    verifyingContract?: Hex;
    salt?: Hex;
}
```

#### `Eip712TypedData`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/types.ts#L78) `packages/dapp/src/types.ts`

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

#### `ForkOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/anvil-fork.ts#L3) `packages/dapp/src/anvil-fork.ts`

```ts
export interface ForkOptions {
    forkUrl: string;
    forkBlockNumber?: bigint;
    port?: number;
}
```

#### `Hex`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/types.ts#L1) `packages/dapp/src/types.ts`

```ts
export type Hex = `0x${string}`;
```

#### `InjectMultipleWalletsEntry`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/inject-multiple-wallets.ts#L5) `packages/dapp/src/inject-multiple-wallets.ts`

```ts
export interface InjectMultipleWalletsEntry {
    privateKey: Hex;
    chainId?: number;
    wallets?: WalletConfig[];
}
```

#### `InjectMultipleWalletsOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/inject-multiple-wallets.ts#L17) `packages/dapp/src/inject-multiple-wallets.ts`

```ts
export interface InjectMultipleWalletsOptions {
    defaultChainId?: number;
    baseUrl?: string;
}
```

#### `InjectMultipleWalletsResult`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/inject-multiple-wallets.ts#L11) `packages/dapp/src/inject-multiple-wallets.ts`

```ts
export interface InjectMultipleWalletsResult {
    context: BrowserContext;
    page: Page;
    close: () => Promise<void>;
}
```

#### `InjectorOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/types.ts#L42) `packages/dapp/src/types.ts`

```ts
export interface InjectorOptions {
    privateKey: Hex;
    chainId: number;
    wallets?: WalletConfig[];
}
```

#### `LoadForgeArtifactOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/deploy-contract.ts#L29) `packages/dapp/src/deploy-contract.ts`

```ts
export interface LoadForgeArtifactOptions {
    exampleRoot: string;
    contractSlug: string;
}
```

#### `MockTestEnv`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/vitest.ts#L23) `packages/dapp/src/vitest.ts`

```ts
export interface MockTestEnv {
    mode: 'mock';
    rpcUrl: null;
    port: null;
    anvil: null;
    privateKeys: readonly string[];
    stop: () => Promise<void>;
}
```

#### `PidEntry`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/e2e-prepare-env.ts#L65) `packages/dapp/src/e2e-prepare-env.ts`

```ts
export interface PidEntry {
    pid: number;
    port?: number;
    startedAt?: string;
    command?: string;
}
```

#### `PrepareEnvDeployContext`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/e2e-prepare-env.ts#L38) `packages/dapp/src/e2e-prepare-env.ts`

```ts
export interface PrepareEnvDeployContext {
    account: PrivateKeyAccount;
    wallet: PrepareEnvWalletClient;
    publicClient: PrepareEnvPublicClient;
    chain: Chain;
    port: number;
    exampleRoot: string;
}
```

#### `PrepareEnvDeployFn`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/e2e-prepare-env.ts#L47) `packages/dapp/src/e2e-prepare-env.ts`

```ts
export type PrepareEnvDeployFn = (ctx: PrepareEnvDeployContext) => Promise<Record<string, string>>;
```

#### `PrepareEnvOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/e2e-prepare-env.ts#L51) `packages/dapp/src/e2e-prepare-env.ts`

```ts
export interface PrepareEnvOptions {
    exampleRoot: string;
    port?: number;
    chainId?: number;
    privateKey?: Hex;
    /** path to write `.env.local`, relative to exampleRoot (default: '.env.local') */
    envLocalPath?: string;
    /** path to .next directory to clean before build, relative to exampleRoot (default: '.next') */
    nextCacheDir?: string;
    /** path to store anvil pid, relative to exampleRoot (default: '.context/anvil.pid') */
    pidFilePath?: string;
    deploy: PrepareEnvDeployFn;
}
```

#### `PrepareEnvPublicClient`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/e2e-prepare-env.ts#L36) `packages/dapp/src/e2e-prepare-env.ts`

```ts
export type PrepareEnvPublicClient = PublicClient<HttpTransport, Chain>;
```

#### `PrepareEnvWalletClient`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/e2e-prepare-env.ts#L35) `packages/dapp/src/e2e-prepare-env.ts`

```ts
export type PrepareEnvWalletClient = WalletClient<HttpTransport, Chain, PrivateKeyAccount>;
```

#### `RpcContext`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/rpc-handlers.ts#L28) `packages/dapp/src/rpc-handlers.ts`

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

#### `SendTxParams`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/types.ts#L88) `packages/dapp/src/types.ts`

```ts
export interface SendTxParams {
    to?: Hex;
    value?: Hex | bigint;
    data?: Hex;
    from?: Hex;
    gas?: Hex | bigint;
}
```

#### `SetStorageSlotParams`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/set-storage-slot.ts#L3) `packages/dapp/src/set-storage-slot.ts`

```ts
export interface SetStorageSlotParams {
    rpcUrl: string;
    address: Address;
    slot: number | bigint | Hex;
    value: Hex;
}
```

#### `SetupTestEnvOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/vitest.ts#L7) `packages/dapp/src/vitest.ts`

```ts
export interface SetupTestEnvOptions {
    /**
     * anvil 起動方針。
     * - 未指定 / false ... anvil を起動しない (mock 経路)
     * - true ... clean chain で anvil を起動
     * - object ... StartAnvilOptions を全て透過 (loadState / dumpState / chainId / port 等)
     */
    anvil?: AnvilModeOption;
    /**
     * Anvil pool を指定すると spawn ではなく pool.borrow() で取得し、
     * stop() で pool.release() (anvil_reset) を呼んで再利用する。
     * anvil option と排他、 pool 指定時は pool が anvil 起動を担う。
     */
    pool?: AnvilPool;
}
```

#### `SpecCase`

公開 entry point から解決しています。

```ts
export type {
  TestLayer,
  TestMode,
  TestEnvBase,
  Lease as SpecLease,
  Pool as SpecPool,
  SpecDoc,
  SpecCase,
} from '@kiwa-lab/core';
```

#### `SpecDoc`

公開 entry point から解決しています。

```ts
export type {
  TestLayer,
  TestMode,
  TestEnvBase,
  Lease as SpecLease,
  Pool as SpecPool,
  SpecDoc,
  SpecCase,
} from '@kiwa-lab/core';
```

#### `SpecLease`

公開 entry point から解決しています。

`Lease` を `SpecLease` として公開しています。

```ts
export type {
  TestLayer,
  TestMode,
  TestEnvBase,
  Lease as SpecLease,
  Pool as SpecPool,
  SpecDoc,
  SpecCase,
} from '@kiwa-lab/core';
```

#### `SpecPool`

公開 entry point から解決しています。

`Pool` を `SpecPool` として公開しています。

```ts
export type {
  TestLayer,
  TestMode,
  TestEnvBase,
  Lease as SpecLease,
  Pool as SpecPool,
  SpecDoc,
  SpecCase,
} from '@kiwa-lab/core';
```

#### `StartAnvilOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/anvil.ts#L67) `packages/dapp/src/anvil.ts`

```ts
export interface StartAnvilOptions {
    port?: number;
    chainId?: number;
    /** detach child so Node parent can exit while anvil keeps running (default: false) */
    detached?: boolean;
    /** kill existing anvil on the port before spawn (default: false) */
    killExistingOnPort?: boolean;
    /** path to pre-built state json to load at startup (anvil --load-state) */
    loadState?: string;
    /** path to write state json when anvil shuts down (anvil --dump-state) */
    dumpState?: string;
}
```

#### `TestEnv`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/vitest.ts#L41) `packages/dapp/src/vitest.ts`

```ts
export type TestEnv = MockTestEnv | AnvilTestEnv;
```

#### `TestEnvBase`

公開 entry point から解決しています。

```ts
export type {
  TestLayer,
  TestMode,
  TestEnvBase,
  Lease as SpecLease,
  Pool as SpecPool,
  SpecDoc,
  SpecCase,
} from '@kiwa-lab/core';
```

#### `TestLayer`

公開 entry point から解決しています。

```ts
export type {
  TestLayer,
  TestMode,
  TestEnvBase,
  Lease as SpecLease,
  Pool as SpecPool,
  SpecDoc,
  SpecCase,
} from '@kiwa-lab/core';
```

#### `TestMode`

公開 entry point から解決しています。

```ts
export type {
  TestLayer,
  TestMode,
  TestEnvBase,
  Lease as SpecLease,
  Pool as SpecPool,
  SpecDoc,
  SpecCase,
} from '@kiwa-lab/core';
```

#### `TxBroadcastCtx`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/types.ts#L96) `packages/dapp/src/types.ts`

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

#### `VerifyEip1271SignatureParams`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/eip1271.ts#L19) `packages/dapp/src/eip1271.ts`

```ts
export interface VerifyEip1271SignatureParams {
    publicClient: Pick<PublicClient, 'call'>;
    contractAddress: Hex;
    messageHash: Hex;
    signature: Hex;
}
```

#### `WaitForChainStateOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/wait-for-chain-state.ts#L8) `packages/dapp/src/wait-for-chain-state.ts`

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

#### `WaitForWalletConnectedOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/wait-for-wallet-connected.ts#L3) `packages/dapp/src/wait-for-wallet-connected.ts`

```ts
export interface WaitForWalletConnectedOptions {
    testId?: string;
    expectedText?: string;
    timeout?: number;
    pollInterval?: number;
}
```

#### `WalletApi`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/types.ts#L120) `packages/dapp/src/types.ts`

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

#### `WalletConfig`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/types.ts#L31) `packages/dapp/src/types.ts`

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

#### `WithAnvilLifecycle`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/vitest.ts#L90) `packages/dapp/src/vitest.ts`

```ts
export interface WithAnvilLifecycle {
    env: () => TestEnv;
}
```
<!-- kiwa-public-api:end -->
