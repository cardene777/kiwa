---
name: kiwa-rust-lib
description: |
  @kiwa-lab/rust-lib (axum / actix-web / tower-http / rocket 統一 mock harness) を使った Rust web framework の handler dispatch test 生成 skill。
  `createRustAppEnv({ framework })` で framework 別 mock app env を立て、 `invokeAxumHandler` / `invokeActixHandler` / `invokeRocketRoute` で handler を直 invoke、 `captureTowerMiddleware` で tower service layer 履歴を verify できる。
user_invocable: true
context: conversation
agent: general-purpose
allowed-tools: Bash, Read, Glob, Grep, Write, Edit
---

# /kiwa-rust-lib — Rust web framework handler test 生成

`@kiwa-lab/rust-lib` の 4 framework (axum / actix-web / tower-http / rocket) 統一 mock を使った Rust framework test を Vitest 形式で生成する。

## 目的

Rust web app を TypeScript から contract test する。 framework 別 async handler signature (axum extractor / actix-web request / rocket request guard) を統一 interface で吸収した抽象で test 化する。

## 前提

- `pnpm add -D @kiwa-lab/rust-lib` install 済
- Vitest 環境
- 対象 module に Rust framework 経路 (axum handler / actix service 等) が存在

## オプション

- `--module {name}` — test 対象 module
- `--framework {axum|actix|tower|rocket}` — 主要 framework (省略時 = 4 framework 全対応)
- `--output {path}` — 生成 test path

## 実行フロー

### Step 1: framework 別 invoke workflow test 生成

`invokeAxumHandler({ handler, method, path, body, headers })` / `invokeActixHandler` / `invokeRocketRoute` の返却 `{ status, body, headers }` を assert。 axum extractor / actix-web request signature 差を it.each で cover。

### Step 2: tower middleware trace test 生成

`captureTowerMiddleware({ middleware, request })` で service layer 通過履歴を取得、 auth layer → logging layer → handler の順序 + layer 別 error 変換の verify。

### Step 3: error path test 生成

各 framework で 400 / 401 / 404 / 500 の failure path を it.each で網羅、 framework 別 default error shape を assertion。

## 使用例

```bash
/kiwa-rust-lib --module users-api --output tests/integration/users.rust-lib.test.ts
/kiwa-rust-lib --module orders --framework axum
```
