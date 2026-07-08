---
name: kiwa-nuxt
description: |
  Layer 1 spec (`tests/spec/integration/test-spec-{module}.{nuxt|nuxt-mw|nitro}.md`) を Nuxt 3 の 3 mode (Server Routes `server/api/*.ts` の `defineEventHandler` / route middleware `middleware/*.ts` の `defineNuxtRouteMiddleware` / Nitro plugin lifecycle `server/plugins/*.ts` の `defineNitroPlugin`) test (Vitest + @kiwa/nuxt) に変換する Layer 2 skill。
  3 mode 全部 Nitro 起動なしで isolated 実行可能、 `invokeEventHandler` (Server Routes) / `invokeRouteMiddleware` (route middleware、 navigateTo / abortNavigation の throw を branded signal 化) / `invokeNitroPlugin` (Nitro plugin、 7 lifecycle hook を任意 payload で fire + hookOnce auto-detach + handler error isolation) の 3 helper を spec の 9 column 表から機械変換する。
  `/kiwa-design --layer {nuxt-server-route|nuxt-route-middleware|nuxt-nitro-plugin}` が出力する 9 column 表を `@kiwa/nuxt` v1.0.3+ の対応 helper の引数に機械的に変換する。
user_invocable: true
context: conversation
agent: general-purpose
allowed-tools: Bash, Read, Glob, Grep, Write, Edit
---

# /kiwa-nuxt — Nuxt 3 test 生成 (Layer 2、 3 mode)

`/kiwa-design --layer {nuxt-server-route|nuxt-route-middleware|nuxt-nitro-plugin}` が出力した spec の 9 column 表を、 `@kiwa/nuxt` v1.0.3+ の `invokeEventHandler` / `invokeRouteMiddleware` / `invokeNitroPlugin` を使った Vitest test に機械変換する。

対象は **Nuxt 3 の 3 layer** ... Server Routes (`server/api/*.ts` の `defineEventHandler`) / route middleware (`middleware/*.ts` の `defineNuxtRouteMiddleware`) / Nitro plugin lifecycle (`server/plugins/*.ts` の `defineNitroPlugin`)。 client component (Vue) は `/kiwa-ui` (Vue mode) で別 layer 対応済。

## 前提

- 対象 example / project に Nuxt 3 (`server/api/` / `middleware/` / `server/plugins/`) が存在
- Layer 1 spec (`tests/spec/integration/test-spec-{module}.{nuxt|nuxt-mw|nitro}.md`) が存在
- `@kiwa/nuxt` v1.0.3+ が install 済 (`pnpm add -D @kiwa/nuxt`)
- vitest + tsx + typescript の standard 開発環境

## mode 1 — Server Routes (`--layer nuxt-server-route`)

### 9 column 拡張表

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

### test 生成 template

```ts
import { invokeEventHandler, NUXT_REDIRECT_SYMBOL } from '@kiwa/nuxt';
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

## mode 2 — route middleware (`--layer nuxt-route-middleware`、 v1.0.2+)

### 9 column 拡張表

| 項目 | 内容 |
|---|---|
| ID | `T-NRM-001` 等の連番 |
| Observation | 観点 (pass-through / navigateTo redirect / abortNavigation / meta access / async middleware / 短形 return 等) |
| Given | to RouteLocation (`{path, name?, params?, query?, hash?, meta?}`) + 任意の from |
| Action | middleware 内部の操作 (`navigateTo('/login')` / `abortNavigation('forbidden', 403)` / return false / return string `/path`) |
| Helpers | middleware 引数 `(to, from, { navigateTo, abortNavigation })` の使用パターン |
| Then | 期待 (`result===false`、 `redirect.to==='/login'`、 `abort.statusCode===403`、 `error.message==='...'`) |
| Priority | `P0` / `P1` / `P2` / `P3` |
| Automation | `yes` / `no` / `manual` |
| Middleware | 対象 middleware file の identifier (`middleware/auth.ts` / `middleware/locale.global.ts` 等) |

### test 生成 template

```ts
import { invokeRouteMiddleware, NUXT_MIDDLEWARE_REDIRECT_SYMBOL, NUXT_MIDDLEWARE_ABORT_SYMBOL } from '@kiwa/nuxt';
import auth from '../middleware/auth.js';

