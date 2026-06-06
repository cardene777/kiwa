# Generate framework integration boilerplate with `kiwa init --with-deploy`

## Goal

When you already have a Foundry project and a dApp, generate the `pnpm test` pre-flight boilerplate (start anvil + `forge build` + `forge create` + write `.env.local`) in one command with `kiwa init --with-deploy <foundry-path>`. The `nextjs-wagmi-rainbow` example is the reference implementation of the same shape.

## Prerequisites

- An existing Foundry project (`foundry.toml` + `src/*.sol`, and `forge build` passes)
- An existing Next.js (or Vite) project + `playwright.config.ts`
- Foundry's `anvil` and `forge` on PATH
- `pnpm install` done + `pnpm exec playwright install chromium` done

## Steps

### 1. Generate the boilerplate

```bash
# When the Foundry project lives in ../contract
pnpm dlx @kiwa/cli init --with-deploy ../contract
```

Generated files.

| File | Role |
|---|---|
| `tests/prepare-env.ts` | Function that runs anvil → `forge build` → `forge create` → write `.env.local` |
| `tests/global-setup.ts` | Calls `prepareEnv()` from Playwright globalSetup to start anvil + deploy |
| `tests/global-teardown.ts` | Stops anvil and clears the pidfile in Playwright globalTeardown |
| `tests/fixture.ts` | Extends `dappE2eTest` so `_anvilHandle` points at the globalSetup anvil |

### 2. Replace template placeholders

Edit the leading constants in `tests/prepare-env.ts` to fit your contract.

```ts
const FOUNDRY_PATH = '../contract';            // injected by the CLI; verify it
const CONTRACT_NAME = 'YourContract';          // ← change to the contract you deploy
const CONTRACT_ARGS: unknown[] = [];           // ← constructor args, e.g. [recipient, 1000n]
const ENV_VAR_NAME = 'NEXT_PUBLIC_CONTRACT_ADDRESS';  // ← env var your dApp reads
const ANVIL_PORT = 8545;                       // ← change only if port 8545 collides
```

`CONTRACT_NAME` reads `out/<CONTRACT_NAME>.sol/<CONTRACT_NAME>.json` produced by `forge build`, so the source filename and contract name are assumed to match. Otherwise edit the `abiPath` line directly.

### 3. Wire it into Playwright config

Register globalSetup / globalTeardown in `playwright.config.ts`.

```ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  globalSetup: './tests/global-setup.ts',
  globalTeardown: './tests/global-teardown.ts',
  testDir: './tests',
  // ... your existing settings
});
```

### 4. Import the fixture from your spec

Instead of using `dappE2eTest` from `@kiwa/core` directly, route through `tests/fixture.ts` so the spec shares the globalSetup anvil.

```ts
import { test, expect } from './fixture';

test('mint flow', async ({ page, dappE2e }) => {
  // The contract address is available via process.env.NEXT_PUBLIC_CONTRACT_ADDRESS
  await page.goto('/');
  // ...
});
```

### 5. Run

```bash
pnpm test
```

What happens inside.

1. `globalSetup` calls `prepareEnv()` → starts anvil + `forge build` + `forge create` + writes `.env.local`
2. Playwright boots the dev server (Next.js / Vite) and runs the spec
3. `globalTeardown` stops anvil and clears the pidfile

## Common pitfalls

- **`forge build` fails** — wrong `FOUNDRY_PATH`, invalid `foundry.toml`, or missing `lib/forge-std`. Run `cd <foundry-path> && forge build` directly first.
- **Existing `.env.local` entries vanish** — `prepareEnv()` only filters out the line matching `ENV_VAR_NAME` and keeps everything else. Still, back up your `.env.local` first if it is complex.
- **Port 8545 already in use** — another anvil / Ganache / dev server is on the same port. Either change `ANVIL_PORT` or stop the other process.
- **`CONTRACT_NAME` does not match the source file** — `out/<CONTRACT_NAME>.sol/<CONTRACT_NAME>.json` is missing. Edit the `abiPath` line, or rename the source file.

## Reference implementation

`examples/nextjs-wagmi-rainbow` implements the same four-file shape as a working reference. Internally `tests/prepare-env.ts` deploys `MintNft` and exposes `NEXT_PUBLIC_MINT_NFT_ADDRESS` to the Next.js dApp.

See [examples/nextjs-wagmi-rainbow/README.md](../../../examples/nextjs-wagmi-rainbow/README.md) for details.

## Related

- [Quickstart](../quickstart.md) — the first five minutes (the bare `pnpm dlx @kiwa/cli init` path)
- [Examples Walkthrough](../examples/walkthrough.md) — Stage 4 (nextjs-wagmi-rainbow) runs this boilerplate
- [Connect button test](./connect-button.md) — exercise the connect flow on top of the boilerplate
- [Token approve flow](./token-approve-flow.md) — approve flow after deploy
