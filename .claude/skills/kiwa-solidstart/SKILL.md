---
name: kiwa-solidstart
description: |
  Layer 1 spec (`tests/spec/integration/test-spec-{module}.solidstart.md` / `.solidstart-api.md`) を SolidStart の Server Functions + API Routes test (Vitest + @kiwa/solidstart) に変換する Layer 2 skill。
  Server Functions (`'use server'`) は `invokeServerFunction({ fn, args, headers, cookies })` で direct invoke、 API Routes は `invokeApiRoute({ handler, url, method, params, headers, formData, jsonBody, locals })` で simulated APIEvent 経由で捕捉、 redirect signal を normalize する。
  `/kiwa-design --layer solidstart-server-function` / `--layer solidstart-api-route` が出力する 9 column 表を `@kiwa/solidstart` の API に機械的に変換する。
user_invocable: true
context: conversation
agent: general-purpose
allowed-tools: Bash, Read, Glob, Grep, Write, Edit
---

# /kiwa-solidstart — SolidStart Server Functions + API Routes test 生成 (Layer 2)

`/kiwa-design --layer solidstart-server-function` / `--layer solidstart-api-route` が出力した 9 column 表を、 `@kiwa/solidstart` v1.0+ の `invokeServerFunction` / `invokeApiRoute` を使った Vitest test に機械変換する。

対象は **SolidStart の Server Functions (`'use server'` directive)** + **API Routes (`routes/api/*.ts` の `GET` / `POST` / 等 function exports)**。 client component (Solid) は `/kiwa-ui` (Solid mode) で別 layer 対応済。

## 9 column 拡張表

### server-function 用 (`--layer solidstart-server-function`)

| 項目 | 内容 |
|---|---|
| ID | `T-SS-001` 等の連番 |
| Observation | 観点 (正常 / 引数 / cookies / redirect / 異常系 / 状態遷移 等) |
| Given | 引数 (args 配列) + headers / cookies seed |
| Args | server function に渡す引数 (`['kiwa']` / `[42, 'item']` 等) |
| Then | 期待 (`result===...` / `redirect.url==='/dashboard'` / `error.message==='...'`) |
| Priority | `P0` / `P1` / `P2` / `P3` |
| Automation | `yes` / `no` / `manual` |
| Function | 対象 server function の identifier (`createPost` / `deleteUser` 等) |
| Signal | `none` / `redirect` / `error` (期待 throw signal) |

### api-route 用 (`--layer solidstart-api-route`)

| 項目 | 内容 |
|---|---|
| ID | `T-SS-API-001` 等の連番 |
| Observation | 観点 (GET / POST formData / POST JSON / params / cookies / redirect / locals 等) |
| Given | URL + params + headers + cookies + body + locals seed |
| Method | `GET` / `POST` / `PUT` / `DELETE` / `PATCH` |
| Then | 期待 (`response.status===200` / `await response.json()===...` / `redirect.url==='/login'` 等) |
| Priority | `P0` / `P1` / `P2` / `P3` |
| Automation | `yes` / `no` / `manual` |
| Route | 対象 endpoint route (`routes/api/users/[id].ts` 等) |
| Mode | `api-route` 固定 |

## test 生成 template

```ts
// server-function
import { invokeServerFunction, redirect, SOLIDSTART_REDIRECT_SYMBOL } from '@kiwa/solidstart';
import { createPost } from '../src/lib/posts.js';

it('{ID} {Observation}', async () => {
  const { result, redirect: r, error } = await invokeServerFunction({
    fn: createPost,
    args: [{Args 展開}],
    headers: {Given.headers},
    cookies: {Given.cookies},
  });
  {Then 展開}
});

// api-route
import { invokeApiRoute, json, redirectResponse } from '@kiwa/solidstart';
import { GET, POST } from '../src/routes/api/items.ts';

it('{ID} {Observation}', async () => {
  const { response, redirect } = await invokeApiRoute({
    handler: GET, // or POST
    url: 'http://localhost:3000{Given.url}',
    method: '{Method}',
    params: {Given.params},
    headers: {Given.headers},
    formData: {Given.formData},  // or jsonBody
    locals: {Given.locals},
  });
  {Then 展開}
});
```

## 関連

- 上流 ... `/kiwa-design --layer solidstart-server-function` / `--layer solidstart-api-route`
- runtime fixture ... `@kiwa/solidstart` v1.0+ (`packages/solidstart/`)
- 下流 ... `/kiwa-review --layer solidstart-server-function` / `--layer solidstart-api-route`
- client component (Solid) ... `/kiwa-ui` (Solid mode)
