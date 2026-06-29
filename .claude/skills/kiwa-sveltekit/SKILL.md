---
name: kiwa-sveltekit
description: |
  Layer 1 spec (`tests/spec/integration/test-spec-{module}.svk.md` / `.svk-action.md` / `.svk-hooks.md`) を SvelteKit の load function + form actions + hooks.server.ts (handle / handleFetch / handleError) test (Vitest + @kiwa-test/sveltekit) に変換する Layer 2 skill。
  `+page.server.ts` の `load` を `invokeLoad`、 `actions.{name}` を `invokeAction`、 `hooks.server.ts` の `handle` / `handleFetch` / `handleError` を `invokeHandle` / `invokeHandleFetch` / `invokeHandleError` で direct invoke、 redirect / error / fail signal + outgoing response + locals 操作を捕捉する。
  `/kiwa-design --layer sveltekit-load` / `--layer sveltekit-action` / `--layer sveltekit-handle` / `--layer sveltekit-handle-fetch` / `--layer sveltekit-handle-error` が出力する 9 column 表を `@kiwa-test/sveltekit` の API に機械的に変換する。
user_invocable: true
context: conversation
agent: general-purpose
allowed-tools: Bash, Read, Glob, Grep, Write, Edit
---

# /kiwa-sveltekit — SvelteKit load + form actions test 生成 (Layer 2)

`/kiwa-design --layer sveltekit-load` / `--layer sveltekit-action` が出力した 9 column 表を、 `@kiwa-test/sveltekit` v1.0+ の `invokeLoad` / `invokeAction` を使った Vitest test に機械変換する。

対象は **SvelteKit `+page.server.ts` / `+layout.server.ts` の load function** と **`+page.server.ts` の actions**。 client component (Svelte) は `/kiwa-ui` (Svelte mode) で別 layer 対応済、 `hooks.server.ts` の handle は本 skill のスコープ外 (将来 Issue)。

## 前提

- SvelteKit project (`+page.server.ts` / `+server.ts`) が存在
- Layer 1 spec が存在
- `@kiwa-test/sveltekit` v1.0+ install 済

## 9 column 拡張表

### load 用 (`--layer sveltekit-load`)

| 項目 | 内容 |
|---|---|
| ID | `T-SKL-001` 等の連番 |
| Observation | 観点 (正常 / params / searchParams / cookies / setHeaders / redirect / error / locals 等) |
| Given | URL + params + cookies + locals seed (`url=http://x/foo`, `params={slug:'kiwa'}`) |
| Then | 期待 (`data.foo===bar` / `redirect.location==='/login'` / `error.status===404` 等) |
| Priority | `P0` / `P1` / `P2` / `P3` |
| Automation | `yes` / `no` / `manual` |
| Route | 対象 load 関数の path (`/users/[id]` / `+layout.server.ts` 等) |
| Mode | `load` 固定 |
| Signal | `none` / `redirect` / `error` (期待 throw signal) |

### action 用 (`--layer sveltekit-action`)

| 項目 | 内容 |
|---|---|
| ID | `T-SKA-001` 等の連番 |
| Observation | 観点 (正常 / fail validation / redirect / cookies 操作 / 異常系 等) |
| Given | URL + FormData + cookies + locals seed |
| Then | 期待 (`result.ok===true` / `fail.status===400` / `redirect.location==='/dashboard'` / `env.cookies.get(...)===...` 等) |
| Priority | `P0` / `P1` / `P2` / `P3` |
| Automation | `yes` / `no` / `manual` |
| Route | 対象 action の name (`default` / `update` / `delete` 等) |
| Mode | `action` 固定 |
| Signal | `none` / `redirect` / `fail` (期待 signal) |

## test 生成 template

