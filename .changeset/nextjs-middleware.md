---
"@kiwa-test/nextjs": patch
---

🎉 Next.js `middleware.ts` test adapter (Issue #495) — `invokeMiddleware({ middleware, url, method, headers, cookies, geo })` で simulated request 経由で middleware を direct invoke、 outgoing response headers / cookies / action (`next` / `redirect` / `rewrite` / `json`) を捕捉する。

## API

- `invokeMiddleware(opts): Promise<InvokeMiddlewareResult>` — middleware を invoke して env を返す。
- `middlewareActions.{next, redirect, rewrite, json}(...)` — production code が `NextResponse` の代わりに return する seam helper。
- `MIDDLEWARE_ACTION_SYMBOL` — action object の brand symbol。
- types: `MiddlewareFunction` / `MiddlewareRequest` / `MiddlewareEnv` / `MiddlewareAction` / `MiddlewareActionKind` / `InvokeMiddlewareOptions` / `InvokeMiddlewareResult`。

## Coverage

12 unit tests (auth gate redirect / pass-through / api skip / locale rewrite / response header capture / cookie capture / json short-circuit / geo block / error / nextUrl parsing / header normalization / method override) で `lines / branches / functions / statements` 全 100%。

## Companion

- `/kiwa-nextjs` skill SKILL.md に middleware mode + 9 column 拡張表 + test 生成 template を追加 (description / `/kiwa-design --layer nextjs-middleware` / `/kiwa-review --layer nextjs-middleware` も同期更新)。
- `kiwa-design` / `kiwa-review` の `--layer` 選択肢に `nextjs-middleware` 追加、 出力 path 表 / Glob 表に entry 追加。
- `examples/nextjs-middleware-poc/` 新規 (6 case PoC、 authGate + localeRewrite + headerInject)。
- README Limitations 表で middleware ❌ → ✅ production-ready (v1.0.2+) に更新。
