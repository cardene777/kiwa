# Test Helpers (v0.2 以降)

`@dapp-e2e/core` v0.2 で追加された 7 test helper の API リファレンス。 業界標準 (hardhat / foundry / viem / hardhat-chai-matchers) と並ぶ範囲を core に集約することで、 各 example での重複定義を解消した。

## snapshotChain / revertChain

anvil の `evm_snapshot` / `evm_revert` の thin wrapper。 test 間で chain state を隔離する用途。

```ts
import { snapshotChain, revertChain } from '@dapp-e2e/core';

test.beforeEach(async ({ publicClient }) => {
  snapshotId = await snapshotChain(publicClient);
});

test.afterEach(async ({ publicClient }) => {
  await revertChain(publicClient, snapshotId);
});
```

- `snapshotChain(client): Promise<Hex>` — anvil の snapshot id を返す
- `revertChain(client, snapshotId): Promise<boolean>` — 指定 snapshot に巻き戻し、 成功時 true

`evm_revert` 後の anvil は snapshot 時点の state を再現するが、 snapshot id は consume される (再利用不可)。 連続 revert する場合は test ごとに `snapshotChain` を取り直す。

## expectCustomError

viem `BaseError` chain から `ContractFunctionRevertedError` を抽出し、 `errorName` を assertion する custom error 検証 helper。

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

- 第 1 引数が viem `BaseError` でない場合は throw (false positive を防ぐ)
- chain walk で `ContractFunctionRevertedError` を探索 → `data?.errorName === expected` を `expect` で確認

13 example で重複定義していた helper を core に集約。

## increaseTime / mineBlock / setNextBlockTimestamp

時間操作の thin wrapper。 vesting / TTL / timelock 系 dApp の test に。

```ts
import { increaseTime, mineBlock, setNextBlockTimestamp } from '@dapp-e2e/core';

await increaseTime(publicClient, 7 * 24 * 60 * 60);  // 7 day 進める
await mineBlock(publicClient, 5);  // 5 block mine
await setNextBlockTimestamp(publicClient, 1_900_000_000n);  // 次 block timestamp 固定
```

- `increaseTime(client, sec)` — `evm_increaseTime` + 自動 `evm_mine` で時間進行
- `mineBlock(client, count = 1)` — `evm_mine` を count 回呼ぶ
- `setNextBlockTimestamp(client, ts)` — `evm_setNextBlockTimestamp` で次 block timestamp 固定

`increaseTime` の副作用 (anvil 内部時刻が累積) は次 test に残るため、 `snapshotChain` / `revertChain` または anvil 再起動と組み合わせて test 間隔離する。

## impersonateAccount / stopImpersonateAccount / setBalance

任意 EOA / contract を impersonate し、 owner-only function を直接呼ぶ用途。

```ts
import { impersonateAccount, stopImpersonateAccount, setBalance } from '@dapp-e2e/core';

await setBalance(publicClient, OWNER_ADDR, 10n ** 18n);  // 1 ETH 注入
await impersonateAccount(publicClient, OWNER_ADDR);

await walletClient.writeContract({
  account: OWNER_ADDR,  // impersonate 中なので private key 不要
  address: contract,
  abi: ABI,
  functionName: 'ownerOnlyFn',
});

await stopImpersonateAccount(publicClient, OWNER_ADDR);
```

- `impersonateAccount(client, addr)` — `anvil_impersonateAccount` で impersonate 開始
- `stopImpersonateAccount(client, addr)` — `anvil_stopImpersonatingAccount` で停止
- `setBalance(client, addr, wei)` — `anvil_setBalance` で balance 注入 (gas 不足回避)

mainnet fork test で「実在する owner address から呼ぶ」シナリオで頻出。

## startAnvilCluster

複数 chain id の anvil を同時起動する helper。 multi-chain dApp (bridge / cross-chain swap) の test に。

```ts
import { startAnvilCluster } from '@dapp-e2e/core';

const cluster = await startAnvilCluster({
  chains: [
    { id: 31337, port: 8554, name: 'chain-a' },
    { id: 31338, port: 8555, name: 'chain-b' },
  ],
});

// cluster.handles[0] = chain A、 cluster.handles[1] = chain B
await cluster.stop();  // 全 chain を一括停止
```

- 戻り値 `AnvilClusterHandle` は `handles[]` で各 chain の `AnvilHandle` を持つ
- `stop()` で全 chain を同時に kill (PID file 経由で確実に)

## startAnvilFork

`anvil --fork-url` の thin wrapper。 mainnet / sepolia / 任意 RPC 経由の fork test に。

```ts
import { startAnvilFork } from '@dapp-e2e/core';

const fork = await startAnvilFork({
  forkUrl: process.env.ALCHEMY_MAINNET!,
  forkBlockNumber: 18_500_000n,
  port: 8551,
});

// fork.port 経由で実 mainnet state を読み書き可能
```

実 RPC への課金が発生するため、 CI で `forkBlockNumber` を固定して cache 効果を最大化することを推奨。

## expectEvent

`decodeEventLog` + assertion を 1 関数に統合した event 検証 helper。

```ts
import { expectEvent } from '@dapp-e2e/core';

const receipt = await publicClient.waitForTransactionReceipt({ hash });

expectEvent(receipt, NFT_ABI, 'Transfer', {
  from: '0x0000000000000000000000000000000000000000',
  to: USER_ADDR,
  tokenId: 1n,
});
```

- receipt の `logs[]` を全 decode し、 `eventName` が match するものを探す
- `expectedArgs` 指定時は各 key を `expect(args[k]).toEqual(v)` で確認

## expectBalanceChange / expectEthBalanceChange

action 実行前後で残高差分を assertion する helper。 hardhat-chai-matchers の `changeTokenBalance` / `changeEtherBalance` 互換 API。

```ts
import { expectBalanceChange, expectEthBalanceChange } from '@dapp-e2e/core';

// ERC-20 残高
await expectBalanceChange(publicClient, USDC_ADDR, USER_ADDR, 100n * 10n ** 6n, async () => {
  await walletClient.writeContract({
    address: SWAP_ADDR,
    abi: SWAP_ABI,
    functionName: 'swap',
    args: [...],
  });
});

// ETH 残高
await expectEthBalanceChange(publicClient, USER_ADDR, -10n ** 18n, async () => {
  await walletClient.sendTransaction({ to: RECIPIENT, value: 10n ** 18n });
});
```

- before / after の `balanceOf` (or `getBalance`) 差分が `delta` と一致することを assertion
- delta は signed bigint (`-` で負方向)

## 関連

- [Concepts: Fixture composition](../concepts/fixture-composition.md)
- [Cookbook: time-manipulation](../cookbook/time-manipulation.md)
