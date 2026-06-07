# examples/nextjs-token-gating

Gates `GatedContent.getSecret()` so only holders of the `GateNFT` ERC721 can read it. The timed-grant path and grantor revocation are part of the example. Hardhat lane added in F-1 wave 1.

## Two tracks

- Workbench: `examples/nextjs-token-gating/` is the retrofit walkthrough workspace. Recreate `test/`, `hardhat-test/`, and `tests/` here when following the docs.
- Finished fixture: the preserved completed suite lives in `tests/fixtures/nextjs-token-gating/`.

## What you can try

- Only `GateNFT` holders may call `GatedContent.getSecret()`
- `grantTimedAccess` to give non-holders time-bounded access
- `time.increase` to expire the grant and trip `NotGated` revert
- Revoke a grantee's access immediately when the grantor transfers the NFT away
- Hardhat lane (`pnpm -F examples-nextjs-token-gating test:hardhat`) running side by side (F-1 wave 1)

## How to run

```bash
# Example app
pnpm -F examples-nextjs-token-gating dev

# Finished Foundry fixture
pnpm --dir tests/fixtures/nextjs-token-gating test:foundry

# Finished Hardhat fixture
pnpm --dir tests/fixtures/nextjs-token-gating test:hardhat

# Finished Playwright fixture
pnpm --dir tests/fixtures/nextjs-token-gating test:e2e
```

Next.js dev server runs on port 3044.

## Reading the tests

| File | What it covers |
|---|---|
| `tests/fixtures/nextjs-token-gating/e2e-test/gating.spec.ts` | Playwright e2e — NFT mint → gated content access → timed grant → revoke |
| `tests/fixtures/nextjs-token-gating/hardhat-test/GatedContent.test.cjs` | Hardhat unit (F-1 wave 1), 23 cases across six perspectives |
| `tests/fixtures/nextjs-token-gating/contract-test/GatedContent.t.sol` | Foundry unit test lane preserved with history |

## Related cookbook entries

- [Time manipulation (timed access)](../../docs/en/cookbook/time-manipulation.md)
- [Custom error revert](../../docs/en/cookbook/custom-error-revert.md)

## Where to go next

- Composite marketplace → [examples/nft-marketplace](../nft-marketplace/README.md)
- ERC1155 game items → [examples/nextjs-erc1155-game](../nextjs-erc1155-game/README.md)