```ts
// load
import { invokeLoad, SK_REDIRECT_SYMBOL } from '@kiwa-test/sveltekit';
import { load } from '../src/routes/[id]/+page.server.ts';

it('{ID} {Observation}', async () => {
  const { data, redirect, error } = await invokeLoad({
    load,
    url: 'http://localhost:5173/{...}',
    params: {...},
    cookies: {...},
  });
  {Then を expect(data...).toBe(...) や expect(redirect?.location).toBe(...) に展開}
});

// action
import { invokeAction, SK_FAIL_SYMBOL } from '@kiwa-test/sveltekit';
import { actions } from '../src/routes/login/+page.server.ts';

it('{ID} {Observation}', async () => {
  const { result, fail, redirect, error } = await invokeAction({
    action: actions.default,
    url: 'http://localhost:5173/login',
    formData: {...},
    cookies: {...},
  });
  {Then を expect(result).toEqual(...) や expect(fail?.data).toEqual(...) に展開}
});
```

## hooks.server.ts mode (Issue #526、 v1.0.1+)

`hooks.server.ts` の 3 handler を test する経路。 SvelteKit production code は `import type { Handle, HandleFetch, HandleServerError } from '@sveltejs/kit'` だが、 kiwa は production 型を使わず simulated RequestEvent + 同 signature で direct invoke する。

### 9 column 拡張表 (`/kiwa-design --layer sveltekit-handle`)

| 項目 | 内容 |
|---|---|
| ID | `T-SKH-001` 等の連番 |
| Observation | 観点 (resolve pass-through / short-circuit / locals 書込 / cookies 操作 / 異常系 / route.id 分岐 / platform 経由 env 等) |
| Given | URL + cookies + locals + route.id + platform seed |
| Then | 期待 (`response.status===200` / `resolveCalled===true` / `localsAtResolve.user.id===42` / `env.cookies.get('telemetry')==='tid_1'`) |
| Priority | `P0` / `P1` / `P2` / `P3` |
| Automation | `yes` / `no` / `manual` |
| Hook | `handle` 固定 |
| ResolveResponse | resolve() の戻 Response (default `200 ok`、 Response object or `(event) => Response` 関数) |
| Mode | `handle` 固定 |

### 9 column (`/kiwa-design --layer sveltekit-handle-fetch`)

| 項目 | 内容 |
|---|---|
| ID | `T-SKHF-001` 等の連番 |
| Observation | 観点 (downstream pass-through / URL rewrite / auth header 追加 / 異常系 等) |
| Given | eventUrl + fetchUrl + cookies + headers seed |
| Then | 期待 (`downstreamCalled===true` / `downstreamRequest.url==='...'` / `response.status===...`) |
| DownstreamFetch | `(req) => Response` の fake (default 200 'downstream-ok') |
| Hook | `handleFetch` 固定 |

### 9 column (`/kiwa-design --layer sveltekit-handle-error`)

| 項目 | 内容 |
|---|---|
| ID | `T-SKHE-001` 等の連番 |
| Observation | 観点 (error message format / locals 経由 requestId / status 分岐 / logger throw 等) |
| Given | error + url + status + message + locals seed |
| Then | 期待 (`report.message==='...'` / `thrown` が undefined / event.url アクセス確認) |
| Hook | `handleError` 固定 |

### test 生成 template

```ts
import { invokeHandle, invokeHandleFetch, invokeHandleError } from '@kiwa-test/sveltekit';
import { handle, handleFetch, handleError } from '../src/hooks.server.ts';

it('{ID} {Observation}', async () => {
  const { response, resolveCalled, localsAtResolve, env } = await invokeHandle({
    handle,
    url: 'http://localhost:5173{Given.url}',
    cookies: {Given.cookies},
    locals: {Given.locals},
    routeId: '{Given.routeId}',
    resolveResponse: {ResolveResponse Response or fn},
  });
  {Then 展開}
});
```

出力 path 規約 ... `tests/spec/integration/test-spec-{module}.svk-hooks.md`。

---

## 関連

- 上流 ... `/kiwa-design --layer sveltekit-load` / `--layer sveltekit-action` / `--layer sveltekit-handle` / `--layer sveltekit-handle-fetch` / `--layer sveltekit-handle-error`
- runtime fixture ... `@kiwa-test/sveltekit` v1.0.1+ (`packages/sveltekit/`)
- 下流 (review) ... `/kiwa-review --layer sveltekit-{load,action,handle,handle-fetch,handle-error}`
- client component (Svelte) ... `/kiwa-ui` (Svelte mode)
