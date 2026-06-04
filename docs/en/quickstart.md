# Quickstart

Run your first dapp-e2e E2E test in 5 minutes.

## Requirements

- Node.js 20+
- pnpm 9+
- Foundry (`anvil` / `forge` available on PATH)
- A Playwright-capable environment

## Install

Set up a fresh project.

~~~bash
pnpm dlx @dapp-e2e/cli init
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
import { dappE2eTest as test, expect } from '@dapp-e2e/core';

test('dApp can connect', async ({ page, dappE2e }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /connect/i }).click();
  await expect(page.getByTestId('connection-status')).toHaveText('status: connected');
});
~~~

## Next steps

- [Concepts](./concepts/README.md) — Fixture / EIP-6963 / RPC handling internals
- [Cookbook](./cookbook/README.md) — Connect button / time manipulation / multi-wallet
- [API Reference](./api/README.md) — `dappE2eTest` / `startAnvil` / `waitForChainState`
