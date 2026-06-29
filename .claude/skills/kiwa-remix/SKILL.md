---
name: kiwa-remix
description: |
  Layer 1 spec (`tests/spec/integration/test-spec-{module}.remix.md` / `.remix-action.md`) を Remix v2 / React Router v7 の loader + action + Resource Routes test (Vitest + @kiwa-test/remix) に変換する Layer 2 skill。
  `loader({ request, params, context })` を `invokeLoader` で direct invoke、 `action({ request, params, context })` を `invokeAction` で invoke、 Response (200 / 3xx redirect) を自動 normalize して assert 可能化する。
  `/kiwa-design --layer remix-loader` / `--layer remix-action` が出力する 9 column 表を `@kiwa-test/remix` の API に機械的に変換する。
user_invocable: true
context: conversation
agent: general-purpose
allowed-tools: Bash, Read, Glob, Grep, Write, Edit
---

# /kiwa-remix — Remix v2 / React Router v7 loader + action test 生成 (Layer 2)

`/kiwa-design --layer remix-loader` / `--layer remix-action` が出力した 9 column 表を、 `@kiwa-test/remix` v1.0+ の `invokeLoader` / `invokeAction` を使った Vitest test に機械変換する。

対象は **Remix v2 / React Router v7 の `app/routes/*.tsx` の `loader` + `action`** および **Resource Routes (UI を return しない loader/action 専用 route)**。 client component (React) は `/kiwa-ui` (React mode) で別 layer 対応済。

## 前提

- Remix v2 / React Router v7 project (`app/routes/`) が存在
- Layer 1 spec が存在
- `@kiwa-test/remix` v1.0+ install 済

## 9 column 拡張表

### loader 用 (`--layer remix-loader`)

| 項目 | 内容 |
|---|---|
| ID | `T-RX-001` 等の連番 |
| Observation | 観点 (正常 / params / search / cookies / Response / redirect / error 等) |
| Given | URL + params + headers + context seed |
| Then | 期待 (`result===...` / `response.status===200` / `await response.json()===...` / `redirect.location==='/login'`) |
| Priority | `P0` / `P1` / `P2` / `P3` |
| Automation | `yes` / `no` / `manual` |
| Route | 対象 loader の route file (`app/routes/users.$id.tsx` 等) |
| Mode | `loader` 固定 |
| Signal | `none` / `redirect` / `error` (期待 throw signal、 throw or 3xx Response 両対応) |

### action 用 (`--layer remix-action`)

| 項目 | 内容 |
|---|---|
| ID | `T-RX-001` 等の連番 |
| Observation | 観点 (formData / json body / validation / cookies 操作 / redirect / 異常系) |
| Given | URL + formData / jsonBody + cookies + context seed |
| Then | 期待 (`result===...` / `response.status===...` / `redirect.location===...`) |
| Priority | `P0` / `P1` / `P2` / `P3` |
| Automation | `yes` / `no` / `manual` |
| Route | 対象 action の route file |
| Mode | `action` 固定 |
| Signal | `none` / `redirect` / `error` |

## test 生成 template

```ts
// loader
import { invokeLoader, REMIX_REDIRECT_SYMBOL } from '@kiwa-test/remix';
import { loader } from '../app/routes/items.tsx';

it('{ID} {Observation}', async () => {
  const { result, response, redirect, error } = await invokeLoader({
    loader,
    url: 'http://localhost{Given.url}',
    params: {Given.params},
    headers: {Given.headers},
  });
  {Then を expect(...).toBe(...) に展開}
});

// action
import { invokeAction } from '@kiwa-test/remix';
import { action } from '../app/routes/login.tsx';

it('{ID} {Observation}', async () => {
  const { result, response, redirect, error } = await invokeAction({
    action,
    url: 'http://localhost{Given.url}',
    formData: {...},  // or jsonBody: {...}
  });
  {Then 展開}
});
```

## 関連

- 上流 ... `/kiwa-design --layer remix-loader` / `--layer remix-action`
- runtime fixture ... `@kiwa-test/remix` v1.0+ (`packages/remix/`)
- 下流 ... `/kiwa-review --layer remix-loader` / `--layer remix-action`
- client component (React) ... `/kiwa-ui` (React mode)
