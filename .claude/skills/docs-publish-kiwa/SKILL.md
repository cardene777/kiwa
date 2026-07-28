---
name: docs-publish-kiwa
description: |
  kiwa docs site (docs/.vitepress/) を VitePress で build して gh-pages branch に push、 GitHub Pages `https://cardene777.github.io/kiwa/` で公開する project-local skill。
  CI 全面禁止規約 (`rules/git-workflow.md`) に沿って **local 実行専用**、 GitHub Actions 経路は使わない。
  Step 1 で `/docs-generate` を chain 起動して 3 系統 API reference を最新化、 Step 2 で `pnpm docs:build` (VitePress build)、 Step 3 で `git worktree` 経由 gh-pages branch に build output を配置 → commit → push、 Step 4 で `https://cardene777.github.io/kiwa/` の反映確認 (5 分程度)。
  既存の同名 skill (~/.claude/skills/docs-publish、 汎用 OSS docs 生成) と用途が異なるため `docs-publish-kiwa` として分離。
user_invocable: true
context: conversation
agent: general-purpose
allowed-tools: Bash, Read, Glob, Grep, Write, Edit
---

# /docs-publish — kiwa docs site build + GitHub Pages publish skill

v1.11-6 (Issue #686) で追加、 kiwa の 3 系統 API reference (v1.11-5 land 済) + tutorial + migration guide + quality reports + release-gate SSOT を VitePress site として build、 gh-pages branch push で GitHub Pages 公開する。

## trigger

- v1.11+ の新 minor version merge 後
- 新 tutorial / migration guide / API reference 追加後
- `/docs-generate` (v1.11-5 land 済) だけでは local browse しかできないので、 web 上で共有したいタイミング
- 手動 `/docs-publish` 起動

## 前提

- Node.js ≥ 20 + pnpm on PATH
- `vitepress` が devDependency に install 済 (`pnpm add -D vitepress` — root package.json、 未 install 時は Step 0 で prompt)
- `git worktree` (git 2.5+) 使用可能
- GitHub Pages 設定 = repository settings → Pages → Source = `gh-pages` branch / root (未設定時は Step 5 で user に手動設定を promptr)
- `origin` remote が SSH で https://github.com/cardene777/kiwa.git を指す

## オプション

- `--skip-generate` — Step 1 (`/docs-generate` chain 起動) を skip、 既存 `docs/api/` 出力を使う
- `--dry-run` — Step 3 の commit + push を skip、 build output の verify のみ
- `--force` — gh-pages branch の history を上書き (default は fast-forward)、 大改修時のみ

## ユーザーのリクエスト

$ARGUMENTS

## 実行フロー

### Step 0: 前提確認

- `pnpm ls vitepress` で install 状態確認、 未 install なら `pnpm add -D vitepress` 実行を prompt
- `git worktree list` で既存 worktree 確認、 `../kiwa-gh-pages` 既存なら Step 3 で reuse
- `git remote get-url origin` で SSH URL 確認

### Step 1: `/docs-generate` chain 起動

`--skip-generate` 未指定時は `/docs-generate` skill (v1.11-5) を chain 起動、 3 系統 API reference (typedoc + cargo doc + forge doc) を `docs/api/{typescript,rust,solidity}/` に生成:

```bash
claude /docs-generate
```

生成完了確認 (`docs/api/typescript/index.html` 存在 + `docs/api/rust/kiwa/index.html` 存在 + `docs/api/solidity/dogfood-foundry-dapp/*.md` 存在)。

### Step 2: 生成物の更新と VitePress build

```bash
pnpm docs:api-reference:write
pnpm docs:links:write
git status --porcelain docs packages
pnpm docs:build
```

`docs:api-reference` と `docs:links` は検査のみで書き込まない (名前に `:write` が付くものだけが更新する)。
先に `:write` 側を実行して生成物を最新にし、差分が出たら内容を確認して commit してから build へ進む。

`docs:build` は `docs:gen:test` → `docs:consistency` → `docs:api-reference` → `docs:links` → `vitepress build` の順に走る。
生成物が古いまま build すると `docs:api-reference` が不一致を列挙して非 0 で止まる (書き換えはしない)。
その場合は `pnpm docs:api-reference:write` を実行して差分を commit してから再実行する。

出力は `docs/.vitepress/dist/`、 build 成功確認 (`index.html` 存在 + `assets/` dir 存在)。 build error 時は abort、 error log を user に提示。

### Step 3: gh-pages branch worktree

```bash
# 既存 gh-pages worktree 掃除 (--skip-generate 未指定時)
git worktree remove ../kiwa-gh-pages --force 2>/dev/null || true

# gh-pages branch 存在確認
if ! git ls-remote --heads origin gh-pages | grep -q gh-pages; then
  git switch --orphan gh-pages
  git commit --allow-empty -m "Initialize gh-pages"
  git push origin gh-pages
  git switch -
fi

# worktree add
git worktree add ../kiwa-gh-pages gh-pages
```

### Step 4: build output を gh-pages に配置 + commit + push

```bash
cd ../kiwa-gh-pages
rm -rf ./*
cp -r ../kiwa/docs/.vitepress/dist/* .
touch .nojekyll   # GitHub Pages が Jekyll 処理を skip
git add -A
git commit -m "docs: publish site $(date -u +%Y-%m-%d) from kiwa main"
git push origin gh-pages
cd -
```

`--force` 指定時は `git push --force origin gh-pages` に切替。

### Step 5: 公開確認

- `https://cardene777.github.io/kiwa/` に 5 分以内に反映される
- Playwright E2E test (`tests/docs-site-e2e/`) が local で `docs/.vitepress/dist/index.html` を検証、 landing / tutorial / API reference の 5 page rendering + full-text search の動作を実測
- GitHub Pages 設定未反映時、 user に手動設定を promptr:
  > repository settings → Pages → Source = `gh-pages` branch / root

### Step 6: `git worktree remove`

```bash
git worktree remove ../kiwa-gh-pages
```

## 環境変数

- `DOCS_PUBLISH_BRANCH` — default `gh-pages`、 上書き時は custom branch push
- `DOCS_PUBLISH_WORKTREE` — default `../kiwa-gh-pages`、 上書き時は該当 path に worktree

## GitHub Pages Free plan 制限

- source repo max 1 GB (kiwa docs 想定 ~100 MB、 十分余裕)
- bandwidth 100 GB/月 (docs 閲覧なら余裕)
- build 10 回/時間 (本 skill は local build、 GitHub Pages 側 build は使わないので該当なし)

閾値超過時は Cloudflare Pages / Vercel の free tier 移行検討、 SSOT `docs/quality/deployment-limits.md` (v1.12+ で追加予定) 参照。

## dev-flow chain との連携

- 単独起動 = user 明示 `/docs-publish`
- 新 minor version merge 後 = Roadmap 更新 PR merge 直後に user 判断で起動
- `/ship` chain には含めない (毎 PR で走らせるには重い、 minor version 単位で 1 回)
