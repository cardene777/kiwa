# examples/nft-marketplace

Pairs an ERC721 (`MarketNft.sol`, ERC2981 royalty) with a composite marketplace (`SimpleMarketplace.sol` — listing + offer + acceptOffer + royalty payout + offer invalidation). The most complex test dApp in kiwa, where a single example covers list / buy / cancel / makeOffer / cancelOffer / acceptOffer / royalty payout in one place.

## What you can try

- Automatic royalty split through ERC2981 `royaltyInfo` (500 bps = 5%), seller 95% / royalty receiver 5%
- Both overloads of `SimpleMarketplace.makeOffer` (`uint256, uint256` and `uint256, uint256, uint256`)
- Automatic offer invalidation on acceptOffer (every other offer for the same tokenId is cancelled + refunded)
- Buy-side refund of excess `msg.value` when payment > price
- `OfferExpired` revert past the deadline (driven by Hardhat `time.increase`)
- Four-wallet pattern (seller / buyer / royalty receiver / counter-buyer)
- Foundry `.t.sol` + Hardhat `.test.cjs` side by side (F-1 wave 2), coverage Stmts 98.77% / Branch 84.62% / Funcs 100% / Lines 97.25%

## How to run

Run `pnpm install` at the repo root first, then `pnpm exec playwright install chromium`. Foundry's `anvil` and `forge` must be on your PATH.

```bash
# Playwright e2e (kiwa fixture)
pnpm -F examples-nft-marketplace test

# Foundry contract tests
cd examples/nft-marketplace && forge test

# Hardhat contract tests (F-1 wave 2)
pnpm -F examples-nft-marketplace test:hardhat

# Hardhat coverage
pnpm -F examples-nft-marketplace test:hardhat:coverage
```

## Reading the tests

| File | What it covers |
|---|---|
| `tests/marketplace.spec.ts` | Playwright e2e — drives four wallets through list → buy → makeOffer → acceptOffer with royalty payout end-to-end |
| `test/*.t.sol` | Foundry unit (invariant / fuzz) |
| `hardhat-test/MarketNft.test.cjs` | Hardhat MarketNft unit (F-1 wave 2) — 21 cases over ERC721 + ERC2981 + safe-receiver path |
| `hardhat-test/SimpleMarketplace.test.cjs` | Hardhat SimpleMarketplace unit (F-1 wave 2) — 30 cases over listing / offer / royalty payout / offer invalidation |

## Related cookbook entries

- [Custom error revert](../../docs/en/cookbook/custom-error-revert.md)
- [Time manipulation (offer expiry)](../../docs/en/cookbook/time-manipulation.md)
- [Multi-wallet seller / buyer split](../../docs/en/cookbook/multi-wallet.md)

## Where to go next

- Another advanced dApp → [examples/nextjs-aa-erc4337](../nextjs-aa-erc4337/) (Smart Account / Account Abstraction, README pending in a follow-up)
- Back to the basics → [examples/basic-connect](../basic-connect/README.md)
