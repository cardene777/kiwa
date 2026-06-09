# 時間操作で test する (vesting / streaming)

> [🇬🇧 English](../../en/cookbook/time-manipulation.md) • [🇯🇵 日本語](./time-manipulation.md)

## Goal

cliff + linear vesting や時間に応じて release される token を CI で待たずに test する。
anvil の `evm_increaseTime` + `evm_snapshot` / `evm_revert` で時間を deterministic に動かす。

## Prerequisites

- TokenVesting / Streaming contract を anvil に deploy 済み
- `tests/global-setup.ts` で `.env.local` に contract address を書き出している

## Steps

### 1. anvil RPC helper

~~~ts
import { createPublicClient, defineChain, http } from 'viem';

const anvilChain = defineChain({
  id: 31337,
  name: 'Anvil',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: { default: { http: ['http://127.0.0.1:8545'] } },
});

const pub = createPublicClient({ chain: anvilChain, transport: http() });

async function rpc(method: string, params: unknown[] = []) {
  return (pub as unknown as { request: (a: { method: string; params: unknown[] }) => Promise<unknown> })
    .request({ method, params });
}

const snapshot = async () => (await rpc('evm_snapshot')) as string;
const revert = async (id: string) => { await rpc('evm_revert', [id]); };

async function increaseTime(seconds: bigint) {
  await rpc('evm_increaseTime', [Number(seconds)]);
  await rpc('evm_mine');
}
~~~

### 2. beforeEach / afterEach で時間軸 isolation

~~~ts
test.describe('Vesting', () => {
  let snapshotId: string | undefined;

  test.beforeEach(async () => {
    snapshotId = await snapshot();
  });

  test.afterEach(async () => {
    if (snapshotId) {
      await revert(snapshotId);
      snapshotId = undefined;
    }
  });
~~~

### 3. cliff 通過後 partial release

~~~ts
  test('cliff 通過後 partial release', async ({ page, dappE2e }) => {
    await page.goto('/');
    await dappE2e.connect();

    await increaseTime(CLIFF_DURATION + 200n);

    await page.getByTestId('release-button').click();
    await dappE2e.waitForRpcIdle();

    const released = await waitForChainState<bigint>({
      publicClient: pub,
      address: VESTING,
      abi: vestingAbi,
      functionName: 'released',
      predicate: (v) => v > 0n,
    });
    expect(released).toBeGreaterThan(0n);
    expect(released).toBeLessThan(VEST_TOTAL);
  });
});
~~~

## Verify

`evm_snapshot` / `evm_revert` を `beforeEach` / `afterEach` で挟むことで、各 test が独立した時間軸で実行される。test 間で時間がリークすると順序依存ハマるため必須。

## Related

- [API: waitForChainState](../api/wait-for-chain-state.md)
- [examples/nextjs-vesting](../../../examples/nextjs-vesting)
