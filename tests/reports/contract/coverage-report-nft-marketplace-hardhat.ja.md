# Contract Coverage Report — nft-marketplace (Hardhat)

Generated: 2026-08-20
Skill: /kiwa-hardhat | Run: round 1 (final)
Loop terminated: residual_uncoverable (runner 差異許容)

## 1. 判定サマリ

| metric | production target | Total |
|---|---|---|
| Statements | ⚠️ 98.77% (runner 差異許容) | 98.77% |
| Branches | ⚠️ 88.46% (runner 差異許容) | 88.46% |
| Functions | ✅ 100% | 100% |
| Lines | ⚠️ 98.17% (runner 差異許容) | 98.17% |

**判定 — ✅ PASS** (Funcs 100%、 残る未到達は mock contract を要する失敗系と、
`continue` の計上が runner で割れる 1 件)

本 report の作成時に 4 件を test 追加で塞いだ。 数値の推移は § 3 に記載する。

## 2. file 別 coverage 内訳

| File | カテゴリ | Stmts | Branches | Funcs | Lines |
|---|---|---|---|---|---|
| contracts/MarketNft.sol | production | 95.45% | 91.67% | 100% | 97.14% |
| contracts/SimpleMarketplace.sol | production | 100% | 87.04% | 100% | 98.65% |

## 3. 未到達 line の分類と判断

### 3.1 本 report で塞いだもの (4 件)

Foundry 側では到達しているのに Hardhat 側だけ未到達だった分岐のうち、
**Solidity の mock を要さず JS だけで組めるもの** を 4 件塞いだ。

| 対象 | 追加した test |
|---|---|
| `SimpleMarketplace.sol:118` の `if (listings[tokenId].active)` の true 側 | TC-031 出品中の token に対する acceptOffer |
| `SimpleMarketplace.sol:112` の `if (!offer.active) revert OfferNotActive` | TC-032 cancel 済 offer の acceptOffer |
| `SimpleMarketplace.sol:180` の `currentOfferId == excludedOfferId` の continue | TC-033 同 token に複数 offer がある状態で 1 件を accept |
| `MarketNft.sol` / `SimpleMarketplace.sol` の line coverage 3 行 | 上記 3 件の副次的な到達 |

いずれも「出品と offer が同時に立つ」「同じ token に offer が 2 件以上ある」 という
**状態の組合せを 1 度も作っていなかった** ことが原因で、 実装の欠陥ではない。
TC-031 が塞いだ経路は、 出品が残ったまま所有者が変わる状態を防ぐ分岐なので、
退行すると所有者の変わった token を元の価格で買える。

数値の推移。

| metric | 追加前 | 追加後 |
|---|---|---|
| Statements | 98.77% | 98.77% |
| Branches | 84.62% | **88.46%** |
| Lines | 97.25% | **98.17%** |

test 件数は 51 件から 55 件になった。

### 3.2 mock contract を要するもの (5 件、 runner 差異)

| 対象 | 必要な相手 |
|---|---|
| `MarketNft.sol:123` `if (retval != onERC721Received.selector) revert UnsafeRecipient();` | 誤った selector を返す受信 contract |
| `SimpleMarketplace.sol:106` `if (!ok) revert PaymentFailed();` (cancelOffer の返金) | ETH の受取を拒む buyer contract |
| `SimpleMarketplace.sol:145` `if (!refund) revert PaymentFailed();` (買い過ぎの返金) | 同上 |
| `SimpleMarketplace.sol:192-193` の `try nft.royaltyInfo(...)` catch 側と receiver 判定 | `royaltyInfo` を持たない NFT / royalty 0 の NFT |
| `SimpleMarketplace.sol:198,203` royalty が売値を超える clamp と支払い失敗 | 異常な royalty を返す NFT / 受取を拒む receiver |

いずれも **相手側の contract を差し替えないと到達しない**。
Foundry は `contract-test/helpers/Mocks.sol` に mock を置けるため 5 件とも到達済で、
Foundry 側の production coverage は 4 metric とも 100% になっている。

Hardhat は Solidity を JS の test file 内に定義できず、 mock を `contracts/` に置く以外の
経路が無い。 production の contract 置き場に test 専用の mock を混ぜることになるため採らない。
`mint-nft` の Hardhat report が同じ理由で `_checkOnERC721Received` を runner 差異としており、
その先例に揃える。

### 3.3 原因を特定できていないもの (1 件)

`SimpleMarketplace.sol:184` の `if (!offer.active) continue;` は、 TC-034
(同 token の offer に cancel 済が混ざっていても accept が通る) で到達するはずだが、
Istanbul の計上では未到達 (`counts=[0, 2]`) のまま残っている。

TC-034 は実際に PASS しており、 cancel 済 offer への二重返金が起きていないことを
残高で確認している。 二重返金が起きていない = `continue` を通っていることの間接証拠になる。
Foundry 側は同じ行を到達済として 100% を出す。

`continue` を含む分岐の計上が runner で割れている可能性が高いが、 Istanbul 側の
計上規則を確かめていないため **断定しない**。 到達しているという主張は残高の観測に基づく
間接的なもので、 coverage の数値としては未到達のまま扱う。

## 4. Layer 1 spec への書き戻し提案

| 項目 | 反映先 section | 形式 |
|---|---|---|
| 出品と offer が同時に立つ状態 | 状態遷移 test case 表 | TC 追加 (acceptOffer が listing も畳むこと) |
| 同 token に offer が複数ある状態 | 状態遷移 test case 表 | TC 追加 (受理分の除外と残りの返金) |
| mock を要する失敗系 5 件 | runner 差異 bullet | Hardhat では未到達と明記 |

状態の組合せ (出品 × offer、 offer 複数、 cancel 済混在) を spec の表に持たせていなかった。
単独の操作は網羅していたが、 組合せを 1 件も並べていなかったため test 側でも落ちた。

### runner 差異 bullet の自動追加 logic (改善 4 / Issue #227) — 適用結果

支払い失敗系 / royalty 異常系 / 受信 selector 不正の 3 系統は mock contract を要するため、
contract spec に runner 差異 bullet を追加する。

## 5. test 件数サマリ

- `hardhat test` PASS: 55 件 (追加 4 件を含む、 追加前は 51 件)
- fuzz test: 0 (Hardhat 経路は fuzz を持たない、 境界は Foundry 側が担当)
- 未到達 6 件の内訳 = mock 必須 5 件 + 計上差異 1 件
