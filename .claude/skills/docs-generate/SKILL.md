---
name: docs-generate
description: |
  kiwa の 3 系統 API reference (TypeScript typedoc + Rust cargo doc + Solidity forge doc) を一括で `docs/api/{typescript,rust,solidity}/` に生成する local skill。
  CI 全面禁止規約 (`rules/git-workflow.md`) に沿って **local 実行専用**、 GitHub Actions 経路は使わない。
  `--only <lang>` で特定言語のみ再生成、 `--check` で新規追加 API surface の diff 確認、 `--publish` で v1.11-6 の `/docs-publish` skill (VitePress build + gh-pages push) を chain 起動する。
user_invocable: true
context: conversation
agent: general-purpose
allowed-tools: Bash, Read, Glob, Grep, Write, Edit
---

# /docs-generate — kiwa 3 系統 API reference 一括生成 skill

v1.11-5 (Issue #685) で追加、 kiwa の 23 TypeScript packages + kiwa-test-rs Rust crate + dogfood-foundry-dapp Solidity contracts を横断して API reference を生成する。 tutorial / migration guide / release-gate SSOT は既存 `docs/tutorials/` `docs/migrations/` `docs/quality/` で完結、 本 skill は「API reference 3 系統」 のみを扱う。

## trigger

- v1.10+ の新 provider を追加した直後 (API surface が変わった)
- 大規模 refactor の後 (public export が動いた)
- `/docs-publish` (v1.11-6) 起動直前 (VitePress build に食わせる source が古い)
- 手動 `/docs-generate` 起動

## 前提

- Node.js ≥ 20 + pnpm on PATH
- Rust toolchain (cargo) on PATH
- Foundry CLI (forge) on PATH — Solidity docs 生成時のみ必須、 未 install 時は Solidity 経路 skip
- `pnpm install` 済 (typedoc は devDependency に既存想定)

## オプション

- `--only <lang>` — `typescript` / `rust` / `solidity` のいずれかで、 対象言語のみ生成
- `--check` — 新規 export を diff 表示のみ (write は skip、 CI 相当)
- `--publish` — 生成後に `/docs-publish` skill (v1.11-6) を chain 起動
- `--out <dir>` — 出力先 dir を上書き (default `docs/api/<lang>/`)

## ユーザーのリクエスト

$ARGUMENTS

## 実行フロー

### Step 1: 生成 target 判定

`--only` 指定時はそれ、 なければ 3 系統全対象。 各系統で対応 CLI (typedoc / cargo doc / forge doc) の PATH 存在を確認、 不在なら warn + skip。 3 系統全部 skip した場合は「Foundry / Rust / Node のいずれかを install してください」 で abort。

### Step 2: 出力 dir 準備

`docs/api/typescript/` `docs/api/rust/` `docs/api/solidity/` を rm -rf → mkdir。 `--out` 指定時はその dir 配下に同構造で作成。

### Step 3: TypeScript typedoc 生成

`packages/*/src/index.ts` を entry points に typedoc を起動、 全 23 packages を横断:

```bash
pnpm dlx typedoc --entryPointStrategy expand --entryPoints "packages/*/src/index.ts" \
  --out docs/api/typescript --readme none --hideGenerator --excludePrivate --excludeInternal
```

生成完了後、 `docs/api/typescript/index.html` の path を出力に含める。

### Step 4: Rust cargo doc 生成

kiwa-test-rs 単独 (feature 全 opt-in):

```bash
cargo doc --package kiwa-test-rs --all-features --no-deps --target-dir docs/api/rust-target
```

cargo doc の出力は `target/doc/kiwa/` になるので、 `docs/api/rust/` に copy + `docs/api/rust-target/` 除去:

```bash
cp -r docs/api/rust-target/doc/kiwa docs/api/rust/
rm -rf docs/api/rust-target
```

### Step 5: Solidity forge doc 生成

`examples/dogfood-foundry-dapp/` を root に forge doc:

```bash
forge doc --root examples/dogfood-foundry-dapp --out docs/api/solidity/dogfood-foundry-dapp --no-server
```

forge doc の出力は markdown なので VitePress で直接 render 可能。

### Step 6: 生成 summary 表示

各系統の 出力 path + 生成 file 数を summary で出力:

```
✅ TypeScript typedoc — docs/api/typescript/ (250 HTML files)
✅ Rust cargo doc — docs/api/rust/ (kiwa module + contract + integration + axum + actix + tower-http)
⚠️ Solidity forge doc — skipped (forge CLI not on PATH)
```

### Step 7: `--publish` 指定時

`/docs-publish` skill (v1.11-6 で追加) を chain 起動、 引数はそのまま渡す。

## 環境変数

- `DOCS_GENERATE_OUT_ROOT` — default `docs/api/`、 上書き時は該当 path 配下に生成
- `DOCS_GENERATE_TS_ENTRY` — default `packages/*/src/index.ts`
- `DOCS_GENERATE_SKIP_TYPEDOC` — set 済なら typescript 経路 skip

## dev-flow chain との連携

- 単独起動 = user 明示 `/docs-generate`
- `/docs-publish` chain 内で先行起動 (v1.11-6 で追加)
- `/ship` chain には含めない (毎 PR で走らせるには重い、 v1.11 milestone まとめ時に 1 回で十分)

## 生成物の git tracking

`docs/api/{typescript,rust,solidity}/` は `.gitignore` で除外済 (v1.11-5 で追加)。 出力は local build 前提、 GitHub Pages 経由 (`/docs-publish`) で公開する。
