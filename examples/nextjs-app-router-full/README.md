# nextjs-app-router-full — kiwa Next.js v15 App Router PoC (5 kiwa layer + Route Handler)

`@kiwa-lab/nextjs` v2.0.0 の **5 helper** (`invokeServerAction` / `invokeMiddleware` / `renderServerComponent` / `invokeParallelRoutes` / `setupNextRscEnv`) + **Route Handler** を 1 つの Next.js v15 App Router example で試せる参考実装。Server Actions / middleware / RSC / Route Handler は実 App Router project に統合し、Parallel Routes / RSC streaming は `_kiwa` の pure seam と Vitest test で扱う。

OSS contributor / kiwa を初めて触る user 向けに、 Server Actions + middleware + RSC + Parallel Routes + RSC streaming + REST Route Handler をどう書けば kiwa 経由で test できるかを **コピペで動く形** で示す。

## 構造

```
nextjs-app-router-full/
├── next.config.mjs               # Next.js config (reactStrictMode)
├── middleware.ts                 # 実 Next.js middleware (thin wrapper)
├── lib/_kiwa/
│   ├── auth.ts                   # 共通 session resolver (CookieJar 対応)
│   └── auth-middleware.ts        # kiwa-testable pure middleware
├── app/
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # トップ page
│   ├── login/page.tsx            # test fixture 用 login (Server Action 経由 session set)
│   ├── items/
│   │   ├── page.tsx              # RSC thin wrapper (cookies → sessionGetter)
│   │   ├── create-form.tsx       # Client Component (useActionState)
│   │   ├── actions.ts            # Server Action thin wrapper
│   │   └── _kiwa/
│   │       ├── items-rsc.ts      # kiwa-testable async RSC
│   │       ├── items-action.ts   # kiwa-testable Server Action (Pattern A 風 DI)
│   │       ├── items-parallel.ts # parallel / intercepting route の pure layout + slot
│   │       └── items-streaming.ts # RSC streaming の async generator
│   └── api/items/
│       ├── route.ts              # Route Handler thin wrapper
│       └── _kiwa/route-handler.ts # kiwa-testable Route Handler (pure Request → Response)
├── tests/
│   ├── integration/
│   │   ├── items.nextjs.test.ts  # invokeServerAction 6 test
│   │   ├── auth.middleware.test.ts # invokeMiddleware 5 test
│   │   ├── items.rsc.test.ts     # renderServerComponent 5 test
│   │   ├── items.parallel.test.ts # invokeParallelRoutes 9 test
│   │   └── items.rsc-streaming.test.ts # setupNextRscEnv 5 test
│   ├── spec/integration/         # 上記 5 layer の Layer 1 spec
│   ├── route-handler.test.ts     # Route Handler direct invoke 5 test
│   └── e2e/nextjs-server.spec.ts # Playwright e2e 7 test (real `next dev` 経由)
├── playwright.config.ts          # Playwright config (webServer auto-launch :3070)
├── package.json
├── tsconfig.json
└── tsconfig.vitest.json
```

## 設計原則 — Pattern A (Dependency Injection)

実 Next.js 側 (`app/items/actions.ts` / `middleware.ts` / `app/api/items/route.ts` / `app/items/page.tsx`) は **thin wrapper のみ** にして、 Next.js runtime に依存する binding 処理を集約する。 ロジック本体は `_kiwa/*.ts` に切り出し、 kiwa の helper 経由で external 依存 (cookies / redirect / revalidatePath / NextRequest / Request / sessionGetter) を受ける形式に統一する。

これにより ...

