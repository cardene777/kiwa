# examples/mint-nft

Deploys the `MintNft.sol` ERC721 contract to anvil and runs tests through three lanes — Playwright + viem, Foundry, and Hardhat — so you can compare the kiwa dApp lane and the "Foundry + Hardhat side-by-side" workflow for contract-only tests.

## What you can try

- `startAnvil` + `forge create`-style deploy flow wired into the Playwright fixture
- ERC721 mint / batchMint / transferFrom / royaltyInfo / safeTransferFrom / supportsInterface
- ERC721Enumerable's tokenOfOwnerByIndex / tokenByIndex
- Foundry `.t.sol` and Hardhat `.test.cjs` running against the same contract
- Hardhat-side coverage in four metrics (Stmts / Branch / Funcs / Lines)

## How to run

Run `pnpm install` at the repo root first, then `pnpm exec playwright install chromium`. Foundry's `anvil` and `forge` must be on your PATH.

```bash
# Playwright e2e (kiwa fixture)
pnpm -F examples-mint-nft test

# Foundry contract tests
cd examples/mint-nft && forge test

# Hardhat contract tests
pnpm -F examples-mint-nft test:hardhat

# Hardhat coverage
pnpm -F examples-mint-nft test:hardhat:coverage
```

## Reading the tests

| File | What it covers |
|---|---|
| `tests/mint.spec.ts` | Playwright e2e lane — viem WalletClient deploy → mint → balanceOf → transferFrom |
| `test/MintNft.t.sol` | Foundry unit lane, including invariant / fuzz cases |
| `hardhat-test/MintNft.test.cjs` | Hardhat unit lane (added in F-1), six grouped perspectives (happy path / error / boundary / state transition / authorization / security) |

Running the same contract through all three lanes is what `/kiwa-hardhat` skill leans on to prove out the Hardhat workflow.

## Related cookbook entries

- [Custom error revert](../../docs/en/cookbook/custom-error-revert.md)
- [Snapshot revert](../../docs/en/cookbook/snapshot-revert.md)
- [Test design flow (skill chain tutorial)](../../tests/docs/skill-chain-tutorial.md)

## Where to go next

- ERC20 + AMM swap → [examples/defi-swap](../defi-swap/README.md)
- Composite marketplace (listing + offer + royalty) → [examples/nft-marketplace](../nft-marketplace/README.md)
