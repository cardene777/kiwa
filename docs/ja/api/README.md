# API Reference

`@kiwa/core` から export される主要 API。

## Fixture / anvil 起動

| Function / Type | 役割 |
|---|---|
| [`dappE2eTest`](./kiwa-play.md) | Playwright `test` を拡張した dApp 用 fixture |
| [`startAnvil`](./start-anvil.md) | anvil 子プロセスを spawn し ready まで待つ |
| [`startAnvilCluster`](./test-helpers.md#startanvilcluster) | 複数 chain id の anvil を同時起動 (multi-chain test 用) |
| [`startAnvilFork`](./test-helpers.md#startanvilfork) | `anvil --fork-url` の thin wrapper (mainnet / sepolia fork) |
| [`waitForChainState`](./wait-for-chain-state.md) | predicate ベース contract view ポーリング |
| [`getFreePort`](./get-free-port.md) | OS allocate された free port を取得 |
| [`AnvilHandle`](./anvil-handle.md) | `startAnvil` の戻り値 (port + stop helper) |

## Test helper (v0.2 以降)

業界標準 (hardhat / foundry / viem / hardhat-chai-matchers) と並ぶ test 助 helper。 詳細は [test-helpers.md](./test-helpers.md) 参照。

| Function | 役割 |
|---|---|
| `snapshotChain(client)` / `revertChain(client, id)` | `evm_snapshot` / `evm_revert` wrapper、 test 間隔離 |
| `expectCustomError(error, errorName)` | viem `BaseError` + `ContractFunctionRevertedError` chain walk |
| `increaseTime(client, sec)` / `mineBlock(client, n?)` / `setNextBlockTimestamp(client, ts)` | 時間操作 (vesting / TTL / timelock 系) |
| `impersonateAccount(client, addr)` / `setBalance(client, addr, wei)` | 任意 EOA / contract への impersonate + balance 注入 |
| `expectEvent(receipt, abi, eventName, args?)` | `decodeEventLog` + assertion 統合 |
| `expectBalanceChange(client, token, account, delta, action)` / `expectEthBalanceChange` | hardhat-chai-matchers 互換 |

## 内部 export

その他の export (`handleRpcRequest` / `createEventEmitter` / `sendTransaction` / `createInjectorScript`) は内部実装向けで通常 test では使用しません。

## 関連

- [Concepts](../concepts/README.md)
- [Cookbook](../cookbook/README.md)
