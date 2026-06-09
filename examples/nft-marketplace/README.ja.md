# examples/nft-marketplace

> [🇬🇧 English](./README.md) • [🇯🇵 日本語](./README.ja.md)

ERC721 (MarketNft.sol、 ERC2981 royalty 対応) + 複合 marketplace contract (SimpleMarketplace.sol、 listing + offer + acceptOffer + royalty payout + offer invalidation) の組合せ。 kiwa の最も複雑な test 用 dApp で、 list / buy / cancel / makeOffer / cancelOffer / acceptOffer / royalty payout の全経路を 1 例で網羅できる。

## 2 つの導線

- retrofit 作業台: `examples/nft-marketplace/{test,hardhat-test,tests}/` は意図的に `.gitignore` 対象。 walkthrough ではここに skill chain で test を再生成する
- 完成形 fixture: `tests/fixtures/nft-marketplace/` に standalone pnpm workspace として完成形 test 群を退避。 Hardhat / Playwright は history 保持、 Foundry は現 branch 上の baseline を保持

## 何が試せるか

- ERC2981 royaltyInfo (500 bps = 5%) 経由の royalty 自動分配 (seller 95% / royalty receiver 5%)
- `SimpleMarketplace.makeOffer` の 2 overload (`uint256, uint256` / `uint256, uint256, uint256`)
- acceptOffer 時の自動 offer invalidation (同 tokenId の他 offer 全 cancel + 返金)
- buy 時の差額 refund (msg.value > price ならお釣り返却)
- deadline 過ぎた offer の `OfferExpired` revert (Hardhat `time.increase` 経由)
- 4 wallet (seller / buyer / royalty receiver / counter-buyer) のマルチアカウント test pattern
- Foundry .t.sol と Hardhat .test.cjs 並立 (F-1 第 2 弾)、 coverage Stmts 98.77% / Branch 84.62% / Funcs 100% / Lines 97.25%

## 動かす

前提として repo root で `pnpm install` 済 + `pnpm exec playwright install chromium` 済 + Foundry の `anvil` / `forge` が PATH 上。

完成形 test をそのまま実走する場合は fixture workspace を使う。

```bash
pnpm --dir tests/fixtures/nft-marketplace test:foundry
pnpm --dir tests/fixtures/nft-marketplace test:hardhat
pnpm --dir tests/fixtures/nft-marketplace test:e2e
```

retrofit walkthrough で test を再生成する時だけ examples 側を使う。

```bash
# Playwright e2e (kiwa fixture)
pnpm -F examples-nft-marketplace test

# Foundry 単体 test
cd examples/nft-marketplace && forge test

# Hardhat 単体 test (F-1 第 2 弾)
pnpm -F examples-nft-marketplace test:hardhat

# Hardhat coverage
pnpm -F examples-nft-marketplace test:hardhat:coverage
```

## test の見方

以下の `examples/nft-marketplace/*` は retrofit 作業台側の path。 完成形 reference は `tests/fixtures/nft-marketplace/` にある。

| File | 何を test しているか |
|---|---|
| `tests/marketplace.spec.ts` | Playwright e2e、 4 wallet を回して list → buy → makeOffer → acceptOffer + royalty 反映を end-to-end 検証 |
| `test/*.t.sol` | Foundry 単体 (invariant / fuzz 含む) |
| `hardhat-test/MarketNft.test.cjs` | Hardhat MarketNft 単体 (F-1 第 2 弾)、 ERC721 + ERC2981 + safe receiver path で 21 ケース |
| `hardhat-test/SimpleMarketplace.test.cjs` | Hardhat SimpleMarketplace 単体 (F-1 第 2 弾)、 listing / offer / royalty payout / offer invalidation で 30 ケース |

## 関連 cookbook

- [Custom error revert 検証](../../docs/ja/cookbook/custom-error-revert.md)
- [Time manipulation (offer expiry 等)](../../docs/ja/cookbook/time-manipulation.md)
- [Multi-wallet で seller / buyer を分ける pattern](../../docs/ja/cookbook/multi-wallet.md)

## 次に試す

- 別の高度な dApp → [examples/nextjs-aa-erc4337](../nextjs-aa-erc4337/) (Smart Account / Account Abstraction、 README 整備予定 / follow-up)
- 入門に戻る → [examples/basic-connect](../basic-connect/README.ja.md)
