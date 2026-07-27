---
name: kiwa-qwikcity
description: |
  Layer 1 spec (`tests/spec/integration/test-spec-{module}.qwik.md` / `.qwik-action.md` / `.qwik-endpoint.md`) を Qwik City の routeAction$ + routeLoader$ + Endpoints test (Vitest + @kiwa-lab/qwikcity) に変換する Layer 2 skill。
  routeAction$ は `invokeRouteAction({ action, formValues, cookies, headers, url })`、 routeLoader$ は `invokeRouteLoader({ loader, url, params, cookies, headers, platform })`、 Endpoints (`onGet` / `onPost`) は `invokeEndpoint({ handler, url, method, params, headers, formData, jsonBody })` で simulated RequestEvent 経由で捕捉、 fail / redirect signal を normalize する。
  `/kiwa-design --layer qwikcity-action` / `--layer qwikcity-loader` / `--layer qwikcity-endpoint` が出力する 9 column 表を `@kiwa-lab/qwikcity` の API に機械的に変換する。
user_invocable: true
context: conversation
agent: general-purpose
allowed-tools: Bash, Read, Glob, Grep, Write, Edit
---

# /kiwa-qwikcity — Qwik City routeAction + routeLoader + Endpoints test 生成 (Layer 2)

`/kiwa-design --layer qwikcity-action` / `--layer qwikcity-loader` / `--layer qwikcity-endpoint` が出力した 9 column 表を、 `@kiwa-lab/qwikcity` v1.0+ の `invokeRouteAction` / `invokeRouteLoader` / `invokeEndpoint` を使った Vitest test に機械変換する。

対象は **Qwik City の `routeAction$`** + **`routeLoader$`** + **Endpoints (`onGet` / `onPost` / 等の RequestHandler exports)**。 client component (Qwik) は `/kiwa-ui` (Qwik mode) で別 layer 対応済。

## 9 column 拡張表

### routeAction 用 (`--layer qwikcity-action`)

| 項目 | 内容 |
|---|---|
| ID | `T-QA-001` 等の連番 |
| Observation | 観点 (正常 / fail validation / redirect / cookie 操作 / 異常系 等) |
| FormValues | action 第1引数 (parsed form values) |
| Given | cookies + headers + url seed |
| Then | 期待 (`result===...` / `fail.status===400` / `redirect.location==='/dashboard'`) |
| Priority | `P0` / `P1` / `P2` / `P3` |
| Automation | `yes` / `no` / `manual` |
| Action | 対象 routeAction$ の identifier (`useLoginAction` 等) |
| Signal | `none` / `fail` / `redirect` |

### routeLoader 用 (`--layer qwikcity-loader`)

| 項目 | 内容 |
|---|---|
| ID | `T-QL-001` 等の連番 |
| Observation | 観点 (params / query / cookies / redirect / platform 経由 env 等) |
| Given | url + params + cookies + headers + platform seed |
| Then | 期待 (`data===...` / `redirect.location==='/login'` / `error.message==='...'`) |
| Priority | `P0` / `P1` / `P2` / `P3` |
| Automation | `yes` / `no` / `manual` |
| Loader | 対象 routeLoader$ の identifier (`useUserLoader` 等) |
| Mode | `loader` 固定 |
| Signal | `none` / `redirect` |

### endpoint 用 (`--layer qwikcity-endpoint`)

| 項目 | 内容 |
|---|---|
| ID | `T-QE-001` 等の連番 |
| Observation | 観点 (GET / POST / json / text / redirect / 異常系 / setHeader 等) |
| Given | url + params + headers + body + method seed |
| Method | `GET` / `POST` / `PUT` / `DELETE` |
| Then | 期待 (`response.kind==='json'` + `response.body===...` / `response.status===201` / `redirect.location===...`) |
| Priority | `P0` / `P1` / `P2` / `P3` |
| Automation | `yes` / `no` / `manual` |
| Endpoint | 対象 endpoint の identifier (`onGet` / `onPost` 等) |

## test 生成 template

```ts
// routeAction
import { invokeRouteAction, QWIK_FAIL_SYMBOL, QWIK_REDIRECT_SYMBOL } from '@kiwa-lab/qwikcity';
import { useLoginAction } from '../src/routes/login/index.tsx';

it('{ID} {Observation}', async () => {
  const { result, fail, redirect, error } = await invokeRouteAction({
    action: useLoginAction.handler,  // routeAction$ result の handler を抽出
    formValues: {FormValues 展開},
    cookies: {Given.cookies},
    headers: {Given.headers},
    url: 'http://localhost:5173{Given.url}',
  });
  {Then 展開}
});

// routeLoader / endpoint も同 pattern (詳細 README + 9 column 表参照)
```

## 関連

- 上流 ... `/kiwa-design --layer qwikcity-{action,loader,endpoint}`
- runtime fixture ... `@kiwa-lab/qwikcity` v1.0+ (`packages/qwikcity/`)
- 下流 ... `/kiwa-review --layer qwikcity-{action,loader,endpoint}`
- client component (Qwik) ... `/kiwa-ui` (Qwik mode)
