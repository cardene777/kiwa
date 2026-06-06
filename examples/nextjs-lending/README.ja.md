# examples/nextjs-lending

簡易 lending pool (SimpleLending + SimpleERC20 + MockPriceOracle) を Playwright で検証する example。 deposit → borrow → repay と liquidation 経路を kiwa の snapshot/revert helper と組み合わせて回す。

## 何が試せるか

- SimpleLending の deposit / borrow / repay / liquidate
- MockPriceOracle 越しに collateral 価格を動かして liquidation を強制
- snapshotChain / revertChain で「borrow 前後」を rollback して何度も試す
- borrow 上限 / health factor の境界値検証
- liquidation 後の seizeAmount 検証

## 動かす

```bash
pnpm -F examples-nextjs-lending test
```

Next.js dev server は port 3038。

## test の見方

| File | 何を test しているか |
|---|---|
| `tests/lending.spec.ts` | deposit → borrow → repay の正常系 + price 変動による liquidation、 8 ケース |

## 関連 cookbook

- [Snapshot revert](../../docs/ja/cookbook/snapshot-revert.md)
- [Custom error revert 検証](../../docs/ja/cookbook/custom-error-revert.md)
- [Token approve flow](../../docs/ja/cookbook/token-approve-flow.md)

## 次に試す

- staking → [examples/nextjs-staking](../nextjs-staking/README.ja.md)
- 入門に戻る → [examples/basic-connect](../basic-connect/README.ja.md)
