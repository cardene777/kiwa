# examples/nextjs-dao-vote

> [🇬🇧 English](./README.md) • [🇯🇵 日本語](./README.ja.md)

The minimal DAO voting path (VoteToken + SimpleDao + DaoExecutionTarget) under Playwright + viem. Lets you exercise propose → vote → execute plus quorum / timelock boundaries.

## What you can try

- Delegate voting power on `VoteToken`
- The propose / vote / execute path on `SimpleDao`
- Execute reverting when quorum is not reached
- `DaoExecutionTarget` state changes (proposal payload actually runs)
- snapshotChain / revertChain to roll back after a vote

## How to run

```bash
pnpm -F examples-nextjs-dao-vote test
```

Next.js dev server runs on port 3037.

## Reading the tests

| File | What it covers |
|---|---|
| `tests/dao.spec.ts` | VoteToken delegate → propose → vote → execute + quorum / timelock boundaries, 8 cases |

## Related cookbook entries

- [Time manipulation (timelock)](../../docs/en/cookbook/time-manipulation.md)
- [Snapshot revert](../../docs/en/cookbook/snapshot-revert.md)

## Where to go next

- Governance starter shape → [examples/nextjs-staking](../nextjs-staking/README.md)
- Back to the basics → [examples/basic-connect](../basic-connect/README.md)
