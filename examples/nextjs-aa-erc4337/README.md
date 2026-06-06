# examples/nextjs-aa-erc4337

Full ERC-4337 v0.7 Account Abstraction (EntryPoint + SimpleAccountFactory + UserOperation + MockTarget) wired into a Next.js + Playwright run. Drives the entire 4337 chain — UserOp construction → bundler-style submit → EntryPoint execute — through a Smart Account.

## What you can try

- Build and sign UserOperation v0.7 payloads
- Deploy a Smart Account via `SimpleAccountFactory.createAccount`
- Execute through `EntryPoint.handleOps` (bumps `MockTarget` counter)
- Gas estimation through the Account Abstraction lane
- ERC-1271 signature verification from a Smart Account

## How to run

Run `pnpm install` at the repo root + `pnpm exec playwright install chromium`. Foundry's `anvil` and `forge` must be on PATH.

```bash
pnpm -F examples-nextjs-aa-erc4337 test
```

Internally: `pnpm -F @kiwa/core build` refreshes the fixture dist → `playwright test` boots Next.js on port 3042 + starts anvil + deploys EntryPoint / Factory / Smart Account.

## Reading the tests

| File | What it covers |
|---|---|
| `tests/aa-erc4337.spec.ts` | UserOp construction → EntryPoint execute → `MockTarget` state changes, 7 cases |

## Related cookbook entries

- [Smart wallet / AA](../../docs/en/cookbook/smart-wallet-aa.md)
- [Custom error revert](../../docs/en/cookbook/custom-error-revert.md)

## Where to go next

- Simplified Smart Account → [examples/nextjs-aa-smart-account](../nextjs-aa-smart-account/README.md)
- Back to the basics → [examples/basic-connect](../basic-connect/README.md)
