# spec: issue-4-changesets-ci-provenance

## タスクサマリ

dapp-e2e npm v0.1.0 公開準備の publish 基盤を確立する。
Changesets で CHANGELOG 自動化、GH Actions で node 20/22 matrix CI を稼働、`npm publish --provenance` を release workflow に組み込み、`publishConfig` / `.npmignore` / `files` field を整備して v0.1.0 を `--dry-run` まで安全に検証できる状態にする。

## 受入条件 (AC)

- AC 1: `.changeset/config.json` + `.changeset/README.md` + root `package.json` の `scripts.changeset` / `scripts.version-packages` / `scripts.release` を設定し、`pnpm changeset` がエラーなく起動する (changesets/cli devDep 追加済)
- AC 2: `.github/workflows/ci.yml` で node 20 / node 22 × ubuntu-latest の matrix を構築し、PR / push (main) のトリガで `pnpm install --frozen-lockfile → pnpm typecheck → pnpm test → pnpm build` が全て GREEN になる
- AC 3: `.github/workflows/release.yml` で changesets/action@v1 が `version` PR を自動作成し、merge 時に `pnpm release` (= `pnpm -r publish --access public --provenance`) で全 package を publish する設定 (`permissions: id-token: write` + `NPM_TOKEN` secret 参照)
- AC 4: `packages/core/package.json` と `packages/cli/package.json` に `publishConfig: { access: "public", provenance: true }` + `repository` + `license: MIT` + `keywords` を追加し、`pnpm -r publish --dry-run` が両 package で SUCCESS になる
- AC 5: ルート `.npmignore` + 各 package `files: ["dist"]` を整備し、`npm pack --dry-run` の出力に `.changeset` / `.context` / `.github` / `tests` / `*.test.ts` / `tsconfig*.json` が含まれない

## スコープ境界

### in (本 Issue で対応)

| 観点 | in |
|---|---|
| Changesets | `.changeset/config.json` + README + root scripts + `@changesets/cli` devDep |
| CI workflow | `.github/workflows/ci.yml` (node 20/22 matrix で install / typecheck / test / build) |
| Release workflow | `.github/workflows/release.yml` (changesets/action@v1 + provenance + id-token write) |
| publishConfig | core / cli の access public + provenance true + repository + license + keywords |
| Files / .npmignore | 各 package `files: ["dist"]` + root `.npmignore` で `.context` `.changeset` `.github` `tests` 除外 |
| Release ガイド (最小) | `docs/RELEASING.md` に Changesets 1 サイクルのフロー記載 (3-5 ステップ) |

### out (本 Issue で対応しない)

| 観点 | out |
|---|---|
| v0.0.0 → v0.1.0 bump | publish 基盤確立のみ、bump は Issue #6 完了後の publish 直前作業 |
| 実 npm publish | NPM_TOKEN 未配布段階のため本 PR では `--dry-run` のみ |
| README 全面書き直し | Issue #6 担当 |
| docs/ 全 5 file (RPC / EVENTS / ERRORS / MIGRATION / COMPARISON) | Issue #6 担当、本 Issue は `docs/RELEASING.md` 最小ガイドのみ |
| CLI `init` template 生成 | Issue #5 担当 |
| EIP-6963 multi-wallet | Issue #7 担当 (v0.2 目玉) |
| Codecov / lighthouse / e2e (Playwright) を CI に統合 | 将来別 Issue、本 PR では vitest + build まで |
| sigstore / Trusted Publisher 詳細解説 | 将来 doc 拡充、本 PR は `--provenance` flag 設定まで |

## 反例ケース (動かないはず・対象外)

