# examples/nextjs-token-gating

Gates `GatedContent.getSecret()` so only holders of the `GateNFT` ERC721 can read it. The timed-grant path and grantor revocation are part of the example. Hardhat lane added in F-1 wave 1.

## What you can try

- Only `GateNFT` holders may call `GatedContent.getSecret()`
- `grantTimedAccess` to give non-holders time-bounded access
- `time.increase` to expire the grant and trip `NotGated` revert
- Revoke a grantee's access immediately when the grantor transfers the NFT away
- Hardhat lane (`pnpm -F examples-nextjs-token-gating test:hardhat`) running side by side (F-1 wave 1)

## How to run

```bash
# Playwright e2e
pnpm -F examples-nextjs-token-gating test

# Hardhat unit (F-1 wave 1, 23 cases across six perspectives)
pnpm -F examples-nextjs-token-gating test:hardhat

# Hardhat coverage (Stmts 94.74% / Branch 88.89% / Funcs 100% / Lines 100%)
pnpm -F examples-nextjs-token-gating test:hardhat:coverage
```

Next.js dev server runs on port 3044.

## Reading the tests

| File | What it covers |
|---|---|
| `tests/gating.spec.ts` | Playwright e2e — NFT mint → gated content access → timed grant → revoke |
| `hardhat-test/GatedContent.test.cjs` | Hardhat unit (F-1 wave 1), 23 cases across six perspectives |

## Related cookbook entries

- [Time manipulation (timed access)](../../docs/en/cookbook/time-manipulation.md)
- [Custom error revert](../../docs/en/cookbook/custom-error-revert.md)

## Where to go next

- Composite marketplace → [examples/nft-marketplace](../nft-marketplace/README.md)
- ERC1155 game items → [examples/nextjs-erc1155-game](../nextjs-erc1155-game/README.md)
