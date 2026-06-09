# examples/defi-swap

> [🇬🇧 English](./README.md) • [🇯🇵 日本語](./README.ja.md)

ERC20 2 種 + 1:1 swap pool (SimpleSwap.sol + Erc20.sol) を deploy し、 approve → swap → slippage / insufficient liquidity の振る舞いを Playwright + Foundry + Hardhat の 3 経路で検証する example。 ERC20 approval policy と slippage protection 周りの kiwa 機能を試したいときの起点。

## 何が試せるか

- ERC20 `approve` を kiwa `setApprovalModeForToken` / token-specific approval policy で per-token reject / limit 制御
- `swapAforB(amountIn, minOutputAmount)` overload の slippage 検証 (SlippageExceeded)
- pool 流動性超過時の InsufficientLiquidity revert
- `expectBalanceChange` で balance 差分 assertion
- Foundry .t.sol と Hardhat .test.cjs の並立 (F-1 第 1 弾)、 coverage Stmts/Funcs/Lines 100% + Branch 87.5%

## 動かす

前提として repo root で `pnpm install` 済 + `pnpm exec playwright install chromium` 済 + Foundry の `anvil` / `forge` が PATH 上。

```bash
# Playwright e2e (kiwa fixture)
pnpm -F examples-defi-swap test

# Foundry 単体 test
cd examples/defi-swap && forge test

# Hardhat 単体 test (F-1 で追加)
pnpm -F examples-defi-swap test:hardhat

# Hardhat coverage
pnpm -F examples-defi-swap test:hardhat:coverage
```

## test の見方

| File | 何を test しているか |
|---|---|
| `tests/swap.spec.ts` | Playwright e2e、 viem deploy → approve → swap、 SlippageExceeded / InsufficientLiquidity 検証 |
| `test/SwapTokens.t.sol` | Foundry 単体 (invariant / fuzz 含む) |
| `hardhat-test/SwapTokens.test.cjs` | Hardhat 単体 (F-1 第 1 弾)、 観点 6 系統 23 ケース |

## 関連 cookbook

- [Token approve flow](../../docs/ja/cookbook/token-approve-flow.md)
- [Custom error revert 検証](../../docs/ja/cookbook/custom-error-revert.md)

## 次に試す

- gated content + timed grant → [examples/nextjs-token-gating](../nextjs-token-gating/) (README 整備予定 / follow-up)
- 複合 marketplace (listing + offer + royalty) → [examples/nft-marketplace](../nft-marketplace/README.ja.md)
