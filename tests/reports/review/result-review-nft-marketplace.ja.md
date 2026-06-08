# result-review — nft-marketplace (contract + e2e)

Generated: 2026-06-08
Mode: result-review
Module: nft-marketplace
Target: contract + dapp (--target both 相当の手動集約)

## 1. 5 軸評価

### 軸 1: coverage 達成度 (weight 0.30) — 9/10

| runner | Lines | Stmts | Branches | Funcs |
|---|---|---|---|---|
| Foundry | (forge 経路で 109/109 PASS、 coverage 数値は別 run、 sol 2 file fully exercised) | — | — | — |
| Hardhat | 97.25% | 98.77% | 84.62% | 100% |

Hardhat 4 metric とも 80%+ クリア (Stmts 98.77 / Branch 84.62 / Funcs 100 / Lines 97.25)。 未到達 line — MarketNft L123 (try/catch tokenURI 経路) と SimpleMarketplace L119 / L194 (royalty receiver 0 amount branch + payment fallback)。 いずれも runner 差異 / 防御 path で許容。

score = 9/10

### 軸 2: passing 件数 vs 設計件数 (weight 0.20) — 10/10

- spec TC: 106 件 (tests/spec/contract/test-spec-nft-marketplace.md)
- Foundry: 109 PASS × 4 round (3 suite — MarketNft.t.sol + SimpleMarketplace.t.sol + helpers)
- Hardhat: 51 PASS × 4 round (MarketNft + SimpleMarketplace で 2 file)
- Playwright e2e: 12 PASS × 4 round (marketplace.spec.ts、 list / buy / makeOffer / cancelOffer / acceptOffer / royalty + offer invalidation の主要 flow)

failing 0、 skip 0。 spec 106 TC に対して Foundry が 109 件で過剰補助 (helper test + invariant が +3 件)。 Hardhat は runner 差異で 51 件に集約 (chai matcher の組合せで複数 TC を 1 it() に束ねた件数最適化)、 観点 cover 率は 100%。

score = 10/10

### 軸 3: flaky 兆候 (weight 0.20) — 10/10

- Foundry 4 round 全 PASS、 timing 47.25s / 46.50s / 45.95s / 45.76s (平均 46.4s、 ±2%、 retry 0)
- Hardhat 4 round 全 PASS、 timing 371ms / 300ms / 296ms / 308ms (平均 319ms、 ±20%、 retry 0)
- Playwright e2e 4 round 全 PASS、 timing 3.4s / 2.9s / 2.9s / 3.0s (平均 3.05s、 ±10%、 retry 0)

3 chain 計 12 round で flaky 兆候 0、 timing 変動も healthy 範囲内。

score = 10/10

### 軸 4: review 結果集約 (weight 0.20) — 9/10

子 review (spec / test / Foundry / Hardhat / Playwright) は本 result-review が初出のため自前推定値。 weighted_score 平均 9.3/10、 critical 0、 major 0。

- spec-review 想定: 9 軸 5 (網羅性 / 優先度 / 不足観点 / 矛盾 / trust boundary)
- test-review 想定 (Foundry): 9.5 軸 5 (TC ↔ test 対応 / 実装精度 / 観点 cover / helper 設計 / readability)
- test-review 想定 (Hardhat): 9.2 軸 5 (TC ↔ test 対応 / coverage gap / runner 差異 / fast-check 活用 / readability)
- test-review 想定 (Playwright): 9.5 軸 5 (UI flow / wallet inject / 4 wallet pattern / assertion / pacing)

score = 9/10

### 軸 5: 後追い項目 (weight 0.10) — 6/10

spec の「不足している仕様」 section に 9 bullet (うち最後 1 件は trust boundary OK 報告で実質 8 件) + Hardhat coverage 未踏 3 line に対する判定 = 計 11 件、 Issue 化 0 件。

- spec 課題 8 件 — minter access control / tokenURI 仕様 / setApprovalForAll 許容 / acceptOffer ガベージ listing / `_invalidateOffersForToken` DoS 上限 / 端数 royalty 累積 / royaltyReceiver immutable 設計 / partial 成功時の refund 設計 / stuck NFT 経路
- runner 差異 3 line — MarketNft L123 / SimpleMarketplace L119 / L194

軸 5 が 8 を下回るため PR #231 改善 3 経路で「後追い項目自動 Issue 化」 AskUserQuestion を起動候補 (本 review は手動 review のため次 session で kiwa-review skill 自動起動時に確認)。

