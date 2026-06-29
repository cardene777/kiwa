---
name: kiwa-sveltekit
description: |
  Layer 1 spec (`tests/spec/integration/test-spec-{module}.svk.md` / `.svk-action.md`) を SvelteKit の load function + form actions test (Vitest + @kiwa-test/sveltekit) に変換する Layer 2 skill。
  `+page.server.ts` の `load({ params, url, cookies, fetch, locals })` を `invokeLoad` で direct invoke、 `actions.{name}({ request, cookies, locals })` を `invokeAction` で invoke、 redirect / error / fail signal を捕捉する。
  `/kiwa-design --layer sveltekit-load` または `--layer sveltekit-action` が出力する 9 column 表を `@kiwa-test/sveltekit` の API に機械的に変換する。
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

## 関連

- 上流 ... `/kiwa-design --layer sveltekit-load` / `--layer sveltekit-action`
- runtime fixture ... `@kiwa-test/sveltekit` v1.0+
- 下流 (review) ... `/kiwa-review --layer sveltekit-load` / `--layer sveltekit-action`
- client component (Svelte) ... `/kiwa-ui` (Svelte mode)
