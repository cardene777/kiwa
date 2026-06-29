---
name: kiwa-nuxt
description: |
  Layer 1 spec (`tests/spec/integration/test-spec-{module}.nuxt.md`) を Nuxt 3 Server Routes (`server/api/*.ts` の `defineEventHandler`) test (Vitest + @kiwa-test/nuxt) に変換する Layer 2 skill。
  `defineEventHandler((event) => ...)` の callback を `invokeEventHandler({ handler, url, method, body, query, headers, cookies })` 経由で direct invoke し、 sendRedirect / setHeader / setCookie / setStatusCode の side-effect を捕捉して assertion 可能化する。
  `/kiwa-design --layer nuxt-server-route` が出力する 9 column 表を `@kiwa-test/nuxt` の `invokeEventHandler` の引数に機械的に変換する。
user_invocable: true
context: conversation
agent: general-purpose
allowed-tools: Bash, Read, Glob, Grep, Write, Edit
---

# /kiwa-nuxt — Nuxt 3 Server Routes test 生成 (Layer 2)

`/kiwa-design --layer nuxt-server-route` が出力した `tests/spec/integration/test-spec-{module}.nuxt.md` の 9 column 表を、 `@kiwa-test/nuxt` v1.0+ の `invokeEventHandler` を使った Vitest test に機械変換する。

対象は **Nuxt 3 の Server Routes (`server/api/*.ts` の `defineEventHandler`)**。 client component (Vue) は `/kiwa-ui` (Vue mode) で別 layer 対応済、 Nitro plugin lifecycle や route middleware は本 skill の対象外。

## 前提

- 対象 example / project に Nuxt 3 (`server/api/`) が存在
- Layer 1 spec (`tests/spec/integration/test-spec-{module}.nuxt.md`) が存在
- `@kiwa-test/nuxt` v1.0+ が install 済 (`pnpm add -D @kiwa-test/nuxt`)
- vitest + tsx + typescript の standard 開発環境

## 9 column 拡張表 (`/kiwa-design --layer nuxt-server-route`)

| 項目 | 内容 |
|---|---|
| ID | `T-NX-001` 等の連番 |
| Observation | 観点 (正常 GET / POST body / 認証 / query parse / redirect / 異常系 / status code 等) |
| Given | URL + initial cookies / headers / query seed (`url=http://x/api/y`、 `cookies={session:'sid'}`) |
| Method | HTTP method (`GET` / `POST` / `PUT` / `DELETE`、 default GET) |
| Body | JSON body (POST/PUT/PATCH 時、 parsed object をそのまま渡す) |
| Then | 期待 (`result===...`、 `redirect.url===...`、 `env.responseHeaders.get('x-...')===...`、 `env.status===201` 等) |
| Priority | `P0` / `P1` / `P2` / `P3` |
| Automation | `yes` / `no` / `manual` |
| Route | 対象 server route の identifier (`/api/items` / `/api/users/[id]` 等) |

## test 生成 template

```ts
import { invokeEventHandler, NUXT_REDIRECT_SYMBOL } from '@kiwa-test/nuxt';
import { handler } from '../server/api/items.get.js';

it('{ID} {Observation}', async () => {
  const { result, redirect, error, env } = await invokeEventHandler({
    handler,
    url: '{Given.url}',
    method: '{Method}',
    body: {Body を JSON object に展開},
    headers: {Headers を object に展開},
    cookies: {Given.cookies を object に展開},
  });
  {Then を expect(result).toEqual(...) や expect(redirect?.url).toBe(...) に展開}
});
```

## 11 観点 → invokeEventHandler mapping

| 観点 | helper の使い方 |
|---|---|
| 正常系 | `body` + `cookies` を seed → `result` が期待値 |
| 異常系 | 不正 body → `error` instanceof Error |
| 境界値 | `query` の値で boundary → `result` or status |
| 状態遷移 | `cookies` で state → `env.responseCookies` で遷移確認 |
| 権限 | `headers.authorization` seed → `redirect` or `error` |
| 入力バリデーション | 空 body → 400 status or error |
| 冪等性 | 同 handler 2 回呼んで result 一致 |
| 性能 | `performance.now()` で wrap |
| セキュリティ | CSRF / token / cookie 改竄テスト |
| 回帰 | 既知 bug 再現 input → 正しい挙動 |

## 関連

- 上流 ... `/kiwa-design --layer nuxt-server-route`
- runtime fixture ... `@kiwa-test/nuxt` v1.0+ (`packages/nuxt/`)
- 下流 (review) ... `/kiwa-review --layer nuxt-server-route`
- client component (Vue) ... `/kiwa-ui` (Vue mode)
- PoC ... `examples/nuxt-server-routes-poc/`
