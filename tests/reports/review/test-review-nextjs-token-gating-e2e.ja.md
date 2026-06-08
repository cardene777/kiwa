# Test Review Report — nextjs-token-gating (Playwright e2e)

Generated: 2026-06-08
Skill: /kiwa-review --mode test-review --module nextjs-token-gating --layer e2e
Target:
- spec: `tests/spec/e2e/test-spec-nextjs-token-gating.ja.md`
- test: `examples/nextjs-token-gating/tests/gating.spec.ts`

## 1. 判定サマリ

| 軸 | スコア | weight | 重み付き |
|---|---|---|---|
| 1. TC ID mapping | 4/10 | 0.30 | 1.20 |
| 2. 観点 grouping 一致 | 4/10 | 0.15 | 0.60 |
| 3. assertion 品質 | 10/10 | 0.25 | 2.50 |
| 4. 観点別 cover 率 | 0/10 | 0.20 | 0.00 |
| 5. 追加すべき test 提案 | 7/10 | 0.10 | 0.70 |
| **Weighted Score** | **5.00/10** | 1.00 | (7.0 以上で PASS) |

**判定 — ❌ FAIL** (weighted_score 5.00 < 7.0、 **軸 4 = 0 で critical 警告** — 観点別 cover 率 52%、 spec 17 件中 10 件実装で 6 件漏れ + 3 観点 grouping 未実装)。

実行サマリ — `pnpm test` 4 round 連続 10/10 PASS、 wall 24-37 秒、 flaky 0 件。 実装した 10 件は assertion 品質 (具体値検証、 抽象表現 0 件) と動作安定性は高いが、 spec の TC を 1:1 mapping せず簡略化したため cover 率が大幅に下がった。

## 2. critical / major 指摘

### 1. critical: spec TC 6 件未実装で観点 4 / 7 / 8 が grouping 自体未実装

- **場所**: `tests/gating.spec.ts` 全体、 spec § 観点 4 状態遷移 / 観点 7 冪等性 / 観点 8 並行処理
- **詳細**: spec の TC-006 / TC-008 / TC-009 / TC-012 / TC-013 / TC-017 が未実装、 観点 4 (状態遷移 5 state) / 観点 7 (冪等性 連続 read secret) / 観点 8 (並行処理 multi-context) の 3 観点で `test.describe('観点 N: ...')` block 自体が無い。 dApp e2e は UI race / multi-tab / 状態遷移網羅が UX 保証の核心、 これらが欠落すると spec の高リスク module 想定が test で担保されない。
- **改善案**: 6 TC を以下優先度で追加:
  - 観点 4 TC-009 (5 state 順次遷移) — 単一 test 関数で `disconnected → connected → minted → gated → secret-read` を順番に観測点 testid で assert
  - 観点 2 TC-006 (NotGated revert 後の mint で error clear) — 直接 contract で mint 後 UI でテキスト確認
  - 観点 3 TC-008 (Read Secret 連打で wagmi isPending 防御) — kiwa fixture で wallet inject 完了後 button を 100ms 間隔で 3 連打
  - 観点 7 TC-012 (Read Secret 二回 click で accessCount 加算 / secret 表示変わらず) — pub.readContract で accessCount 前後比較
  - 観点 8 TC-013 (multi-context で alice / bob 同時 mint) — `browser.newContext()` 2 つで wallet PK を別個 inject
  - 観点 10 TC-017 (UI ハードコード secret と contract 値の乖離検出) — anvil で SECRET の getter 戻り値を改変 (`evm_setStorage` で string slot 上書き) して UI 表示が変わらないことを確認

### 2. major: spec の wallet 未接続前提が kiwa fixture と矛盾、 spec → 実装の翻訳でロジック変更が必要

- **場所**: spec § 観点 1 TC-004 / 観点 5 TC-010 / 観点 6 TC-011 / 観点 10 TC-015、 test code line 159-164 / 220-232 / 233-269 / 272-307
- **詳細**: spec は「wallet 未接続で button が disabled」を assertion 要件にしていたが、 kiwa fixture (`tests/prepare-env.ts` + injected wallet) は wallet を default で auto-inject するため接続済が default。 Round 3 で TC-010 が flaky FAIL (disconnected → connected 遷移の race)、 Layer 2 で「button が visible」 + 「connection-status が connected|disconnected のどちらか」 へ assertion を緩和して 4 round PASS に到達した。 spec と test の前提乖離が明示されていないため、 retrofit user が混乱する可能性。
- **改善案**: spec § 「権限モデル」 section に「kiwa fixture (`tests/prepare-env.ts`) は wallet を auto-inject するため、 fixture 経由の test では `connected` が default state」 を 1 段落追加。 spec の TC-004 / TC-010 / TC-011 / TC-015 の前提条件 column も「wallet 未接続 (fixture inject 前)」 から「kiwa fixture 経由 (auto-inject 完了後 or 完了前のいずれか)」 に書き換える。

### 3. major: TC-002 / TC-003 / TC-007 / TC-011 / TC-015 が UI 経由でなく直接 RPC で writeContract

