# Examples Walkthrough

> [🇬🇧 English](./walkthrough.md) • [🇯🇵 日本語](../../ja/examples/walkthrough.md)

A 30 minute to 1 hour tour through five popular kiwa examples. The stages ramp up gradually — starter → contract-only → framework integration → composite.

The "duration" on each stage is the time it takes to read the docs and watch the behaviour. The test commands themselves take seconds to a few dozen seconds (Stage 4 is ~25s including Next.js boot; the rest are around 4s).

## Prerequisites

- `pnpm install` run at the repo root
- `pnpm exec playwright install chromium` done
- Foundry's `anvil` and `forge` on PATH
- Node.js 20+

## Stage 1 — basic-connect (~5 min)

No contract, a single inline HTML page so you can feel how the kiwa fixture behaves.

```bash
pnpm -F examples-basic-connect test
```

Expect — 11 cases from `connect.spec.ts` + 4 from `eip6963.spec.ts` = 15 passing, end-to-end in ~4s (the chain is `pnpm -F @kiwa/core build` → `playwright test`).

What to watch for.

- Playwright launches, the fixture injects `window.ethereum`
- Connect click → `eth_requestAccounts` → anvil dev account
- Sign click → `personal_sign` → viem `verifyMessage` round-trip
- `dappE2e.waitForRpcIdle()` drains pending RPCs before assertions

More in [examples/basic-connect/README.md](../../../examples/basic-connect/README.md).

## Stage 2 — mint-nft (~10 min)

Deploys the minimal ERC721 + ERC2981 + Enumerable contract to anvil and runs tests through Playwright + viem + Foundry + Hardhat.

```bash
# Playwright e2e
pnpm -F examples-mint-nft test

# Foundry unit
cd examples/mint-nft && forge test

# Hardhat unit (the kiwa-hardhat skill output)
pnpm -F examples-mint-nft test:hardhat

# Hardhat coverage
pnpm -F examples-mint-nft test:hardhat:coverage
```

Expect — 8 e2e + 27 Foundry + 24 Hardhat cases, Hardhat coverage at Stmts 92.86% / Branch 80.56% / Funcs 100% / Lines 93.75% (e2e ~3s / forge test ~0.1s / hardhat test ~0.4s).

What to watch for.

- Three lanes (e2e / forge / hardhat) against a single contract
- Hardhat coverage reports four metrics — Stmts / Branch / Funcs / Lines
- `forge create` deploy wired into the Playwright fixture

More in [examples/mint-nft/README.md](../../../examples/mint-nft/README.md).

## Stage 3 — defi-swap (~15 min)

ERC20 plus a 1:1 swap pool. Use it to play with token approve flows and slippage protection.

```bash
# Playwright e2e (approve → swap, SlippageExceeded / InsufficientLiquidity)
pnpm -F examples-defi-swap test

# Hardhat unit (23 cases across six grouped perspectives)
pnpm -F examples-defi-swap test:hardhat

# Hardhat coverage (Stmts/Funcs/Lines 100% + Branch 87.5%)
pnpm -F examples-defi-swap test:hardhat:coverage
```

Expect — 7 e2e + 23 Hardhat cases, Hardhat coverage at Stmts 100% / Branch 87.5% / Funcs 100% / Lines 100% (e2e ~4s / hardhat test ~0.3s).

What to watch for.

- `setApprovalModeForToken` controls per-token approve reject / limit
- `swapAforB(amountIn, minOutputAmount)` overload forces `SlippageExceeded`
- Liquidity overflow returns `InsufficientLiquidity` with arg info
- `expectBalanceChange` helper writes balance-delta assertions

More in [examples/defi-swap/README.md](../../../examples/defi-swap/README.md).

## Stage 4 — nextjs-wagmi-rainbow (~15 min)

The framework-integration loop in one example. Next.js + wagmi + RainbowKit with the kiwa fixture wired in.

```bash
pnpm -F examples-nextjs-wagmi-rainbow test
```

Expect — 4 cases from `connect-and-mint.spec.ts`, ~25s including Next.js dev-server boot.

Internally:

1. `pnpm -F @kiwa/core build` refreshes the fixture dist
2. `tests/prepare-env.ts` starts anvil + `forge build` + `forge create` + writes `.env.local`
3. Playwright boots Next.js → runs `connect-and-mint.spec.ts`
4. globalTeardown stops anvil and clears the pidfile

What to watch for.

- The four-file shape `tests/prepare-env.ts` + `tests/global-setup.ts` + `tests/global-teardown.ts` + `tests/fixture.ts`
- `dappE2eTest.extend({ _anvilHandle: ... })` hands the globalSetup anvil to the fixture
- RainbowKit modal click → wagmi `useAccount` populates the address

`kiwa init --with-deploy <foundry-path>` produces the same four-file shape (CLI option in PR #195).

More in [examples/nextjs-wagmi-rainbow/README.md](../../../examples/nextjs-wagmi-rainbow/README.md).

## Stage 5 — nft-marketplace (~20 min)

The most complex test dApp. listing + offer + royalty payout + offer invalidation in one contract.

```bash
# Playwright e2e (drives four wallets — seller / buyer / royalty receiver / counter-buyer)
pnpm -F examples-nft-marketplace test

# Hardhat unit (MarketNft 21 cases + SimpleMarketplace 30 cases over six perspectives)
pnpm -F examples-nft-marketplace test:hardhat

# Hardhat coverage (Stmts 98.77% / Branch 84.62% / Funcs 100% / Lines 97.25%)
pnpm -F examples-nft-marketplace test:hardhat:coverage
```

Expect — 12 e2e + Hardhat (MarketNft 21 + SimpleMarketplace 30) = 51 cases, Hardhat coverage at Stmts 98.77% / Branch 84.62% / Funcs 100% / Lines 97.25% (e2e ~4s / hardhat test ~0.6s).

What to watch for.

- ERC2981 `royaltyInfo` (500 bps) splits royalty automatically (seller 95% / royalty receiver 5%)
- acceptOffer invalidates every other offer for the same tokenId and refunds them
- Buy returns the change when `msg.value > price`
- Hardhat `time.increase` lets you trip `OfferExpired` past the deadline
- Multi-account test pattern across four wallets

More in [examples/nft-marketplace/README.md](../../../examples/nft-marketplace/README.md).

## Where to go next

- Full map of 20 examples → [examples/README.md](./README.md)
- Feature recipes → [Cookbook](../cookbook/README.md)
- Understand the internals → [Concepts](../concepts/README.md)
- Look up the API → [API Reference](../api/README.md)
