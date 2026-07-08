# nuxt-server-routes-full — kiwa Nuxt 3 PoC (v1.0.4+ 全 3 helper)

`@kiwa/nuxt` v1.0.4 の **3 helper 全部** (`invokeEventHandler` / `invokeRouteMiddleware` / `invokeNitroPlugin`) を **実 Nuxt 3 project** に統合した参考実装。

OSS contributor / kiwa を初めて触る user 向けに、 `defineEventHandler` / `defineNuxtRouteMiddleware` / `defineNitroPlugin` の 3 layer をどう書けば kiwa 経由で test できるかを **コピペで動く形** で示す。

## 構造

```
nuxt-server-routes-full/
├── nuxt.config.ts                 # Nuxt 3 config (ssr + routeRules + runtimeConfig)
├── pages/index.vue                # トップ page (PoC 説明 + /api/items link)
├── server/
│   ├── api/
│   │   ├── items.get.ts           # 実 Nuxt server route (thin wrapper)
│   │   └── _kiwa/items-handler.ts # kiwa-testable pure handler
│   └── plugins/
│       ├── analytics.ts           # 実 Nitro plugin (production logger wired)
│       └── _kiwa/analytics-plugin.ts # kiwa-testable factory (logger 注入対応)
├── middleware/
│   ├── auth.global.ts             # 実 Nuxt global middleware (thin wrapper)
│   └── _kiwa/auth-middleware.ts   # kiwa-testable pure middleware
├── tests/
│   ├── items-handler.test.ts      # invokeEventHandler 8 test
│   ├── auth-middleware.test.ts    # invokeRouteMiddleware 6 test
│   ├── analytics-plugin.test.ts   # invokeNitroPlugin 6 test
│   └── e2e/server-api.spec.ts     # Playwright e2e (real `nuxt dev` 経由)
├── playwright.config.ts           # Playwright config (webServer auto-launch nuxt dev :3030)
├── package.json
├── tsconfig.json
└── tsconfig.vitest.json
```

## 設計原則 — Pattern A (Dependency Injection)

実 Nuxt 側 (`server/api/items.get.ts` / `middleware/auth.global.ts` / `server/plugins/analytics.ts`) は **thin wrapper のみ** にして、 H3 / Nuxt runtime に依存する binding 処理を集約する。 ロジック本体は `_kiwa/*.ts` に切り出し、 引数で外部依存 (logger / session / fetch 等) を受ける形式に統一する。

これにより ...

| layer | 実 Nuxt 経路 | kiwa test 経路 |
|---|---|---|
| Server Routes | `defineEventHandler(...)` で h3 event を adapter に変換 | `invokeEventHandler` で simulated H3 event を直接 inject |
| Route middleware | `defineNuxtRouteMiddleware(...)` で `navigateTo` / `abortNavigation` を throw 化 | `invokeRouteMiddleware` で navigateTo / abortNavigation helper を inject、 throw を branded signal で捕捉 |
| Nitro plugin | `defineNitroPlugin(...)` で production logger を引数 bind | `invokeNitroPlugin` で `vi.fn()` logger を inject、 hook 登録 + callHook で payload mutation を全捕捉 |

## 実行方法

### Step 1 — install + build

```bash
pnpm install               # repo root から実行
pnpm -F examples-nuxt-server-routes-full build  # 依存 @kiwa/nuxt + @kiwa/core を先に build
```

### Step 2 — kiwa unit test (Nuxt 起動不要、 高速)

```bash
pnpm -F examples-nuxt-server-routes-full test
# → 20 test (8 + 6 + 6) 全 pass、 数秒で完了
```

3 helper を使った 20 test が pass し、 each layer の動作仕様を満たすことを Nuxt / Nitro runtime なしで確認できる。

### Step 3 — Playwright e2e (real Nuxt dev server)

```bash
pnpm -F examples-nuxt-server-routes-full exec playwright install  # 初回のみ
pnpm -F examples-nuxt-server-routes-full test:e2e
# → Playwright が自動で `nuxt dev --port 3030` を起動 + 4 e2e spec を実行
```

実 Nitro server + 実 H3 + 実 Vue page renderer の統合動作を end-to-end で確認する。 各 e2e spec は kiwa unit test と **同じ振る舞いを実 server で検証** する形になっており、 unit test と e2e が同じ実装を別 angle で test する 2 軸構成。

### Step 4 — `/kiwa-design → /kiwa-nuxt → /kiwa-review` chain (skill 経由)

```bash
/kiwa-design --layer nuxt-server-route --module items
# → tests/spec/integration/test-spec-items.nuxt.md (9 column 表) 生成

/kiwa-nuxt
# → 上記 spec から invokeEventHandler を使った Vitest test を自動生成

/kiwa-review --mode test-review --layer nuxt-server-route --module items
# → 生成 test の 11 観点網羅判定 + 不足観点提案
```

同様に `--layer nuxt-route-middleware` / `--layer nuxt-nitro-plugin` でも skill chain 動作確認可能。

## kiwa v1.0.4 の 3 helper を覚える順序 (初心者向け)

1. **`invokeEventHandler`** (Server Routes) — 最も理解しやすい、 query / body / cookies seed + redirect / headers / status code capture
2. **`invokeRouteMiddleware`** (route middleware) — navigateTo / abortNavigation の branded signal capture、 全 Nuxt page で発火する global guard
3. **`invokeNitroPlugin`** (Nitro plugin lifecycle) — hook 登録 + payload mutation + handler error isolation、 server-wide 横断機能の test

各 helper の API 詳細は [`@kiwa/nuxt` の README](../../packages/nuxt/README.md) を参照。

## 関連

- 上位 Issue ... [#525](https://github.com/cardene777/kiwa/issues/525) (v1.2 examples/* full server PoC)
- 親 PR ... 本 PR (`feature/525-1-nuxt-full-poc`、 5 framework sub-task の 1 つ目)
- helper 実装 PR ... [#537](https://github.com/cardene777/kiwa/pull/537) (5 framework sub-feature helper 実装)
- 関連 skill ... `/kiwa-design --layer nuxt-server-route` / `/kiwa-nuxt` / `/kiwa-review`
