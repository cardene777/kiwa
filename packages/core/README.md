<p align="center">
  <img src="https://raw.githubusercontent.com/cardene777/kiwa/main/assets/kiwa-logo.png" alt="kiwa logo" width="160" />
</p>

# @kiwa-test/core

> [🇬🇧 English](./README.md) • [🇯🇵 日本語](./README.ja.md)

<p align="center">
  <img src="https://raw.githubusercontent.com/cardene777/kiwa/main/assets/kiwa-promo-en.gif" alt="kiwa overview — contract test, dApp e2e test, and manual write paths" width="640" />
  <br />
  <sub>Full <a href="https://github.com/cardene777/kiwa">kiwa</a> overview — this package covers the dApp e2e and manual-write paths. <a href="https://github.com/cardene777/kiwa/blob/main/assets/kiwa-promo-en.mp4">▶ Full-quality MP4</a>.</sub>
</p>

Headless E2E test fixture for dApps on anvil forks (Playwright + viem).

`@kiwa-test/core` is the runtime fixture used by [kiwa](https://github.com/cardene777/kiwa)'s Playwright-based dApp E2E layer. It injects `window.ethereum` into the test page, starts an anvil-backed wallet fixture, handles the core EIP-1193 flows directly, and forwards the rest of the JSON-RPC surface to anvil.

You can use this package in two ways: (a) let Claude generate Playwright tests via `/kiwa-play`, or (b) import the fixture directly (`import { dappE2eTest as test } from "@kiwa-test/core"`) and write the tests by hand. See [kiwa README](https://github.com/cardene777/kiwa) for the full 3-path picture (contract test via `@kiwa-test/forge` + dApp e2e via `@kiwa-test/core` + manual write).

## Installation

```bash
pnpm add -D @kiwa-test/core @playwright/test viem
```

### Bonus — Claude Code plugin

If you use Claude Code, install the kiwa skill chain in **one command** to get `/kiwa:kiwa-play` (Playwright e2e generation), `/kiwa:kiwa-design`, `/kiwa:kiwa-forge`, `/kiwa:kiwa-hardhat`, `/kiwa:kiwa-vitest`, `/kiwa:kiwa-api`, `/kiwa:kiwa-review` across every dApp project. (The `/kiwa:kiwa-test` one-shot orchestrator requires `examples/` and is kiwa-monorepo-only.)

```bash
# In Claude Code:
/plugin marketplace add cardene777/kiwa
/plugin install kiwa@kiwa-marketplace
/reload-plugins
```

> Plugin skills are namespaced by plugin name (`/kiwa:kiwa-design`, not `/kiwa-design`). See [kiwa README — Option A](https://github.com/cardene777/kiwa#option-a-claude-code-plugin-recommended-for-claude-users) for the full skill list.

## Quickstart

```ts
import { expect } from "@playwright/test";
import { dappE2eTest as test } from "@kiwa-test/core";

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

`@kiwa-test/core` handles these methods directly:

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
