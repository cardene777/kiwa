# API Reference

> [🇬🇧 English](./README.md) • [🇯🇵 日本語](../../ja/api/README.md)

Main API exported from `@kiwa-test/core`.

## Fixture / anvil

| Function / Type | Role |
|---|---|
| [`dappE2eTest`](./dapp-e2e-test.md) | Playwright `test` extended for dApps |
| [`startAnvil`](./start-anvil.md) | Spawn anvil and wait for ready |
| [`startAnvilCluster`](./test-helpers.md#startanvilcluster) | Spawn multiple anvil processes with distinct chain ids (multi-chain tests) |
| [`startAnvilFork`](./test-helpers.md#startanvilfork) | Thin wrapper for `anvil --fork-url` (mainnet / sepolia fork) |
| [`waitForChainState`](./wait-for-chain-state.md) | Predicate-based contract view polling |
| [`getFreePort`](./get-free-port.md) | Obtain an OS-allocated free port |
| [`AnvilHandle`](./anvil-handle.md) | Return type of `startAnvil` (port + stop helper) |

## Test helpers (v0.2+)

Standard helpers comparable to hardhat / foundry / viem / hardhat-chai-matchers. See [test-helpers.md](./test-helpers.md) for details.

| Function | Role |
|---|---|
| `snapshotChain(client)` / `revertChain(client, id)` | `evm_snapshot` / `evm_revert` wrapper for inter-test isolation |
| `expectCustomError(error, errorName)` | viem `BaseError` + `ContractFunctionRevertedError` chain walk |
| `increaseTime(client, sec)` / `mineBlock(client, n?)` / `setNextBlockTimestamp(client, ts)` | Time manipulation (vesting / TTL / timelock) |
| `impersonateAccount(client, addr)` / `setBalance(client, addr, wei)` | Impersonate arbitrary EOA / contract + inject balance |
| `expectEvent(receipt, abi, eventName, args?)` | `decodeEventLog` + assertion combined |
| `expectBalanceChange(client, token, account, delta, action)` / `expectEthBalanceChange` | hardhat-chai-matchers compatible |

## Internal exports

Other exports (`handleRpcRequest` / `createEventEmitter` / `sendTransaction` / `createInjectorScript`) are internal-facing and rarely needed in tests.

## Related

- [Concepts](../concepts/README.md)
- [Cookbook](../cookbook/README.md)
