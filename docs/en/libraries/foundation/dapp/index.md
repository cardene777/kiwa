# @kiwa-lab/dapp

[日本語](/libraries/foundation/dapp/)

`@kiwa-lab/dapp` is a headless E2E fixture for testing dApps on Anvil with Playwright. It injects `window.ethereum` into the test page so that you can test EIP-1193 connection, signing, chain switching, and transaction flows without a real wallet extension.

```bash
pnpm add -D @kiwa-lab/dapp @playwright/test viem
```

An Anvil executable must be available on `PATH`. If it cannot be found, the fixture's `startAnvil()` fails with `anvil not found in PATH`.

## What it solves

For each Playwright test, it starts Anvil and injects a provider as the page initializes. Import `dappE2eTest` instead of the usual Playwright `test` to receive `wallet`, `anvilPort`, and `dappE2e` fixtures in addition to `page`.

The fixture handles `eth_requestAccounts`, `eth_accounts`, `eth_chainId`, `net_version`, `personal_sign`, `eth_signTypedData_v4`, `wallet_switchEthereumChain`, `wallet_addEthereumChain`, and `eth_sendTransaction` directly. Other JSON-RPC requests are forwarded to Anvil.

## When to use it—and when not to

Use it for browser-driven dApp E2E tests that verify connection UI, approving or rejecting signatures, network switching, transaction submission, and provider events. You can trigger `accountsChanged`, `chainChanged`, `connect`, and `disconnect` from a test.

This package does not control a real wallet extension. It is also not suitable for simple UI tests that do not need Anvil, or for contract-only tests. Choose ordinary Playwright for the former and contract-focused test tooling for the latter.

## Continue reading

- [Write your first dApp E2E test](./quickstart)
- [Test a rejected connection UI](./guides/test-wallet-rejection)
- [API reference](./reference)

## Implementation basis

This page is based on [`packages/dapp/src/fixture.ts`](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/fixture.ts), [`rpc-handlers.ts`](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/rpc-handlers.ts), and [`types.ts`](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/types.ts).
