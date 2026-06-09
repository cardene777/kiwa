# examples/nextjs-vesting

> [🇬🇧 English](./README.md) • [🇯🇵 日本語](./README.ja.md)

Token vesting schedule (TokenVesting + SimpleERC20) を Playwright で検証する example。 cliff → linear vesting → claim の経路を kiwa の time manipulation helper と組み合わせて回す。

## 何が試せるか

- TokenVesting.createSchedule で cliff + duration を設定
- `increaseTime` で時間を進めて releasable amount を確認
- cliff 前の claim が失敗する経路 (custom error revert)
- vesting 進行率に応じた逐次 claim
- 残量検証と vesting 完了後の最終 claim

## 動かす

```bash
pnpm -F examples-nextjs-vesting test
```

Next.js dev server は port 3047。

## test の見方

| File | 何を test しているか |
|---|---|
| `tests/vesting.spec.ts` | createSchedule → time 進行 → claim、 cliff 境界 / 進行率検証、 7 ケース |

## 関連 cookbook

- [Time manipulation](../../docs/ja/cookbook/time-manipulation.md)
- [Custom error revert 検証](../../docs/ja/cookbook/custom-error-revert.md)
- [Snapshot revert](../../docs/ja/cookbook/snapshot-revert.md)

## 次に試す

- staking → [examples/nextjs-staking](../nextjs-staking/README.ja.md)
- 入門に戻る → [examples/basic-connect](../basic-connect/README.ja.md)
