---
name: kiwa-nextjs
description: |
  Layer 1 spec (`tests/spec/integration/test-spec-{module}.nextjs.md` / `.middleware.md` / `.rsc.md` / `.parallel.md`) を Next.js App Router の 4 mode (Server Actions + middleware + RSC + Parallel Routes + Intercepting Routes) test (Vitest + @kiwa-lab/nextjs) に変換する Layer 2 skill。
  Server Actions (`'use server'`) は `invokeServerAction` で direct invoke、 middleware は `invokeMiddleware` で simulated request 経由で捕捉、 RSC は `renderServerComponent` で async server component を await + element tree を `findAll` / `textContent` で検証、 Parallel Routes は `invokeParallelRoutes` で全 slot 並列 await + per-slot error isolation + Intercepting variant 切替を捕捉、 全 mode で redirect / not-found / forbidden の throw signal も捕捉する。
  `/kiwa-design --layer nextjs-server-action` / `--layer nextjs-middleware` / `--layer nextjs-rsc` / `--layer nextjs-parallel-route` が出力する 9 column 表を `@kiwa-lab/nextjs` v1.0.4+ の API に機械的に変換する。
user_invocable: true
context: conversation
agent: general-purpose
allowed-tools: Bash, Read, Glob, Grep, Write, Edit
---

# /kiwa-nextjs — Next.js Server Actions + middleware test 生成 (Layer 2)

`/kiwa-design --layer nextjs-server-action` または `/kiwa-design --layer nextjs-middleware` が出力した 9 column 表を、 `@kiwa-lab/nextjs` v1.0+ の `invokeServerAction` / `invokeMiddleware` を使った Vitest test に機械変換する。

対象は以下 5 mode ...

