---
name: kiwa-go-lib
description: |
  @kiwa-lab/go-lib (gin / echo / fiber / chi 統一 mock harness) を使った Go web framework の handler dispatch + middleware chain test 生成 skill。
  `createGoAppEnv({ framework })` で mock app env を立て、 `invokeGinHandler` / `invokeEchoHandler` / `invokeFiberHandler` で handler を統一 shape で叩き、 `captureChiRoute` で chi router pattern matching + middleware trace を verify できる。
user_invocable: true
context: conversation
agent: general-purpose
allowed-tools: Bash, Read, Glob, Grep, Write, Edit
---

# /kiwa-go-lib — Go web framework handler test 生成

`@kiwa-lab/go-lib` の 4 framework (gin / echo / fiber / chi) 統一 mock を使った Go framework test を Vitest 形式で生成する。

## 目的

Go web app を TypeScript から contract test する。 framework 別 Context / Ctx signature (gin.Context / echo.Context / fiber.Ctx / chi Request-Response) を統一 shape (req = `{ method, path, body, headers, params, query }` / res = `{ status, body, headers }`) で吸収した抽象で test 化する。

## 前提

- `pnpm add -D @kiwa-lab/go-lib` install 済
- Vitest 環境
- 対象 module に Go framework 経路 (gin handler / echo handler 等) が存在

## オプション

- `--module {name}` — test 対象 module
- `--framework {gin|echo|fiber|chi}` — 主要 framework (省略時 = 4 framework 全対応)
- `--output {path}` — 生成 test path

## 実行フロー

### Step 1: framework 別 invoke workflow test 生成

`invokeGinHandler({ handler, req })` / `invokeEchoHandler` / `invokeFiberHandler` の返却 `{ status, body, headers, framework }` を assert。 c.JSON / c.String / c.Status 挙動を capture、 4 framework を it.each で回して各 default status / content-type を cover。

### Step 2: chi router pattern test 生成

`captureChiRoute({ app, method, path })` で pattern matching + middleware trace + handler dispatch を取得、 named param (`/users/{id}`) の抽出 + wildcard route + middleware order の verify。

### Step 3: error path test 生成

各 framework で 400 / 404 / 500 failure path + panic recovery middleware の verify を it.each で網羅。

## 使用例

```bash
/kiwa-go-lib --module posts-api --output tests/integration/posts.go-lib.test.ts
/kiwa-go-lib --module users --framework gin
```
