# examples/nextjs-vesting

> [🇬🇧 English](./README.md) • [🇯🇵 日本語](./README.ja.md)

Token vesting schedule (`TokenVesting` + `SimpleERC20`) verified through Playwright. Drives cliff → linear vesting → claim alongside kiwa's time manipulation helpers.

## What you can try

- Set up cliff + duration via `TokenVesting.createSchedule`
- `increaseTime` to advance and check `releasable` amount
- Custom-error revert when claiming before the cliff
- Stepwise claim as vesting progresses
- Remainder check and final claim after vesting completes

## How to run

```bash
pnpm -F examples-nextjs-vesting test
```

Next.js dev server runs on port 3047.

## Reading the tests

| File | What it covers |
|---|---|
| `tests/vesting.spec.ts` | createSchedule → time advance → claim, plus cliff boundary / progress checks, 7 cases |

## Related cookbook entries

- [Time manipulation](../../docs/en/cookbook/time-manipulation.md)
- [Custom error revert](../../docs/en/cookbook/custom-error-revert.md)
- [Snapshot revert](../../docs/en/cookbook/snapshot-revert.md)

## Where to go next

- Staking → [examples/nextjs-staking](../nextjs-staking/README.md)
- Back to the basics → [examples/basic-connect](../basic-connect/README.md)
