# Isolate tests with snapshot / revert

> [🇬🇧 English](./snapshot-revert.md) • [🇯🇵 日本語](../../ja/cookbook/snapshot-revert.md)

Use `snapshotChain` / `revertChain` added in `@kiwa-test/core` v0.2 to completely isolate anvil chain state between tests.

## Problem

Tests that call `evm_increaseTime` or perform multiple contract writes accumulate state in anvil and leak side effects into subsequent tests. This is a classic flaky pattern that only surfaces after 4 consecutive rounds.

Real example: in the kiwa MVP foundation, `nextjs-token-gating` round 3 once failed due to lingering anvil PIDs from the previous round.

## Solution pattern

Snapshot in `beforeEach`, revert in `afterEach`.

```ts
import { test, expect } from './fixture';
import { snapshotChain, revertChain, increaseTime } from '@kiwa-test/core';
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

test('T-VESTING-001 release succeeds after cliff', async ({ anvilPort }) => {
  const publicClient = makePublicClient(anvilPort);
  await increaseTime(publicClient, 30 * 24 * 60 * 60);  // advance 30 days
  // ... assert vesting contract release
});

test('T-VESTING-002 release returns 0 before cliff', async ({ anvilPort }) => {
  // 30-day advance from the test above is reverted; we start from before the cliff
  // ...
});
```

## Notes

- The snapshot id is **consumed by `evm_revert` and cannot be reused**. Take a fresh snapshot in each `beforeEach`.
- Snapshots live inside the anvil process memory and disappear if anvil restarts.
- For multi-chain tests (`startAnvilCluster`), snapshot/revert each anvil independently.

## See also

- [API: snapshotChain / revertChain](../api/test-helpers.md#snapshotchain--revertchain)
- [Cookbook: Test with time manipulation](./time-manipulation.md)
