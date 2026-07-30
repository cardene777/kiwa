---
name: kiwa-ruby
description: |
  @kiwa-lab/ruby (Rails / Sinatra / Roda / Hanami 統一 mock harness) を使った Ruby framework の request → controller → response cycle test 生成 skill。
  `createRubyAppEnv({ framework })` で mock env を立て、 `dispatchRailsRequest` で Rails controller (before_action / render / redirect_to) を捕捉、 `renderERB` で ERB `<%= %>` interpolation、 `captureActiveRecord` で AR query log snapshot を verify できる。
user_invocable: true
context: conversation
agent: general-purpose
allowed-tools: Bash, Read, Glob, Grep, Write, Edit
---

# /kiwa-ruby — Ruby framework request-response test 生成

`@kiwa-lab/ruby` の 4 framework (Rails / Sinatra / Roda / Hanami) 統一 mock を使った Ruby framework test を Vitest 形式で生成する。

## 目的

Ruby web app を TypeScript から contract test する。 framework 別 request/response 経路 (Rails controller vs Sinatra block vs Roda routing tree vs Hanami action) を統一 interface で吸収した抽象で test 化する。

## 前提

- `pnpm add -D @kiwa-lab/ruby` install 済
- Vitest 環境
- 対象 module に Ruby framework 経路 (Rails action / Sinatra route 等) が存在

## オプション

- `--module {name}` — test 対象 module
- `--framework {rails|sinatra|roda|hanami}` — 主要 framework (省略時 = 4 framework 全対応)
- `--output {path}` — 生成 test path (省略時 = `tests/integration/{module}.ruby.test.ts`)

## 実行フロー

### Step 1: Rails dispatch workflow test 生成

`createRubyAppEnv({ framework: 'rails' })` で env を立て、 `dispatchRailsRequest(env, { controller, action, params })` の返却 `{ status, body, before_action_chain, rendered_template }` を assert。 before_action → action → render の順序 + skip_before_action / halt (redirect) の short-circuit を cover。

### Step 2: ERB render + Generic dispatch test 生成

`renderERB('<%= name %>', { name: 'kiwa' })` で ERB interpolation verify。 Sinatra / Roda / Hanami は `dispatchGenericRequest(env, req)` で統一 shape 経由 test。

### Step 3: ActiveRecord capture test 生成

`captureActiveRecord(env)` で AR query log (find / where / create / update / destroy) を取得、 SQL 発行回数 + N+1 検知 + eager load 適用の verify。

## 使用例

```bash
/kiwa-ruby --module posts --output tests/integration/posts.ruby.test.ts
/kiwa-ruby --module api --framework sinatra
```
