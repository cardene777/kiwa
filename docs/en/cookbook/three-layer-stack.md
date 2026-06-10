# Stack three layers on the same contract

> [🇬🇧 English](./three-layer-stack.md) • [🇯🇵 日本語](../../ja/cookbook/three-layer-stack.md)

kiwa lets you run **Foundry (`.t.sol`) + Hardhat (`.test.cjs`) + Playwright (`.spec.ts`)** against a single Solidity contract. This recipe walks the same approach for three reference contracts so you can confirm the pattern is not specific to one example.

## When to choose three layers

Use all three layers when one of the following is true.

- You want runner diversity (Foundry `vm.warp` / Hardhat `solidity-coverage` / Playwright on-chain assertion) to catch the same bug from different angles.
- You want to keep a contract test (`forge test` + `npx hardhat test`) and a UX-level e2e test (`playwright test`) in lockstep with one Layer 1 spec (`/kiwa-design --layer contract` and `--layer e2e`).
- You want to cover both the contract surface and the dApp surface in a single regression suite.

If you only need contract correctness, run Foundry alone. If you only need UX, run Playwright alone. The three-layer stack pays off when you want all of the above to stay aligned.

## Three reference contracts

| Example | Contract | Foundry lane | Hardhat lane | Playwright lane |
|---|---|---|---|---|
| [`tests/fixtures/mint-nft`](../../../tests/fixtures/mint-nft/) | `MintNft.sol` (ERC721 + Enumerable + royalty) | `contract-test/MintNft.t.sol` (27/27) | `hardhat-test/MintNft.test.cjs` (24/24) | `e2e-test/mint.spec.ts` (8/8) |
| [`tests/fixtures/defi-swap`](../../../tests/fixtures/defi-swap/) | `SimpleSwap.sol` + `Erc20.sol` (1:1 swap pool with slippage protection) | `contract-test/SwapTokens.t.sol` (17/17) | `hardhat-test/SwapTokens.test.cjs` (23/23) | `e2e-test/swap.spec.ts` (7/7) |
| [`tests/fixtures/nextjs-token-gating`](../../../tests/fixtures/nextjs-token-gating/) | `GatedContent.sol` (NFT-gated access + timed grant) | `contract-test/GatedContent.t.sol` (20/20) | `hardhat-test/GatedContent.test.cjs` (23/23) | `e2e-test/gating.spec.ts` (8/8) |

Run any lane directly from its fixture directory.

```bash
# Foundry lane (any example)
pnpm --dir tests/fixtures/<name> test:foundry

# Hardhat lane (any example)
pnpm --dir tests/fixtures/<name> test:hardhat

# Playwright lane (any example)
pnpm --dir tests/fixtures/<name> test:e2e
```

The 9 entries (3 examples × 3 lanes) cover three contract shapes (NFT mint, AMM swap, gated content) to demonstrate that the stack is not tied to one specific contract pattern.

## Why all three lanes pass on the same contract

The shared Layer 1 spec (`tests/spec/contract/test-spec-<name>.md` and `tests/spec/e2e/test-spec-<name>.md`) is the single source of truth. Layer 2 skills read it and mechanically translate.

- `/kiwa-forge` translates the spec's TC table into Foundry helpers (`vm.expectRevert`, `forge fuzz`, `vm.warp`).
- `/kiwa-hardhat` translates the same table into Hardhat helpers (`expect(...).to.be.reverted`, `fast-check`, `time.increaseTo`).
- `/kiwa-play` translates the spec's e2e TC table into Playwright + `@kiwa-test/core` fixture helpers (`getByTestId`, `walletClient.signTypedData`).

The viewpoint × runner mapping table in [`viewpoints-catalog.md`](../../../.claude/skills/kiwa-design/references/viewpoints-catalog.md) lists each translation per viewpoint, so a contributor can predict what the generated test will look like before invoking Layer 2.

## How to add a fourth contract to this stack

Pick any contract under `examples/<name>/contracts/`, then walk the skill chain in this order.

1. `/kiwa-design --layer contract --module <name> --input examples/<name>/contracts/<Contract>.sol`
2. `/kiwa-forge --module <name>` → `examples/<name>/test/<Contract>.t.sol`
3. `/kiwa-hardhat --module <name>` → `examples/<name>/hardhat-test/<Contract>.test.cjs`
4. `/kiwa-design --layer e2e --module <name> --input examples/<name>/app/page.tsx`
5. `/kiwa-play --module <name>` → `examples/<name>/tests/<name>.spec.ts`

If the contract uses time-dependent logic (vesting, voting deadlines), prefer Foundry for the contract lane — `vm.warp` is the simplest way to test boundary times. If the contract emits many events that the UI needs to react to, prefer Playwright for the e2e lane so you can assert against the UI directly via `getByTestId`.

For runner-specific limitations, the spec captures them under [`runner 差異`](../../../.claude/skills/kiwa-design/references/output-skeleton.md) bullets so the contributor does not chase coverage on a branch that one runner cannot reach.

## Related

- [`tests/docs/skill-chain-tutorial.md`](../../../tests/docs/skill-chain-tutorial.md) — Full skill-chain flow from spec to test
- [`tests/docs/run-contract-tests.md`](../../../tests/docs/run-contract-tests.md) — Contract side procedure (Foundry + Hardhat)
- [`tests/docs/run-dapp-e2e-tests.md`](../../../tests/docs/run-dapp-e2e-tests.md) — dApp e2e procedure (Playwright)
- [`docs/EXAMPLE-FIXTURES.md`](../../EXAMPLE-FIXTURES.md) — Which examples have a completed fixture
