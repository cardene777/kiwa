# spec: issue-6-readme-docs

## タスクサマリ

dapp-e2e v0.1.0 publish 前の最後の前提条件として、README.md を quickstart + features + comparison 全面書き直し + docs/ 配下 5 file (RPC / EVENTS / ERRORS / MIGRATION / COMPARISON) の最小実用ガイドを整備する。
roadmap AC 6 (v0.1.0 publish 可能状態) の達成条件で、Issue #4 (publish 基盤) + Issue #5 (CLI scaffold) を踏まえた読者体験完成版。
記述粒度は v1.0 で vitepress 化を見越して各 50-150 行の最小実用ガイドに留め、過剰装飾は避ける。

## 受入条件 (AC)

- AC 1: `README.md` を全面書き直しで、(a) 1 段落でツール定位 (anvil ベース fork chain testing 特化の headless E2E fixture) (b) `pnpm dlx @dapp-e2e/cli init` → `pnpm install` → `pnpm exec playwright test` の 3 step quickstart (c) features 箇条書き 5-8 項目 (d) `docs/COMPARISON.md` への link を含むツール選び navigation (e) MIT license + Issue tracker link を末尾に配置する
- AC 2: `docs/RPC.md` を新規作成し、core が直接 handle する 9 RPC method (eth_requestAccounts / eth_accounts / eth_chainId / net_version / personal_sign / eth_signTypedData_v4 / wallet_switchEthereumChain / wallet_addEthereumChain / eth_sendTransaction) を **method 名 / params signature / 戻り値 / 主な error code** の 4 列表で網羅 + anvilProxy fallback の動作説明 1 段落を含む
- AC 3: `docs/EVENTS.md` を新規作成し、EIP-1193 4 event (accountsChanged / chainChanged / connect / disconnect) の名前 + payload 型 + `dappE2e.triggerEvent(name, payload)` API + page 側 handler との連携を `code 例` 1 件以上で示す
- AC 4: `docs/ERRORS.md` を新規作成し、(a) EIP-1193 公式 error code (4001 / 4100 / 4200 / 4900 / 4901 / -32700 / -32602 / -32603) の意味 + (b) 本実装の error envelope (`{ ok: true, result } | { ok: false, error: { code, message } }`) + (c) page 境界で code が保持される仕組みを 1 段落ずつ説明
- AC 5: `docs/MIGRATION.md` (v0.x → v0.y breaking change tracking、v0.0 → v0.1 初版エントリ) + `docs/COMPARISON.md` (Synpress / wallet-mock / dapp-e2e の 3 軸比較表 + 使い分けガイド) を新規作成、両者とも先頭 1 段落で読者ターゲット + 末尾に関連 link を配置する

## スコープ境界

### in (本 Issue で対応)

| 観点 | in |
|---|---|
| README | quickstart + features + comparison link + license/issue tracker (1 ファイル全面書き直し) |
| docs/RPC.md | 9 RPC 表 + anvilProxy fallback 説明 |
| docs/EVENTS.md | 4 event + triggerEvent API + code 例 |
| docs/ERRORS.md | EIP-1193 code + error envelope + page 境界保持 |
| docs/MIGRATION.md | v0.0 → v0.1 初版 + 将来 entry template |
| docs/COMPARISON.md | Synpress / wallet-mock / dapp-e2e 3 軸比較 + 使い分け |
| link 方針 | 内部 link は相対参照、external link は信頼できる公式 (EIP-1193 / Changesets / npm provenance / 比較対象の公式 repo) のみ |
| 図 | Mermaid 図は README quickstart の flow 図 + docs/COMPARISON.md の差別化軸図の 2 箇所のみ (過剰装飾回避) |

### out (本 Issue で対応しない)

