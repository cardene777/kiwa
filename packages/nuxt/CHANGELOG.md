# @kiwa-test/nuxt

## 1.0.1

### Patch Changes

- f19aae3: 🎉 New package `@kiwa-test/nuxt` v1.0 — Nuxt 3 Server Routes test adapter (Issue #496、 v1.1 milestone 5/7).

  Invoke `defineEventHandler((event) => ...)` callbacks in isolation through `invokeEventHandler({ handler, url, method, body, query, headers, cookies })` and assert on the captured `result` / `redirect` / `env.responseHeaders` / `env.responseCookies` / `env.status` without a running Nitro server.

  ## What's in the box

  - `invokeEventHandler<TResult>(opts)` — wrap a defineEventHandler callback and capture side-effects.
  - `NUXT_REDIRECT_SYMBOL` — `event.sendRedirect(url, status)` throws a branded object that the helper normalizes into `result.redirect`.
  - types: `SimulatedH3Event` / `EventHandlerFunction` / `EventHandlerEnv` / `NuxtRedirectSignal` / `InvokeEventHandlerOptions` / `InvokeEventHandlerResult`.

  ## Coverage

  14 unit tests (正常系 JSON return / query parse / array query / query override / body / redirect with status / default status 302 / setHeader / setCookie / setStatusCode / non-redirect error / header normalization / method default / path with search) with `lines / branches / functions / statements` 全 100%.

  ## Companion changes (this same PR)

  - New skill `/kiwa-nuxt` (`.claude/skills/kiwa-nuxt/`) — Layer 2 generator for Nuxt 3 Server Route tests, 9 column extension table, test 生成 template, 11 観点 mapping.
  - `/kiwa-design` adds `--layer nuxt-server-route` with a 9-column extension table.
  - `/kiwa-review --layer nuxt-server-route` review mode + Glob path.
  - `release.yml` workflow: Test (nuxt) step + Coverage (all 13 packages) + Typecheck / Build / publish filter に nuxt 追加.
  - `scripts/check-coverage-gates.mjs` PACKAGES + PKG_DIRS に nuxt 追加.
  - `tests/release-smoke/` 4 file (package.json + coverage-gate.test.ts + coverage-diff.test.ts + import-surface.test.ts) に nuxt 追加.
  - `README.md` Limitations 表で Nuxt 3 ❌ → ✅ production-ready (v1.0.0+).
  - `package.json` release script に -F @kiwa-test/nuxt build + --filter @kiwa-test/nuxt publish 追加.

  ## Out of scope (separate Issues)

  - Nuxt composables (`useFetch` / `useState` / `useNuxtApp`) — covered by `@kiwa-test/ui` Vue mode.
  - Nitro plugin lifecycle.
  - Server-side route middleware (Nuxt route middleware prepass).
