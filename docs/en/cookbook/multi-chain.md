# Test multi-chain (L1/L2 in parallel)

## Goal

Run multiple anvil instances with distinct chain IDs in parallel to test bridge / cross-chain dApps.

## Steps

### 1. Start multiple anvil instances in global-setup

~~~ts
import { startAnvil, type AnvilHandle } from '@kiwa/core';

const anvilHandles: AnvilHandle[] = [];

export default async function globalSetup() {
  const l1 = await startAnvil({ port: 8554, chainId: 1 });
  anvilHandles.push(l1);

  const l2 = await startAnvil({ port: 8555, chainId: 10 });
  anvilHandles.push(l2);

  // ... deploy contracts on L1/L2 and write .env.local
}
~~~

### 2. Stop all anvil instances in global-teardown

~~~ts
export default async function globalTeardown() {
  for (const handle of anvilHandles) {
    await handle.stop();
  }
}
~~~

### 3. Verify both chains run concurrently in a test

~~~ts
test('lock on L1 then mint on L2', async ({ page, dappE2e }) => {
  await page.goto('/');
  await dappE2e.connect();

  // Lock on L1
  await page.getByTestId('lock-button').click();
  await dappE2e.waitForRpcIdle();

  // Operator mints on L2
  await page.getByTestId('relay-button').click();
  await dappE2e.waitForRpcIdle();

  await expect(page.getByTestId('l2-balance')).toContainText(/^l2: \d+$/);
});
~~~

## Verify

- L1 and L2 use distinct chain IDs (`eth_chainId` differs)
- L1 deploy addresses differ from L2 deploy addresses (via nonce padding)
- Each anvil keeps independent state

## Related

- [API: startAnvil chainId option](../api/start-anvil.md)
- [examples/nextjs-bridge](../../../examples/nextjs-bridge)
- [examples/nextjs-multi-chain](../../../examples/nextjs-multi-chain)
