# @kiwa-lab/dapp reference

[日本語](/libraries/foundation/dapp/reference)

## Playwright fixture

### `dappE2eTest`

A fixture that extends `test` from `@playwright/test`. It is also exported under the alias `test`.

```ts
import { dappE2eTest as test } from "@kiwa-lab/dapp";
```

The option fixtures are `privateKey`, `chainId`, and `wallets`. The default `chainId` is `31337`; the default private key is Anvil's first default key.

| Fixture | Description |
| --- | --- |
| `wallet` | `viem` `PrivateKeyAccount` for the primary wallet |
| `anvilPort` | Port number of the Anvil instance started by the fixture |
| `dappE2e` | Helpers for controlling the provider and wallet |

`dappE2e` has `triggerEvent`, `getAnvilPort`, `connect`, `disconnect`, `switchChain`, `setApprovalMode`, `setApprovalModeForToken?`, `setActiveAccount?`, `setChainRegistry?`, `setRejectConnect?`, and `waitForRpcIdle?`. When you configure multiple wallets, `wallets?: Record<string, WalletApi>` is also available.

Implementation: [`fixture.ts`](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/fixture.ts); types: [`types.ts`](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/types.ts).

## Anvil and test environments

| API | Description |
| --- | --- |
| `startAnvil(options?)` | Starts Anvil and returns `{ port, pid, stop }` |
| `getFreePort()` | Reserves and returns an available port |
| `setupTestEnv(options?)` | Creates a mock or Anvil `TestEnv` |
| `withAnvil(options?)` | Registers environment startup and shutdown with Vitest `beforeAll` / `afterAll` |
| `createAnvilPool(options)` | Creates a pool of prestarted Anvil instances that runs `anvil_reset` when returned |
| `startAnvilFork(options)` | Starts an Anvil instance for a fork |
| `startAnvilCluster(config)` | Starts multiple Anvil instances |

`setupTestEnv()` returns a mock environment by default. Pass `{ anvil: true }` to return an Anvil environment with a clean chain. You cannot specify `anvil` and `pool` at the same time.

Implementation: [`anvil.ts`](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/anvil.ts), [`vitest.ts`](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/vitest.ts), and [`anvil-pool.ts`](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/anvil-pool.ts).

## Chain control and assertion helpers

| API | Description |
| --- | --- |
| `snapshotChain(client)` / `revertChain(client, id)` | Calls `evm_snapshot` and `evm_revert` |
| `increaseTime(client, seconds)` | Calls `evm_increaseTime`, then `evm_mine` |
| `mineBlock(client, count?)` | Calls `evm_mine` the requested number of times |
| `setNextBlockTimestamp(client, timestamp)` | Sets the next block timestamp |
| `setBalance(client, address, wei)` | Sets an account balance |
| `impersonateAccount(client, address)` / `stopImpersonateAccount(client, address)` | Toggles account impersonation in Anvil |
| `expectEvent(...)` / `expectCustomError(...)` | Asserts an event or custom error |
| `expectBalanceChange(...)` / `expectEthBalanceChange(...)` | Asserts a balance change |

The package root also exports `deployContract`, `loadForgeArtifact`, `waitForChainState`, `waitForWalletConnected`, `injectMultipleWallets`, `createInjectorScript`, `runE2EPrepareEnv`, `sendTransaction`, and `verifyEip1271Signature`.

## RPC and types

`handleRpcRequest(context, request)` handles an EIP-1193 request, and `createRpcHandler` creates a handler that connects it to the page. The package exports `Eip1193Provider`, `Eip1193Request`, `Eip1193Error`, `WalletConfig`, `WalletApi`, `ApprovalMode`, and `Eip6963ProviderInfo` types.

For the complete list of public exports, see [`packages/dapp/src/index.ts`](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/index.ts). Treat the [type definitions](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/types.ts) and implementation in the same repository as the primary source for individual parameters and return values.
