# Test Helpers (v0.2+)

API reference for the 7 test helpers added in `@dapp-e2e/core` v0.2. These helpers cover the same scope as industry standards (hardhat / foundry / viem / hardhat-chai-matchers), eliminating duplicate definitions across examples.

## snapshotChain / revertChain

Thin wrapper around anvil's `evm_snapshot` / `evm_revert`. Use it to isolate chain state between tests.

```ts
import { snapshotChain, revertChain } from '@dapp-e2e/core';

test.beforeEach(async ({ publicClient }) => {
  snapshotId = await snapshotChain(publicClient);
});

test.afterEach(async ({ publicClient }) => {
  await revertChain(publicClient, snapshotId);
});
```

- `snapshotChain(client): Promise<Hex>` — returns the anvil snapshot id
- `revertChain(client, snapshotId): Promise<boolean>` — rewinds to the snapshot, returns true on success

The snapshot id is consumed by `evm_revert` (cannot be reused). Re-take with `snapshotChain` per test.

## expectCustomError

Walks the viem `BaseError` chain for `ContractFunctionRevertedError` and asserts the `errorName` matches.

```ts
import { expectCustomError } from '@dapp-e2e/core';

try {
  await publicClient.simulateContract({
    account: nonOperator,
    address: contract,
    abi: ABI,
    functionName: 'protectedFn',
  });
  throw new Error('expected revert');
} catch (error) {
  expectCustomError(error, 'NotOperator');
}
```

- Throws if the first argument is not a viem `BaseError` (prevents false positives)
- Chain-walks for `ContractFunctionRevertedError`, then `expect(data?.errorName).toBe(expected)`

Aggregated from helpers that were duplicated across 13 examples.

## increaseTime / mineBlock / setNextBlockTimestamp

Time manipulation wrappers for vesting / TTL / timelock-driven dApps.

```ts
import { increaseTime, mineBlock, setNextBlockTimestamp } from '@dapp-e2e/core';

await increaseTime(publicClient, 7 * 24 * 60 * 60);  // advance 7 days
await mineBlock(publicClient, 5);                     // mine 5 blocks
await setNextBlockTimestamp(publicClient, 1_900_000_000n);
```

- `increaseTime(client, sec)` — `evm_increaseTime` followed by automatic `evm_mine`
- `mineBlock(client, count = 1)` — calls `evm_mine` `count` times
- `setNextBlockTimestamp(client, ts)` — fixes the next block timestamp via `evm_setNextBlockTimestamp`

`increaseTime` accumulates state in anvil and leaks into the next test. Combine with `snapshotChain` / `revertChain` or anvil restart for isolation.

## impersonateAccount / stopImpersonateAccount / setBalance

Impersonate arbitrary EOA / contract addresses to invoke owner-only functions directly.

```ts
import { impersonateAccount, stopImpersonateAccount, setBalance } from '@dapp-e2e/core';

await setBalance(publicClient, OWNER_ADDR, 10n ** 18n);  // inject 1 ETH
await impersonateAccount(publicClient, OWNER_ADDR);

await walletClient.writeContract({
  account: OWNER_ADDR,  // no private key needed while impersonating
  address: contract,
  abi: ABI,
  functionName: 'ownerOnlyFn',
});

await stopImpersonateAccount(publicClient, OWNER_ADDR);
```

- `impersonateAccount(client, addr)` — `anvil_impersonateAccount`
- `stopImpersonateAccount(client, addr)` — `anvil_stopImpersonatingAccount`
- `setBalance(client, addr, wei)` — `anvil_setBalance` to avoid gas shortages

Common in mainnet-fork scenarios where you need to call as a known on-chain owner.

## startAnvilCluster

Spawn multiple anvil processes with distinct chain ids. Used for multi-chain dApps (bridges, cross-chain swaps).

```ts
import { startAnvilCluster } from '@dapp-e2e/core';

const cluster = await startAnvilCluster({
  chains: [
    { id: 31337, port: 8554, name: 'chain-a' },
    { id: 31338, port: 8555, name: 'chain-b' },
  ],
});

// cluster.handles[0] = chain A, cluster.handles[1] = chain B
await cluster.stop();  // kill all chains at once
```

- The returned `AnvilClusterHandle` exposes `handles[]` (one `AnvilHandle` per chain)
- `stop()` kills all chains via PID files for reliability

## startAnvilFork

Thin wrapper for `anvil --fork-url`. Use it for mainnet / sepolia / any RPC-backed fork tests.

```ts
import { startAnvilFork } from '@dapp-e2e/core';

const fork = await startAnvilFork({
  forkUrl: process.env.ALCHEMY_MAINNET!,
  forkBlockNumber: 18_500_000n,
  port: 8551,
});

// fork.port now serves live mainnet state for reads and writes
```

Pinning `forkBlockNumber` is recommended in CI to maximize cache reuse and reduce upstream RPC bills.

## expectEvent

Combines `decodeEventLog` and assertion into a single event-checking helper.

```ts
import { expectEvent } from '@dapp-e2e/core';

const receipt = await publicClient.waitForTransactionReceipt({ hash });

expectEvent(receipt, NFT_ABI, 'Transfer', {
  from: '0x0000000000000000000000000000000000000000',
  to: USER_ADDR,
  tokenId: 1n,
});
```

- Decodes every `log` in the receipt and finds those matching `eventName`
- When `expectedArgs` is provided, each key is asserted via `expect(args[k]).toEqual(v)`

## expectBalanceChange / expectEthBalanceChange

Assert the balance delta around an action. API-compatible with hardhat-chai-matchers' `changeTokenBalance` / `changeEtherBalance`.

```ts
import { expectBalanceChange, expectEthBalanceChange } from '@dapp-e2e/core';

// ERC-20 balance
await expectBalanceChange(publicClient, USDC_ADDR, USER_ADDR, 100n * 10n ** 6n, async () => {
  await walletClient.writeContract({
    address: SWAP_ADDR,
    abi: SWAP_ABI,
    functionName: 'swap',
    args: [...],
  });
});

// ETH balance
await expectEthBalanceChange(publicClient, USER_ADDR, -10n ** 18n, async () => {
  await walletClient.sendTransaction({ to: RECIPIENT, value: 10n ** 18n });
});
```

- Diff between before / after `balanceOf` (or `getBalance`) is asserted to equal `delta`
- `delta` is a signed bigint (negative for outflow)

## See also

- [Concepts: Fixture composition](../concepts/fixture-composition.md)
- [Cookbook: time-manipulation](../cookbook/time-manipulation.md)