- 反例 1: 本 PR で v0.0.0 → v0.1.0 を bump して publish 直前まで進める PR は AC 違反 (本 Issue は基盤確立のみ、bump は Issue #6 完了後)
- 反例 2: `record` / `run` CLI subcommand を `dapp-e2e` bin に追加する PR は壁打ち論点 5 違反 (Playwright codegen + `pnpm exec playwright test` で代替)
- 反例 3: `packages/core/package.json` の `dependencies` に viem 以外の runtime dep (例: yargs / commander / kleur 等) を追加する PR は zero runtime dep 方針違反、reject
- 反例 4: GH Actions で実 npm publish を本 PR でテストする PR は NPM_TOKEN 未配布段階で fail、`--dry-run` 検証で代替
- 反例 5: `.github/workflows/ci.yml` に Playwright E2E (Chromium DL + browser test) を組み込む PR は CI 時間増 + flaky リスク、Issue 範囲外 (将来別 Issue)

## 影響範囲 (touched file 候補)

新規 6 file:

- `/Users/cardene/Desktop/projects/dapp-e2e/.changeset/config.json`
- `/Users/cardene/Desktop/projects/dapp-e2e/.changeset/README.md`
- `/Users/cardene/Desktop/projects/dapp-e2e/.github/workflows/ci.yml`
- `/Users/cardene/Desktop/projects/dapp-e2e/.github/workflows/release.yml`
- `/Users/cardene/Desktop/projects/dapp-e2e/.npmignore`
- `/Users/cardene/Desktop/projects/dapp-e2e/docs/RELEASING.md`

修正 3 file:

- `/Users/cardene/Desktop/projects/dapp-e2e/package.json` (scripts: changeset / version-packages / release + devDep `@changesets/cli`)
- `/Users/cardene/Desktop/projects/dapp-e2e/packages/core/package.json` (publishConfig + repository + license + keywords)
- `/Users/cardene/Desktop/projects/dapp-e2e/packages/cli/package.json` (同上)

## 既知のリスク・前提

### 前提

- pnpm@10.33.2 monorepo (workspace), node >=20 を維持 (CI matrix node 20/22 と整合)
- v0.x freely breaking 方針 (壁打ち確定済)、CHANGELOG で breaking change を明示
- v1.0 以降に strict semver、API 確定後に移行
- npm provenance は GitHub Actions OIDC token + sigstore で署名、`id-token: write` 権限必須 (`permissions` block で設定)
- `NPM_TOKEN` secret はリリース直前にユーザーが GitHub repo settings で設定 (本 PR ではドキュメント追記のみ)

### リスク

- リスク 1: `.changeset/config.json` の `baseBranch` 設定ミスで `pnpm changeset status` が壊れる → config は `@changesets/cli init` で生成し最小限の修正に留める
- リスク 2: `pnpm -r publish` が `private: true` の root を含めようとして fail → `packages/*` のみ publish 対象、root は `private: true` 維持
- リスク 3: provenance build provenance generation が pnpm v10 + npm v10 で要求する OIDC token 形式 → release.yml で `npm publish` を pnpm wrap せず `pnpm publish --provenance` を直接呼ぶ (`pnpm publish` は npm CLI を内部利用)
- リスク 4: `.npmignore` と `files` field の優先順位 → `files` が優先される (npm 公式仕様)、ルート `.npmignore` は workspace 全体の補助、各 package の `files` で dist 限定が主防御
- リスク 5: CI matrix node 22 で vitest / tsup が deprecation warning を出す可能性 → 初回 CI run で確認し warning が fail を引き起こさないか検証 (`continue-on-error: false` 維持)

### 粒度判定

- AC 数: 5 (緑閾値 3-5、ぎりぎり緑)
- 変更 file 数: 9 (黄閾値 6-10、黄)
- 推定実装時間: 50 分 (黄閾値 30-60、黄)
- **判定: 黄 (警告承知で単発進行)**、ユーザー確認済 — 大半が config / workflow boilerplate で実装負荷は緑相当、Changesets と release workflow は依存関係があり分割すると整合性確認が二重化するため単発で実施

## 次ステップ

1. 本 spec を入力に `/issue-plan` で Issue #4 起票 (spec fast path)
2. feature branch `feature/4-changesets-ci-provenance` 作成済 (本 spec 保存と同 branch)
3. TDD は package.json scripts / workflow syntax / publishConfig 設定が test 対象 → vitest だと assertion が薄いため、検証は `pnpm changeset --version` / `pnpm -r publish --dry-run` / `actionlint` (workflow lint) で代替
4. `/impl` → `/parallel-review` → `/verify` → PR (Closes #4)
