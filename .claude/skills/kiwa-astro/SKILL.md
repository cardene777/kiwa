---
name: kiwa-astro
description: |
  Layer 1 spec (`tests/spec/integration/test-spec-{module}.{astro|astro-ssr|astro-vt}.md`) を Astro の 3 mode (Server Endpoints `pages/api/*.ts` の `GET` / `POST` 等 function exports + `.astro` page SSR + View Transitions API lifecycle event) test (Vitest + @kiwa/astro) に変換する Layer 2 skill。
  endpoint mode は `APIRoute((context: APIContext) => Response)` を `invokeEndpoint(...)` 経由で direct invoke し Response (200 / 3xx redirect) を normalize、 ssr mode は `.astro` page を `renderAstroPage(...)` で render し HTML string / Response 両 return + Astro.redirect / kiwaAstroNotFound / Astro.rewrite signal 捕捉 + cookies mutate + locals 伝搬を Astro Container API 不要で実現、 view-transitions mode は `setupAstroViewTransitionEnv(...)` で 4 lifecycle event (`astro:before-preparation` / `astro:after-preparation` / `astro:before-swap` / `astro:after-swap`) を 1 env で順次 dispatch + preventDefault による nav cancel + loader override + cross-document fallback + diffDom() で from / to の top-level tag 差分抽出を real browser なしで実現する。
  `/kiwa-design --layer astro-endpoint` / `--layer astro-ssr` / `--layer astro-view-transitions` が出力する 9 column 表を `@kiwa/astro` v1.1+ の `invokeEndpoint` / `renderAstroPage` / `setupAstroViewTransitionEnv` の引数に機械的に変換する。
user_invocable: true
context: conversation
agent: general-purpose
allowed-tools: Bash, Read, Glob, Grep, Write, Edit
---

# /kiwa-astro — Astro Server Endpoints test 生成 (Layer 2)

`/kiwa-design --layer astro-endpoint` が出力した 9 column 表を、 `@kiwa/astro` v1.0+ の `invokeEndpoint` を使った Vitest test に機械変換する。

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
import { invokeEndpoint, type APIRoute } from '@kiwa/astro';
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

## SSR mode (Issue #523、 v1.0.2+)

`.astro` page (Astro layout + frontmatter script + slot HTML) を `renderAstroPage({ page, url, params?, props?, locals?, cookies?, site? })` で render し、 HTML string / Response 両 return + `Astro.redirect()` / `kiwaAstroNotFound()` / `Astro.rewrite()` の throw を branded signal として捕捉する。 Astro Container API 不要、 `astro` runtime dependency なし、 page を `async (context: SimulatedAstroContext) => string | Response` 形式の plain function として扱う軽量 helper (full hydration / Islands は対象外、 page の return value semantics + SSR side-effect のみ検証する)。

### 9 column 拡張表 (`/kiwa-design --layer astro-ssr`)

| 項目 | 内容 |
|---|---|
| ID | `T-AP-001` 等の連番 |
| Observation | 観点 (HTML string return / Response return / params + props 伝搬 / cookies mutate / redirect / notFound / rewrite / locals / async page / non-signal error 等) |
| Given | URL + headers + cookies + params + props + locals + site seed (`url=https://x/posts/kiwa`、 `params={slug:'kiwa'}`) |
| Method | `GET` (default) / `POST` 等、 `.astro` page は普通 GET |
| Then | 期待 (`html.includes('<h1>...</h1>')` / `response.status===200` / `redirect.url==='/login'` / `notFound[ASTRO_NOT_FOUND_SYMBOL]===true` / `rewrite.target==='/internal'`) |
| Priority | `P0` / `P1` / `P2` / `P3` |
| Automation | `yes` / `no` / `manual` |
| Page | 対象 `.astro` page の identifier (`src/pages/posts/[slug].astro` 等) |
| Signal | 期待 throw signal (`none` / `redirect` / `notFound` / `rewrite`) |

### signal helper

`.astro` page 内部の `Astro.redirect()` / `Astro.rewrite()` は test 環境で real Astro runtime 不在のため、 page を refactor して `(context) => { context.redirect('/login'); ... }` / `(context) => { context.rewrite('/internal'); ... }` の context-injected 形式で書く (Pattern A 同等)。 `Astro.notFound()` の代わりに kiwa の `kiwaAstroNotFound(response?)` を `throw` する。