| layer | 実 Next.js 経路 | kiwa test 経路 |
|---|---|---|
| Server Actions | `'use server'` で `next/headers.cookies()` + `next/navigation.redirect()` + `next/cache.revalidatePath()` を bind して env を構築、 pure action に流す | `invokeServerAction` で formData + cookieJar + redirect(REDIRECT_SYMBOL throw) + revalidatePath spy を inject、 redirect / error / result を全捕捉 |
| middleware | `middleware.ts` で `NextRequest` → kiwa `MiddlewareRequest` 変換、 返り値の `MiddlewareAction` → `NextResponse` 再変換 | `invokeMiddleware` で synthetic request を inject、 `env.action.kind` (`next/redirect/rewrite/json`) と response headers / cookies を全捕捉 |
| RSC | `app/items/page.tsx` で `cookies()` を `sessionGetter` に inject、 純粋 RSC を await | `renderServerComponent` で async component を直接 await、 `findAll` / `textContent` で element tree を検証 |
| Parallel Routes | この example では実 route tree は未実装。`_kiwa/items-parallel.ts` で layout / children / named slot を pure model 化 | `invokeParallelRoutes` で layout / children / slot を直接渡し、 fallback・割り込み・失敗隔離を検証 |
| RSC streaming | この example では実 Suspense page は未実装。`_kiwa/items-streaming.ts` で段階描画する async data source を pure model 化 | `setupNextRscEnv` で fallback・chunk 順序・resolved・error boundary・timeout を捕捉 |
| Route Handler | `app/api/items/route.ts` で `Request → Response` の thin wrapper | `itemsGetHandler(new Request(url, { headers: { cookie } }))` で direct invoke (kiwa helper 不要、 Web API のみ) |

## 実行方法

### Step 1 — install + build

```bash
pnpm install               # repo root から実行
pnpm -F examples-nextjs-app-router-full build  # 依存 @kiwa-lab/nextjs + @kiwa-lab/core + Next.js build
```

### Step 2 — kiwa unit test (Next.js 起動不要、 高速)

```bash
pnpm -F examples-nextjs-app-router-full test
# → 35 test (action 6 + middleware 5 + RSC 5 + parallel 9 + streaming 5 + route 5) 全 pass
```

5 helper + Route Handler direct invoke を使った 35 test で、各 layer の動作仕様を Next.js / next/headers / next/navigation runtime なしで確認できる。

### Step 3 — Playwright e2e (real `next dev`)

```bash
pnpm -F examples-nextjs-app-router-full exec playwright install chromium  # 初回のみ
pnpm -F examples-nextjs-app-router-full test:e2e
# → Playwright が自動で `next dev --port 3070` を起動 + 7 e2e spec を実行
```

実 Next.js v15 runtime (async RSC + Server Action multipart + middleware NextResponse + Route Handler) の統合動作を end-to-end で確認する。Parallel Routes / RSC streaming はこの e2e の対象外。各 e2e spec は対応する kiwa unit test と **同じ振る舞いを実 server で検証** する形になっており、 unit test と e2e が同じ実装を別 angle で test する 2 軸構成。

### Step 4 — `/kiwa-design → /kiwa-nextjs → /kiwa-review` chain (skill 経由)

```bash
/kiwa-design --layer nextjs-server-action --module items
# → tests/spec/integration/test-spec-items.nextjs.md (9 column 表) 生成

/kiwa-nextjs
# → 上記 spec から invokeServerAction を使った Vitest test を自動生成

/kiwa-review --mode test-review --layer nextjs-server-action --module items
# → 生成 test の 11 観点網羅判定 + 不足観点提案
```

同様に `--layer nextjs-middleware` / `--layer nextjs-rsc` / `--layer nextjs-parallel-route` / `--layer nextjs-rsc-streaming` でも skill chain の動作を確認できる。

## kiwa Next.js helper を覚える順序 (初心者向け)

1. **`invokeServerAction`** (`'use server'` action) — 最も理解しやすい、 formData + cookieJar + redirect/revalidate spy を inject、 result / error / redirect を全捕捉
2. **`invokeMiddleware`** (`middleware.ts`) — synthetic NextRequest を inject、 `env.action.kind` (`next/redirect/rewrite/json`) で挙動を全パターン assert
3. **`renderServerComponent`** (async RSC) — `await component(props)` で element tree を取得、 `findAll` / `textContent` で構造検証 (DOM 不要、 streaming 不要)
4. **`invokeParallelRoutes`** — layout / children / named slot を直接渡し、 fallback と Intercepting Routes を検証
5. **`setupNextRscEnv`** — async source を chunk ごとに収集し、 Suspense fallback / resolved / error / timeout を検証
6. **Route Handler は kiwa helper 不要** — pure `Request → Response` 関数なので Vitest から `new Request(url, ...)` で direct invoke 可能

各 helper の API 詳細は [`@kiwa-lab/nextjs` の README](../../packages/nextjs/README.md) を参照。

## 関連

- 実装 Issue ... [#2062](https://github.com/cardene777/kiwa/issues/2062) (Next.js 系 5 layer の example / roster 完成)
- 関連 skill ... `/kiwa-design --layer <nextjs-*>` / `/kiwa-nextjs` / `/kiwa-review`
