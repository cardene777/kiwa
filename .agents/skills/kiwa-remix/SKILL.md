---
name: kiwa-remix
description: |
  Layer 1 spec (`tests/spec/integration/test-spec-{module}.{remix|remix-action|resource|remix-nested-chain}.md`) を Remix v2 / React Router v7 の 4 mode (loader + action + Resource Routes + nested route chain) test (Vitest + @kiwa-lab/remix) に変換する Layer 2 skill。
  `loader({ request, params, context })` を `invokeLoader` で direct invoke、 `action({ request, params, context })` を `invokeAction` で invoke、 Resource Routes は `invokeResourceRoute` で HTTP method dispatch (GET/HEAD → loader、 POST/PUT/PATCH/DELETE → action) + 該当 export 不在は 405 + allow header + methodNotAllowed signal 自動 return、 nested route chain は `setupRemixNestedRouteEnv` で parent → child loader 連鎖 + parent JSON Response auto-deserialize + Set-Cookie の cookieStore persist + 公式 `getDocumentHeaders` 互換 logic で `headers()` export merge + `defer()` / `resolveDeferred()` で streaming resolve、 Response (200 / 3xx redirect / binary download / json) を自動 normalize して assert 可能化する。
  `/kiwa-design --layer remix-loader` / `--layer remix-action` / `--layer remix-resource-route` / `--layer remix-nested-route-chain` が出力する 9 column 表を `@kiwa-lab/remix` v1.1+ の API に機械的に変換する。
user_invocable: true
context: conversation
agent: general-purpose
allowed-tools: Bash, Read, Glob, Grep, Write, Edit
---

# /kiwa-remix — Remix v2 / React Router v7 loader + action test 生成 (Layer 2)

`/kiwa-design --layer remix-loader` / `--layer remix-action` が出力した 9 column 表を、 `@kiwa-lab/remix` v1.0+ の `invokeLoader` / `invokeAction` を使った Vitest test に機械変換する。

対象は **Remix v2 / React Router v7 の `app/routes/*.tsx` の `loader` + `action`** および **Resource Routes (UI を return しない loader/action 専用 route)**。 client component (React) は `/kiwa-ui` (React mode) で別 layer 対応済。

## 前提

- Remix v2 / React Router v7 project (`app/routes/`) が存在
- Layer 1 spec が存在
- `@kiwa-lab/remix` v1.0+ install 済

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
import { invokeLoader, REMIX_REDIRECT_SYMBOL } from '@kiwa-lab/remix';
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
import { invokeAction } from '@kiwa-lab/remix';
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

## Resource Routes mode (Issue #523、 v1.0.2+)

Resource Routes は UI を return しない route module (`{ loader?, action? }`) で、 HTTP method dispatch によって loader / action を使い分け、 binary download / CSV / JSON / 405 response を直接生成する。 `invokeResourceRoute({ route, url, method, params?, context?, headers?, formData?, jsonBody? })` で method 別に dispatch + 該当 export 不在は 405 + `allow: 'GET, HEAD'` 等の header + `RESOURCE_ROUTE_METHOD_NOT_ALLOWED_SYMBOL` branded signal を自動 return する。 既存 `invokeLoader` / `invokeAction` の Response normalize / redirect signal を内部で reuse。

### 9 column 拡張表 (`/kiwa-design --layer remix-resource-route`)

| 項目 | 内容 |
|---|---|
| ID | `T-RR-001` 等の連番 |
| Observation | 観点 (GET → loader / POST → action / 405 method-not-allowed / case-insensitive method / binary download / redirect / formData / jsonBody / params 伝搬 等) |
| Given | URL + method + params + headers + context + body (formData / jsonBody) seed |
| Method | HTTP method (`GET` / `HEAD` / `POST` / `PUT` / `PATCH` / `DELETE`、 case-insensitive) |
| Then | 期待 (`dispatch==='loader'`、 `dispatch==='action'`、 `dispatch==='method-not-allowed'`、 `response.status===405`、 `methodNotAllowed.allow===['GET','HEAD']`、 `response.headers.get('allow')==='GET, HEAD'`、 `await response.arrayBuffer()` binary 一致) |
| Priority | `P0` / `P1` / `P2` / `P3` |
| Automation | `yes` / `no` / `manual` |
| Route | 対象 resource route の identifier (`app/routes/api.export.csv.ts` / `app/routes/api.items.ts` 等) |
| Module | 提供する export 群 (`loader` / `action` / `loader+action`) |

