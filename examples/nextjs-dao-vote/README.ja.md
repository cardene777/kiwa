# examples/nextjs-dao-vote

DAO 投票の最小経路 (VoteToken + SimpleDao + DaoExecutionTarget) を Playwright + viem で検証する example。 proposal 作成 → 投票 → execute の典型 flow と quorum / timelock の境界値を試せる。

## 何が試せるか

- VoteToken の投票権 delegate
- SimpleDao.propose / vote / execute の典型 flow
- quorum 未達成時の execute revert
- DaoExecutionTarget の state 反映 (proposal payload の実行確認)
- snapshotChain / revertChain を使った投票後 rollback

## 動かす

```bash
pnpm -F examples-nextjs-dao-vote test
```

Next.js dev server は port 3037。

## test の見方

| File | 何を test しているか |
|---|---|
| `tests/dao.spec.ts` | VoteToken delegate → propose → vote → execute、 quorum / timelock 境界値、 8 ケース |

## 関連 cookbook

- [Time manipulation (timelock)](../../docs/ja/cookbook/time-manipulation.md)
- [Snapshot revert](../../docs/ja/cookbook/snapshot-revert.md)

## 次に試す

- governance 上のひな形 → [examples/nextjs-staking](../nextjs-staking/README.ja.md)
- 入門に戻る → [examples/basic-connect](../basic-connect/README.ja.md)
