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
| <code v-pre>createAnvilPool: size must be a positive integer, got $&#123;opts.size&#125;</code> | [packages/dapp/src/anvil-pool.ts](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/anvil-pool.ts#L40) |
| <code v-pre>anvil failed to listen within $&#123;STARTUP&#95;TIMEOUT&#95;MS&#125;ms</code> | [packages/dapp/src/anvil.ts](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/anvil.ts#L198) |
| <code v-pre>Could not determine free port</code> | [packages/dapp/src/anvil.ts](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/anvil.ts#L65) |
| <code v-pre>deployContract did not return contractAddress for tx $&#123;txHash&#125;</code> | [packages/dapp/src/deploy-contract.ts](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/deploy-contract.ts#L69) |
| <code v-pre>forge artifact abi missing or invalid: $&#123;artifactPath&#125;</code> | [packages/dapp/src/deploy-contract.ts](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/deploy-contract.ts#L86) |
| <code v-pre>forge artifact bytecode missing or invalid: $&#123;artifactPath&#125;</code> | [packages/dapp/src/deploy-contract.ts](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/deploy-contract.ts#L92) |
| <code v-pre>kiwa: page script runner is unavailable</code> | [packages/dapp/src/fixture.ts](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/fixture.ts#L289) |
| <code v-pre>kiwa: WalletConfig at index $&#123;index&#125; must be an object</code> | [packages/dapp/src/fixture.ts](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/fixture.ts#L393) |
| <code v-pre>kiwa: WalletConfig.name must be a non-empty string, got $&#123;typeof name&#125;</code> | [packages/dapp/src/fixture.ts](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/fixture.ts#L399) |
| <code v-pre>kiwa: WalletConfig.rdns must be a reverse-DNS name (alnum/./-), got "$&#123;String(rdns)&#125;"</code> | [packages/dapp/src/fixture.ts](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/fixture.ts#L402) |
| <code v-pre>kiwa: WalletConfig.icon must be a data URI (data:image/...), got "$&#123;typeof icon === 'string' ? icon.slice(0, 30) : typeof icon&#125;"</code> | [packages/dapp/src/fixture.ts](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/fixture.ts#L407) |
| <code v-pre>kiwa: WalletConfig.privateKey at index $&#123;index&#125; must be a 0x-prefixed 64-char hex string (32 bytes), got "$&#123;typeof privateKey === 'string' ? privateKey.slice(0, 20) : typeof privateKey&#125;"</code> | [packages/dapp/src/fixture.ts](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/fixture.ts#L412) |
| <code v-pre>kiwa: WalletConfig.chainId at index $&#123;index&#125; must be a positive integer when specified, got $&#123;typeof wallet.chainId === 'number' ? wallet.chainId : typeof wallet.chainId&#125;</code> | [packages/dapp/src/fixture.ts](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/fixture.ts#L422) |
| <code v-pre>kiwa: WalletConfig.isContractAccount at index $&#123;index&#125; must be a boolean when specified, got $&#123;typeof wallet.isContractAccount&#125;</code> | [packages/dapp/src/fixture.ts](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/fixture.ts#L431) |
| <code v-pre>kiwa: WalletConfig.contractAccountAddress at index $&#123;index&#125; must be a 0x-prefixed 40-char address when specified, got "$&#123;typeof wallet.contractAccountAddress === 'string' ? wallet.contractAccountAddress : typeof wallet.contractAccountAddress&#125;"</code> | [packages/dapp/src/fixture.ts](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/fixture.ts#L440) |
| <code v-pre>kiwa: WalletConfig.contractAccountExecuteAbi at index $&#123;index&#125; must be a non-empty string&#91;&#93; when specified</code> | [packages/dapp/src/fixture.ts](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/fixture.ts#L450) |
| <code v-pre>kiwa: WalletConfig.contractAccountAddress at index $&#123;index&#125; is required when isContractAccount=true</code> | [packages/dapp/src/fixture.ts](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/fixture.ts#L456) |
| <code v-pre>kiwa: wallet rdns collision after sanitization: "$&#123;rdns&#125;" -&gt; "$&#123;sanitizedRdns&#125;" (already used by "$&#123;existingRdns&#125;")</code> | [packages/dapp/src/fixture.ts](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/fixture.ts#L464) |
| <code v-pre>kiwa: unknown wallet rdns "$&#123;prop&#125;"</code> | [packages/dapp/src/fixture.ts](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/fixture.ts#L599) |
| <code v-pre>kiwa: missing $&#123;label&#125;</code> | [packages/dapp/src/fixture.ts](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/fixture.ts#L660) |
| <code v-pre>kiwa: setStorageSlot value must be a 32-byte hex (0x + 64 hex chars), got "$&#123;value&#125;"</code> | [packages/dapp/src/set-storage-slot.ts](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/set-storage-slot.ts#L17) |
| <code v-pre>kiwa: setStorageSlot RPC failed with HTTP $&#123;response.status&#125; ($&#123;response.statusText&#125;)</code> | [packages/dapp/src/set-storage-slot.ts](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/set-storage-slot.ts#L36) |
| <code v-pre>kiwa: setStorageSlot RPC error $&#123;payload.error.code&#125;: $&#123;payload.error.message&#125;</code> | [packages/dapp/src/set-storage-slot.ts](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/set-storage-slot.ts#L47) |
| <code v-pre>kiwa: setStorageSlot slot number must be a non-negative integer, got $&#123;slot&#125;</code> | [packages/dapp/src/set-storage-slot.ts](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/set-storage-slot.ts#L56) |
| <code v-pre>kiwa: setStorageSlot slot bigint must be non-negative, got $&#123;slot&#125;</code> | [packages/dapp/src/set-storage-slot.ts](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/set-storage-slot.ts#L62) |
| <code v-pre>kiwa: setStorageSlot slot hex must match /^0x&#91;0-9a-fA-F&#93;+$/, got "$&#123;slot&#125;"</code> | [packages/dapp/src/set-storage-slot.ts](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/set-storage-slot.ts#L67) |
| <code v-pre>withAnvil must be called inside a vitest test file (beforeAll / afterAll missing)</code> | [packages/dapp/src/vitest.ts](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/vitest.ts#L101) |
| <code v-pre>withAnvil env() called before beforeAll resolved</code> | [packages/dapp/src/vitest.ts](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/vitest.ts#L114) |
| <code v-pre>setupTestEnv: anvil and pool options are mutually exclusive</code> | [packages/dapp/src/vitest.ts](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/vitest.ts#L54) |
| <code v-pre>waitForChainState timeout after $&#123;timeoutMs&#125;ms: $&#123;String(functionName)&#125; did not satisfy predicate (last value: $&#123;String(lastValue)&#125;)</code> | [packages/dapp/src/wait-for-chain-state.ts](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/wait-for-chain-state.ts#L90) |
| <code v-pre>kiwa: waitForWalletConnected timed out after $&#123;timeout&#125;ms (testId=$&#123;testId&#125;, expected="$&#123;expectedText&#125;", lastSeen="$&#123;lastSeen&#125;")</code> | [packages/dapp/src/wait-for-wallet-connected.ts](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/wait-for-wallet-connected.ts#L42) |

## API 契約

[公開 entry point](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/index.ts) から同期しています。宣言元ごとにページを分けています。

| 宣言元 | 値 | 型 |
| --- | --- | --- |
| [anvil.ts](./api/anvil) | 2 | 2 |
| [anvil-cluster.ts](./api/anvil-cluster) | 1 | 2 |
| [anvil-default-keys.ts](./api/anvil-default-keys) | 1 | 0 |
| [anvil-fork.ts](./api/anvil-fork) | 1 | 1 |
| [anvil-pool.ts](./api/anvil-pool) | 1 | 3 |
| [balance-change.ts](./api/balance-change) | 2 | 0 |
| [deploy-contract.ts](./api/deploy-contract) | 2 | 3 |
| [e2e-prepare-env.ts](./api/e2e-prepare-env) | 3 | 6 |
| [eip1271.ts](./api/eip1271) | 2 | 1 |
| [event-emitter.ts](./api/event-emitter) | 1 | 0 |
| [expect-custom-error.ts](./api/expect-custom-error) | 1 | 0 |
| [expect-event.ts](./api/expect-event) | 1 | 0 |
| [fixture.ts](./api/fixture) | 4 | 0 |
| [impersonate.ts](./api/impersonate) | 3 | 0 |
| [index.ts](./api/index) | 1 | 7 |
| [inject-multiple-wallets.ts](./api/inject-multiple-wallets) | 1 | 3 |
| [injector-script.ts](./api/injector-script) | 1 | 0 |
| [rpc-handlers.ts](./api/rpc-handlers) | 6 | 1 |
| [set-storage-slot.ts](./api/set-storage-slot) | 1 | 1 |
| [snapshot.ts](./api/snapshot) | 2 | 0 |
| [time.ts](./api/time) | 3 | 0 |
| [tx.ts](./api/tx) | 1 | 0 |
| [types.ts](./api/types) | 1 | 20 |
| [vitest.ts](./api/vitest) | 2 | 6 |
| [wait-for-chain-state.ts](./api/wait-for-chain-state) | 1 | 1 |
| [wait-for-wallet-connected.ts](./api/wait-for-wallet-connected) | 1 | 1 |

<!-- kiwa-public-api:end -->
