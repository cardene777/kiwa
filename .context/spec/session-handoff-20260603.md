# Session Handoff — 2026-06-03 (kiwa v0.1.0 publish 直前完成)

本セッション (引き継ぎ "kiwa v0.1.0 公開準備") の全成果と残作業を SSOT として記録する。
次セッションは本 file を Read することで、現状把握 + 次着手判断ができる状態。

## セッション開始時点 (2026-06-02 朝)

- Issue #3 ✅ closed (PR #9 merged、deferred 10 finding + R1 7 fix)
- PR #8 merged (roadmap spec 取り込み)
- Issue #4 / #5 / #6 / #7 open
- main HEAD = 1903e37

## セッション完了時点 (2026-06-03)

- Issue #3 / #4 / #5 / #6 / #11 全 closed (5 PR merged)
- Issue #7 / #14 / #15 / #16 / #17 open (起票済)
- main HEAD = da316eb (Issue #11 PR #18 merge)
- **v0.1.0 publish 直前防御完成** (ci.yml 削除によりローカルテスト運用へ切替、publish 経路は release.yml 内 5 step gate で担保)、Issue #17 のユーザー側操作で初回 publish 可能

## 本セッションで完了した PR (5 件)

| # | Issue | PR | merge commit | 内容 |
|---|---|---|---|---|
| 1 | #4 | #10 | 4104571 | Changesets + CI matrix + npm provenance |
| 2 | #5 | #12 | fb8471f | CLI init scaffold + template |
| 3 | #6 | #13 | 0a6ae26 | README + docs (RPC/EVENTS/ERRORS/MIGRATION/COMPARISON) |
| 4 | #11 | #18 | da316eb | release pipeline supply chain 強化 (SHA pin + CI gate) |

(Issue #3 は本セッション前に completed、Issue #11 は本セッション内で新規起票 → 完了)

## 本セッションで起票した新 Issue (4 件)

| # | 内容 | label | milestone |
|---|---|---|---|
| #11 | release pipeline supply chain 強化 (本セッション完了済) | enhancement | follow-up (完了) |
| #14 | setApprovalMode で User Reject (code 4001) 経路 | enhancement | v0.2 |
| #15 | setActiveAccount で複数 account 切替 | enhancement | v0.3 |
| #16 | setChainRegistry で chain registry test | enhancement | v0.3 |
| #17 | v0.1.0 publish 実行手順 (NPM_TOKEN + Trusted Publisher) | documentation | publish 直前 (ユーザー側) |

## v0.1.0 publish 直前防御 (本セッション最終成果)

### Publish 基盤 (Issue #4 + #11)

- Changesets で CHANGELOG 自動化 + CHANGELOG 生成済 (`.changeset/initial-publish-baseline.md` で v0.0.0 → v0.1.0 bump 宣言)
- GH Actions release.yml で changesets/action@SHA pin (v1.8.0 = 63a615b9c)
- `--provenance` 付き publish + `id-token: write` + `NPM_CONFIG_PROVENANCE: true`
- 4 action SHA pin (actions/checkout 34e114876 / pnpm/action-setup b906affcc / actions/setup-node 49933ea52 / changesets/action 63a615b9c)
- dependabot.yml で github-actions ecosystem daily + 2 groups 分離 (routine + changesets) + ignore changesets/action semver-major
- release.yml に test 再走 5 step (install → typecheck → test core SKIP_ANVIL_TESTS=1 → test cli → build -F core -F cli → consumer typecheck) で CI gate (案 B)

### CLI scaffold (Issue #5)

- `pnpm dlx @kiwa/cli init` で e2e/connect.spec.ts + playwright.config.ts + package.json merge 生成
- 既存 file 上書き保護 + `--force` flag + rollback (template 失敗時に半端 scaffold 残さず)
- 既存 scripts/devDeps merge で破壊しない (`test:e2e` / `@kiwa/core` / `@playwright/test` / viem を新規追加のみ)
- template 内に PRIVATE_KEY ハードコード排除 (eth_requestAccounts 経由で address 取得、secret scanner false positive 回避)

### Documentation (Issue #6)

- [README.md](../../README.md) — Quickstart 3 step + Features 7 + Documentation 6 link + License/Issues、tagline は「anvil をローカルで起動して使う headless E2E test fixture」(fork chain 誇張は Round 1 fix で削除済)
- [docs/RPC.md](../../docs/RPC.md) — 9 RPC + anvilProxy fallback + code 3 (transaction rejected)
- [docs/EVENTS.md](../../docs/EVENTS.md) — 4 event + triggerEvent API + code 例
- [docs/ERRORS.md](../../docs/ERRORS.md) — EIP-1193 公式 code + 実装固有 code (code 3) + error envelope + page 境界
- [docs/MIGRATION.md](../../docs/MIGRATION.md) — v0.0 → v0.1 初版 + 将来 template
- [docs/COMPARISON.md](../../docs/COMPARISON.md) — Synpress / wallet-mock / kiwa 3 軸比較
- [docs/RELEASING.md](../../docs/RELEASING.md) — release 手順 + SHA pin 運用 + CI gate + main branch protection

## 次セッションの作業候補 (優先順)

### 優先 A — v0.1.0 publish 実行 (ユーザー側操作必須)

Issue #17 https://github.com/cardene777/kiwa/issues/17 の手順:

1. **npm account 準備** — 2FA 設定 (Auth only) + Automation Token 発行 (`@kiwa/*` scope に Read and write)
2. **package 名予約確認** — npm 上で `@kiwa/core` `@kiwa/cli` の organization or scope が利用可能か (https://www.npmjs.com/org/kiwa 確認)、衝突時は scope 名変更 Issue 起票
3. **GitHub Secrets 登録** — Settings > Secrets and variables > Actions で `NPM_TOKEN` 追加
4. **Workflow permissions** — Settings > Actions で Read and write permissions + Allow GHA to create PR 有効化
5. **main branch protection (任意)** — Settings > Branches で PR 経由必須化のみ設定。
   required status check は **設定しない** (PR #22 で ci.yml を削除しローカルテスト運用に切り替え、`test (20)` + `test (22)` check は存在しないため required にできない)
6. **main push** — Changesets bot が `chore(release): version packages` PR を自動作成
7. **version PR merge** — release.yml が `pnpm publish -r --provenance` 実行、npmjs.com に v0.1.0 公開
8. **smoke test** — 外部 temp dir で `pnpm dlx @kiwa/cli init && pnpm install && pnpm exec playwright test` 実行確認

### 優先 B — Issue #14 (setApprovalMode) 着手

v0.2 マイルストーン最優先機能 (Reject 経路で実 MetaMask 損代 95% 到達)、AI 完結可能:

- `packages/core/src/fixture.ts` に `dappE2e.setApprovalMode(mode: 'approve' | 'reject')` 追加
- `packages/core/src/rpc-handlers.ts` の 4 method (personal_sign / eth_signTypedData_v4 / eth_sendTransaction / wallet_switchEthereumChain) で approval check
- 起動 — `/spec /Users/cardene/Desktop/projects/kiwa/.context/spec/kiwa-v0.1.0-roadmap.md` の Issue #14 (本セッションで起票) から個別 spec を起こす

### 優先 C — Issue #15 / #16 / #7 (v0.3 + EIP-6963)

v0.1.0 publish 後の v0.2 / v0.3 マイルストーン:

- Issue #7 EIP-6963 multi-wallet (v0.2)
- Issue #15 setActiveAccount (v0.3、複数 account 切替)
- Issue #16 setChainRegistry (v0.3、chain registry test)

## 主要 SSOT file (次セッションで Read 推奨)

| file | 内容 |
|---|---|
| `.context/spec/kiwa-v0.1.0-roadmap.md` | 親 roadmap (5 Issue 分割の元) |
| `.context/spec/issue-4-changesets-ci-provenance.md` | Issue #4 spec |
| `.context/spec/issue-5-cli-init.md` | Issue #5 spec |
| `.context/spec/issue-6-readme-docs.md` | Issue #6 spec |
| `.context/spec/issue-11-supply-chain-hardening.md` | Issue #11 spec |
| `.context/spec/session-handoff-20260603.md` | 本 file (引き継ぎ SSOT) |
| `docs/RELEASING.md` | release 手順 + SHA pin 運用 + CI gate (Issue #4 + #11) |

## 重要な技術メモ (引き継ぎ書から発展した知見)

### Codex CLI sandbox 制約

- loopback bind (127.0.0.1) EPERM — anvil test / vitest worker で偽陽性、host 側で再実行が必要
- `.git/index.lock` 作成不可 — Codex 側で commit fail、Opus 側で commit 作成が必要
- network 制限 — `pnpm install` / `registry.npmjs.org` 接続不可、SHA verify は `gh api commits/{SHA}` で代替

### action SHA pin の正しい取得経路

`gh api repos/{owner}/{repo}/git/refs/tags/v{version}` は **annotated tag の object SHA を返す** ことがある (commit object でない)。
正しい commit SHA は:

1. `gh api repos/{owner}/{repo}/git/refs/tags/v{version}` で tag object SHA を取得
2. `gh api repos/{owner}/{repo}/git/tags/{TAG_SHA}` で `.object.sha` (commit SHA) を dereference
3. `gh api repos/{owner}/{repo}/commits/{SHA}` で 200 OK 確認 (tag object なら 404 / 422)

**lightweight tag** (annotation なし、稀) なら refs/tags 経路で直接 commit SHA が返る。本セッションで判明した経路差異:

- actions/checkout / actions/setup-node = lightweight tag (refs/tags で直接 commit SHA OK)
- pnpm/action-setup / changesets/action = annotated tag (dereference 必要)

### dependabot の groups 設計

- `pattern: "*"` で全 action を 1 group にまとめると **release pipeline 核** (changesets/action 等) の major up が低リスク routine update PR に混入
- 解決: groups を 2 つに分離 (routine = actions/* + pnpm/* / release pipeline 核 = changesets/* 等) + `ignore` で版バンドル制限
- 本 PR の dependabot.yml は本パターンを実装、参考 SSOT

### v0.0.0 → v0.1.0 bump フロー

- 本セッションで dry-run 確認済 (feature/publish-prep-v0.1.0 で `pnpm changeset version` 実行 → revert)
- `.changeset/initial-publish-baseline.md` が v0.0.0 → v0.1.0 bump を予約済
- 実 bump は release.yml の自動経路 (Changesets bot の version PR)、ユーザー側で手動 `pnpm changeset version` 実行は不要
- Issue #5 + #6 の貢献は changeset 未追加だが、initial-publish-baseline.md の minor bump 宣言で全 package が v0.1.0 になる

### MetaMask 損代カバレッジ (v0.1.0 / v0.2 / v0.3)

| version | カバレッジ | 担保範囲 |
|---|---|---|
| v0.1.0 (現状) | 90% | Approve 経路全部 (9 RPC + 4 event + EIP-1193 code + anvil 実 chain state) |
| v0.2 (#7 EIP-6963 + #14 setApprovalMode) | 95% | + User Reject + multi-wallet |
| v0.3 (#15 setActiveAccount + #16 setChainRegistry) | 100% | + account 切替 + chain registry |

「実 MetaMask 拡張なしで実 MetaMask と同範囲を担保」が v0.3 で完成。

## セッション全体の振り返り

### 完走 dev-flow パターン (5 PR で共通)

```
spec (/spec で AC/反例/影響範囲構造化)
  ↓
Issue body PATCH (gh api で AC 5/反例 5/リスク 5 を Issue に反映)
  ↓
spec commit (独立 commit、SSOT 維持)
  ↓
impl (/impl で Codex 委譲、4-9 file 実装)
  ↓
parallel-review (Codex adversarial で 2-3 finding 検出 → fix)
  ↓
verify (host quality gate 全 PASS → marker)
  ↓
PR 作成 (feat-improve template、Closes #N)
  ↓
CI all GREEN 確認 (GitHub Actions test 20/22 + GitGuardian + CodeRabbit)
  ↓
gh pr merge --squash --delete-branch
  ↓
Issue 自動 close + trace コメント (Issue + roadmap PR #8)
```

### 学んだ「事前認識リスクの威力」

- Pre-commitment Predictions (各レビュー前に「起こりそうな問題」3-5 件を予測) が Codex の指摘と高頻度で一致
- 特に Issue #6 で「README line 42 の `connect/disconnect/switchChain` API」を予測 → 実装確認で否定 (Codex は触れず、実装に存在)
- 「予測した上で検証する」プロセスが false alarm / 見落とし両方を減らす

### Codex 委譲の境界

- yaml / config / markdown 生成は Codex 委譲が安定 (200-400s で 4-9 file 一気に生成)
- TypeScript ロジック実装も Codex 委譲 (init.ts 123 行 + rollback 関数等を 200s 程度)
- Codex sandbox 制約 (loopback bind / git lock) は host 側 verify + commit で補完

## 次セッション着手手順

1. 本 file (`.context/spec/session-handoff-20260603.md`) を Read で現状把握
2. main branch 確認 (`git checkout main && git pull origin main`、HEAD = da316eb 起点)
3. 着手 Issue 決定:
   - publish 実行 → Issue #17 (ユーザー側操作支援)
   - v0.2 機能先行 → Issue #14 (setApprovalMode) を `/spec` で個別 spec 化
4. dev-flow 標準フロー (spec → impl → review → verify → PR → merge) を踏襲

完了。