### test 生成 template

```ts
import { renderAstroPage, kiwaAstroNotFound, ASTRO_REDIRECT_SYMBOL, ASTRO_NOT_FOUND_SYMBOL } from '@kiwa/astro';
import PostPage from '../pages/posts/[slug].astro.js';

it('{ID} {Observation}', async () => {
  const { html, response, redirect, notFound, rewrite, error } = await renderAstroPage({
    page: PostPage,
    url: '{Given.url}',
    params: {Given.params},
    props: {Given.props},
    locals: {Given.locals},
    cookies: {Given.cookies},
  });
  {Then を expect(html).toContain(...) や expect(redirect?.url).toBe(...) に展開}
  {Signal が "notFound" なら expect(notFound?.[ASTRO_NOT_FOUND_SYMBOL]).toBe(true) 等}
});
```

### 11 観点 → renderAstroPage mapping

| 観点 | 使い方 |
|---|---|
| 正常系 | `props` + `params` seed → `html` に期待文字列 |
| 異常系 | non-signal throw → `error` に Error instance |
| 境界値 | 空 params / null props / undefined locals → page の default 動作 |
| 状態遷移 | cookies seed → `context.cookies.get(name)` で read、 mutate 後の state は page return 値で検証 |
| 権限 | `locals.user` 未 set → `context.redirect('/login')` → `redirect` 捕捉 |
| 入力バリデーション | 不正 params → page が `throw kiwaAstroNotFound()` → `notFound` 捕捉 |
| 冪等性 | 同 page 2 回 render → html 一致 |
| 性能 | `performance.now()` で wrap (async page の data fetch 含む) |
| セキュリティ | XSS payload を props で渡す → html escaping 確認 |
| 回帰 | 既知 SSR bug (例 hydration mismatch) の input → expected html |

出力 path 規約 ... `tests/spec/integration/test-spec-{module}.astro-ssr.md`。

## View Transitions mode (Issue #560、 v1.1+)

Astro v5 の `<ViewTransitions />` component が dispatch する 4 lifecycle event (`astro:before-preparation` / `astro:after-preparation` / `astro:before-swap` / `astro:after-swap`) を、 real browser なしで unit test する。 page 内の `<script>document.addEventListener('astro:before-preparation', ...)</script>` 等の listener (framework hook / analytics / focus manager) の挙動を `setupAstroViewTransitionEnv({ fromPath, toPath, transitionName, supportsViewTransitions, ... })` で fake 化、 4 event を `dispatchAll()` で順次 dispatch して capture する。

公式 router 動作 (Astro v5 / `node_modules/astro/dist/transitions/{router.js,events.js}`) との整合を厳密に保つ ... preparation event は `supportsViewTransitions` に **関係なく** 必ず dispatch (router の `transitionEnabledOnThisPage()` true 時の挙動)、 `supportsViewTransitions=false` は `before-swap.viewTransition` を `undefined` にする (= 視覚 transition なし、 fallback animate 経路) のみ。 `after-preparation` / `after-swap` event は plain (`type` のみ、 `from` / `to` / `newDocument` は持たない、 公式 `triggerEvent()` 経路相当)。 `before-swap` の `swap()` は post-listener で **必ず** 1 回呼ばれる、 listener も `event.swap()` を呼べば計 2 回 (`swapCallCount` で観測可能、 listener が swap を no-op 化したい場合は `event.swap = () => {}`)。

### 9 column 拡張表 (`/kiwa-design --layer astro-view-transitions`)

