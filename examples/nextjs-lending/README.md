# examples/nextjs-lending

A simplified lending pool (`SimpleLending` + `SimpleERC20` + `MockPriceOracle`) verified through Playwright. Drives deposit → borrow → repay plus liquidation, paired with kiwa's snapshot / revert helpers.

## What you can try

- `SimpleLending.deposit / borrow / repay / liquidate`
- Move collateral price through `MockPriceOracle` to force liquidation
- snapshotChain / revertChain to rewind before / after borrow and try again
- Borrow cap / health-factor boundaries
- `seizeAmount` after a liquidation

## How to run

```bash
pnpm -F examples-nextjs-lending test
```

Next.js dev server runs on port 3038.

## Reading the tests

| File | What it covers |
|---|---|
| `tests/lending.spec.ts` | Happy path deposit → borrow → repay + liquidation through price moves, 8 cases |

## Related cookbook entries

- [Snapshot revert](../../docs/en/cookbook/snapshot-revert.md)
- [Custom error revert](../../docs/en/cookbook/custom-error-revert.md)
- [Token approve flow](../../docs/en/cookbook/token-approve-flow.md)

## Where to go next

- Staking → [examples/nextjs-staking](../nextjs-staking/README.md)
- Back to the basics → [examples/basic-connect](../basic-connect/README.md)