### test 生成 template

```ts
import { invokeResourceRoute, RESOURCE_ROUTE_METHOD_NOT_ALLOWED_SYMBOL } from '@kiwa-lab/remix';
import * as exportRoute from '../app/routes/api.export.csv.js';

it('{ID} {Observation}', async () => {
  const { dispatch, response, redirect, methodNotAllowed, error } = await invokeResourceRoute({
    route: exportRoute, // { loader, action } module
    url: 'http://localhost{Given.url}',
    method: '{Method}',
    params: {Given.params},
    headers: {Given.headers},
    formData: {Given.formData},  // or jsonBody: {...}
  });
  {Then を expect(dispatch).toBe('loader') や expect(methodNotAllowed?.allow).toEqual(['POST','PUT']) に展開}
});
```

### 11 観点 → invokeResourceRoute mapping

| 観点 | 使い方 |
|---|---|
| 正常系 | GET + loader → `dispatch==='loader'`、 `response.status===200` |
| 異常系 | action throw → `dispatch==='action'`、 `error` に Error |
| 境界値 | empty module (`{}`) → 405 + empty allow list、 case-insensitive method (`get`) → loader dispatch |
| 状態遷移 | POST → action → 動作後 GET → loader で state read (resource lifecycle) |
| 権限 | header 不在 → action 内 `throw redirect('/login', 302)` → `redirect` capture |
| 入力バリデーション | 不正 jsonBody → action 内 4xx response → `response.status===400` |
| 冪等性 | GET 2 回呼んで `response.body` 一致 |
| 性能 | binary download の大 size response、 `performance.now()` で wrap |
| セキュリティ | content-type sniff、 unsafe header injection 防止 |
| 回帰 | 既知 405 dispatch bug の retry 経路 |

出力 path 規約 ... `tests/spec/integration/test-spec-{module}.resource.md`。

## Nested Route Chain mode (Issue #561、 v1.1+)

Remix v2 の nested route (`app/routes/dashboard.tsx` + `app/routes/dashboard.profile.tsx` 等の flat 規約) で parent route の loader → child route の loader への data 連鎖 + parent / child の `headers()` export merge + `Set-Cookie` の親子横断 preservation + `defer()` による streaming Server Rendering を unit test する。 `setupRemixNestedRouteEnv({ parentRoute, childRoute, url, params, context, headers, cookies, method })` で env を build、 `runLoaderChain()` で parent → child loader を順次 invoke、 parent JSON Response は自動 deserialize して `child.context.parentData` に伝播、 cookieStore は env 内で persist し後続 chain 起動で child request の Cookie header に乗る、 mergedHeaders は Remix 公式 `getDocumentHeaders` (`@remix-run/server-runtime/dist/esm/headers.js`) と整合した logic で accumulate する。

### 9 column 拡張表 (`/kiwa-design --layer remix-nested-route-chain`)

| 項目 | 内容 |
|---|---|
| ID | `T-NR-001` 等の連番 |
| Observation | 観点 (parent → child data 連鎖 / parent Response auto-deserialize / Set-Cookie persistence / headers() merge / `defer()` resolve / `resolveDeferred` errors map / reset 経路 等) |
| Given | parentRoute (id + loader + headers) + childRoute (同) + URL + params + initialCookies + headers seed |
| Then | 期待 (`parent.result===...` / `child.result===...` / `parentData===...` / `mergedHeaders.get('cache-control')===...` / `mergedHeaders.getSetCookie()===[...]` / `cookies.get('session')===...` / `resolveDeferred(r.child.result).resolved.x===...`) |
| Priority | `P0` / `P1` / `P2` / `P3` |
| Automation | `yes` / `no` / `manual` |
| Route 構成 | parent route id + child route id (`routes/dashboard` + `routes/dashboard.profile` 等) |
| Mode | `nested-chain` 固定 |
| Signal | `none` / `redirect` / `error` / `deferred` (parent or child loader の signal) |

