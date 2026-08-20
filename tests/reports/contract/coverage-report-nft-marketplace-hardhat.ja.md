# Contract Coverage Report — nft-marketplace (Hardhat)

Generated: 2026-08-20
Skill: /kiwa-hardhat | Run: round 1 (final)
Loop terminated: residual_uncoverable (runner 差異許容)

## 1. 判定サマリ

| metric | production target | Total |
|---|---|---|
| Statements | ⚠️ 98.77% (runner 差異許容) | 98.77% |
| Branches | ⚠️ 89.74% (runner 差異許容) | 89.74% |
| Functions | ✅ 100% | 100% |
| Lines | ⚠️ 98.17% (runner 差異許容) | 98.17% |

**判定 — ✅ PASS** (Funcs 100%、 残る未到達は mock contract を要する失敗系と、
`continue` の計上が runner で割れる 1 件)

本 report の作成時に 5 件を test 追加し、 4 分岐を coverage 上で塞いだ。
残る 1 件 (TC-034) は stale offer を含む状態を実行する regression test だが、 Istanbul の
分岐 count には反映されていない。 数値の推移は § 3 に記載する。

## 2. file 別 coverage 内訳

| File | カテゴリ | Stmts | Branches | Funcs | Lines |
|---|---|---|---|---|---|
| contracts/MarketNft.sol | production | 95.45% | 91.67% | 100% | 97.14% |
| contracts/SimpleMarketplace.sol | production | 100% | 88.89% | 100% | 98.65% |

## 3. 未到達 line の分類と判断

### 3.1 本 report で coverage 上塞いだもの (4 分岐)

Foundry 側では到達しているのに Hardhat 側だけ未到達だった分岐のうち、
**Solidity の mock を要さず JS だけで組めるもの** に test を追加し、 4 分岐を塞いだ。

| 対象 | 追加した test |
|---|---|
| `SimpleMarketplace.sol:118` の `if (listings[tokenId].active)` の true 側 | TC-031 出品中の token に対する acceptOffer |
| `SimpleMarketplace.sol:112` の `if (!offer.active) revert OfferNotActive` | TC-032 cancel 済 offer の acceptOffer |
| `SimpleMarketplace.sol:177` の `currentOfferId == excludedOfferId` の continue | TC-033 同 token に複数 offer がある状態で 1 件を accept |
| `SimpleMarketplace.sol:192` の `royaltyAmount > 0` の false 側 | TC-035 zero-price sale |
| `MarketNft.sol` / `SimpleMarketplace.sol` の line coverage 3 行 | 上記 test の副次的な到達 |

TC-031〜034 は「出品と offer が同時に立つ」「同じ token に offer が 2 件以上ある」 という
**状態の組合せを 1 度も作っていなかった** ことが原因で、 実装の欠陥ではない。 TC-035 は
zero-price sale で royalty が 0 になる既存仕様の境界を補う。
TC-031 が塞いだ経路は、 出品が残ったまま所有者が変わる状態を防ぐ分岐なので、
退行すると所有者の変わった token を元の価格で買える。

数値の推移。

| metric | 追加前 | 追加後 |
|---|---|---|
| Statements | 98.77% | 98.77% |
| Branches | 84.62% | **89.74%** |
| Lines | 97.25% | **98.17%** |

test 件数は 51 件から 56 件になった。

### 3.2 mock contract を要するもの (5 件、 runner 差異)

| 対象 | 必要な相手 |
|---|---|
| `MarketNft.sol:123` `if (retval != onERC721Received.selector) revert UnsafeRecipient();` | 誤った selector を返す受信 contract |
| `SimpleMarketplace.sol:106` `if (!ok) revert PaymentFailed();` (cancelOffer の返金) | ETH の受取を拒む buyer contract |
| `SimpleMarketplace.sol:145` `if (!refund) revert PaymentFailed();` (買い過ぎの返金) | 同上 |
| `SimpleMarketplace.sol:192` の `try nft.royaltyInfo(...)` catch 側と receiver 0 判定 | `royaltyInfo` を持たない NFT / receiver 0 の NFT |
| `SimpleMarketplace.sol:193-194,198,203` royalty が売値を超える clamp と支払い失敗 | 異常な royalty を返す NFT / 受取を拒む receiver |

いずれも **相手側の contract を差し替えないと到達しない**。
Foundry は `contract-test/helpers/Mocks.sol` に mock を置けるため 5 件とも到達済で、
Foundry 側の production coverage は 4 metric とも 100% になっている。

現在の Hardhat config は `./contracts` だけを Solidity source として compile するため、 同じ経路には
test 専用 mock を compile 対象へ追加する必要がある。 本 PR の production contract 非変更制約では
採らず、 fixture 構成上の runner 差異として扱う。
`mint-nft` の Hardhat report が同じ理由で `_checkOnERC721Received` を runner 差異としており、
その先例に揃える。

### 3.3 原因を特定できていないもの (1 件)

`SimpleMarketplace.sol:180` の `if (!offer.active) continue;` は、 TC-034
(同 token の offer に cancel 済が混ざっていても accept が通る) で到達するはずだが、
Istanbul の計上では未到達 (`counts=[0, 2]`) のまま残っている。

TC-034 は stale id が `offersByToken` に残る状態でも accept が成功し、 cancel 済 buyer の
残高が変わらないことを確認している。 ただし `cancelOffer` は offer struct 全体を delete するため、
`continue` を除いても zero address への 0 ETH call となり、 この残高 assertion だけでは分岐通過を
独立には証明できない。 coverage の到達根拠にはせず、 Istanbul の数値どおり未到達として扱う。
Foundry 側は同じ行を到達済として 100% を出す。

`continue` を含む分岐の計上が runner で割れている可能性はあるが、 Istanbul 側の
計上規則を確かめていないため **断定しない**。

## 4. Layer 1 spec への書き戻し提案

| 項目 | 反映先 section | 形式 |
|---|---|---|
| 出品と offer が同時に立つ状態 | 状態遷移 test case 表 | TC 追加 (acceptOffer が listing も畳むこと) |
| 同 token に offer が複数ある状態 | 状態遷移 test case 表 | TC 追加 (受理分の除外と残りの返金) |
| royalty が 0 になる sale | 境界値 test case 表 | TC 追加 (zero-price sale でも buy が完了すること) |
| mock を要する失敗系 5 件 | runner 差異 bullet | Hardhat では未到達と明記 |

状態の組合せ (出品 × offer、 offer 複数、 cancel 済混在) を spec の表に持たせていなかった。
単独の操作は網羅していたが、 組合せを 1 件も並べていなかったため test 側でも落ちた。

### runner 差異 bullet の自動追加 logic (改善 4 / Issue #227) — 適用結果

支払い失敗系 / royalty 異常系 / 受信 selector 不正の 3 系統は mock contract を要するため、
contract spec に runner 差異 bullet を追加する。

## 5. test 件数サマリ

- `hardhat test` PASS: 56 件 (追加 5 件を含む、 追加前は 51 件)
- fuzz test: 0 (Hardhat 経路は fuzz を持たない、 境界は Foundry 側が担当)
- 未到達 6 件の内訳 = mock 必須 5 件 + 計上差異 1 件