- **Server Actions** (`'use server'` directive) ... `--layer nextjs-server-action`、 `tests/spec/integration/test-spec-{module}.nextjs.md`
- **middleware.ts** ... `--layer nextjs-middleware` (Issue #495)、 `tests/spec/integration/test-spec-{module}.middleware.md`
- **React Server Components (RSC)** ... `--layer nextjs-rsc` (Issue #494、 v1.0.3+)、 `tests/spec/integration/test-spec-{module}.rsc.md`
- **Parallel Routes + Intercepting Routes** ... `--layer nextjs-parallel-route` (Issue #523、 v1.0.4+)、 `tests/spec/integration/test-spec-{module}.parallel.md`
- **RSC streaming + Suspense boundary** ... `--layer nextjs-rsc-streaming` (Issue #558、 v1.1+)、 `tests/spec/integration/test-spec-{module}.rsc-streaming.md`

## 前提

- 対象 example / project に Next.js App Router が存在 (`app/` directory)
- Layer 1 spec (`tests/spec/integration/test-spec-{module}.nextjs.md`) が存在 (`/kiwa-design --layer nextjs-server-action` で生成)
- `@kiwa-lab/nextjs` v1.0+ が install 済 (`pnpm add -D @kiwa-lab/nextjs`)
- vitest + tsx + typescript の standard 開発環境

## オプション

- `--module {name}` — spec / test の module 名キー (1 起動 = 1 module)
- `--input-spec {path}` — Layer 1 spec の path (省略時は `tests/spec/integration/test-spec-{module}.nextjs.md`)
- `--output {path}` — 生成 test の path (省略時は `tests/integration/{module}.nextjs.test.ts`)

### mode 別の生成先

`--output` 省略時の生成先は layer ごとに違う。 入力 spec の suffix をそのまま写した形で、
5 mode を 1 file に上書きしないための分離。

| layer | 入力 spec の suffix | 生成 test |
|---|---|---|
| `nextjs-server-action` | `.nextjs.md` | `tests/integration/{module}.nextjs.test.ts` |
| `nextjs-middleware` | `.middleware.md` | `tests/integration/{module}.middleware.test.ts` |
| `nextjs-rsc` | `.rsc.md` | `tests/integration/{module}.rsc.test.ts` |
| `nextjs-parallel-route` | `.parallel.md` | `tests/integration/{module}.parallel.test.ts` |
| `nextjs-rsc-streaming` | `.rsc-streaming.md` | `tests/integration/{module}.rsc-streaming.test.ts` |

以前は 5 layer とも `{module}.nextjs.test.ts` に書いており、 順に起動すると最後の 1 つしか
残らなかった。 入力は suffix で分かれているのに出力が分かれていない形だった。
- `--lang {ja|en|<ISO 639-1>}` — 生成 test 内コメント言語 (省略時は `--input-spec` から自動判定)
- `--no-review` — Step 6 の `/kiwa-review --layer nextjs-server-action` 自動呼出を skip

## 実行フロー

### Step 1: Layer 1 spec の読込 + 9 column 表 parse

`tests/spec/integration/test-spec-{module}.nextjs.md` を Read し、 「テストケース一覧」 section の 9 column 表を行単位で配列に展開する。

期待する 9 column (`/kiwa-design --layer nextjs-server-action` の SSOT):

| 項目 | 内容 |
|---|---|
| ID | `T-NA-001` 等の連番 |
| Observation | 観点 (正常系 / 異常系 / 境界値 / 権限 / 冪等性 等) |
| Given | 初期 state (`cookies` / `headers` / 既存 DB row / fixture seed) |
| FormData | action に渡す FormData entries (key=value 形式) |
| Args | useFormState 等で formData 後ろに追加する extra args |
| Then | 期待 (`result.ok === true` / `env.redirect.url === '/dashboard'` / `env.cookies.get('session') === 'sid_X'` 等) |
| Priority | `P0` / `P1` / `P2` / `P3` |
| Automation | `yes` / `no` / `manual` |
| Action | 対象 Server Action の identifier (`login` / `createPost` 等) |

### Step 2: action の import + injectable seam 確認

対象 Server Action の export を Grep で探す (`app/actions.ts` / `app/{path}/actions.ts` / `lib/actions/*.ts` 等)。 redirect / cookies / revalidatePath への依存は **injectable seam (parameter / module setter)** で書き換える必要がある (production の `redirect()` import を直接 throw する形では unit test 不可)。

seam 未整備の action を検出したら test 生成を中断し、 user に「Server Action を `(formData, env?)` 形式に refactor が必要」 を返す。 詳細パターンは `references/server-action-seam.md` 参照。

### Step 3: vitest test の生成

各 9 column 行を以下 template で test ブロックに変換 ...

```ts
import { describe, expect, it } from 'vitest';
import { invokeServerAction, REDIRECT_SYMBOL } from '@kiwa-lab/nextjs';
import { {ACTION} } from '{ACTION_PATH}';

describe('{MODULE} server action', () => {
  it('{ID} {Observation}', async () => {
    const fd = new FormData();
    {FormData の各 entry を fd.set(key, value) に展開}
    const { result, error, env } = await invokeServerAction({
      action: {ACTION},
      formData: fd,
      cookies: {Given.cookies を object に展開},
      headers: {Given.headers を object に展開},
      args: {Args を配列に展開},
    });
    {Then を expect(...).toBe(...) 等に展開}
  });
});
```

### Step 4: test 実行 + 結果取得

`pnpm vitest run tests/integration/{module}.nextjs.test.ts --environment node` を起動。 fail 行を spec の対応 TC ID と紐付けて report する。

### Step 5: result-review 用 metadata の Write

`tests/reports/result/{module}.nextjs.{lang}.md` に以下を Write ...

- 実行日時 (skill 引数で渡された ISO 8601)
- spec 由来 TC 件数 / pass 件数 / fail 件数
- coverage (v8 で collect、 invokeServerAction の呼出有無で判定可能)
- 各 fail TC の Then 期待 vs 実際の env state diff

### Step 6: kiwa-review 自動呼出

`--no-review` 指定がなければ `/kiwa-review --mode test-review --layer nextjs-server-action --module {module}` を起動して 11 観点の cover 率を判定する。

## 11 観点 → invokeServerAction mapping

| 観点 | helper の使い方 |
|---|---|
| 正常系 | `formData` + `cookies` を seed → `result` が期待値 |
| 異常系 | 不正 `formData` → `error` instanceof Error + message check |
| 境界値 | FormData の値で boundary を試行 → `result` or `error` |
| 状態遷移 | `cookies` で state を表現 → action 後の `env.cookies.get(...)` で遷移を assert |
| 権限 | `headers.authorization` seed → action が `error` を throw or `result` が `unauthorized` |
| 入力バリデーション | 空 FormData → `error.message === 'required'` 等 |
| 冪等性 | 同 action を 2 回呼んで `env` 差分が 0 |
| 並行処理 | `Promise.all([invokeServerAction(...), ...])` で race 検出 |
| 性能 | `performance.now()` で wrap、 100ms 等の上限 assert |
| セキュリティ | CSRF token 不在 / 改竄 → `error` |
| 回帰 | 既知 bug 再現 FormData → `result` が正しい値 |

## 関連

- 上流 (Layer 1) ... `/kiwa-design --layer nextjs-server-action`
- runtime fixture ... `@kiwa-lab/nextjs` v1.0+ (`packages/nextjs/`)
- 下流 (review) ... `/kiwa-review --layer nextjs-server-action`
- 統合 chain ... 無し。 `/kiwa-test` に nextjs 専用 Step が無いため、 本 skill は単体起動する (#1809)
- RSC test ... 下記 § RSC mode (#494、 v1.0.3+ 対応済)
- middleware test ... 下記 § middleware mode (#495、 v1.0.2+ 対応済)
- PoC ... `examples/nextjs-server-actions-poc/`、 `examples/nextjs-middleware-poc/`、 `examples/nextjs-rsc-poc/`

---

## middleware mode (Issue #495、 v1.0.2+)

App Router の `middleware.ts` を `invokeMiddleware({ middleware, url, method, headers, cookies, geo })` で simulated request 経由で invoke + outgoing response headers / cookies / action (`next` / `redirect` / `rewrite` / `json`) を捕捉する。

### 9 column 拡張表 (`/kiwa-design --layer nextjs-middleware`)

| 項目 | 内容 |
|---|---|
| ID | `T-MW-001` 等の連番 |
| Observation | 観点 (auth gate / locale rewrite / geo block / header inject / csp 等) |
| Given | URL + initial cookies/headers/geo seed (`url=https://x/foo`、 `cookies={session:'sid'}`、 `geo={country:'JP'}`) |
| Method | HTTP method (`GET` / `POST` 等、 default GET) |
| Headers | request headers (case-insensitive、 `Authorization=Bearer ...`) |
| Then | 期待 (`env.action.kind==='redirect'` + `env.action.url==='/login'`、 `env.responseHeaders.get('x-csp')==='...'`、 `env.responseCookies.get('tid')==='...'`) |
| Priority | `P0` / `P1` / `P2` / `P3` |
| Automation | `yes` / `no` / `manual` |
| Middleware | 対象 middleware の identifier (default 1 つだけ、 多 middleware 構成は entry 別に行を分ける) |

### action helper

middleware は `NextResponse.redirect()` 等を直接 import せず、 kiwa の `middlewareActions.{next,redirect,rewrite,json}()` を return する形に refactor 済みであることが前提 (Pattern A 同等)。 これにより production code と test の両方で同 shape の return value が成立する。

### test 生成 template

```ts
import { invokeMiddleware, middlewareActions } from '@kiwa-lab/nextjs';
import { middleware } from '../middleware.js';

it('{ID} {Observation}', async () => {
  const { env, error } = await invokeMiddleware({
    middleware,
    url: '{Given.url}',
    method: '{Method}',
    headers: {Headers を object に展開},
    cookies: {Given.cookies を object に展開},
    geo: {Given.geo を object に展開},
  });
  {Then を expect(env.action.kind).toBe(...) 等に展開}
});
```

出力 path 規約 ... `tests/spec/integration/test-spec-{module}.middleware.md`。

---

## RSC mode (Issue #494、 v1.0.3+)

App Router の async React Server Components (`async function Page(props): Promise<JSX.Element>`) を `renderServerComponent({ component, props })` で direct await + return tree を捕捉する。 jsx-runtime や React import は不要、 element を `{ type, props, key }` 形式の plain object として扱う軽量 helper (full RSC flight payload format は対象外、 server component の return value semantics のみ検証する)。

### 9 column 拡張表 (`/kiwa-design --layer nextjs-rsc`)

| 項目 | 内容 |
|---|---|
| ID | `T-RSC-001` 等の連番 |
| Observation | 観点 (初期 render / async data fetch / notFound / forbidden / redirect / props 分岐 / search params 等) |
| Component | 対象 server component の identifier (`UserPage` / `ProductList` 等) |
| Props | `params` / `searchParams` / fetched data 等の props seed (`{slug:'kiwa'}` / `{q:'foo'}`) |
| Then | 期待 (`textContent(tree).toBe('Hello kiwa')` / `findAll(tree, n => n.type==='li').length===3` / `signal[NOT_FOUND_SYMBOL]===true` / `signal.url==='/login'`) |
| Priority | `P0` / `P1` / `P2` / `P3` |
| Automation | `yes` / `no` / `manual` |
| Mode | `direct` (renderServerComponent 直 await) / `withFetch` (component 内で await fetch、 vitest の `vi.stubGlobal('fetch', ...)` で mock) |
| Signal | 期待 throw signal の種類 (`none` / `notFound` / `forbidden` / `redirect`) |

### signal helper

`next/navigation` の `notFound()` / `forbidden()` / `redirect()` を直接 import せず、 kiwa の signal symbol (`NOT_FOUND_SYMBOL` / `FORBIDDEN_SYMBOL` / `RSC_REDIRECT_SYMBOL`) を持つ object を throw する形に refactor 済みであることが前提 (Pattern A 同等)。

### test 生成 template

```ts
import { renderServerComponent, findAll, textContent, NOT_FOUND_SYMBOL } from '@kiwa-lab/nextjs';
import { UserPage } from '../app/users/[slug]/page.js';

it('{ID} {Observation}', async () => {
  const { tree, signal, error } = await renderServerComponent({
    component: UserPage,
    props: {Props を展開},
  });
  {Then を expect(textContent(tree)).toBe(...) や findAll(tree, ...).length === N に展開}
  {Signal が "notFound" なら expect(signal?.[NOT_FOUND_SYMBOL]).toBe(true)、 "redirect" なら expect(signal.url).toBe('/login') 等}
});
```

出力 path 規約 ... `tests/spec/integration/test-spec-{module}.rsc.md`。

## Parallel Routes mode (Issue #523、 v1.0.4+)

App Router の Parallel Routes (`layout({ children, @modal, @sidebar })`) と Intercepting Routes (`(.)` / `(..)` / `(...)`) を `invokeParallelRoutes({ layout, children, slots })` で render する。 全 slot は `Promise.all` で並列 await (slow slot が fast slot を block しない)、 per-slot error は `slotResults[]` に capture (broken slot が layout 全体を倒さない)。 Intercepting Routes の soft-vs-hard navigation 切替は `intercepting: { variant: 'intercepted' | 'default', url, distance }` で表現、 `variant: 'default'` 時は `defaultFallback` を強制 render する (hard-nav 経路を test 内で再現)。

### 9 column 拡張表 (`/kiwa-design --layer nextjs-parallel-route`)

| 項目 | 内容 |
|---|---|
| ID | `T-PR-001` 等の連番 |
| Observation | 観点 (multi-slot render / parallel await / per-slot error isolation / default fallback / intercepting variant / zero slots edge case 等) |
| Layout | 対象 layout 関数の identifier (`DashboardLayout` / `PhotoFeedLayout` 等) |
| Slots | slot 配列 (`[{ slot: 'modal', component: PhotoModal, defaultFallback?, intercepting? }, { slot: 'sidebar', component: Sidebar }]`) |
| Children | `children` slot の component + props (`{ component: PostsPage, props: { page: 1 } }`) |
| Then | 期待 (`tree.tag==='layout'` / `slotResults[0].tree===...` / `slotResults[0].error.message==='boom'` / `slotResults[0].interception.variant==='intercepted'` / `slotResults[0].usedDefault===true`) |
| Priority | `P0` / `P1` / `P2` / `P3` |
| Automation | `yes` / `no` / `manual` |
| Variant | Intercepting 動作 (`none` / `intercepted` (soft-nav) / `default` (hard-nav)) |

### Intercepting Routes 対応

`intercepting.variant === 'intercepted'` → component を render しつつ `InterceptionMatch` を `slotResults[].interception` に capture (soft-nav 経路の test)。 `intercepting.variant === 'default'` → component を無視して `defaultFallback` を強制 render (hard-nav 経路 = full-page reload で `default.tsx` が選ばれる動作を test)。 `distance` は `'sibling'` (default) / `'parent'` / `'root'` で URL match の階層を表現。

### test 生成 template

```ts
import { invokeParallelRoutes, PARALLEL_INTERCEPTION_SYMBOL } from '@kiwa-lab/nextjs';
import DashboardLayout from '../app/dashboard/layout.js';
import PhotoModal from '../app/dashboard/@modal/photo/page.js';
import Sidebar from '../app/dashboard/@sidebar/page.js';
import PostsPage from '../app/dashboard/posts/page.js';

it('{ID} {Observation}', async () => {
  const { tree, slotResults, childrenError, layoutError } = await invokeParallelRoutes({
    layout: DashboardLayout,
    children: PostsPage,
    childrenProps: {Children.props を展開},
    slots: [
      { slot: 'modal', component: PhotoModal{Variant が intercepted/default なら intercepting field 追加} },
      { slot: 'sidebar', component: Sidebar },
    ],
  });
  {Then を expect(slotResults[0].tree).toBeDefined() や expect(slotResults[0].interception?.variant).toBe('intercepted') 等に展開}
});
```

### 11 観点 → invokeParallelRoutes mapping

| 観点 | 使い方 |
|---|---|
| 正常系 | 全 slot 正常 component → `slotResults.every(s => s.error === undefined)` |
| 異常系 | broken slot 注入 → `slotResults[idx].error` 捕捉、 他 slot は影響なし |
| 境界値 | zero slots / null component + defaultFallback / empty children |
| 状態遷移 | intercepting.variant 切替で soft-vs-hard nav の render result 差分検証 |
| 並行処理 | slow + fast slot 混在 → 完了順を sequence で記録、 fast が先 (parallel 確認) |
| 入力バリデーション | defaultFallback 無しで component=null → `error` 捕捉 |
| 性能 | slow slot wall time を `performance.now()` で計測、 sequential なら sum、 parallel なら max |
| 回帰 | Intercepting Routes 既知 bug 再現 URL → expected variant + distance |

出力 path 規約 ... `tests/spec/integration/test-spec-{module}.parallel.md`。

## RSC streaming + Suspense boundary 拡張 (`--layer nextjs-rsc-streaming`、 Issue #558)

RSC streaming chunk + Suspense boundary 遷移を `setupNextRscEnv({ component?, dataSource?, suspenseFallback?, streamingTimeout?, injectError?, props? })` で test する。 既存 `renderServerComponent` (leaf-level + signal capture) の補完で、 streaming + Suspense に焦点を絞る。

### 9 column 拡張表 (`/kiwa-design --layer nextjs-rsc-streaming`)

| 項目 | 内容 |
|---|---|
| ID | `T-RST-001` 等の連番 |
| Observation | 観点 (single-chunk / streaming order / Suspense fallback / fallback-only / component throw / mid-stream throw / injectError / streamingTimeout / dataSource precedence 等) |
| Source | dataSource async generator の identifier (`streamItems()` / `slowSource()`) または component の identifier (`Page` / `ItemsPageRSC`) |
| Fallback | `suspenseFallback` markup (`<Skeleton />` 相当の RscNode) または `none` |
| Timeout | `streamingTimeout` (ms、 default 5000)、 `0` は fail-fast |
| ErrorMode | `none` / `injectError` / `component-throw` / `stream-throw` のいずれか |
| Then | 期待 (`chunks.length===N` / `chunks[0]===fallback` / `resolved===<Item />` / `errorBoundary?.error.message==='...'` / `timedOut===true`) |
| Priority | `P0` / `P1` / `P2` / `P3` |
| Automation | `yes` / `no` / `manual` |

### test 生成 template

```ts
import { setupNextRscEnv, RSC_ERROR_BOUNDARY_SYMBOL } from '@kiwa-lab/nextjs';
import { streamItems, itemsSkeleton } from '../app/items/_kiwa/items-streaming.js';

it('{ID} {Observation}', async () => {
  const env = await setupNextRscEnv({
    dataSource: streamItems({Source の引数を展開}),
    suspenseFallback: itemsSkeleton(),
    streamingTimeout: {Timeout},
    {ErrorMode==='injectError' なら injectError: new Error('...') を追加},
  });
  {Then を expect(env.chunks).toHaveLength(N) や expect(env.resolved).toEqual(...) 等に展開}
});
```

### 11 観点 → setupNextRscEnv mapping

| 観点 | 使い方 |
|---|---|
| 正常系 | dataSource yields → `env.errorBoundary===null` + `env.resolved` 一致 |
| 異常系 | dataSource throw / component throw / injectError → `env.errorBoundary?.error` 検証 |
| 境界値 | empty stream (yield 0 times) → `env.resolved===null` / `chunks===[fallback]` |
| 状態遷移 | fallback → resolved 遷移は `chunks[0]===fallback` + `chunks[N-1]===resolved` |
| 並行処理 | streamingTimeout で wall clock 上限制約、 hung stream に test が止まらない |
| 入力バリデーション | no component + no dataSource → empty env (`chunks===[]`) |
| 性能 | streamingTimeout で SLA 上限 enforcement、 `timedOut===true` を assertion |
| 回帰 | 既知 streaming bug 再現 source → expected chunk 配列 |

出力 path 規約 ... `tests/spec/integration/test-spec-{module}.rsc-streaming.md`。
