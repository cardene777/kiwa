# @kiwa/core

> [🇬🇧 English](./README.md) • [🇯🇵 日本語](./README.ja.md)

Headless E2E test fixture for dApps on anvil forks (Playwright + viem).

`@kiwa/core` is the runtime fixture used by [kiwa](https://github.com/cardene777/kiwa)'s Playwright-based dApp E2E layer. It injects `window.ethereum` into the test page, starts an anvil-backed wallet fixture, handles the core EIP-1193 flows directly, and forwards the rest of the JSON-RPC surface to anvil.

## Installation

```bash
pnpm add -D @kiwa/core @playwright/test viem
```

## Quickstart

```ts
import { expect } from "@playwright/test";
import { dappE2eTest as test } from "@kiwa/core";

test("window.ethereum is injected", async ({ page, dappE2e }) => {
  await page.goto("/");

  const chainId = await page.evaluate(() => {
    return (window as any).ethereum.request({ method: "eth_chainId" });
  });

  await dappE2e.waitForRpcIdle();
  expect(chainId).toBe("0x7a69");
});
```

## Features

- Playwright fixture preset (`dappE2eTest`) that injects `window.ethereum`
- anvil lifecycle integration for isolated test runs
- 9 EIP-1193 JSON-RPC methods handled directly, with all other methods forwarded to anvil
- 4 EIP-1193 events triggerable from tests
- transaction broadcast helper for `eth_sendTransaction`
- approval-mode helpers for deterministic reject-flow testing
- EIP-6963 multi-wallet injection and smart-account support

## Direct RPC Methods

`@kiwa/core` handles these methods directly:

- `eth_requestAccounts`
- `eth_accounts`
- `eth_chainId`
- `net_version`
- `personal_sign`
- `eth_signTypedData_v4`
- `wallet_switchEthereumChain`
- `wallet_addEthereumChain`
- `eth_sendTransaction`

Common read methods such as `eth_call`, `eth_getBalance`, `eth_blockNumber`, and `eth_estimateGas` are forwarded to anvil.

## EIP-1193 Events

The injected provider supports these events:

- `accountsChanged`
- `chainChanged`
- `connect`
- `disconnect`

From tests, you can drive them with `dappE2e.triggerEvent()` or use higher-level helpers such as `connect()`, `disconnect()`, `switchChain()`, and `waitForRpcIdle()`.

## Related

- [GitHub repository](https://github.com/cardene777/kiwa)
- [Full documentation](https://github.com/cardene777/kiwa/tree/main/docs/en)
- [Cookbook](https://github.com/cardene777/kiwa/tree/main/docs/en/cookbook)
- [Errors reference](https://github.com/cardene777/kiwa/blob/main/docs/ERRORS.md)
- [Events reference](https://github.com/cardene777/kiwa/blob/main/docs/EVENTS.md)
- [RPC reference](https://github.com/cardene777/kiwa/blob/main/docs/RPC.md)

## Author

[cardene](https://github.com/cardene777) — [GitHub](https://github.com/cardene777) / [X](https://x.com/cardene777)

## License

MIT
