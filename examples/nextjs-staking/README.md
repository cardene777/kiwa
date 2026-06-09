# examples/nextjs-staking

> [🇬🇧 English](./README.md) • [🇯🇵 日本語](./README.ja.md)

A staking pool (`SimpleStaking` + `SimpleERC20`) verified through Playwright. Drives deposit → reward accrual → withdraw alongside kiwa's time manipulation helpers.

## What you can try

- `SimpleStaking.deposit` to stake → reward accrual
- `increaseTime` to advance reward accrual and check the withdraw payout
- Balance delta around withdraw via `expectBalanceChange` helper
- Staking cap / duration boundaries
- Reward-calculation overflow guard

## How to run

```bash
pnpm -F examples-nextjs-staking test
```

Next.js dev server runs on port 3039.

## Reading the tests

| File | What it covers |
|---|---|
| `tests/staking.spec.ts` | deposit → time advance → reward accrual → withdraw, plus cap / duration boundaries, 7 cases |

## Related cookbook entries

- [Time manipulation](../../docs/en/cookbook/time-manipulation.md)
- [Token approve flow](../../docs/en/cookbook/token-approve-flow.md)
- [Snapshot revert](../../docs/en/cookbook/snapshot-revert.md)

## Where to go next

- Vesting → [examples/nextjs-vesting](../nextjs-vesting/README.md)
- Lending → [examples/nextjs-lending](../nextjs-lending/README.md)
