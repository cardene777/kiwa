---
name: kiwa-sveltekit
description: |
  Layer 1 spec (`tests/spec/integration/test-spec-{module}.svk.md` / `.svk-action.md` / `.svk-hooks.md`) を SvelteKit の load function + form actions + hooks.server.ts (handle / handleFetch / handleError) test (Vitest + @kiwa/sveltekit) に変換する Layer 2 skill。
  `+page.server.ts` の `load` を `invokeLoad`、 `actions.{name}` を `invokeAction`、 `hooks.server.ts` の `handle` / `handleFetch` / `handleError` を `invokeHandle` / `invokeHandleFetch` / `invokeHandleError` で direct invoke、 redirect / error / fail signal + outgoing response + locals 操作を捕捉する。
  `/kiwa-design --layer sveltekit-load` / `--layer sveltekit-action` / `--layer sveltekit-handle` / `--layer sveltekit-handle-fetch` / `--layer sveltekit-handle-error` が出力する 9 column 表を `@kiwa/sveltekit` の API に機械的に変換する。
user_invocable: true
context: conversation
agent: general-purpose
allowed-tools: Bash, Read, Glob, Grep, Write, Edit
---

# /kiwa-sveltekit — SvelteKit load + form actions test 生成 (Layer 2)

`/kiwa-design --layer sveltekit-load` / `--layer sveltekit-action` が出力した 9 column 表を、 `@kiwa/sveltekit` v1.0+ の `invokeLoad` / `invokeAction` を使った Vitest test に機械変換する。

対象は **SvelteKit `+page.server.ts` / `+layout.server.ts` の load function** と **`+page.server.ts` の actions**。 client component (Svelte) は `/kiwa-ui` (Svelte mode) で別 layer 対応済、 `hooks.server.ts` の handle は本 skill のスコープ外 (将来 Issue)。

## 前提

- SvelteKit project (`+page.server.ts` / `+server.ts`) が存在
- Layer 1 spec が存在
- `@kiwa/sveltekit` v1.0+ install 済

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
import { invokeLoad, SK_REDIRECT_SYMBOL } from '@kiwa/sveltekit';
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
import { invokeAction, SK_FAIL_SYMBOL } from '@kiwa/sveltekit';
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
import { invokeHandle, invokeHandleFetch, invokeHandleError } from '@kiwa/sveltekit';
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

## hooks-chain mode (Issue #559、 v1.1+)

`hooks.server.ts` で `sequence(...handles)` を使う chain 構造、 および 4 hook 種 (handle / handleFetch / handleError / locals injection) を 1 env 内で共有する経路を test する。 v1.1 で追加された `setupSvelteKitHooksEnv` + `sequence` API を直接利用する。

### test 観点 (9 column 拡張表)

| ID | Given (env / chain) | When (run*) | Then (response / locals / cookies / order) | 優先度 | E2E | Unit | Mutation | Fuzz | Property |
|---|---|---|---|---|---|---|---|---|---|
| H-C-1 | `setupSvelteKitHooksEnv({locals})` + `sequence(h1, h2)` | `runHandle(seq)` | 全 hook 実行 + locals 書込が outer → inner → resolve → inner-after → outer-after の順序で観測 | P0 | - | Vitest | - | - | - |
| H-C-2 | env locals 注入 + chain 内 handle が locals 書込 | `runHandle(seq)` 2 回 | `env.reset()` で 2 回目は初期状態 / 未 reset なら mutate persist | P0 | - | Vitest | - | - | - |
| H-C-3 | env + chain 中段で short-circuit (403) | `runHandle(seq)` | inner 後段は呼ばれない + outer after は走る (`response.headers` 付与は実行される) | P0 | - | Vitest | - | - | - |
| H-C-4 | 同 env で `runHandle` → `runHandleFetch` → `runHandleError` を順次 | 3 連続 invoke | locals / cookies が 3 hook で共有 + `reset` で初期化 | P1 | - | Vitest | - | - | - |
| H-C-5 | `sequence()` 引数なし (no-op) | `runHandle(seq)` | resolve(event) を直接 invoke + 200 default response | P2 | - | Vitest | - | - | - |

### template

```typescript
import { describe, expect, it, beforeEach } from 'vitest';
import { setupSvelteKitHooksEnv, sequence } from '@kiwa/sveltekit';
import { {h1}, {h2} } from '../src/lib/_kiwa/{file}.ts';

describe('{module} hooks chain', () => {
  it('{T-id} {Given}', async () => {
    const env = setupSvelteKitHooksEnv<{Locals}>({
      url: '{url}',
      cookies: { {seed} },
      locals: { {seed} },
    });
    const { response, resolveCalled, localsAtResolve } = await env.runHandle(
      sequence<{Locals}>({h1}, {h2}),
    );
    {Then 展開}
  });
});
```

出力 path 規約 ... `tests/spec/integration/test-spec-{module}.svk-hooks-chain.md`。

---

## 関連

- 上流 ... `/kiwa-design --layer sveltekit-load` / `--layer sveltekit-action` / `--layer sveltekit-handle` / `--layer sveltekit-handle-fetch` / `--layer sveltekit-handle-error` / `--layer sveltekit-hooks-chain`
- runtime fixture ... `@kiwa/sveltekit` v1.1+ (`packages/sveltekit/`、 v1.0.1 は単発 invoke、 v1.1+ は `setupSvelteKitHooksEnv` + `sequence` chain 対応)
- 下流 (review) ... `/kiwa-review --layer sveltekit-{load,action,handle,handle-fetch,handle-error,hooks-chain}`
- client component (Svelte) ... `/kiwa-ui` (Svelte mode)
