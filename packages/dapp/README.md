<p align="center">
  <img src="https://raw.githubusercontent.com/cardene777/kiwa/main/assets/kiwa-logo.png" alt="kiwa logo" width="160" />
</p>

# @kiwa-test/dapp

> [🇬🇧 English](./README.md) • [🇯🇵 日本語](./README.ja.md)

<p align="center">
  <img src="https://raw.githubusercontent.com/cardene777/kiwa/main/assets/kiwa-promo-en.gif" alt="kiwa 127s overview — generate full-spec tests across Web (Next.js) / Contract (Solidity) / dApp (Playwright) in 6 steps (this package powers the dApp e2e and manual-write paths)" width="640" />
  <br />
  <sub>Full <a href="https://github.com/cardene777/kiwa">kiwa</a> overview (127s) — this package covers the dApp e2e and manual-write paths. <a href="https://github.com/cardene777/kiwa/blob/main/assets/kiwa-promo-en.mp4">▶ Full-quality MP4 (2.9 MB)</a>.</sub>
</p>

Headless E2E test fixture for dApps on anvil forks (Playwright + viem).

`@kiwa-test/dapp` is the runtime fixture used by [kiwa](https://github.com/cardene777/kiwa)'s Playwright-based dApp E2E layer. It injects `window.ethereum` into the test page, starts an anvil-backed wallet fixture, handles the core EIP-1193 flows directly, and forwards the rest of the JSON-RPC surface to anvil.

You can use this package in two ways: (a) let Claude generate Playwright tests via `/kiwa-play`, or (b) import the fixture directly (`import { dappE2eTest as test } from "@kiwa-test/dapp"`) and write the tests by hand. See [kiwa README](https://github.com/cardene777/kiwa) for the full 3-path picture (contract test via `@kiwa-test/forge` + dApp e2e via `@kiwa-test/dapp` + manual write).

## Installation

```bash
pnpm add -D @kiwa-test/dapp @playwright/test viem
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
import { dappE2eTest as test } from "@kiwa-test/dapp";

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
- vitest helper (`setupTestEnv` / `withAnvil`) that boots a real anvil with `--load-state` for unit / integration tests
- anvil pool (`createAnvilPool`) with `anvil_reset`-backed 0 ms borrow / release for parallel test suites
- tunable transport timeout / retry on `sendTransaction` for fail-fast error-path tests

## Vitest helper (mock + real anvil with state load)

`@kiwa-test/dapp` ships a vitest helper that lets the same test file run in either **mock mode** (no anvil process, default) or **real anvil mode** with a pre-built state file. The state file is produced once via `kiwa anvil seed`, then every test boots anvil with `--load-state` — equivalent to pasting the entire chain in one shot.

```ts
import { setupTestEnv } from "@kiwa-test/dapp";

// mock mode (default): no anvil process, viem mock transport
const env = await setupTestEnv();

// clean anvil: spawns anvil on a free port, chainId 31337
const env = await setupTestEnv({ anvil: true });

// anvil with pre-built state: instant setup, no per-test deploy
const env = await setupTestEnv({
  anvil: { loadState: "tests/fixtures/state.json", chainId: 31337 },
});

await env.stop(); // call in afterAll
```

Generate the state file once with the CLI seed command:

```bash
# tests/seed.ts uses process.env.ANVIL_RPC_URL to deploy + setup
pnpm exec kiwa anvil seed tests/seed.ts --out tests/fixtures/state.json
```

The seed script runs against a one-shot anvil; on exit, anvil's `--dump-state` writes the full chain state to the output path. Subsequent test runs read it back via `loadState` and reach a ready chain in ~300 ms without replaying any transactions.

## Anvil pool (v0.2.0+)

For test suites that need real anvil across many cases, `createAnvilPool` pre-spawns N instances and lets each test borrow/release one. Releasing runs `anvil_reset` so the next borrower sees a clean chain — borrow + release is **~0 ms** after the pool warms up.

```ts
import { createAnvilPool, setupTestEnv, type AnvilPool } from "@kiwa-test/dapp";

let pool: AnvilPool;
beforeAll(async () => {
  pool = await createAnvilPool({ size: 4 });
});
afterAll(async () => {
  await pool.stopAll();
});

it("borrows from pool", async () => {
  const env = await setupTestEnv({ pool }); // borrow + lease
  // ...
  await env.stop(); // releases back, anvil_reset is invoked
});
```

`setupTestEnv` cannot accept `anvil` and `pool` together — the call throws if both are passed. Polling/spawn was tuned in v0.2.0 so a fresh `setupTestEnv({ anvil: true })` returns in **~32 ms** (down from 107 ms).

## Transport tuning for `sendTransaction` (v0.2.0+)

`TxBroadcastCtx` accepts optional `transportTimeoutMs` (default 5000) and `transportRetryCount` (default 0). Tests that exercise transport-error paths (e.g. invalid port → ECONNREFUSED) can shrink the wait from viem's 10s default to 200 ms:

```ts
await sendTransaction(
  { privateKey, chainId: 31337, anvilPort: brokenPort, transportTimeoutMs: 200, transportRetryCount: 0 },
  params,
); // rejects with code -32603 within ~200ms
```

## Direct RPC Methods

`@kiwa-test/dapp` handles these methods directly:

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
