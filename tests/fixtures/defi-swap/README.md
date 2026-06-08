# tests/fixtures/defi-swap

`examples/defi-swap` の skill chain 完成形 test 群を退避した standalone pnpm workspace。

## 構造

- `contracts/SwapTokens.sol` — Erc20 + SimpleSwap (1:1 swap pool) の minimal 実装
- `contract-test/SwapTokens.t.sol` — Foundry contract test (vm.* helper + invariant 含む)
- `hardhat-test/SwapTokens.test.cjs` — Hardhat contract test (chai matchers + fast-check)
- `e2e-test/swap.spec.ts` — Playwright e2e (kiwa fixture 経由、 approve → swap → slippage / insufficient liquidity 経路)

## 実行

```bash
# Foundry
pnpm test:foundry

# Hardhat (+ coverage)
pnpm test:hardhat
pnpm test:hardhat:coverage

# Playwright e2e
pnpm test:e2e
```

## 関連

- 親 example [`examples/defi-swap/`](../../../examples/defi-swap/)
- spec [`tests/spec/contract/test-spec-defi-swap.md`](../../spec/contract/test-spec-defi-swap.md) (存在する場合)
- review report [`tests/reports/review/result-review-defi-swap.ja.md`](../../reports/review/result-review-defi-swap.ja.md) (生成済の場合)
