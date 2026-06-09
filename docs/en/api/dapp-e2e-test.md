# dappE2eTest

> [🇬🇧 English](./dapp-e2e-test.md) • [🇯🇵 日本語](../../ja/api/dapp-e2e-test.md)

Playwright `test` extended for dApp E2E. Receives `page` plus the `dappE2e` helper.

## Signature

~~~ts
import { dappE2eTest } from '@kiwa/core';

const test = dappE2eTest;
~~~

## Fixtures

| Fixture | Type | Description |
|---|---|---|
| `page` | `Page` | Playwright `Page` with `window.ethereum` injected |
| `dappE2e` | `DappE2eHelper` | Helpers: `connect` / `personalSign` / `setApprovalMode` / `waitForRpcIdle` and more |
| `wallets` | `WalletConfig[]` (option) | EIP-6963 multi-wallet injection (set via `test.use({ wallets: [...] })`) |
| `approvalMode` | `'approve' \| 'reject'` (option) | Default RPC approval mode |

## DappE2eHelper main methods

| Method | Description |
|---|---|
| `connect()` | Connect via `eth_requestAccounts` |
| `disconnect()` | Fire `accountsChanged` with an empty array |
| `personalSign(msg)` | Sign with `personal_sign` |
| `signTypedData(domain, types, value)` | Sign with `eth_signTypedData_v4` |
| `sendTransaction(tx)` | Send via `eth_sendTransaction` directly |
| `switchChain(id)` | Send `wallet_switchEthereumChain` |
| `setApprovalMode(mode)` | Switch upcoming RPC approval to `approve` / `reject` |
| `waitForRpcIdle()` | Wait for the injected wallet RPC pipe to drain |
| `triggerEvent(name, args)` | Fire wallet-side events (`chainChanged` / `accountsChanged`) |

## Example

~~~ts
import { dappE2eTest as test, expect } from '@kiwa/core';

test('sign with personal_sign after connect', async ({ page, dappE2e }) => {
  await page.goto('/');
  await dappE2e.connect();
  const sig = await dappE2e.personalSign('hello');
  expect(sig).toMatch(/^0x[0-9a-f]+$/);
});
~~~

## Related

- [Fixture design](../concepts/fixture.md)
- [EIP-6963 Multi-Wallet](../concepts/eip-6963.md)
