# Test the user-reject path

## Goal

Test how the dApp handles user rejection (EIP-1193 code 4001) for `personal_sign` / `eth_sendTransaction`.

## Steps

### 1. Switch approval mode to reject

~~~ts
import { dappE2eTest as test, expect } from '@dapp-e2e/core';

test('rejected signMessage shows error message', async ({ page, dappE2e }) => {
  await page.goto('/');
  await dappE2e.connect();

  await dappE2e.setApprovalMode('reject');

  await page.getByRole('button', { name: /sign/i }).click();

  await expect(page.getByTestId('error')).toContainText(/user rejected|4001/i);
});
~~~

### 2. Reset approval mode before exiting

~~~ts
  await dappE2e.setApprovalMode('approve'); // avoid leaking reject state into subsequent tests
~~~

## Verify

- The dApp catches an error object containing `code 4001`
- The UI shows a `User rejected` style message
- No state changes on chain (balance via `useReadContract` remains unchanged)

## Related

- [RPC handling Concepts](../concepts/rpc-handling.md)
- [RPC.md (Reference)](../../RPC.md)
