# Test Review Report — nextjs-token-gating (Foundry)

Generated: 2026-06-08
Skill: /kiwa-review --mode test-review --module nextjs-token-gating --layer contract
Target:
- spec: `tests/spec/contract/test-spec-nextjs-token-gating.ja.md`
- test: `examples/nextjs-token-gating/test/TokenGating.t.sol`

## 1. 判定サマリ

| 軸 | スコア | weight | 重み付き |
|---|---|---|---|
| 1. TC ID mapping | 10/10 | 0.30 | 3.00 |
| 2. 観点 grouping 一致 | 10/10 | 0.15 | 1.50 |
| 3. assertion 品質 | 10/10 | 0.25 | 2.50 |
| 4. 観点別 cover 率 | 10/10 | 0.20 | 2.00 |
| 5. 追加すべき test 提案 | 4/10 | 0.10 | 0.40 |
| **Weighted Score** | **9.40/10** | 1.00 | (7.0 以上で PASS) |

**判定 — ✅ PASS** (weighted_score 9.40 ≥ 7.0、 critical 軸 0 件)。

実行サマリ — `forge test` 29 passed / 0 failed / coverage 100% (Lines 35/35, Statements 44/44, Branches 8/8, Funcs 7/7)。 spec の TC-001〜TC-026 が test 関数 1:1 mapping、 観点 grouping 9/9 一致、 抽象 assertion 0 件。

## 2. critical / major 指摘

### 1. major: spec TC-013 の期待結果が contract logic と矛盾

- **場所**: spec § 観点 3 境界値 TC-013、 test 関数 `test_HasAccess_PastExpiry_ReturnsFalseEvenIfGrantorHolds`
- **詳細**: spec TC-013 は「expiry 後でも grantor が NFT 保有なら hasAccess true」と書いているが、 `GatedContent.hasAccess` の実装は `if (timedAccessExpiry[user] < block.timestamp) return false` で **期限切れで早期 return false**、 grantor branch に到達しない。 forge test を最初に走らせた際に test が assertion failure し、 contract 実装に合わせて test の期待値を修正した経緯あり。 Layer 2 の正解判定は contract に従ったので test code は妥当だが、 spec 側が未訂正で残る。
- **改善案**: spec の TC-013 期待結果を「`expiry < ts` の早期 return で常に false (grantor 保有有無に関わらず)」 に訂正、 また「不足している仕様」 #4 (`<` vs `<=` の意図) を「`<` で確定、 期限ちょうど (==) は grantor 経由 fallback 評価される」と解消明記する。

## 3. minor 指摘 (参考)

### 1. minor: test 関数名に TC-NNN prefix 無し

- **場所**: `test/TokenGating.t.sol` の全 test 関数
- **詳細**: 関数名は意味的に妥当 (`test_Mint_HappyPath` 等) だが、 spec の TC ID (`TC-001`) と grep 一致しないため CI / report で trace するときに目視 mapping が必要。
- **改善案**: 関数名 prefix or コメント (`/// @notice TC-001 — mint happy path`) を追加。 1 行コメントなら variable rename 不要で追加可能。

### 2. minor: 余剰 test 2 件 (spec 未記載)

- **場所**: `test_IsGated_TrueForHolder` (line 432-438) / `test_HasAccess_NeverGranted_GrantorZero` (line 449-456)
- **詳細**: `isGated` view 関数の確認、 および coverage Round 2 で追加した default mapping branch の 2 件は spec の TC リストには無い。 `isGated` は spec § 仕様の要約 § API 契約に列挙されているため正当、 `NeverGranted_GrantorZero` は spec の「観点 6 入力バリデーション」 に該当する。
- **改善案**: spec 「テストケース一覧」 § 観点 6 に TC-027 として正式追加。

## 4. 追加すべき test 提案

| 観点 | 提案 TC | 緊急度 | 理由 |
|---|---|---|---|
| 5 権限 | mock IGateNFT (常に balanceOf=0 返す) を constructor 注入して getSecret 全 reject | major | constructor で interface 受け入れる設計の test、 別実装で gate を差し替える運用想定 |
| 6 入力バリデーション | `grantTimedAccess(user, type(uint256).max)` で `block.timestamp + ttl` overflow | minor | Solidity 0.8 panic check (現在 fuzz 未実装、 OZ ERC721 でも踏まない overflow 経路) |
| 6 入力バリデーション | `transferFrom(alice, alice, 1)` 自己 transfer の balance 不変 | minor | `balanceOf[from] -= 1; balanceOf[to] += 1` で from == to のとき結果不変、 ただし from の balance が 0 のとき underflow 危険 (現状は ownerOf check で防がれる) |
| 4 状態遷移 | grantor が複数 grantee に grant → grantor の transfer で全 grantee 一斉失効 | minor | 既存 TC-015 / TC-024 は 1 grantee 経路のみ、 多 grantee 波及 test |
| 11 回帰 | `forge invariant_*` で「totalSupply は減らない」 「ownerOf[tokenId] != 0 || tokenId > totalSupply」 等の invariant を 256 run 走らせる | major | property-based fuzz は未実装、 contract design assumptions の網羅性向上に有効 |
| 9 性能 | `forge --gas-snapshot` で 主要 fn の gas baseline 固定 | minor | 現状 `--gas-report` で都度測定のみ、 regression 検出には snapshot file が必要 |

critical 提案 0 件。 6 件全て enhancement / 将来改善範囲。

## 5. 総評

spec の TC-001〜TC-026 を 1:1 mapping で実装、 観点 grouping コメント、 vm.expectRevert + custom error selector / vm.expectEmit の使い分け、 vm.warp による境界値検証など、 Foundry の慣用パターンを正しく適用した良質な test code。 coverage は production 全 4 metric 100% に到達 (Round 1 → Round 2 で `hasAccess` の grantor == 0 branch を `vm.warp(0)` で踏む追加 test を投入)、 自走 auto loop が SSOT 通り機能した好例。

弱点は (1) spec TC-013 が contract logic と矛盾していたまま test で先に正解判定された経緯 (spec 側の書き戻し未実施)、 (2) test 関数名と TC ID の grep mapping が無いため CI で trace 困難、 (3) `forge invariant_*` / `forge fuzz` を使った property-based test が未実装で 11 観点中「並行処理」「境界値」 が unit test レベルに止まる点。 critical なし、 Layer 2 完了として `/kiwa-hardhat` (Hardhat 並走 test) に進む判断は妥当。

次アクション — `/kiwa-hardhat --module nextjs-token-gating --gas-report --lang ja` で Hardhat 経路の test を生成し、 Foundry とは別 toolchain での独立 PASS を確認する。 invariant test の追加は別 Issue で `/kiwa-forge --mode add-invariants` を検討余地として残す。
