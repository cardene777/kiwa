---
name: kiwa-trpc
description: |
  @kiwa-lab/trpc (tRPC v10 router / procedure / middleware / typed client mock harness) を使った tRPC endpoint の test 生成 skill。
  `createRouter` + `defineProcedure` で router を組み立て、 `invokeProcedure` で server 側実行、 `createClient(router)` で typed client proxy 経由の call、 `middleware(fn)` で middleware chain 検証を in-process で叩ける。
user_invocable: true
context: conversation
agent: general-purpose
allowed-tools: Bash, Read, Glob, Grep, Write, Edit
---

# /kiwa-trpc — tRPC endpoint test 生成

`@kiwa-lab/trpc` の router / procedure / middleware mock を使った tRPC test を Vitest 形式で生成する。 real HTTP transport 不要で query / mutation / subscription / middleware chain の test を書く。

## 目的

tRPC v10 based app で「router 定義 → procedure invoke → 出力検証」 の server test、 typed client proxy (`client.foo.query(input)`) の client test、 middleware chain (auth / logging / context transform) の test を書く。 real HTTP layer を跨がず in-process で完結。

## 前提

- `pnpm add -D @kiwa-lab/trpc` install 済
- Vitest 環境
- 対象 module に tRPC router (`appRouter`) + procedure が存在

## オプション

- `--module {name}` — test 対象 module (user-router / post-router / etc)
- `--target {procedure|client|middleware}` — 対象 layer (省略時 = 3 layer 全対応)
- `--output {path}` — 生成 test の path

## 実行フロー

### Step 1: procedure invoke test 生成

`createRouter()` + `defineProcedure('query', async ({ input, ctx }) => ...)` で router 組立、 `invokeProcedure(router, 'user.get', { id: 1 }, ctx)` で実行、 output shape を assert。 query / mutation / subscription 3 type を it.each で cover。

### Step 2: typed client test 生成

`createClient(router)` で client proxy、 `client.user.get.query({ id: 1 })` + `client.user.create.mutate({ name: 'x' })` で call、 return value + type inference を verify。 error propagation (procedure throw → client catch) も追加。

### Step 3: middleware chain test 生成

`middleware(async (opts) => { ... })` で middleware 定義、 chain (`middleware1 → middleware2 → procedure`) を router に組込、 middleware で context 変換 (`ctx.userId = decodeToken(...)`) を assert。 auth reject / logging emission も cover。

## 使用例

```bash
/kiwa-trpc --module user-router --target procedure
/kiwa-trpc --module auth-middleware --target middleware
```
