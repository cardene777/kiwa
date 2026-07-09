# remix-full — kiwa Remix v2 PoC (loader + action + Resource Route)

`@kiwa-lab/remix` v1.0.x の **2 helper** (`invokeLoader` / `invokeAction` / `invokeResourceRoute`) を **実 Remix v2 project** に統合した参考実装。

OSS contributor / kiwa を初めて触る user 向けに、 UI route の `loader` / `action` と Resource Route (JSON-only endpoint) をどう書けば kiwa 経由で test できるかを **コピペで動く形** で示す。

## 構造

```
remix-full/
├── vite.config.ts                 # Vite + Remix plugin (port 3050)
├── app/
│   ├── root.tsx                   # Remix root layout
│   ├── entry.client.tsx           # client hydration entry
│   ├── entry.server.tsx           # SSR entry (renderToPipeableStream)
│   ├── lib/_kiwa/
│   │   ├── items-loader.ts        # kiwa-testable pure loader
│   │   ├── items-action.ts        # kiwa-testable pure action
│   │   └── items-resource.ts      # kiwa-testable Resource Route module
│   ├── utils/_kiwa/auth.ts        # 共通 session resolver (cookie → SessionUser)
│   └── routes/
│       ├── _index.tsx             # トップ page (link 集)
│       ├── items.tsx              # UI route (thin wrapper + form 表示)
│       ├── api.items.tsx          # Resource Route (loader/action を re-export)
│       └── login.tsx              # test fixture 用 login page
├── tests/
│   ├── items-loader.test.ts       # invokeLoader 8 test
│   ├── items-action.test.ts       # invokeAction 7 test
│   ├── items-resource.test.ts     # invokeResourceRoute 6 test (GET/POST dispatch + 405)
│   ├── auth.test.ts               # session resolver 5 test
│   └── e2e/remix-server.spec.ts   # Playwright e2e 7 test (real `remix vite:dev` 経由)
├── playwright.config.ts           # Playwright config (webServer auto-launch :3050)
├── package.json
├── tsconfig.json
└── tsconfig.vitest.json
```

## 設計原則 — Pattern A (Dependency Injection)

実 Remix 側 (`app/routes/items.tsx` / `app/routes/api.items.tsx`) は **thin wrapper のみ** にして、 Remix runtime に依存する binding 処理を集約する。 ロジック本体は `_kiwa/*.ts` に切り出し、 kiwa の `SimulatedRouteArgs` / `ResourceRouteModule` 経由で external 依存 (request / params / context) を受ける形式に統一する。

これにより ...

| layer | 実 Remix 経路 | kiwa test 経路 |
|---|---|---|
| UI route loader | `export const loader = (args) => itemsLoader(args)` で thin wrap、 Remix runtime が Response を HTML / JSON にレンダリング | `invokeLoader` で synthetic Request を inject + `response` / `redirect` / `error` を全捕捉 |
| UI route action | `export const action = (args) => createItemAction(args)` で thin wrap、 form submit から自動 invoke | `invokeAction` で formData / cookies を inject + `response` / `redirect` / `error` を全捕捉 |
| Resource Route | `export const loader = itemsResourceRoute.loader` / `action = itemsResourceRoute.action` で re-export | `invokeResourceRoute` で method dispatch を helper に委譲 + `dispatch` / `methodNotAllowed` / `response` を全捕捉 |

## 実行方法

### Step 1 — install + build

```bash
pnpm install               # repo root から実行
pnpm -F examples-remix-full build  # 依存 @kiwa-lab/remix + @kiwa-lab/core を先に build + Remix build
```

### Step 2 — kiwa unit test (Remix 起動不要、 高速)

```bash
pnpm -F examples-remix-full test
# → 26 test (loader 8 + action 7 + resource 6 + auth 5) 全 pass、 数百ms で完了
```

3 helper を使った 26 test が pass し、 each layer の動作仕様を Remix / Vite runtime なしで確認できる。

### Step 3 — Playwright e2e (real Remix dev server)

```bash
pnpm -F examples-remix-full exec playwright install chromium  # 初回のみ
pnpm -F examples-remix-full test:e2e
# → Playwright が自動で `remix vite:dev --port 3050` を起動 + 7 e2e spec を実行
```

実 Remix runtime (UI route の SSR + Resource Route の direct response) を end-to-end で確認する。 UI route は HTML レンダリング + form 動作の検証に絞り、 cache-control / 4xx JSON 等の HTTP response 細部は Resource Route 経由で確認する 2 軸構成 (UI route の loader response は Remix の ErrorBoundary 経路で wrap されることがあるため)。

### Step 4 — `/kiwa-design → /kiwa-remix → /kiwa-review` chain (skill 経由)

```bash
/kiwa-design --layer remix-loader --module items
# → tests/spec/integration/test-spec-items.remix.md (9 column 表) 生成

/kiwa-remix
# → 上記 spec から invokeLoader / invokeAction を使った Vitest test を自動生成

/kiwa-review --mode test-review --layer remix-loader --module items
# → 生成 test の 11 観点網羅判定 + 不足観点提案
```

同様に `--layer remix-action` でも skill chain 動作確認可能。

## kiwa Remix helper を覚える順序 (初心者向け)

1. **`invokeLoader`** (UI route の loader) — 最も理解しやすい、 url / cookies / headers seed + Response / redirect 自動 normalize
2. **`invokeAction`** (UI route の action) — formData / jsonBody seed + Response / redirect / error 全捕捉
3. **`invokeResourceRoute`** (Resource Route の dispatcher) — method dispatch を helper に委譲、 405 method-not-allowed を branded signal で捕捉

各 helper の API 詳細は [`@kiwa-lab/remix` の README](../../packages/remix/README.md) を参照。

## 関連

- 上位 Issue ... [#525](https://github.com/cardene777/kiwa/issues/525) (v1.2 examples/* full server PoC)
- 親 PR ... 本 PR (`feature/525-3-remix-full-poc`、 5 framework sub-task の 3 つ目)
- 関連 PR ... [#543](https://github.com/cardene777/kiwa/pull/543) (Nuxt full PoC、 sub-task 1/5) / [#544](https://github.com/cardene777/kiwa/pull/544) (SvelteKit full PoC、 sub-task 2/5)
- 関連 skill ... `/kiwa-design --layer remix-loader` / `/kiwa-remix` / `/kiwa-review`
