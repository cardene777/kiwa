# Spec Review Report — nextjs-token-gating (e2e)

Generated: 2026-06-08
Skill: /kiwa-review --mode spec-review --module nextjs-token-gating --layer e2e --lang ja
Target: tests/spec/e2e/test-spec-nextjs-token-gating.ja.md

## 1. 判定サマリ

| 軸 | スコア | weight | 重み付き |
|---|---|---|---|
| 1. 観点網羅 | 10/10 | 0.30 | 3.00 |
| 2. TC 件数妥当性 | 0/10 | 0.20 | 0.00 |
| 3. 優先度妥当性 | 10/10 | 0.20 | 2.00 |
| 4. 入力 / 期待結果の具体性 | 10/10 | 0.20 | 2.00 |
| 5. 不足している仕様 section の使い方 | 10/10 | 0.10 | 1.00 |
| **Weighted Score** | **8.00/10** | 1.00 | (7.0 以上で PASS) |

**判定 — ✅ PASS** (weighted_score 8.00 ≥ 7.0、 ただし **軸 2 = 0 で critical 警告** — TC 件数が高リスク module の期待密度未達 6 観点)。

## 2. critical / major 指摘

### 1. critical: TC 件数が高リスク module の期待密度を大きく下回る (6 観点未達)

- **場所**: spec 「テストケース一覧」 全体
- **詳細**: token-gating dApp は Read Secret (security 高) + accessCount 表示 (security 中-高) + UI ハードコード secret (security 高) を含む **高リスク** UI module。 高リスク module は観点あたり 3+ TC を期待するが、 異常系 2 / 境界値 2 / 状態遷移 1 / 権限 1 / 入力バリデーション 1 / 冪等性 1 と 6 観点で未達 (5+ 観点未達で軸 0)。 e2e は contract と違って **UI 表示の race / DOM 改ざん / multi-tab** などのカバー面が広いため、 件数密度が低いと UX 退行を見逃す。
- **改善案**: 以下 9 件の TC 追加を提案 (Layer 2 `/kiwa-play` で実装時に補強、 spec 改訂で正式追加):
  - 観点 2 異常系 — TC-005b: anvil RPC 切断 (proxy で 503 注入) で `nft-balance` が `(loading)` 表示のまま固定、 retry UI 不在を明示
  - 観点 2 異常系 — TC-005c: wallet reject (test の wallet inject で reject 設定) で `Mint NFT` 押下 → onError 未配線のため UI 反応無し、 button が pending 状態で stuck する不在仕様を明示
  - 観点 3 境界値 — TC-007b: `refetchInterval` 1.5s を超えて 5 秒以上待った後の表示安定性 (polling 累積で表示変動が無い incremental idempotency)
  - 観点 4 状態遷移 — TC-009b: `secret-read → wallet 切替 (別 account に切替)` で UI state が clean reset されるか確認
  - 観点 4 状態遷移 — TC-009c: NFT を別 user に transfer 後の元 holder の UI 状態 (`nft-balance` 0、 `is-gated` false 遷移)
  - 観点 5 権限 — TC-010b: NFT 保有 + 別 chain 切替時の UI 表示 (本実装は anvil 31337 固定だが wagmi の chain switch 経由で別 chain RPC が見えた場合の挙動)
  - 観点 6 入力バリデーション — TC-011b: keyboard 操作 (Tab + Enter) で button trigger 時の disabled 制御
  - 観点 7 冪等性 — TC-012b: `Mint NFT` 連続 click で `nftBalance` の遷移が `0 → 1 → 2` か `0 → 1` のみか (UI 仕様で連続 mint 防御の意図確認)
  - 観点 5 権限 — TC-010c: NFT 保有 + 別 user の context で `accessCount` が他者の操作で増えるのが見えるか (read polling の共有状態確認)

PASS 閾値はクリアだが軸 2 = 0 のため **Layer 2 進行前に上記 9 件の追加を強く推奨**。

## 3. minor 指摘 (参考)

### 1. minor: 観点 11 回帰の非適用判定の根拠

- **場所**: spec 「テスト観点一覧」 観点 11
- **詳細**: 「現時点で既存 e2e test 不在の clean start」と明記されているため非適用は妥当。 ただし `--auto-cleanup` で削除した既存 test (`tests/gating.spec.ts` 等が存在していた) を retrofit 観点として記録しておくと、 後の改訂時に過去履歴が辿りやすい。
- **改善案**: 「不足している仕様」 に 1 bullet 追加: 「過去 e2e test (削除済) からの retrofit 観点は本 spec 未反映、 historical bug shape は記録なし」。

### 2. minor: TC-009 の 5 state 遷移を 1 TC に圧縮しすぎ

- **場所**: spec § 観点 4 状態遷移 TC-009
- **詳細**: `disconnected → connected → minted → gated → secret-read` の 5 state を 1 TC で順次たどる構成だが、 各 state の観測点 (testid) が 4-6 個ずつあり 1 TC で 25+ 個の assertion を 1 行の「期待結果」 column に押し込む形になっている。 Layer 2 で実装する際に 1 it block で長くなり debug 困難。
- **改善案**: TC-009 を「TC-009a connected」「TC-009b minted」「TC-009c gated」「TC-009d secret-read」 の 4 分割で観点 4 内の TC 件数も補強できる (軸 2 の改善にも寄与)。

## 4. 追加すべき test 提案

(spec-review mode のため Section 2 / Section 3 に集約済、 本 section は test-review 用途で割愛)

## 5. 総評

UI 構成 (page.tsx の 6 testid + 2 button + wagmi hook 3 種 + simulateContract / writeContract の使い分け) を正確に読み取り、 失敗 mode (wallet reject onError 未配線 / error state clear / hardcode 乖離) や UX SLA (refetchInterval + setTimeout の合計 2.3 秒待機) を「不足している仕様」 で 6 bullet 明示した点が強み。 9 観点中 7 観点で高リスク module 想定の TC 件数 (3+) を満たさず、 e2e の UX カバー面 (race / DOM 改ざん / multi-tab) が薄い点が最大の弱点。

weighted_score 8.00 で PASS 閾値はクリアだが、 軸 2 = 0 の critical 警告があるため Layer 2 (`/kiwa-play`) に進む前に Section 2 で提案した 9 件の TC を追加して件数密度を上げると、 e2e test の信頼性が大幅に向上する。 ただし TC-009 の 4 分割で観点 4 の件数も自然増、 retrofit 観点 (削除した既存 gating.spec.ts) の記録を「不足している仕様」 に 1 bullet 追加すれば minor も解消する。

次アクション — `/kiwa-play --mode new --module nextjs-token-gating --lang ja --rounds 4` で Playwright spec 生成へ進む。 件数不足は Layer 2 実装で「補完 TC 提案」 として既出 17 件を実装しつつ、 上記 9 件は kiwa-play の auto-fix loop or 後続 PR で追加余地として残す。
