---
name: kiwa-python
description: |
  @kiwa-lab/python (Django / Flask / FastAPI / Starlette 統一 mock harness) を使った Python web framework の request-response test 生成 skill。
  `createPythonAppEnv({ framework })` で WSGI/ASGI mock env を立て、 `dispatchRequest` で request-response cycle を in-process で叩き、 `renderTemplate` で Jinja2 相当 interpolation、 `captureMiddlewareCall` で middleware chain 履歴を verify できる。 real Python runtime 不要で TypeScript から Python framework の挙動 contract を test 化する。
user_invocable: true
context: conversation
agent: general-purpose
allowed-tools: Bash, Read, Glob, Grep, Write, Edit
---

# /kiwa-python — Python framework request-response test 生成

`@kiwa-lab/python` の 4 framework (Django / Flask / FastAPI / Starlette) 統一 mock を使った Python framework test を Vitest 形式で生成する。

## 目的

Python web app を TypeScript から contract test する。 framework 別 request/response shape (WSGI environ vs ASGI scope / Django `HttpRequest` vs Flask `request` vs FastAPI `Request`) を統一 interface で吸収した抽象で test 化する。

## 前提

- `pnpm add -D @kiwa-lab/python` install 済
- Vitest 環境 (`vitest run` が走る)
- 対象 module に Python framework 経路 (Django view / Flask route / FastAPI endpoint / Starlette handler) が存在

## オプション

- `--module {name}` — test 対象 module (1 起動 = 1 module)
- `--framework {django|flask|fastapi|starlette}` — 主要 framework (省略時 = 4 framework 全対応 test)
- `--output {path}` — 生成 test path (省略時 = `tests/integration/{module}.python.test.ts`)

## 実行フロー

### Step 1: dispatchRequest workflow test 生成

`createPythonAppEnv({ framework })` で mock env を立て、 `dispatchRequest(env, { method, path, body, headers })` の返却 `{ status, body, headers }` を assert。 4 framework を it.each で回して WSGI/ASGI mode 差 + status code / content-type の framework 別 default 差も cover。

### Step 2: template render test 生成

`renderTemplate(env, 'welcome', { name: 'kiwa' })` で Jinja2 相当 `{{ var }}` interpolation を verify。 missing var / nested context / conditional tag の 3 case で分岐 cover。

### Step 3: middleware chain test 生成

`captureMiddlewareCall(env)` で middleware 呼出履歴を取得、 認証 middleware → CSRF middleware → view の順序 assert + 途中 short-circuit (auth fail で view 未到達) の failure path 追加。

## 使用例

```bash
/kiwa-python --module user-api --output tests/integration/user-api.python.test.ts
/kiwa-python --module report --framework fastapi
```
