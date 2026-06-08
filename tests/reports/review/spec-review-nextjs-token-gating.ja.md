# Spec Review Report — nextjs-token-gating (contract)

Generated: 2026-06-08
Skill: /kiwa-review --mode spec-review --module nextjs-token-gating --layer contract --lang ja
Target: tests/spec/contract/test-spec-nextjs-token-gating.ja.md

## 1. 判定サマリ

| 軸 | スコア | weight | 重み付き |
|---|---|---|---|
| 1. 観点網羅 | 10/10 | 0.30 | 3.00 |
| 2. TC 件数妥当性 | 4/10 | 0.20 | 0.80 |
| 3. 優先度妥当性 | 10/10 | 0.20 | 2.00 |
| 4. 入力 / 期待結果の具体性 | 10/10 | 0.20 | 2.00 |
| 5. 不足している仕様 section の使い方 | 10/10 | 0.10 | 1.00 |
| **Weighted Score** | **8.80/10** | 1.00 | (7.0 以上で PASS) |

**判定 — ✅ PASS** (weighted_score 8.80 ≥ 7.0、 critical 軸 0 件)。

## 2. critical / major 指摘

### 1. major: 状態遷移 / 権限 / 入力バリデーション観点の TC 件数不足

- **場所**: spec 「テストケース一覧」 § 観点 4 / 観点 5 / 観点 6
- **詳細**: contract が高リスク (transferFrom / getSecret / grantTimedAccess が security 高) のため観点あたり 3+ 件期待だが、 状態遷移 2 件 / 権限 1 件 / 入力バリデーション 2 件 と不足。 特に **権限 (TC-017 のみ)** は token-gating contract の核心観点で件数不足の影響大。
- **改善案**: 以下 5 件の TC 追加を提案 (Layer 2 で test code 化する際に併せて補強):
  - 観点 4 状態遷移 — TC-016b: grant 後に grantor が transfer → grantee の `hasAccess` true → false 遷移を block 跨ぎで連続観測 (vm.warp 不要、 transfer 即時で false)
  - 観点 5 権限 — TC-017b: GatedContent が任意の `IGateNFT` 実装を受け入れる設計のため、 mock NFT (常に balanceOf=0 返す) を渡して getSecret 全 reject を確認
  - 観点 5 権限 — TC-017c: `grantTimedAccess` を grantor 経由ではなく直接非 NFT holder が呼べないかの 多 ECase
  - 観点 6 入力バリデーション — TC-018b: `transferFrom` で `from == to == msg.sender` (自分への transfer) を呼んだ場合の state 不変性 (balanceOf 増減なし、 ownerOf 不変)
  - 観点 6 入力バリデーション — TC-019b: `grantTimedAccess` の `ttlSeconds = type(uint256).max` で `block.timestamp + ttl` の overflow 挙動 (Solidity 0.8 で revert すること)

## 3. minor 指摘 (参考)

### 1. minor: TC-012 の期待結果に解釈余地

- **場所**: 「テストケース一覧」 § 観点 3 境界値 TC-012
- **詳細**: 期待結果が「expiry == block.timestamp は false 扱い」と長文で説明的、 grantor 経由の fallback まで触れて読みづらい。 spec の「不足している仕様」 で `<` vs `<=` 解釈が未定義と明示されているので、 TC-012 の期待結果は **「`<` 解釈で false」を断定** し、 「不足している仕様」 で「仕様確定後に TC-012 期待結果再評価」 と参照付けるとよい。
- **改善案**: TC-012 期待結果を「`hasAccess(bob) == false` (`expiry < block.timestamp` の比較が false、 spec § 不足 #4 参照)」に短縮。

### 2. minor: 「自動化すべきテスト」 と 「テストケース一覧」 の優先度表記順整合

- **場所**: 「自動化すべきテスト」 section
- **詳細**: TC-009 / TC-013 / TC-014 が「中」 で並んでいるが、 TC-009 (異常系 TC-008 と同観点) と TC-013 / TC-014 (境界値) が混在しているため、 観点別グループ化されている本文の流儀と微妙にずれる。 観点別 → 優先度順の 2 段階 sort を維持した方が Layer 2 reader に親切。
- **改善案**: 「自動化すべきテスト」 を観点別 (正常系 → 異常系 → 境界値 → ...) に group 化し直し、 group 内優先度順。

## 4. 追加すべき test 提案 (spec-review でも将来 enhancement として列挙)

| 観点 | 提案 TC | 理由 |
|---|---|---|
| 5 権限 | mock IGateNFT 実装の挙動切替 | constructor で interface 注入する設計の test |
| 6 入力バリデーション | uint256 ttl overflow (type(uint256).max) | Solidity 0.8 panic check |
| 6 入力バリデーション | 自分自身への transferFrom | from == to のとき balanceOf 演算が破綻しないか (-1 then +1 で結果不変) |
| 4 状態遷移 | grantor が複数 grantee に grant 後一斉 revoke | grantor 喪失で全 grantee の access が同時 lost する全件波及 |

これらは Layer 2 (`/kiwa-forge` / `/kiwa-hardhat`) で必ず実装する必要はないが、 spec が次回改訂される際の検討項目。

## 5. 総評

GateNFT / GatedContent の 2 contract 連携を 11 観点中 9 観点 (非適用 2 観点に明確な根拠あり) で網羅した良質な spec。 特に **「状態遷移」 として grantor 喪失時の access 自動 revoke (TC-015 / TC-016)** と **「セキュリティ」 として grant 後 escape 攻撃 (TC-024)** をリスク表から正確に導出している点が強い。 抽象表現 0 件 / 不足している仕様の 4 bullet 明示で具体性も担保。

弱点は 状態遷移 / 権限 / 入力バリデーション 観点で件数が 1-2 件にとどまり、 高リスク module の期待密度 (3+/観点) を満たさない点。 critical ではないが Layer 2 への進行前に Section 2 の major 5 件を追加すると spec の completeness が一段上がる。 ただし weighted_score 8.80 で PASS のため **Layer 2 (`/kiwa-forge` / `/kiwa-hardhat`) へそのまま進む判断も妥当**、 追加 TC は Layer 2 で test 実装時にエンジニア判断で組み込めば良い。

次アクション — `/kiwa-forge --module nextjs-token-gating --gas-report --lang ja` で Foundry test 生成へ進むのを推奨。 spec の TC-001~TC-026 を 1:1 で `test/*.t.sol` に変換し、 観点別 grouping を維持。
