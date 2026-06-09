# examples/nextjs-erc1155-game

> [🇬🇧 English](./README.md) • [🇯🇵 日本語](./README.ja.md)

ERC1155 game items (`GameItems`) verified through Next.js + Playwright. Drives inventory display → burn → mint with viem `WalletClient`.

## What you can try

- ERC1155 `mint` / `batchMint` to distribute multiple token IDs in one tx
- `balanceOfBatch` to fetch a whole inventory at once
- `burn` flow that consumes tokens
- Asserting ERC1155 `TransferSingle` / `TransferBatch` event args

## How to run

```bash
pnpm -F examples-nextjs-erc1155-game test
```

Next.js dev server runs on port 3034.

## Reading the tests

| File | What it covers |
|---|---|
| `tests/inventory.spec.ts` | mint → `balanceOfBatch` inventory display, 5 cases |
| `tests/burn.spec.ts` | burn → balance decrement → remainder check, 5 cases |

## Related cookbook entries

- [Custom error revert](../../docs/en/cookbook/custom-error-revert.md)

## Where to go next

- ERC721 side → [examples/mint-nft](../mint-nft/README.md)
- Back to the basics → [examples/basic-connect](../basic-connect/README.md)
