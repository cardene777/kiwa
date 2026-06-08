# Result Review Report — nextjs-token-gating

Generated: 2026-06-08
Skill: /kiwa-review --mode result-review --module nextjs-token-gating --lang ja
Target:
- 統合 report: `tests/reports/integrated/nextjs-token-gating-both.ja.md`
- contract coverage: `tests/reports/contract/coverage-report-nextjs-token-gating.ja.md` (Foundry) + `coverage-report-nextjs-token-gating-hardhat.ja.md` (Hardhat)
- spec-review: contract + e2e
- test-review: Foundry + Hardhat + Playwright

## 1. 判定サマリ

| 軸 | スコア | weight | 重み付き |
|---|---|---|---|
| 1. coverage 達成度 | 9/10 | 0.30 | 2.70 |
| 2. passing 件数 vs 設計件数 | 0/10 | 0.20 | 0.00 |
| 3. flaky 兆候 | 4/10 | 0.20 | 0.80 |
| 4. review 集約 | 0/10 | 0.20 | 0.00 |
| 5. 後追い項目 | 0/10 | 0.10 | 0.00 |
| **Weighted Score** | **3.50/10** | 1.00 | (7.0 以上で PASS) |

**判定 — ❌ FAIL** (weighted_score 3.50 < 7.0、 **軸 2 / 軸 4 / 軸 5 = 0 で critical 3 件**)。

実行サマリ — contract chain (Foundry 29/29 + Hardhat 27/27、 coverage 100% / 94.7%) は production 公開水準だが、 dApp e2e chain (Playwright 10/10 × 4 round) が spec 17 件中 10 件実装で軸 4 で 5.00/10 FAIL を生み、 結果 result-review でも FAIL。 残存 critical 2 件 (e2e spec の TC 件数不足 + e2e test の cover 率 52%) と spec の後追い項目 10 件放置 (Issue/TODO 紐付け 0) が複合要因。

## 2. critical / major 指摘

### 1. critical: e2e test の cover 率 52% で軸 4 review 集約 FAIL を引きずる

- **場所**: `tests/reports/review/test-review-nextjs-token-gating-e2e.ja.md` (5.00/10 FAIL)
- **詳細**: Playwright spec.ts が spec の 17 件中 10 件のみ実装、 観点 4 状態遷移 / 観点 7 冪等性 / 観点 8 並行処理 の grouping 自体未実装。 軸 4 review 集約で平均 8.12/10 だが critical 2 件残存のため軸 4 = 0、 result-review も FAIL に直結。
- **改善案**: Step 5c auto-fix loop を発火、 critical 2 件 (TC-009 / TC-013) + major 3 件 (TC-006 / TC-012 / TC-017) を Layer 2 で追加実装。 TC-013 / TC-017 は kiwa fixture helper 追加が前提のため別 Issue で対応、 まず TC-009 / TC-006 / TC-012 を実装すれば軸 4 cover 率 → 71% → 軸 4 score 4/10 → test-review weighted_score ≈ 7.0 → result-review 軸 4 → 7/10 → 全体 ≈ 6.4/10 (まだ 7.0 未達)。 TC-008 / TC-013 / TC-017 を全て実装すれば cover 率 ≈ 100%、 weighted_score 7.0+ で PASS 到達。

### 2. critical: spec 「不足している仕様」 計 10 件が Issue / TODO 紐付けなしで放置

- **場所**: `tests/spec/contract/test-spec-nextjs-token-gating.ja.md` § 不足している仕様 (4 bullet) + `tests/spec/e2e/test-spec-nextjs-token-gating.ja.md` § 不足している仕様 (6 bullet)
- **詳細**: contract で 4 件 (zero address grant 仕様未定義 / totalSupply 上限不明 / approve 経路追加予定 / `<` vs `<=` 解釈)、 e2e で 6 件 (wagmi onError 未配線 / error clear / SLA / hardcode 乖離 / multi-tab inject / DevTools 改ざん React revert)。 Issue 起票 0 / TODO 注記 0 で軸 5 = 0 警告。 spec の不明点が永久に「不明のまま」 残り、 retrofit user / 後任エンジニアの判断材料が抜ける。
- **改善案**: result-review 完了後、 各 bullet に対し以下のいずれかを実施:
  - **option A**: 仕様 author が回答できるものは spec を直接更新 (`/kiwa-design --mode update` 別 Issue で実装予定)
  - **option B**: Issue 化して仕様 author に Q&A (bullet 1 件 = Issue 1 件、 `gh api repos/{o}/{r}/issues --method POST` で起票)
  - **option C**: TODO 注記 (`(TODO: spec 改訂 PR で対応)`) を spec の各 bullet 末尾に追記し、 後追い予定を明示

### 3. major: Playwright timing ±50% の flaky 兆候 (軸 3 = 4/10)

- **場所**: `tests/reports/integrated/nextjs-token-gating-both.ja.md` § 実行サマリ
- **詳細**: 4 round 連続 PASS だが timing が 24.0s → 24.8s → 25.4s → 37.5s と Round 4 のみ +50%。 さらに Round 3 で TC-010 が一度 FAIL し、 assertion 緩和 (button.toBeDisabled → button.toBeVisible) で潰した経緯あり。 緩和した assertion は spec の意図 (wallet 未接続で disabled) を完全には検証しておらず、 妥協で test が PASS する形になっている。
- **改善案**: kiwa fixture を改善 (`@kiwa/core` に `waitForWalletConnected(page)` helper 追加) し、 wallet inject 完了を明示的に待ってから assertion を走らせる。 緩和した TC-004 / TC-010 / TC-011 / TC-015 の assertion を spec 通り「未接続 → disabled / 接続済 → enabled」 の状態別 test に分割し直す。

