# Test with time manipulation (vesting / streaming)

> [🇬🇧 English](./time-manipulation.md) • [🇯🇵 日本語](../../ja/cookbook/time-manipulation.md)

## Goal

Test cliff + linear vesting or time-based token release without waiting in CI.
Drive time deterministically with anvil's `evm_increaseTime` + `evm_snapshot` / `evm_revert`.

## Prerequisites

- A `TokenVesting` or `Streaming` contract deployed on anvil
- `tests/global-setup.ts` (or pretest) writes contract addresses to `.env.local`

## Steps

### 1. anvil RPC helpers

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

### 2. Isolate the time axis with beforeEach / afterEach

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

### 3. Partial release after cliff

~~~ts
  test('partial release after cliff', async ({ page, dappE2e }) => {
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

Bracketing each test with `evm_snapshot` / `evm_revert` keeps time independent across tests.
Time leakage between tests creates order-dependent failures, so this is essential.

## Related

- [API: waitForChainState](../api/wait-for-chain-state.md)
- [examples/nextjs-vesting](../../../examples/nextjs-vesting)
