# examples/mint-nft

> [🇬🇧 English](./README.md) • [🇯🇵 日本語](./README.ja.md)

Deploys the `MintNft.sol` ERC721 contract to anvil and runs tests through three lanes — Playwright + viem, Foundry, and Hardhat — so you can compare the kiwa dApp lane and the "Foundry + Hardhat side-by-side" workflow for contract-only tests.

## Two paths in this directory

### 1. Walk the retrofit tutorial (authoring path)

`test/`, `hardhat-test/`, and `tests/` are `.gitignore`d and empty right after `git clone`. Run the `/kiwa-design` → `/kiwa-forge` → `/kiwa-hardhat` → `/kiwa-play` skill chain to regenerate the tests from zero. After regeneration, you can run them directly with commands such as `cd examples/mint-nft && forge test`.

### 2. Read or run the completed reference

The completed test suite has been relocated to `tests/fixtures/mint-nft/`. Run it from there:

```bash
pnpm --dir tests/fixtures/mint-nft test:foundry    # 27/27
pnpm --dir tests/fixtures/mint-nft test:hardhat    # 24/24
pnpm --dir tests/fixtures/mint-nft test:e2e        # 8/8
```

See `tests/fixtures/mint-nft/README.md` for details.

### Migration note

The old `cd examples/mint-nft && forge test` flow does nothing right after clone because the working directories are empty. Use `tests/fixtures/mint-nft/` when you want to run the completed reference suite.

## What you can try

- `startAnvil` + `forge create`-style deploy flow wired into the Playwright fixture
- ERC721 mint / batchMint / transferFrom / royaltyInfo / safeTransferFrom / supportsInterface
- ERC721Enumerable's tokenOfOwnerByIndex / tokenByIndex
- Foundry `.t.sol` and Hardhat `.test.cjs` running against the same contract
- Hardhat-side coverage in four metrics (Stmts / Branch / Funcs / Lines)

## How to run

Run `pnpm install` at the repo root first, then `pnpm exec playwright install chromium`. Foundry's `anvil` and `forge` must be on your PATH.

```bash
# Run the completed reference fixture
pnpm --dir tests/fixtures/mint-nft test:foundry
pnpm --dir tests/fixtures/mint-nft test:hardhat
pnpm --dir tests/fixtures/mint-nft test:e2e

# Run the examples-side workbench only after you regenerate the tests
cd examples/mint-nft && forge test
```

## Reading the tests

| File | What it covers |
|---|---|
| `tests/fixtures/mint-nft/e2e-test/mint.spec.ts` | Playwright e2e lane — viem WalletClient deploy → mint → balanceOf → transferFrom |
| `tests/fixtures/mint-nft/contract-test/MintNft.t.sol` | Foundry unit lane, including invariant / fuzz cases |
| `tests/fixtures/mint-nft/hardhat-test/MintNft.test.cjs` | Hardhat unit lane (added in F-1), six grouped perspectives (happy path / error / boundary / state transition / authorization / security) |

Running the same contract through all three lanes is what `/kiwa-hardhat` skill leans on to prove out the Hardhat workflow.

## Related cookbook entries

- [Custom error revert](../../docs/en/cookbook/custom-error-revert.md)
- [Snapshot revert](../../docs/en/cookbook/snapshot-revert.md)
- [Test design flow (skill chain tutorial)](../../tests/docs/skill-chain-tutorial.md)

## Where to go next

- ERC20 + AMM swap → [examples/defi-swap](../defi-swap/README.md)
- Composite marketplace (listing + offer + royalty) → [examples/nft-marketplace](../nft-marketplace/README.md)
