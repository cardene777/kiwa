# Quickstart

> [🇬🇧 English](./quickstart.md) • [🇯🇵 日本語](../ja/quickstart.md)

Run your first kiwa E2E test in 5 minutes.

## Required prerequisites

> Required checklist:
> - `anvil --version` must succeed. Install Foundry and make sure `anvil` is available on PATH
> - Use Node.js 20+. The source of truth is the repo `package.json` `engines.node` entry (or your own `.nvmrc` if you keep one)
> - Use pnpm 10+
> - Install the Chromium binary with `pnpm exec playwright install chromium`. Sandbox environments usually need this explicitly
> - Make sure `lsof` is available on PATH. On Linux distros that omit it, install it with `apt-get install lsof` or `apk add lsof`

### Common errors

- `tsx: command not found` — `pnpm install` has not completed or dependencies are out of sync. Reinstall from the lockfile
- `anvil: command not found` — Foundry is not installed or PATH is not configured. Fix this until `anvil --version` works
- `EADDRINUSE: address already in use 127.0.0.1:8545` — another anvil or dev server is already bound to the same port. Stop it or move the port
- `browserType.launch: Executable doesn't exist` — the Playwright Chromium binary is missing. Run `pnpm exec playwright install chromium`
- `lsof: command not found` — port detection helpers cannot inspect listeners. Install `lsof` for your distro

## Requirements

- Node.js 20+
- pnpm 10+
- Foundry (`anvil` / `forge` available on PATH)
- A Playwright-capable environment

## Install

Set up a fresh project.

~~~bash
pnpm dlx @kiwa/cli init
pnpm install
pnpm exec playwright install chromium
~~~

`init` generates:

- `e2e/connect.spec.ts` — Minimal spec covering connect / sign / send tx via `window.ethereum`
- `playwright.config.ts` — Headless Chromium configuration
- Updates `package.json` `scripts.test:e2e` and `devDependencies` when an existing `package.json` is present

## Run the first test

~~~bash
pnpm exec playwright test
~~~

Expected output.

~~~
Running 1 test using 1 worker
  ✓ e2e/connect.spec.ts:5:1 › connects and signs message
  1 passed (3.2s)
~~~

## Minimal custom test

~~~ts
import { dappE2eTest as test, expect } from '@kiwa/core';

test('dApp can connect', async ({ page, dappE2e }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /connect/i }).click();
  await expect(page.getByTestId('connection-status')).toHaveText('status: connected');
});
~~~

## Integrating with an existing Foundry project

`init --with-deploy` generates a four-file boilerplate that starts anvil, runs `forge build` + `forge create`, and writes `.env.local` in one command.

~~~bash
pnpm dlx @kiwa/cli init --with-deploy ../contract
~~~

For step-by-step instructions (placeholder replacement, Playwright config wiring, common pitfalls) and the reference implementation, see [Cookbook: kiwa init --with-deploy](./cookbook/with-deploy.md).

## Next steps

- [Examples](./examples/README.md) — Pick an example by feature
- [Concepts](./concepts/README.md) — Fixture / EIP-6963 / RPC handling internals
- [Cookbook](./cookbook/README.md) — Connect button / time manipulation / multi-wallet / `--with-deploy` usage
- [API Reference](./api/README.md) — `dappE2eTest` / `startAnvil` / `waitForChainState`
