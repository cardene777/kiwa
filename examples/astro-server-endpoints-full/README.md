# astro-server-endpoints-full — kiwa Astro v5 SSR PoC (APIRoute + middleware locals)

`@kiwa-lab/astro` v1.0.x の `invokeEndpoint` helper を **実 Astro v5 SSR project** に統合した参考実装。

OSS contributor / kiwa を初めて触る user 向けに、 Astro の `pages/api/*.ts` (API Route) と middleware で注入される `Astro.locals` をどう書けば kiwa 経由で test できるかを **コピペで動く形** で示す。

## 構造

```
astro-server-endpoints-full/
├── astro.config.mjs              # Astro config (output: 'server' + @astrojs/node)
├── src/
│   ├── env.d.ts                  # Astro 生成型 + App.Locals 拡張
│   ├── middleware.ts             # x-request-id を locals.requestId に流す middleware
│   ├── utils/_kiwa/auth.ts       # 共通 session resolver (cookies → SessionUser)
│   └── pages/
│       ├── index.astro           # トップ page (link 集)
│       ├── login.astro           # test fixture 用 login page
│       └── api/
│           ├── items.ts          # 実 API Route (thin wrapper: GET/POST)
│           ├── counter.ts        # 実 API Route (thin wrapper: GET/POST)
│           └── _kiwa/
│               ├── items-endpoint.ts    # kiwa-testable pure GET + POST handler
│               └── counter-endpoint.ts  # kiwa-testable counter + locals echo
├── src/pages/blog/
│   ├── index.astro              # View Transitions PoC 起点 (transition:name="site-header")
│   └── [slug].astro             # 遷移先 page (article 部分のみ swap)
├── tests/
│   ├── items-get.test.ts         # invokeEndpoint 8 test (GET)
│   ├── items-post.test.ts        # invokeEndpoint 7 test (POST)
│   ├── counter.test.ts           # invokeEndpoint 5 test (multi-method + locals)
│   ├── auth.test.ts              # session resolver 4 test
│   ├── view-transitions.test.ts  # setupAstroViewTransitionEnv 5 test (v1.1+)
│   ├── e2e/astro-server.spec.ts  # Playwright e2e 7 test (real `astro dev` 経由)
│   └── e2e/astro-view-transitions.spec.ts  # Playwright e2e 3 test (View Transitions、 v1.1+)
├── playwright.config.ts          # Playwright config (webServer auto-launch :3060)
├── package.json
├── tsconfig.json
└── tsconfig.vitest.json
```

## 設計原則 — Pattern A (Dependency Injection)

実 Astro 側 (`src/pages/api/items.ts` / `counter.ts`) は **thin wrapper のみ** にして、 Astro runtime に依存する binding 処理を集約する。 ロジック本体は `_kiwa/*.ts` に切り出し、 kiwa の `SimulatedAPIContext` 経由で external 依存 (request / cookies / url / locals) を受ける形式に統一する。

これにより ...

| layer | 実 Astro 経路 | kiwa test 経路 |
|---|---|---|
| API Route GET/POST | `export const GET = (context) => itemsGetEndpoint(context)` で thin wrap | `invokeEndpoint` で synthetic context を inject + `response` / `redirect` を全捕捉 |
| middleware による locals 注入 | `src/middleware.ts` で `context.locals.requestId` を set、 endpoint が読む | `invokeEndpoint` の `locals` option で同 shape を inject、 unit test で middleware 動作を fake 化 |
| Astro `.astro` page | `src/pages/login.astro` で SSR レンダ | (out of scope — Astro Container API 直叩きで別途検証可能) |

## 実行方法

### Step 1 — install + build

```bash
pnpm install               # repo root から実行
pnpm -F examples-astro-server-endpoints-full build  # 依存 @kiwa-lab/astro + @kiwa-lab/core + Astro build
```

### Step 2 — kiwa unit test (Astro 起動不要、 高速)

```bash
pnpm -F examples-astro-server-endpoints-full test
# → 29 test (items GET 8 + items POST 7 + counter 5 + auth 4 + view-transitions 5) 全 pass、 1 秒未満で完了
```

`invokeEndpoint` を使った 24 test が pass し、 each API Route の動作仕様を Astro / @astrojs/node runtime なしで確認できる。

### Step 3 — Playwright e2e (real `astro dev`)

```bash
pnpm -F examples-astro-server-endpoints-full exec playwright install chromium  # 初回のみ
pnpm -F examples-astro-server-endpoints-full test:e2e
# → Playwright が自動で `astro dev --port 3060` を起動 + 7 e2e spec を実行
```

実 Astro SSR runtime + @astrojs/node + 実 middleware の統合動作を end-to-end で確認する。 各 e2e spec は kiwa unit test と **同じ振る舞いを実 server で検証** する形になっており、 unit test と e2e が同じ実装を別 angle で test する 2 軸構成。

### Step 4 — `/kiwa-design → /kiwa-astro → /kiwa-review` chain (skill 経由)

```bash
/kiwa-design --layer astro-endpoint --module items
# → tests/spec/integration/test-spec-items.astro.md (9 column 表) 生成

/kiwa-astro
# → 上記 spec から invokeEndpoint を使った Vitest test を自動生成

/kiwa-review --mode test-review --layer astro-endpoint --module items
# → 生成 test の 11 観点網羅判定 + 不足観点提案
```

## kiwa Astro helper の覚え方 (初心者向け)

`invokeEndpoint` は 1 helper で GET / POST / PUT / DELETE / ALL すべてを cover する。 method ごとに別 helper はない。

1. **GET pattern** — `url` / `cookies` / `headers` を seed して `response.status` / `response.headers.get(...)` を assert
2. **POST pattern** — `method: 'POST'` + `formData` または `jsonBody` を seed して response JSON を assert
3. **locals injection pattern** — `locals: { ... }` で middleware 注入値を fake 化、 endpoint が読む値を unit test で精緻に制御
4. **redirect pattern** — `context.redirect()` を返した時、 結果の `redirect` field が `{ url, status }` で捕捉される (response status code でも判定可)

helper の API 詳細は [`@kiwa-lab/astro` の README](../../packages/astro/README.md) を参照。

## 関連

- 上位 Issue ... [#525](https://github.com/cardene777/kiwa/issues/525) (v1.2 examples/* full server PoC)
- 親 PR ... 本 PR (`feature/525-4-astro-full-poc`、 5 framework sub-task の 4 つ目)
- 関連 PR ... [#543](https://github.com/cardene777/kiwa/pull/543) (Nuxt full PoC) / [#544](https://github.com/cardene777/kiwa/pull/544) (SvelteKit full PoC) / [#545](https://github.com/cardene777/kiwa/pull/545) (Remix full PoC)
- 関連 skill ... `/kiwa-design --layer astro-endpoint` / `/kiwa-astro` / `/kiwa-review`