| 項目 | 内容 |
|---|---|
| ID | `T-AVT-001` 等の連番 |
| Observation | 観点 (4 event order / preventDefault cancel / cross-document fallback / loader override / transition:name 継承 / formData submit / sourceElement 伝搬 / direction (back/forward) / dom diff 等) |
| Given | `fromPath` + `toPath` + `transitionName` + `navigationType` + `direction` + `supportsViewTransitions` + `fromHtml` + `toHtml` + `formData` + `sourceElement` + `info` |
| Method | (n/a — listener が dispatch 順を observe) |
| Then | 期待 (`order === ['before-preparation', ...]` / `result.cancelled === true` / `result.fellBackToCrossDocument === true` / `diff.added === ['ARTICLE']`) |
| Priority | `P0` / `P1` / `P2` / `P3` |
| Automation | `yes` / `no` / `manual` |
| Pages | from / to の page identifier (`/blog/`、 `/blog/[slug]`) |
| Trigger | event trigger (`link-click` / `form-submit` / `popstate` / `programmatic`) |

### test 生成 template

```ts
import { setupAstroViewTransitionEnv } from '@kiwa/astro';

it('{ID} {Observation}', async () => {
  const env = setupAstroViewTransitionEnv({
    fromPath: '{Given.fromPath}',
    toPath: '{Given.toPath}',
    transitionName: '{Given.transitionName}',
    supportsViewTransitions: {Given.supportsViewTransitions},
    fromHtml: '{Given.fromHtml}',
    toHtml: '{Given.toHtml}',
  });
  const order: string[] = [];
  env.on('astro:before-preparation', (e) => { order.push(e.type); });
  env.on('astro:after-preparation', (e) => { order.push(e.type); });
  env.on('astro:before-swap', (e) => { order.push(e.type); });
  env.on('astro:after-swap', (e) => { order.push(e.type); });
  const result = await env.dispatchAll();
  {Then を expect(order).toEqual(...) / expect(result.cancelled).toBe(...) / expect(env.diffDom().added).toEqual(...) に展開}
});
```

### 11 観点 → setupAstroViewTransitionEnv mapping

| 観点 | 使い方 |
|---|---|
| 正常系 | listener 4 個登録 → `dispatchAll()` → `order` が 4 event の昇順 |
| 異常系 | listener が throw → `dispatchAll()` も throw (silent fail しない) |
| 境界値 | listener なし → `dispatchAll()` 完走 / `transitionName` 省略 → 空文字 |
| 状態遷移 | `before-preparation.preventDefault()` → `result.cancelled === true` + 後続 event は dispatch されない / `supportsViewTransitions=false` でも 4 event 全 dispatch + `viewTransition` のみ `undefined` |
| 権限 | 認可失敗を `before-preparation` listener で `preventDefault()` → nav cancel + UI 警告 |
| 入力 | `formData` seed → `before-preparation.formData` で取得 / `sourceElement` / `info` を listener が受取 |
| 冪等性 | `dispatchAll()` 2 回呼出 → listener も 2 回 / `off()` で登録解除 |
| 並行 | 同 type 複数 listener → 登録順に直列実行 / `loader = async ()=>{...}` override → before-preparation が await |
| 性能 | `dispatch(type)` 個別呼出時の event 構築コスト 1 回のみ (assertion で確認) |
| セキュリティ | env に `locals` / `cookies` / `platform` を expose しない (Object.keys(env) で検証) / `after-preparation` / `after-swap` event は plain (`type` のみ、 公式 router 整合) |
| 回帰 | `diffDom()` の added/removed/kept array で transition:name 継承の正確性を assertion / void element (`<img>` / `<br>`) / 自己終端形 / comment / DOCTYPE を含む HTML でも top-level tag 抽出 / `swapCallCount` で double-swap bug 検出 |

出力 path 規約 ... `tests/spec/integration/test-spec-{module}.astro-vt.md`。

## 関連

- 上流 ... `/kiwa-design --layer {astro-endpoint|astro-ssr|astro-view-transitions}`
- runtime fixture ... `@kiwa/astro` v1.1+ (`packages/astro/`)
- 下流 ... `/kiwa-review --layer {astro-endpoint|astro-ssr|astro-view-transitions}`
- Astro Islands (client side hydration) ... `/kiwa-ui` の対象 framework mode (React / Vue / Svelte / 等)
- HTML-perfect snapshot ... Astro Container API (`experimental_AstroContainer`) 併用も可、 本 helper は redirect / notFound / locals 等の **動作** 検証に focus
- View Transitions の real browser 検証 ... Playwright e2e で別途 `<ViewTransitions />` component の visual transition + 4 event dispatch を end-to-end 確認