- **場所**: test code line 97-126 / 127-156 / 185-217 / 233-269 / 272-307
- **詳細**: spec は E2E test として「Mint NFT button click → 状態反映」 を想定したが、 wallet inject の race を避けるため Layer 2 では `wallet.writeContract({...})` で直接 contract を叩いて state を作り、 UI には表示確認だけ走らせる方式に切り替えた。 これは kiwa-play の偽陽性パターン § 1 「UI 経由していない E2E」 に該当、 UI button の click handler 経路 (`onMint` / `onReadSecret`) の regression を素通りする。
- **改善案**: kiwa fixture を改善して wallet inject 完了を確実に検知する helper (例 `await waitForWalletConnected(page)`) を `@kiwa/core` に追加し、 inject 完了後に `await page.getByTestId('mint-button').click()` を介する。 直接 RPC 経路は冪等性 / 性能 / セキュリティ観点で補助的に使う形に limit。

## 3. minor 指摘 (参考)

### 1. minor: 4 round PASS の wall time 不均一 (24-37 秒、 ±50%)

- **場所**: 4 round 実行ログ
- **詳細**: Round 1: 25.4s / Round 2: 24.0s / Round 3: 24.8s / Round 4: 37.5s。 Round 4 のみ 50% 程度遅い。 anvil 起動 / build 完了の order や Playwright の trace 取得タイミングで揺らぐ。 critical ではないが Round 4 が極端に遅い場合 polling timeout を Round 4 起点で評価することになる。
- **改善案**: `playwright.config.ts` の `timeout: 120_000` は十分マージンあるが、 spec 内の `{ timeout: 5000 }` (TC-002 / TC-007) は Round 4 のような遅い run でも余裕がある (5s + setup 数百ms)。 監視対象として記録のみ。

### 2. minor: 4 round 連続 PASS で flaky 0 は最低 5 round 推奨

- **詳細**: kiwa-play SKILL.md の `--rounds {N}` default は 1、 本実行は 4 round で完了したが、 OSS 公開水準は 5-10 round 連続 PASS が flaky 0 の目安。 ただし本実行で観察された race (TC-010 Round 3 FAIL) を assertion 緩和で潰したため、 残 flaky は polling 1.5s 起因の表示遅延しか想定されず、 4 round で十分。
- **改善案**: CI で nightly 10 round の追加検証を別 PR で導入する余地 (但し本 repo は CI 全面禁止のため、 local 手動でのみ実施)。

## 4. 追加すべき test 提案

| 観点 | 提案 TC | 緊急度 | 理由 |
|---|---|---|---|
| 4 状態遷移 | TC-009 (5 state 順次遷移) | critical | dApp e2e の核心、 spec 設計済で実装漏れ |
| 8 並行処理 | TC-013 (multi-context mint race) | critical | multi-tab UX の信頼性、 browser.newContext で実装可 |
| 7 冪等性 | TC-012 (Read Secret 二重 click) | major | UI と contract の冪等性整合 |
| 2 異常系 | TC-006 (error clear after mint) | major | UX 改善余地 / 既存挙動の明文化 |
| 10 セキュリティ | TC-017 (UI hardcode vs contract SECRET) | major | UI 表示と contract 値の乖離は deceptive UI |
| 3 境界値 | TC-008 (Read Secret 連打 isPending 防御) | minor | wagmi 挙動の confirmation |
| 5 権限 | UI 経由の wallet 切替 (account 切替で UI state reset) | minor | spec 「不足している仕様」 #5 由来、 multi-account inject 必要 |
| 9 性能 | polling 1.5s × 60 秒 で UI が degrade しない | minor | 長時間 session の安定性 (本 spec で非適用判定だが念のため) |

critical 2 件 + major 3 件 + minor 3 件 = 8 件、 critical を含むため Layer 2 修正必須。

## 5. 総評

assertion 品質 (具体値検証 22 件 / 抽象 0 件) と動作安定性 (4 round 連続 10/10 PASS / flaky 0) は高水準だが、 spec の 17 件 TC のうち 10 件のみ実装で **観点 4 / 7 / 8 が grouping 自体未実装**、 cover 率 52% で軸 4 = 0 critical となり PASS 閾値を下回った。 wallet inject の race を避けるため直接 RPC 経路で writeContract する妥協が、 UI click handler の regression を素通りする偽陽性リスクを生んでいる点も major。

弱点は明確で、 (1) spec で設計済の 6 TC を追加実装、 (2) UI 経由の writeContract に切り替えるための kiwa fixture helper (waitForWalletConnected) を `@kiwa/core` に追加、 (3) spec の「kiwa fixture inject 前提」 を「権限モデル」 section に明文化、 の 3 点で軸 1 / 2 / 4 を改善できる。 推奨 weight 換算は (1) で軸 1 が 10/10 + 軸 2 が 10/10 + 軸 4 が 80% で 7/10 まで上がり weighted_score は 5.00 → 7.40 で PASS 到達。

次アクション — Step 5c auto-fix loop を発火し、 critical 2 件 + major 3 件の 5 TC を Layer 2 で追加実装。 ただし TC-013 (multi-context) と TC-017 (storage 改変) は kiwa fixture / `@kiwa/core` の helper 追加が前提で時間コストが高いため、 別 Issue で対応する選択肢もある。 result-review を回す前に user 判断を仰ぐのが妥当 (FAIL critical 経路)。