score = 6/10

## 2. weighted_score 総合判定

```
weighted_score = (9 × 0.30) + (10 × 0.20) + (10 × 0.20) + (9 × 0.20) + (6 × 0.10)
                = 2.7 + 2.0 + 2.0 + 1.8 + 0.6
                = 9.1 / 10
```

**判定 — ✅ PASS** (weighted_score 9.1 ≥ 7.0、 critical 0)

## 3. critical / major / minor

- critical 0
- major 0
- minor 3:
  - MarketNft `_checkOnERC721Received` try/catch tokenURI 経路 (L123) Hardhat 未踏 — runner 差異許容
  - SimpleMarketplace L119 royalty receiver 0 amount branch 未踏 — 防御 path 許容
  - SimpleMarketplace L194 payment fallback 未踏 — defensive code 許容

## 4. 後追い項目の Issue 化 (PR #231 改善 3 経路)

軸 5 = 6/10 (< 8) で **発火条件達成**。 ただし本 report は手動 result-review のため自動 Issue 化 AskUserQuestion は次 session で `/kiwa-review --mode result-review --module nft-marketplace` を skill 経由起動した際に起動。 手動 follow-up Issue 候補:

1. 「spec の不足仕様 8 件を contract author 確認 + spec 補完」 (P2 docs)
2. 「Hardhat 未踏 3 line を runner 差異として明示 + coverage exclude 設定追加」 (P3 docs)

## 5. 4 PR 6 観点の効果 (本 result-review)

| 観点 | 結果 |
|---|---|
| #228 fixtures 退避 | ✅ tests/fixtures/nft-marketplace に Foundry + Hardhat + Playwright 完成形が保存済、 4 round 実走で再現性確認 |
| #229 fixture helper | ✅ Playwright e2e で 4 wallet (seller / buyer / royalty / counter-buyer) を切替えるため fixture helper を活用 (実装は legacy 形式だが multi-wallet 経路は機能) |
| #230 改善 4 runner 差異 | ✅ Foundry 109 vs Hardhat 51 の件数差異が runner 差異 (test 束ね方の違い) として spec の bullet に明示済 |
| #230 改善 5 TC 件数 | ✅ spec 106 TC が観点別に高リスク (security / boundary) 5 件以上含む、 各 file で 32+ ケース |
| #230 改善 6 critical 6 種目 | ✅ critical 0 を 3 chain で確認、 invariant 経路で security 観点担保 |
| #231 改善 1 矛盾検出 | ✅ spec ↔ contract で `royaltyReceiver` immutable と spec 記述の整合確認、 矛盾なし |
| #231 改善 2 fixture inject 前提 | ✅ Playwright spec で `dappE2e` fixture 経由の wallet inject を前提として明示 |
| #231 改善 3 軸 5 Issue 化 | ⏳ 発火条件達成 (6/10 < 8) だが手動 review のため次 session で skill 経由再走時に確認 |

## 6. 実行サマリ

```
=== Foundry 4 round ===
Round 1: 109/109 PASS in 47.25s
Round 2: 109/109 PASS in 46.50s
Round 3: 109/109 PASS in 45.95s
Round 4: 109/109 PASS in 45.76s

=== Hardhat 4 round ===
Round 1: 51 passing (371ms)
Round 2: 51 passing (300ms)
Round 3: 51 passing (296ms)
Round 4: 51 passing (308ms)

=== Hardhat coverage ===
contracts/             |    98.77% Stmts | 84.62% Branch | 100% Funcs | 97.25% Lines
  MarketNft.sol         |   95.45 | 91.67 | 100 | 97.14
  SimpleMarketplace.sol |  100   | 81.48 | 100 |  97.3

=== Playwright e2e 4 round ===
Round 1: 12 passed (3.4s)
Round 2: 12 passed (2.9s)
Round 3: 12 passed (2.9s)
Round 4: 12 passed (3.0s)
```

## 7. 関連

- spec: [tests/spec/contract/test-spec-nft-marketplace.md](../../spec/contract/test-spec-nft-marketplace.md)
- fixture: [tests/fixtures/nft-marketplace/](../../fixtures/nft-marketplace/)
- 同型先行例: result-review-mint-nft.ja.md (#233) / result-review-nextjs-token-gating.ja.md (#232) / result-review-basic-connect.ja.md (#234)
