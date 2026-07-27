# @kiwa-lab/dapp: Your first dApp E2E test

[日本語](/libraries/foundation/dapp/quickstart)

In this tutorial, you replace the usual Playwright `test` with `dappE2eTest` and verify the chain ID returned by the provider injected into the page. When you finish, you can run one E2E test with Anvil and `window.ethereum`.

## Prerequisites

- Node.js 20 or later
- `anvil` available on `PATH`
- A project that can run Playwright

Add the dependencies.

```bash
pnpm add -D @kiwa-lab/dapp @playwright/test viem
```

## Write the test

Create `tests/wallet.spec.ts`. `dappE2eTest` is also exported as `test`; this example uses the named export to make its origin clear.

```ts
import { expect } from "@playwright/test";
import { dappE2eTest as test } from "@kiwa-lab/dapp";

test("provider が Anvil の chain ID を返す", async ({ page, dappE2e }) => {
  await page.goto("/");

  const chainId = await page.evaluate(async () => {
    const provider = (window as typeof window & {
      ethereum?: { request: (request: { method: string }) => Promise<unknown> };
    }).ethereum;

    return provider?.request({ method: "eth_chainId" });
  });

  await dappE2e.waitForRpcIdle();
  expect(chainId).toBe("0x7a69");
});
```

The default `chainId` for `dappE2eTest` is `31337`; the result of `eth_chainId` is the hexadecimal string `0x7a69`. The fixture stops the Anvil instance it started when the test ends.

## What the fixture can do

The `dappE2e` fixture from the preceding test provides helpers for changing provider state from the test.

```ts
test("接続イベントを発火できる", async ({ page, dappE2e }) => {
  await page.goto("/");

  await dappE2e.connect();
  await dappE2e.waitForRpcIdle();
});
```

The primary helpers are `connect()`, `disconnect()`, `switchChain(chainIdHex)`, `triggerEvent(event, ...args)`, `setApprovalMode(mode)`, `getAnvilPort()`, and `waitForRpcIdle()`. Next, see [test a rejected connection UI](./guides/test-wallet-rejection).
