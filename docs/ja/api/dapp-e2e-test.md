# dappE2eTest

Playwright の `test` を拡張した dApp 専用 fixture。`page` に加えて `dappE2e` ヘルパーを受け取れます。

## Signature

~~~ts
import { dappE2eTest } from '@dapp-e2e/core';

const test = dappE2eTest;
~~~

## fixture 一覧

| Fixture | 型 | 説明 |
|---|---|---|
| `page` | `Page` | Playwright の `Page`、`window.ethereum` が inject 済み |
| `dappE2e` | `DappE2eHelper` | `connect` / `personalSign` / `setApprovalMode` / `waitForRpcIdle` 等の helper |
| `wallets` | `WalletConfig[]` (option) | EIP-6963 multi-wallet inject (`test.use({ wallets: [...] })` で指定) |
| `approvalMode` | `'approve' \| 'reject'` (option) | RPC approval の default mode |

## DappE2eHelper の主要 method

| Method | 説明 |
|---|---|
| `connect()` | `eth_requestAccounts` で接続 |
| `disconnect()` | `accountsChanged` を空配列で発火 |
| `personalSign(msg)` | `personal_sign` で署名 |
| `signTypedData(domain, types, value)` | `eth_signTypedData_v4` で署名 |
| `sendTransaction(tx)` | `eth_sendTransaction` を直接発行 |
| `switchChain(id)` | `wallet_switchEthereumChain` を発行 |
| `setApprovalMode(mode)` | 後続 RPC を `approve` / `reject` で切替 |
| `waitForRpcIdle()` | inject wallet RPC pipe が drain するまで待つ |
| `triggerEvent(name, args)` | wallet 側 event (`chainChanged` / `accountsChanged`) を発火 |

## Example

~~~ts
import { dappE2eTest as test, expect } from '@dapp-e2e/core';

test('connect 後 personal_sign で署名', async ({ page, dappE2e }) => {
  await page.goto('/');
  await dappE2e.connect();
  const sig = await dappE2e.personalSign('hello');
  expect(sig).toMatch(/^0x[0-9a-f]+$/);
});
~~~

## 関連

- [Fixture 設計](../concepts/fixture.md)
- [EIP-6963 Multi-Wallet](../concepts/eip-6963.md)
