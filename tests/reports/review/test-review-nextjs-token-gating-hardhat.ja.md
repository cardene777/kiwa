# Test Review Report — nextjs-token-gating (Hardhat)

Generated: 2026-06-08
Skill: /kiwa-review --mode test-review --module nextjs-token-gating --layer contract
Target:
- spec: `tests/spec/contract/test-spec-nextjs-token-gating.ja.md`
- test: `examples/nextjs-token-gating/hardhat-test/TokenGating.test.cjs`

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

実行サマリ — `npx hardhat test` 27 passed / 0 failed、 wall 160ms。 spec TC-001〜TC-026 を `it('TC-NNN ...')` 形式で 1:1 mapping、 観点 grouping 9/9 一致 + coverage 補完 (TC-add-1)、 抽象 assertion 0 件 (71 assertion 全て具体値 / event args / custom error 名で検証)。 coverage は production target 全 4 metric で Lines 100% / Funcs 100%、 Stmts 94.74% / Branches 94.44% — 残 1 branch (`hasAccess` line 54 grantor==0 分岐) は Hardhat 制約 (block.timestamp == 0 不可) で再現不能、 「外部依存」分類で test-passed marker 作成。

## 2. critical / major 指摘

### 1. major: Hardhat の block.timestamp == 0 branch カバレッジ漏れ (制約由来、 回避不可)

- **場所**: `coverage report Section 3` / `GatedContent.sol:54`
- **詳細**: `hasAccess` の `if (grantor == address(0)) return false` の true 分岐は Hardhat network で再現不能 (`evm_setNextBlockTimestamp` は前進方向のみ許容、 0 への巻き戻し不可)。 Foundry 経路 (`vm.warp(0)`) では cover 済で同じ branch は production 全 4 metric 100% を満たす。 二つの runner で同 spec を走らせる構成のおかげで「片方では不可能、 もう片方では可能」を可視化できた点が本構成の価値。
- **改善案**: spec の 「不足している仕様」 に「block.timestamp == 0 branch は Foundry 経路でのみカバー」を 1 行追加し、 runner 差異を意図的なものとして文書化する。 Hardhat 経路で `mock IGateNFT` を別途用意して同様の boundary を作る案もあるが、 contract 内部の `block.timestamp` 比較を mock 側で迂回する経路はメンテ性悪化のため非推奨。

### 2. major: spec TC-013 期待値と Hardhat test 期待値の整合 (Foundry review と同じ指摘)

- **場所**: spec § 観点 3 境界値 TC-013 / `hardhat-test/TokenGating.test.cjs` line 145-156 (`TC-013 expiry + 1 で grantor が保有していても false`)
- **詳細**: spec は当初「expiry + 1 でも grantor 保有なら true」と書いたが、 contract logic では `expiry < block.timestamp` で早期 return false のため正解は false。 Hardhat test は最初から正しい期待値 (`.to.equal(false)`) で実装されている (Foundry の修正経緯を踏まえた）。 spec 側のみ未訂正。
- **改善案**: spec TC-013 期待結果を「`expiry < ts` の早期 return で常に false (grantor 保有有無に関わらず)」 と訂正。 Foundry / Hardhat 両 test は既に整合済。

## 3. minor 指摘 (参考)

### 1. minor: 余剰 test (coverage 補完) の spec への昇格

- **場所**: `hardhat-test/TokenGating.test.cjs` line 285-289 (`TC-add-1 isGated`)
- **詳細**: `isGated` view 関数の確認は spec の API 契約 table には記載されているが「テストケース一覧」 9 column 表には未登場、 余剰 test 扱い。 Foundry test にも対応する関数 (`test_IsGated_TrueForHolder`) があり、 両 runner で実装済の TC は spec に昇格させた方が trace しやすい。
- **改善案**: spec § 観点 1 正常系 (もしくは観点 5 権限) に TC-027 として 9 column で追加。

### 2. minor: fast-check / property-based test の未使用

- **場所**: `hardhat-test/TokenGating.test.cjs` 全体
- **詳細**: hardhat-mapping reference では境界値 / 入力バリデーション に `fast-check` を推奨しているが、 本実装では deterministic な値で TC を組んだ (TC-010 で `ttl=0`、 TC-014 で 3 回連続 mint 等)。 deterministic の方が Foundry test と挙動が揃いやすく失敗時の debug も容易だが、 property-based fuzz で偶発的な edge case 検出ができていない。
- **改善案**: TC-014 (連続 mint) を `fc.bigUintN(8)` で `n` 回 mint した時の `totalSupply == n` 不変条件として property 化する余地。 critical ではなく将来 enhancement。

## 4. 追加すべき test 提案

| 観点 | 提案 TC | 緊急度 | 理由 |
|---|---|---|---|
| 5 権限 | mock IGateNFT を constructor 注入し getSecret 全 reject | major | constructor で interface 受け入れる設計の test、 別 NFT 差し替え運用想定 |
| 6 入力バリデーション | `ttl = type(uint256).max` で `block.timestamp + ttl` overflow | minor | Solidity 0.8 panic check、 fast-check で `fc.bigUintN(256)` を asyncProperty 化 |
| 6 入力バリデーション | 自己 transfer (`from == to`) の balance 不変性 | minor | `balanceOf[from] -= 1; balanceOf[to] += 1` で from == to のとき balance 増減なし |
| 4 状態遷移 | grantor が複数 grantee に grant 後 transfer で全 grantee 一斉失効 | minor | TC-015 / TC-024 は 1 grantee 経路のみ、 多 grantee 波及 |
| 11 回帰 | hardhat-network の snapshot / restore を使った race scenario test | minor | `Promise.all([tx1, tx2])` で同 block 内 race 検証、 nonce 競合の挙動確認 |
| 9 性能 | `hardhat-gas-reporter` の baseline snapshot file 保存 | minor | regression 検出には snapshot file が必要、 現状 `--gas-report` は console のみ |
| 5 権限 | hardhat-network の `--fork` で mainnet 状態を読み込んだ scenario | minor | OSS user の dApp で本番 chain の state を読む際の挙動 reference |

critical 0 件、 enhancement 範囲。

## 5. 総評

Hardhat 用 chai matchers (`revertedWithCustomError` / `.to.emit().withArgs()` / `time.setNextBlockTimestamp` + `evm_mine`) を正しく使い、 spec TC-001〜TC-026 を `it('TC-NNN ...')` で完全 mapping。 観点 grouping 9/9 一致、 71 個の assertion 全てが具体値 / event args / custom error 名検証で抽象表現 0 件、 production target Lines 100% / Funcs 100% に到達。 残 1 branch は Hardhat network 制約 (block.timestamp 巻き戻し不可) による「外部依存」で、 Foundry 経路で cover 済のため runner 構成全体としては production 100% を達成している。

弱点は (1) Hardhat 単体では到達不能な branch (`hasAccess` grantor==0) が存在し、 同 example の Foundry / Hardhat 経路で coverage 差が発生 (本来の意図的な runner 差異だが spec に未記載)、 (2) `fast-check` の property-based test が未使用で deterministic な TC のみ、 (3) `forge invariant_*` 相当の Hardhat invariant 経路 (mocha-it.skip + manual property loop) も未実装。 critical なし、 Layer 2 完了として contract test chain (`/kiwa-forge` + `/kiwa-hardhat`) は完走したと評価できる。

次アクション — `/kiwa-design --layer e2e --module nextjs-token-gating --input examples/nextjs-token-gating/app/` で dApp e2e spec 生成へ進む。 fast-check / invariant / mock IGateNFT injection は別 Issue で contract test 拡張 PR として検討。