it('{ID} {Observation}', async () => {
  const { result, redirect, abort, error } = await invokeRouteMiddleware({
    middleware: auth,
    to: {Given.to を object に展開, 例: { path: '/dashboard', meta: { requiresAuth: true } }},
    from: {任意、 default /},
  });
  {Then を expect(redirect?.to).toBe(...) や expect(abort?.statusCode).toBe(...) に展開}
});
```

### Pattern A (推奨) — DI

middleware 内部の `useUserSession()` 等を直接呼ばず、 `to.meta.userSession` 経由で注入。 helper は `to.meta` を任意 object として伝搬する。

## mode 3 — Nitro plugin (`--layer nuxt-nitro-plugin`、 v1.0.3+)

### 9 column 拡張表

| 項目 | 内容 |
|---|---|
| ID | `T-NNP-001` 等の連番 |
| Observation | 観点 (hook 登録 / multi-handler 順序 / hookOnce auto-detach / handler error isolation / localFetch / render:html mutation 等) |
| Given | plugin setup 内部で呼ぶ初期化処理 (logger setup / external API client 注入等) |
| Hook | 検証対象 hook 名 (`request` / `beforeResponse` / `afterResponse` / `error` / `render:html` / `render:response` / `close`) |
| Payload | callHook 時に渡す payload object (`{ method: 'GET', url: '/x' }` 等) |
| Then | 期待 (`registered[0].name==='request'`、 `callHookErrors[0].error.message==='...'`、 hook handler 内部の closure variable 変化等) |
| Priority | `P0` / `P1` / `P2` / `P3` |
| Automation | `yes` / `no` / `manual` |
| Plugin | 対象 plugin file の identifier (`server/plugins/analytics.ts` / `server/plugins/cache.ts` 等) |

### test 生成 template

```ts
import { invokeNitroPlugin } from '@kiwa/nuxt';
import analyticsPlugin from '../server/plugins/analytics.js';

it('{ID} {Observation}', async () => {
  const { registered, callHook, callHookErrors, error } = await invokeNitroPlugin({
    plugin: analyticsPlugin,
    localFetch: {任意、 hook 内部で nitroApp.localFetch(req) を呼ぶ場合に注入},
  });
  expect(registered.map(r => r.name)).toContain('{Hook}');
  await callHook('{Hook}', {Payload を object に展開});
  {Then を expect(callHookErrors).toEqual([]) や expect(closure var).toBe(...) に展開}
});
```

## 11 観点 → 3 helper mapping (3 mode 共通)

| 観点 | Server Routes | route middleware | Nitro plugin |
|---|---|---|---|
| 正常系 | `body` + `cookies` → `result` | navigation pass-through → `result === undefined` | hook 登録確認 → `registered.length > 0` |
| 異常系 | 不正 body → `error` | non-signal throw → `error` | plugin setup throw → `error` |
| 境界値 | `query` boundary → `result` | params edge → `to.params` 不在 case | callHook payload edge (null / undefined) |
| 状態遷移 | `cookies` → `env.responseCookies` | abort → `abort` capture | hookOnce 2 回呼び → first only fire |
| 権限 | `headers.authorization` → `redirect` | `to.meta.requiresAuth` → `redirect` | (該当稀、 plugin level の auth は別 layer) |
| 入力バリデーション | 空 body → 400 | invalid `to.path` → `error` | 不正 hook name → silent no-op |
| 冪等性 | 同 handler 2 回呼んで result 一致 | 同 middleware 2 回 → redirect 一致 | callHook 2 回 → handler 2 回 fire |
| 性能 | `performance.now()` で wrap | 同左 | 同左 (callHook 含む) |
| セキュリティ | CSRF / cookie 改竄 | external redirect 制御 | hook 内部の sensitive log 漏れ |
| 回帰 | 既知 bug 再現 input | navigateTo 連鎖 redirect | hookOnce + multi-handler 順序 |

## 関連

- 上流 ... `/kiwa-design --layer {nuxt-server-route|nuxt-route-middleware|nuxt-nitro-plugin}`
- runtime fixture ... `@kiwa/nuxt` v1.0.3+ (`packages/nuxt/`)
- 下流 (review) ... `/kiwa-review --layer {nuxt-server-route|nuxt-route-middleware|nuxt-nitro-plugin}`
- client component (Vue) ... `/kiwa-ui` (Vue mode)
- PoC ... `examples/nuxt-server-routes-poc/` + (route middleware / Nitro plugin の PoC は v1.2 で追加予定)
