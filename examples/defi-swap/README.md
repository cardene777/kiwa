# examples/defi-swap

> [🇬🇧 English](./README.md) • [🇯🇵 日本語](./README.ja.md)

Deploys two ERC20 tokens plus a 1:1 swap pool (`SimpleSwap.sol` + `Erc20.sol`) and exercises approve → swap → slippage / insufficient-liquidity behaviour across Playwright + Foundry + Hardhat. Pick this when you want to play with kiwa's ERC20 approval policy and slippage protection helpers.

## Two paths in this directory

### 1. Walk the retrofit tutorial (authoring path)

`test/`, `hardhat-test/`, and `tests/` are `.gitignore`d and empty right after `git clone`. Run the `/kiwa-design` → `/kiwa-forge` → `/kiwa-hardhat` → `/kiwa-play` skill chain to regenerate the tests from zero. After regeneration, you can run them directly with commands such as `cd examples/defi-swap && forge test`.

### 2. Read or run the completed reference

The completed test suite has been relocated to `tests/fixtures/defi-swap/`. Run it from there:

```bash
pnpm --dir tests/fixtures/defi-swap test:foundry    # 17/17
pnpm --dir tests/fixtures/defi-swap test:hardhat    # 23/23
pnpm --dir tests/fixtures/defi-swap test:e2e        # 7/7
```

See `tests/fixtures/defi-swap/README.md` for details.

### Migration note

The old `cd examples/defi-swap && forge test` flow does nothing right after clone because the working directories are empty. Use `tests/fixtures/defi-swap/` when you want to run the completed reference suite.

## What you can try

- ERC20 `approve` driven through kiwa's `setApprovalModeForToken` / per-token reject / limit policies
- `swapAforB(amountIn, minOutputAmount)` overload to assert `SlippageExceeded`
- Pool-liquidity overflow path (`InsufficientLiquidity`)
- `expectBalanceChange` balance-delta assertions
- Foundry `.t.sol` and Hardhat `.test.cjs` running side by side (F-1 wave 1), coverage Stmts/Funcs/Lines 100% + Branch 87.5%

## How to run

Run `pnpm install` at the repo root first, then `pnpm exec playwright install chromium`. Foundry's `anvil` and `forge` must be on your PATH.

```bash
# Playwright e2e (kiwa fixture)
pnpm -F examples-defi-swap test

# Foundry contract tests
cd examples/defi-swap && forge test

# Hardhat contract tests (added in F-1 wave 1)
pnpm -F examples-defi-swap test:hardhat

# Hardhat coverage
pnpm -F examples-defi-swap test:hardhat:coverage
```

## Reading the tests

| File | What it covers |
|---|---|
| `tests/fixtures/defi-swap/e2e-test/swap.spec.ts` | Playwright e2e — viem deploy → approve → swap, asserts SlippageExceeded / InsufficientLiquidity |
| `tests/fixtures/defi-swap/contract-test/SwapTokens.t.sol` | Foundry unit (invariant + fuzz) |
| `tests/fixtures/defi-swap/hardhat-test/SwapTokens.test.cjs` | Hardhat unit (F-1 wave 1), 23 cases across six grouped perspectives |

## Related cookbook entries

- [Token approve flow](../../docs/en/cookbook/token-approve-flow.md)
- [Custom error revert](../../docs/en/cookbook/custom-error-revert.md)

## Where to go next

- Gated content + timed grant → [examples/nextjs-token-gating](../nextjs-token-gating/) (README pending in a follow-up)
- Composite marketplace (listing + offer + royalty) → [examples/nft-marketplace](../nft-marketplace/README.md)
