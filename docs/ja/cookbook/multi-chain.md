# Multi-Chain (L1/L2 並走) を test する

## Goal

異なる chainId の anvil を並走起動し、bridge / cross-chain dApp の挙動を test する。

## Steps

### 1. global-setup で複数 anvil を起動

~~~ts
import { startAnvil, type AnvilHandle } from '@kiwa/core';

const anvilHandles: AnvilHandle[] = [];

export default async function globalSetup() {
  const l1 = await startAnvil({ port: 8554, chainId: 1 });
  anvilHandles.push(l1);

  const l2 = await startAnvil({ port: 8555, chainId: 10 });
  anvilHandles.push(l2);

  // ... L1/L2 で contract deploy + .env.local 書き出し
}
~~~

### 2. global-teardown で全 anvil を順次 stop

~~~ts
export default async function globalTeardown() {
  for (const handle of anvilHandles) {
    await handle.stop();
  }
}
~~~

### 3. test で 2 chain 並走確認

~~~ts
test('L1 で lock → L2 で mint', async ({ page, dappE2e }) => {
  await page.goto('/');
  await dappE2e.connect();

  // L1 で lock
  await page.getByTestId('lock-button').click();
  await dappE2e.waitForRpcIdle();

  // operator が L2 で mint
  await page.getByTestId('relay-button').click();
  await dappE2e.waitForRpcIdle();

  await expect(page.getByTestId('l2-balance')).toContainText(/^l2: \d+$/);
});
~~~

## Verify

- L1 / L2 で chainId が独立している (`eth_chainId` が異なる)
- L1 deploy address と L2 deploy address が異なる (nonce padding で )
- 各 anvil が独立した state を持つ

## Related

- [API: startAnvil chainId option](../api/start-anvil.md)
- [examples/nextjs-bridge](../../../examples/nextjs-bridge)
- [examples/nextjs-multi-chain](../../../examples/nextjs-multi-chain)