| 観点 | out |
|---|---|
| docs/RELEASING.md | Issue #4 で作成済、touch しない |
| vitepress / docusaurus site 化 | v1.0 以降 (roadmap §39 out) |
| docs/API.md (TSDoc 統合) | 将来別 Issue、現状は RPC.md + EVENTS.md + ERRORS.md で代替 |
| docs/CONTRIBUTING.md | 将来別 Issue、本 v0.1.0 scope 外 |
| docs/SECURITY.md | 将来別 Issue、Issue #11 (supply chain 強化) 完了後に検討 |
| docs/CHANGELOG.md | Changesets 自動生成 (Issue #4 確立済) |
| 翻訳 (英語版) | 現状は日本語のみ、v0.2 以降検討 |
| 動画 / GIF demo | 将来別 Issue、本 PR はテキスト + Mermaid のみ |
| screenshot | 同上 |
| EIP-6963 multi-wallet 記載 | Issue #7 (v0.2 目玉) で対応、本 Issue では言及しない |

## 反例ケース (動かないはず・対象外)

- 反例 1: `record` / `run` CLI subcommand を README / docs に記載する PR は roadmap 反例 3 違反、reject (Playwright codegen + `pnpm exec playwright test` で代替を案内)
- 反例 2: `docs/RELEASING.md` を変更する PR は Issue #4 で完成済の SSOT 改変、本 Issue scope 外で reject
- 反例 3: EIP-6963 multi-wallet 機能を README / docs/COMPARISON.md に言及する PR は Issue #7 (v0.2) の先取りで、reject (v0.1.0 時点では EIP-6963 未対応のため誤情報)
- 反例 4: docs/*.md の 1 file が **300 行を超える** 規模で書き直す PR は最小実用ガイド方針違反、reject (v1.0 vitepress 化の roadmap §39 out 方針と矛盾、目安 50-150 行)
- 反例 5: external link 内に npm registry 以外の **ダウンロード可能アーティファクト (binary / installer)** へのリンクを含む PR は supply chain 観点で reject (公式 docs / GitHub repo のみ)

## 影響範囲 (touched file 候補)

新規 5 file:

- `/Users/cardene/Desktop/projects/dapp-e2e/docs/RPC.md` — 9 RPC + anvilProxy fallback
- `/Users/cardene/Desktop/projects/dapp-e2e/docs/EVENTS.md` — 4 event + triggerEvent API
- `/Users/cardene/Desktop/projects/dapp-e2e/docs/ERRORS.md` — EIP-1193 code + error envelope + page 境界
- `/Users/cardene/Desktop/projects/dapp-e2e/docs/MIGRATION.md` — v0.0 → v0.1 + 将来 entry テンプレ
- `/Users/cardene/Desktop/projects/dapp-e2e/docs/COMPARISON.md` — Synpress / wallet-mock / dapp-e2e 3 軸比較

修正 1 file:

- `/Users/cardene/Desktop/projects/dapp-e2e/README.md` — 全面書き直し (現状 1 行 `# dapp-e2e` placeholder → quickstart 完成版)

合計 6 file (新規 5 + 修正 1)。

`docs/RELEASING.md` は Issue #4 で完成済の SSOT、本 Issue では touch しない (反例 2)。

## 既知のリスク・前提

### 前提

- Issue #4 で publish 基盤 (Changesets + provenance + .npmignore + publishConfig) が完成済、`.npmignore` で docs/ は publish 除外
- Issue #5 で CLI init scaffold が完成済 (PR #12)、README quickstart で `pnpm dlx @dapp-e2e/cli init` 経由の手順を書ける条件が整った
- 既存 `docs/RELEASING.md` (Issue #4 で作成、47 行) のスタイル (Mermaid 図最小 + 日本語 + 公式 link only) を本 Issue の他 docs でも踏襲
- 差別化軸 (anvil fork chain testing 特化) は roadmap 壁打ち §論点 1 + §論点 4 で確定済、COMPARISON.md でこれを明示
- error envelope `{ ok, result | error: { code, message } }` の page 境界保持は Issue #3 fix で確立済 (`packages/core/src/rpc-handlers.ts` の handleRpcRequest 経路)、ERRORS.md でこの仕様を文書化

### リスク

- リスク 1: **AC 5 で 2 file (MIGRATION + COMPARISON) を 1 AC にまとめる粒度判定** — 各々独立完成性を持つが、検証時 `両方とも先頭 1 段落で読者ターゲット + 末尾に関連 link を配置する` の条件で並列確認が必要、レビュー時に「これは 2 AC に分けるべき」指摘リスクあり (緩和: 各 file 50-150 行で完成度高く、AC 5 の検証コストは AC 2-4 の単独検証コストと同等)
- リスク 2: **docs/RPC.md の 9 RPC 表が実装と乖離するリスク** — `packages/core/src/rpc-handlers.ts` の case 文と一致させる必要、実装変更 PR でこの table も同 PR 内更新が必要 (緩和: 本 Issue 完了後の PR template に `docs/RPC.md` 更新 checkbox を入れる将来検討、本 PR は現状実装と一致する初版を作る)
- リスク 3: **README quickstart の 3 step (init / install / test) が実環境で動作しない** — `pnpm dlx @dapp-e2e/cli init` は npm publish 後にしか動かないため、本 Issue 時点では smoke test 不可、local `node packages/cli/dist/index.js init` の動作確認に留める (緩和: README quickstart は `pnpm dlx @dapp-e2e/cli init` 表記、AC 6 publish 後の動作確認は別タスク)
- リスク 4: **COMPARISON.md の Synpress / wallet-mock の情報が古い可能性** — 比較対象は ecosystem evolution で機能拡張する、本 Issue 時点の機能セット (Synpress 4.x / wallet-mock 最新) と比較した snapshot として記載、将来 entry 追加で update (緩和: COMPARISON.md 冒頭に `as of v0.1.0 (2026-06)` の timestamp 明記)
- リスク 5: **MIGRATION.md 初版 entry が薄い** — v0.0 → v0.1 で breaking change は実質なし (v0.0.0 は MVP、v0.1.0 が初の publish)、初版 entry は「v0.1.0 first public release」のみで実質的内容ゼロ (緩和: 初版 entry + 将来 entry template の 2 部構成で format を確立し、v0.2 以降の breaking change で本格活用)

### 粒度判定

- AC 数: 5 (緑閾値 3-5、ぎりぎり緑)
- 変更 file 数: 6 (緑閾値 5 以下、黄寄り)
- 推定実装時間: 50 分 (黄閾値 30-60、黄)
- **判定: 緑〜黄の境界 (緑寄りで単発進行)**、ユーザー確認待ち — docs は config / workflow と比べて実装負荷 (純粋 text 書き出し) が低く、6 file が並列無依存で書ける構造

### markdown スタイル統一

本 Issue で作成する 6 file 全体で以下を統一:

- 日本語 (READMEを除き必要に応じて英語識別子併記)
- 見出しは `#` `##` `###` の 3 階層まで、本文では絵文字使わない (Output Style cardene の応答テキスト規約とは別、SSOT file は markdown 標準)
- code block は \`\`\`typescript / \`\`\`bash / \`\`\`json を使う、絵文字なし
- 表は markdown table で、列が 4 個を超えたら横スクロール考慮
- 内部 link は相対参照 (`[CLI init](../packages/cli/src/commands/init.ts)` 等)、external link は信頼できる公式 (EIP-1193 / Changesets / npm provenance / GitHub repo) のみ
- 各 file 冒頭に 1 段落の読者ターゲット明記 (`本ドキュメントは X 向けです。`)
- 末尾に「関連」セクションで内部 / external link を 3-5 件配置

## 次ステップ

1. 本 spec を入力に `/issue-plan` で Issue #6 起票 (spec fast path) — ただし Issue #6 は既存 open (roadmap PR #8 起票時)、body 更新の PATCH 経路を取る
2. feature branch `feature/6-readme-docs` 作成済 (本 spec 保存と同 branch)
3. docs 中心のため TDD は省略 (markdown lint / spell check は本 Issue scope 外)、検証は markdown 構文 + リンク切れ + 反例遵守の手動確認
4. `/impl` (Codex 委譲で 6 file 一括生成) → `/parallel-review` → `/verify` → PR (Closes #6)
5. PR merge 後、v0.1.0 publish 直前の最終確認: `pnpm changeset version` で v0.0.0 → v0.1.0 bump → `pnpm publish -r --provenance` (Issue #4 で確立した release workflow で実行)