### 4. major: Hardhat coverage 1 branch 未踏が runner 差異として明示されていない

- **場所**: `tests/reports/contract/coverage-report-nextjs-token-gating-hardhat.ja.md` § Section 3
- **詳細**: `hasAccess` の `grantor == address(0)` branch true 分岐は Hardhat 制約 (block.timestamp 巻き戻し不可) で再現不能、 Foundry 経路ではカバー済。 ただし spec / README 等で「2 runner 構成で意図的な runner 差異を許容する」 設計判断が明示されていないため、 OSS user が「Hardhat coverage が 100% でない」 と困惑する余地。
- **改善案**: spec § 「不足している仕様」 または README に「Hardhat 経路は block.timestamp == 0 branch が外部依存分類で未踏、 Foundry 経路で carry」 を 1 段落明示する。

## 3. minor 指摘 (参考)

### 1. minor: contract test-review が両 runner で 9.40/10 と高水準だが、 fast-check / forge invariant が未使用

- **場所**: `tests/reports/review/test-review-nextjs-token-gating-{foundry,hardhat}.ja.md` § Section 4
- **詳細**: deterministic な 26 TC で全 PASS、 coverage 100% は達成だが property-based fuzz / invariant test が未実装。 contract 設計の核心 (free mint 設計の supply 無制限 / grantor revoke ロジック) は invariant test で網羅性向上の余地大。
- **改善案**: 別 Issue で `/kiwa-forge --mode add-invariants` (将来) or 手動で `forge invariant_*` 追加。

### 2. minor: 統合 report 「次アクション」 の 3 件中 2 件が別 Issue 想定 (本 chain では未着手)

- **場所**: `tests/reports/integrated/nextjs-token-gating-both.ja.md` § Section 4
- **詳細**: 「spec 書き戻し」 (10 bullet 反映) と「kiwa fixture 拡張」 (3 helper 追加) は別 Issue / 別 PR 想定。 本 chain で着手しないが、 後追い項目放置 (軸 5) との重複扱い。
- **改善案**: 統合 report 完了直後に user に AskUserQuestion で「別 Issue 化するか / 後追いするか」 選択肢を提示するのが妥当 (本 result-review 完了時の Step 5c の AskUserQuestion で吸収可能)。

## 4. 追加すべき test 提案 (result-review でも future enhancement として列挙)

| 範囲 | 提案 | 緊急度 | 理由 |
|---|---|---|---|
| e2e | TC-009 / TC-013 / TC-006 / TC-012 / TC-017 の追加 | critical | spec 設計済で実装漏れ、 5c auto-fix で対応 |
| contract | `forge invariant_*` で totalSupply 単調増加 / ownerOf 整合 の property test | major | 設計上の不変条件を CI で常時検証 |
| contract | `fast-check` で grantTimedAccess の ttl fuzz (1 〜 type(uint64).max) | minor | overflow 境界の網羅 |
| e2e | kiwa fixture に `waitForWalletConnected` / `injectMultipleWallets` / `setStorageSlot` helper 追加 | major | TC-013 / TC-017 実装の前提、 OSS user の e2e 表現力向上 |
| 横断 | `tests/reports/run-history.md` で 過去 round の timing 統計を蓄積 | minor | flaky 兆候の中長期トレンド分析 |

## 5. 総評

contract chain (Foundry + Hardhat) は spec 26 件を 1:1 mapping で実装し production target 100% (Foundry) / 94.7% (Hardhat、 runner 差異で意図的) を達成、 test-review も両 runner で 9.40/10 と production 公開水準。 一方 dApp e2e chain は spec 17 件中 10 件実装で観点 3 つの grouping 未実装、 cover 率 52% で test-review 5.00/10 FAIL となり、 result-review 軸 4 で残存 critical を引きずって全体 3.50/10 FAIL に至った。

主な弱点は明確で、 (1) e2e の spec → test 翻訳での妥協 (wallet inject race を避けるため直接 RPC 経路 + assertion 緩和)、 (2) spec の「不足している仕様」 計 10 件が Issue/TODO 紐付けなしで放置、 (3) Playwright timing ±50% で flaky 一歩手前。 contract chain の完成度が高い分、 e2e chain の cover 率不足が全体評価を大きく押し下げる構造。

次アクション — Step 5c auto-fix loop を発火するか user 判断:

- **option A (recommended)** — auto-fix loop で TC-009 / TC-006 / TC-012 / TC-008 の 4 件を追加実装 (UI 経由 + 直接 RPC で実装可、 各 30 分目安)、 軸 2 / 軸 4 を改善して result-review weighted_score を 7.0+ へ到達させる。 TC-013 / TC-017 は kiwa fixture helper 拡張前提で別 Issue 化。
- **option B** — PARTIAL FAIL を許容して chain 完了、 残作業 (5 TC + 10 bullet + 3 helper) は別 Issue 起票して継続。 contract chain は production 公開水準で、 e2e 不足は別 PR で対応する戦略。
- **option C** — spec を縮小修正 (TC-013 / TC-017 を手動分類に降格、 TC-009 を 4 分割) して spec ↔ test の整合を spec 側で取る。 cover 率分母が下がり result-review 軸 2 / 軸 4 が改善する。
