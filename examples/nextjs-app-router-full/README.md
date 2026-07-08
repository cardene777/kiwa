# nextjs-app-router-full — kiwa Next.js v15 App Router PoC (全 4 layer 統合)

`@kiwa/nextjs` v1.0.x の **3 helper 全部** (`invokeServerAction` / `invokeMiddleware` / `renderServerComponent`) + **Route Handler** を **実 Next.js v15 App Router project** に統合した参考実装。 Issue #525 v1.2 milestone の 5/5 完遂例。

OSS contributor / kiwa を初めて触る user 向けに、 Server Actions + middleware + RSC + REST Route Handler の **4 layer 全部** をどう書けば kiwa 経由で test できるかを **コピペで動く形** で示す。

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
│   │       └── items-action.ts   # kiwa-testable Server Action (Pattern A 風 DI)
│   └── api/items/
│       ├── route.ts              # Route Handler thin wrapper
│       └── _kiwa/route-handler.ts # kiwa-testable Route Handler (pure Request → Response)
├── tests/
│   ├── items-action.test.ts      # invokeServerAction 6 test
│   ├── auth-middleware.test.ts   # invokeMiddleware 5 test
│   ├── items-rsc.test.ts         # renderServerComponent 5 test
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
| Route Handler | `app/api/items/route.ts` で `Request → Response` の thin wrapper | `itemsGetHandler(new Request(url, { headers: { cookie } }))` で direct invoke (kiwa helper 不要、 Web API のみ) |

## 実行方法

### Step 1 — install + build

```bash
pnpm install               # repo root から実行
pnpm -F examples-nextjs-app-router-full build  # 依存 @kiwa/nextjs + @kiwa/core + Next.js build
```

### Step 2 — kiwa unit test (Next.js 起動不要、 高速)

```bash
pnpm -F examples-nextjs-app-router-full test
# → 21 test (action 6 + middleware 5 + RSC 5 + route 5) 全 pass、 数百ms で完了
```

3 helper + Route Handler direct invoke を使った 21 test が pass し、 each layer の動作仕様を Next.js / next/headers / next/navigation runtime なしで確認できる。

### Step 3 — Playwright e2e (real `next dev`)

```bash
pnpm -F examples-nextjs-app-router-full exec playwright install chromium  # 初回のみ
pnpm -F examples-nextjs-app-router-full test:e2e
# → Playwright が自動で `next dev --port 3070` を起動 + 7 e2e spec を実行
```

実 Next.js v15 runtime (RSC streaming + Server Action multipart + middleware NextResponse + Route Handler) の統合動作を end-to-end で確認する。 各 e2e spec は kiwa unit test と **同じ振る舞いを実 server で検証** する形になっており、 unit test と e2e が同じ実装を別 angle で test する 2 軸構成。

### Step 4 — `/kiwa-design → /kiwa-nextjs → /kiwa-review` chain (skill 経由)

```bash
/kiwa-design --layer nextjs-server-action --module items
# → tests/spec/integration/test-spec-items.nextjs.md (9 column 表) 生成

/kiwa-nextjs
# → 上記 spec から invokeServerAction を使った Vitest test を自動生成

/kiwa-review --mode test-review --layer nextjs-server-action --module items
# → 生成 test の 11 観点網羅判定 + 不足観点提案
```

同様に `--layer nextjs-middleware` / `--layer nextjs-rsc` でも skill chain 動作確認可能。

## kiwa Next.js helper を覚える順序 (初心者向け)

1. **`invokeServerAction`** (`'use server'` action) — 最も理解しやすい、 formData + cookieJar + redirect/revalidate spy を inject、 result / error / redirect を全捕捉
2. **`invokeMiddleware`** (`middleware.ts`) — synthetic NextRequest を inject、 `env.action.kind` (`next/redirect/rewrite/json`) で挙動を全パターン assert
3. **`renderServerComponent`** (async RSC) — `await component(props)` で element tree を取得、 `findAll` / `textContent` で構造検証 (DOM 不要、 streaming 不要)
4. **Route Handler は kiwa helper 不要** — pure `Request → Response` 関数なので Vitest から `new Request(url, ...)` で direct invoke 可能

各 helper の API 詳細は [`@kiwa/nextjs` の README](../../packages/nextjs/README.md) を参照。

## 関連

- 上位 Issue ... [#525](https://github.com/cardene777/kiwa/issues/525) (v1.2 examples/* full server PoC) — **5/5 完遂例** (最後の sub-task)
- 親 PR ... 本 PR (`feature/525-5-nextjs-full-poc`、 5 framework sub-task の **最終 5/5**)
- 関連 PR ... [#543](https://github.com/cardene777/kiwa/pull/543) (Nuxt) / [#544](https://github.com/cardene777/kiwa/pull/544) (SvelteKit) / [#545](https://github.com/cardene777/kiwa/pull/545) (Remix) / [#546](https://github.com/cardene777/kiwa/pull/546) (Astro)
- 関連 skill ... `/kiwa-design --layer nextjs-server-action` / `/kiwa-nextjs` / `/kiwa-review`
