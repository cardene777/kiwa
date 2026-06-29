---
name: kiwa-astro
description: |
  Layer 1 spec (`tests/spec/integration/test-spec-{module}.astro.md`) を Astro Server Endpoints (`pages/api/*.ts` の `GET` / `POST` / 等 function exports) test (Vitest + @kiwa-test/astro) に変換する Layer 2 skill。
  `APIRoute((context: APIContext) => Response)` を `invokeEndpoint({ endpoint, url, method, params, headers, cookies, formData, jsonBody, locals, site })` 経由で direct invoke し、 Response (200 / 3xx redirect) を normalize して assertion 可能化する。
  `/kiwa-design --layer astro-endpoint` が出力する 9 column 表を `@kiwa-test/astro` の `invokeEndpoint` の引数に機械的に変換する。
user_invocable: true
context: conversation
agent: general-purpose
allowed-tools: Bash, Read, Glob, Grep, Write, Edit
---

# /kiwa-astro — Astro Server Endpoints test 生成 (Layer 2)

`/kiwa-design --layer astro-endpoint` が出力した 9 column 表を、 `@kiwa-test/astro` v1.0+ の `invokeEndpoint` を使った Vitest test に機械変換する。

対象は **Astro Server Endpoints (`pages/api/*.ts` の `export GET` / `POST` / 等の function export)**。 Astro Islands / `.astro` page rendering は本 skill のスコープ外 (前者は client framework adapter で対応、 後者は Astro Container API で別途対応)。

## 9 column 拡張表 (`/kiwa-design --layer astro-endpoint`)

| 項目 | 内容 |
|---|---|
| ID | `T-AS-001` 等の連番 |
| Observation | 観点 (正常 / GET / POST FormData / POST JSON / params / cookies / redirect / locals 等) |
| Given | URL + params + headers + cookies + body + locals + site seed |
| Method | `GET` / `POST` / `PUT` / `DELETE` / `PATCH` / `ALL` |
| Then | 期待 (`response.status===200` / `await response.json()===...` / `redirect.url==='/login'` / `redirect.status===301`) |
| Priority | `P0` / `P1` / `P2` / `P3` |
| Automation | `yes` / `no` / `manual` |
| Endpoint | 対象 endpoint の route (`pages/api/users/[id].ts` 等) |
| Mode | `endpoint` 固定 |

## test 生成 template

```ts
import { invokeEndpoint, type APIRoute } from '@kiwa-test/astro';
import { GET, POST } from '../pages/api/items.ts';

it('{ID} {Observation}', async () => {
  const { response, redirect } = await invokeEndpoint({
    endpoint: GET, // または POST 等
    url: 'http://localhost:4321{Given.url}',
    method: '{Method}',
    params: {Given.params},
    headers: {Given.headers},
    cookies: {Given.cookies},
    formData: {Given.formData},  // または jsonBody: {...}
    locals: {Given.locals},
  });
  {Then を expect(response.status).toBe(...) や expect(redirect?.url).toBe(...) に展開}
});
```

## 関連

- 上流 ... `/kiwa-design --layer astro-endpoint`
- runtime fixture ... `@kiwa-test/astro` v1.0+ (`packages/astro/`)
- 下流 ... `/kiwa-review --layer astro-endpoint`
- Astro Islands (client side) ... `/kiwa-ui` の対象 framework mode (React / Vue / Svelte / 等)
- `.astro` page rendering ... Astro Container API + Vitest 直接 (本 skill では未対応、 需要次第で別 Issue)
