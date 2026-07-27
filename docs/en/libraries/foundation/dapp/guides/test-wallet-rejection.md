# Test a rejected wallet connection UI

[日本語](/libraries/foundation/dapp/guides/test-wallet-rejection)

This guide reproduces the UI state in which a user rejects a connection request in an E2E test. `dappE2e` lets you configure approval mode and connection rejection separately.

## Enable rejection

`setApprovalMode("reject")` rejects operations that require approval, including signing, chain switching, and transaction submission. To reject `eth_requestAccounts` as well, also set `setRejectConnect(true)`. By default, `eth_requestAccounts` succeeds even while reject mode is active.

```ts
import { expect } from "@playwright/test";
import { dappE2eTest as test } from "@kiwa-lab/dapp";

test("接続拒否をアプリが表示できる", async ({ page, dappE2e }) => {
  await page.goto("/");
  await dappE2e.setApprovalMode("reject");
  await dappE2e.setRejectConnect(true);

  const result = await page.evaluate(async () => {
    const provider = (window as typeof window & {
      ethereum?: { request: (request: { method: string }) => Promise<unknown> };
    }).ethereum;

    try {
      await provider?.request({ method: "eth_requestAccounts" });
      return { rejected: false };
    } catch (error) {
      const rpcError = error as { code?: number; message?: string };
      return { rejected: true, code: rpcError.code, message: rpcError.message };
    }
  });

  await dappE2e.waitForRpcIdle();
  expect(result.rejected).toBe(true);
  expect(result.code).toBe(4001);
});
```

In an application test, click the connection button instead of using `page.evaluate()`, then assert the error message. The example intentionally minimizes the fixture's EIP-1193 error contract.

## Restore the default behavior

To permit later approvals in the same test, restore approval mode to `approve`.

```ts
await dappE2e.setApprovalMode("approve");
```

`setRejectConnect(false)` disables connection rejection alone. `eth_accounts` remains a read request and returns accounts even when `setRejectConnect(true)` and reject mode are combined.

## Other rejection flows

`setApprovalMode("reject")` also returns EIP-1193 code `4001` for `personal_sign`, `eth_signTypedData_v4`, `wallet_switchEthereumChain`, and `eth_sendTransaction`. To control ERC-20 `approve` per token, use `setApprovalModeForToken(tokenAddress, { mode, limit? })`.

Implementation basis: [`fixture.ts`](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/fixture.ts), [`rpc-handlers.ts`](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/rpc-handlers.ts), and [`approval-mode.test.ts`](https://github.com/cardene777/kiwa/blob/main/packages/dapp/tests/approval-mode.test.ts).
