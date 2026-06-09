# Snapshot / revert で test 間隔離する

> [🇬🇧 English](../../en/cookbook/snapshot-revert.md) • [🇯🇵 日本語](./snapshot-revert.md)

`@kiwa/core` v0.2 で追加された `snapshotChain` / `revertChain` を使い、 anvil chain state を test ごとに完全に隔離する pattern。

## 課題

`evm_increaseTime` や複数 contract write を行う test は anvil 内部 state が累積し、 後続 test に副作用を残す。 4 round 連続実行で flaky 化する典型的な落とし穴。

実例: 過去の kiwa MVP foundation で `nextjs-token-gating` r3 だけ FAIL する flaky を検出した経験あり (前 round の anvil PID が cleanup 漏れで残留したケース)。

## 解決パターン

`beforeEach` で snapshot を取り、 `afterEach` で revert する。

```ts
import { test, expect } from './fixture';
import { snapshotChain, revertChain, increaseTime } from '@kiwa/core';
import type { Hex } from 'viem';

let snapshotId: Hex;

test.beforeEach(async ({ anvilPort }) => {
  const publicClient = makePublicClient(anvilPort);
  snapshotId = await snapshotChain(publicClient);
});

test.afterEach(async ({ anvilPort }) => {
  const publicClient = makePublicClient(anvilPort);
  await revertChain(publicClient, snapshotId);
});

test('T-VESTING-001 cliff 経過後に release できる', async ({ anvilPort }) => {
  const publicClient = makePublicClient(anvilPort);
  await increaseTime(publicClient, 30 * 24 * 60 * 60);  // 30 day 進める
  // ...vesting contract release を assertion
});

test('T-VESTING-002 cliff 前は release が 0', async ({ anvilPort }) => {
  // 上の test で 30 day 進めた状態が revert され、 cliff 前から始まる
  // ...
});
```

## 注意点

- `evm_revert` 後の snapshot id は **consume されて再利用不可**。 `beforeEach` で都度新しい snapshot を取る
- snapshot は anvil process が再起動されると消える (process 内部の memory state)
- multi-chain test (`startAnvilCluster`) では各 anvil で個別に snapshot/revert する

## 関連

- [API: snapshotChain / revertChain](../api/test-helpers.md#snapshotchain--revertchain)
- [Cookbook: 時間操作で test する](./time-manipulation.md)
