# examples/nextjs-aa-smart-account

> [🇬🇧 English](./README.md) • [🇯🇵 日本語](./README.ja.md)

A simplified Smart Account stack (AccountFactory + Counter + MockToken + Paymaster + SmartAccount + TokenSpender) for the common AA use cases — Paymaster-sponsored gas, TokenSpender automated approvals, guardian recovery, ERC-1271.

## What you can try

- Deploy the first Smart Account via `AccountFactory`
- Paymaster-sponsored gas (ETH route)
- TokenSpender-driven automated ERC20 approvals
- Guardian recovery (swap Smart Account owner)
- ERC-1271 `isValidSignature` verification for Smart Account signatures

## How to run

```bash
pnpm -F examples-nextjs-aa-smart-account test
```

Next.js dev server runs on port 3041.

## Reading the tests

| File | What it covers |
|---|---|
| `tests/aa.spec.ts` | Smart Account deploy → `Counter.increment` → Paymaster gas sponsorship → ERC20 transfer via TokenSpender → guardian recovery → ERC-1271 verify, 10 cases |

## Related cookbook entries

- [Smart wallet / AA](../../docs/en/cookbook/smart-wallet-aa.md)
- [Custom error revert](../../docs/en/cookbook/custom-error-revert.md)

## Where to go next

- Full ERC-4337 v0.7 → [examples/nextjs-aa-erc4337](../nextjs-aa-erc4337/README.md)
- Back to the basics → [examples/basic-connect](../basic-connect/README.md)