### test 生成 template

```ts
import { setupRemixNestedRouteEnv, resolveDeferred, isDeferred } from '@kiwa-lab/remix';
import { dashboardLayoutLoader, dashboardLayoutHeaders } from '../app/lib/_kiwa/dashboard-layout-loader.js';
import { dashboardProfileLoader, dashboardProfileHeaders } from '../app/lib/_kiwa/dashboard-profile-loader.js';

const parentDef = { id: 'routes/dashboard', loader: dashboardLayoutLoader, headers: dashboardLayoutHeaders } as const;
const childDef  = { id: 'routes/dashboard.profile', loader: dashboardProfileLoader, headers: dashboardProfileHeaders } as const;

it('{ID} {Observation}', async () => {
  const env = setupRemixNestedRouteEnv({
    parentRoute: parentDef,
    childRoute: childDef,
    url: 'http://localhost{Given.url}',
    cookies: {Given.cookies},
    headers: {Given.headers},
  });
  const r = await env.runLoaderChain();
  {Then を expect(r.parent.response?.status).toBe(...) や
   expect(r.mergedHeaders.get('cache-control')).toBe(...) や
   await resolveDeferred(r.child.result).resolved.{key} === ... に展開}
});
```

### 11 観点 → setupRemixNestedRouteEnv mapping

| 観点 | 使い方 |
|---|---|
| 正常系 | parent loader → child loader 順次 invoke → `r.parent.result + r.child.result` 両方期待値 |
| 異常系 | parent loader が Response 401 → child の parentData=undefined → child loader が 401 を返す経路 |
| 境界値 | parent loader 不在 (loader 未 export) → parent.result=undefined / child.parentData=undefined / child は素通し走る |
| 状態遷移 | 1 回目 chain で Set-Cookie 発行 → 2 回目 chain で cookieStore に persist → child Cookie header に乗る (T-NR-013 PoC 経路) |
| 権限 | parent loader の `resolveUser(request)` で unauthorized 検出 → 401 Response → child は parent layout 不在で 401 を返す |
| 入力バリデーション | parent loader が非 JSON Response (text/html) を返す → parentData=undefined (T-NR-002b SSOT) |
| 冪等性 | 同 env で 2 回 runLoaderChain → cookieStore に同 cookie が重複 set されない (T-NR-013 / T-NR-PoC-005) |
| 並行処理 | child loader が parent loader 完了を待ってから走る (`events` 配列で順序検証、 T-NR-003) |
| 性能 | `defer({ heavy: Promise<...> })` で重い query を resolve、 `resolveDeferred` の pendingKeys で確認 |
| セキュリティ | child が同 cookie name を返したら child 側を優先 (T-NR-009 の Remix 公式 prependCookies 互換)、 Set-Cookie injection 防止 |
| 回帰 | 公式 `getDocumentHeaders` の reduce step と整合 (`@remix-run/server-runtime/dist/esm/headers.js` の prependCookies 経路を T-NR-008 で fix) |

出力 path 規約 ... `tests/spec/integration/test-spec-{module}.remix-nested-chain.md`。

## 関連

- 上流 ... `/kiwa-design --layer {remix-loader|remix-action|remix-resource-route|remix-nested-route-chain}`
- runtime fixture ... `@kiwa-lab/remix` v1.1+ (`packages/remix/`)
- 下流 ... `/kiwa-review --layer {remix-loader|remix-action|remix-resource-route|remix-nested-route-chain}`
- client component (React) ... `/kiwa-ui` (React mode)
