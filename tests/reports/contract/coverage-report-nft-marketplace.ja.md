# Contract Coverage Report — nft-marketplace (Foundry)

Generated: 2026-08-20
Skill: /kiwa-forge | Run: round 1 (final)
Loop terminated: production_100_achieved

## 1. 判定サマリ

| metric | production target | Total |
|---|---|---|
| Lines | ✅ 100.00% (132/132) | 90.87% (219/241) |
| Statements | ✅ 100.00% (158/158) | 93.52% (231/247) |
| Branches | ✅ 100.00% (40/40) | 88.71% (55/62) |
| Functions | ✅ 100.00% (26/26) | 85.25% (52/61) |

**判定 — ✅ PASS** (production 2 contract とも 4 metric すべて 100%)

production target は `contracts/MarketNft.sol` と `contracts/SimpleMarketplace.sol` の合算。
Total 側が届かないのは分母に test 自身と mock が入るため。

## 2. file 別 coverage 内訳

| File | カテゴリ | Lines | Stmts | Branches | Funcs |
|---|---|---|---|---|---|
| contracts/MarketNft.sol | production | 100.00% (51/51) | 100.00% (55/55) | 100.00% (12/12) | 100.00% (12/12) |
| contracts/SimpleMarketplace.sol | production | 100.00% (81/81) | 100.00% (103/103) | 100.00% (28/28) | 100.00% (14/14) |
| contract-test/SimpleMarketplace.t.sol | test 自身 | 86.67% (26/30) | 82.86% (29/35) | 83.33% (5/6) | 83.33% (5/6) |
| contract-test/helpers/Mocks.sol | mock | 77.22% (61/79) | 81.48% (44/54) | 62.50% (10/16) | 72.41% (21/29) |

`helpers/Mocks.sol` の未到達は、 mock が用意している失敗系のうち本 suite が使わない口
(受信拒否 / 異常な royalty / 戻り値 false 等の組合せ) が残っているもの。
production の到達性には影響しない。

## 3. 未到達 line の分類と判断

production contract に未到達なし。

Foundry 側は `contract-test/helpers/Mocks.sol` に mock を持てるため、 支払い失敗
(`PaymentFailed`) / 受信拒否 / royalty が売値を超える形 / `royaltyInfo` を持たない NFT の
4 系統をすべて実際に発生させて到達している。

同じ contract を Hardhat で測ると 4 系統とも未到達になる。 原因と扱いは
`coverage-report-nft-marketplace-hardhat.ja.md` の § 3 が持つ。

## 4. Layer 1 spec への書き戻し提案

| 項目 | 反映先 section | 形式 |
|---|---|---|
| (該当なし) | - | - |

production 側は spec の test case で覆えている。

### runner 差異 bullet の自動追加 logic (改善 4 / Issue #227) — 適用結果

支払い失敗系と royalty 異常系は mock contract を要するため、 Hardhat 経路では未到達になる。
contract spec に runner 差異 bullet を追加する (Hardhat 側 report と同じ内容)。

## 5. test 件数サマリ

- `FOUNDRY_OFFLINE=true forge test` PASS: 109 件 (SimpleMarketplace 73 件 + MarketNft 35 件 + invariant 1 件)
- fuzz test: 2 件 (`testFuzz_Mint_AnyNonZeroAddress_Succeeds` / `testFuzz_RoyaltyInfo_AlwaysBelowSalePrice`、 各 256 runs)
- 主要 gas: list / buy / acceptOffer は offer の掃き出し (`_invalidateOffersForToken`) が
  同 token の offer 件数に比例するため、 offer が増えるほど acceptOffer が重くなる
