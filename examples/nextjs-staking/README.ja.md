# examples/nextjs-staking

> [🇬🇧 English](./README.md) • [🇯🇵 日本語](./README.ja.md)

Staking pool (SimpleStaking + SimpleERC20) を Playwright で検証する example。 deposit → reward accrual → withdraw の経路を kiwa の time manipulation helper と組み合わせて試せる。

## 何が試せるか

- SimpleStaking.deposit で stake → reward 蓄積
- `increaseTime` で reward 蓄積を進めて withdraw 受取額を検証
- withdraw 前後の balance 差分 (`expectBalanceChange` helper)
- staking 上限 / 期間制約の境界値
- reward 計算の overflow チェック

## 動かす

```bash
pnpm -F examples-nextjs-staking test
```

Next.js dev server は port 3039。

## test の見方

| File | 何を test しているか |
|---|---|
| `tests/staking.spec.ts` | deposit → time 進行 → reward 蓄積 → withdraw、 上限 / 期間境界、 7 ケース |

## 関連 cookbook

- [Time manipulation](../../docs/ja/cookbook/time-manipulation.md)
- [Token approve flow](../../docs/ja/cookbook/token-approve-flow.md)
- [Snapshot revert](../../docs/ja/cookbook/snapshot-revert.md)

## 次に試す

- vesting → [examples/nextjs-vesting](../nextjs-vesting/README.ja.md)
- lending → [examples/nextjs-lending](../nextjs-lending/README.ja.md)
