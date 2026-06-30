# 🌱 kiwa v1.2 — 9 framework adapters · 9 ORM matrix · 3 runtimes · 5 full PoC examples

The v1.2 milestone (**11/11 GitHub Issues resolved**) just landed. The polyglot test toolchain now drives 9 server-side framework adapters and 3 ORM query adapters from a single Layer 1 spec.

If v0.5 was "stop rewriting the same test viewpoint per runner", v1.2 is "do that across the server-side framework + ORM layer too".

## 1. 20 npm packages, all on the same contract

| Surface | Package | Notes |
|---|---|---|
| Core fixture | `@kiwa-test/dapp` + `@kiwa-test/core` | Playwright + viem + anvil + EIP-6963 + ERC-4337 |
| API integration | `@kiwa-test/api` | msw / supertest |
| Component | `@kiwa-test/ui` | React / Vue / Svelte / Solid / Lit / Qwik / Angular / Chromium (8 adapters) |
| E2E + A11y + Visual | `@kiwa-test/e2e` + `@kiwa-test/a11y` + `@kiwa-test/visual` | Playwright + axe-core + pixelmatch |
| Data + CLI + Observability | `@kiwa-test/data` + `@kiwa-test/cli-test` + `@kiwa-test/observability` | queue / cron / shell IO / flaky detection |
| **Server framework (v1.2 main)** | `@kiwa-test/{nextjs,nuxt,sveltekit,remix,astro,solidstart,qwikcity}` | 7 framework helpers, all `setupXxxEnv` + `mode` + `stop()` |
| **Edge runtime (v1.2 new)** | `@kiwa-test/edge` | Cloudflare Workers / Vercel Edge, KV mock, no Miniflare |
| **ORM query (v1.2 new)** | `@kiwa-test/orm` | Drizzle / Prisma / Kysely × SQLite / Postgres / MySQL — 9 combos |

Every helper exposes the same `setupXxxEnv({ mode, ... })` → `{ env, stop }` shape. Dynamic import + optional peer deps mean you only install what you actually use.

## 2. ORM matrix — 9 combos via `@kiwa-test/orm` v0.6.0

`setupOrmEnv({ orm, dialect, mode, schema })` resolves to a unified `env.db` + `env.connectionUri` + `env.stop()`.

| ORM | SQLite | Postgres | MySQL | extra |
|---|---|---|---|---|
| Drizzle | mock + file migration | live (testcontainers) | live (testcontainers) | `drizzle-orm/migrator` folder migration |
| Prisma | tempdir + `prisma db push` | live (testcontainers) | (v1.3 candidate) | |
| Kysely | mock | live (testcontainers) | live (testcontainers) | (Migrator v1.3 candidate) |

Mock mode for speed, live mode for deterministic queries against a real DB. The same `expectQuery` helper works across all combos.

## 3. 5 framework full PoC examples (GitHub Issue #525)

`examples/{framework}-full/` ships **real dev server + kiwa helper unit tests + Playwright e2e** for 5 frameworks:

- `examples/nuxt-server-routes-full/` — Nuxt 3 + `@kiwa-test/nuxt` v1.0.4
- `examples/sveltekit-full/` — SvelteKit 2 + `@kiwa-test/sveltekit` (load + actions + hooks)
- `examples/remix-full/` — Remix v2 + `@kiwa-test/remix` (loader + action + Resource Routes)
- `examples/astro-server-endpoints-full/` — Astro v5 SSR + `@kiwa-test/astro` (`invokeEndpoint`)
- `examples/nextjs-app-router-full/` — Next.js v15 + `@kiwa-test/nextjs` (all 4 layers)

Pick the one closest to your stack and retrofit.

## 4. 3 runtimes pass (Node / Bun / Deno) + Edge runtime

| Runtime | Workflow | Status |
|---|---|---|
| Node.js 20+ | `.github/workflows/test.yml` | ✅ primary |
| Bun 1.3+ | `.github/workflows/test-bun.yml` | ✅ all 19 packages pass |
| Deno 2.x | `.github/workflows/test-deno.yml` | ✅ all 19 packages pass |
| Cloudflare Workers / Vercel Edge | `@kiwa-test/edge` (KV mock + `invokeEdgeHandler`) | ✅ no Miniflare required |

## 5. Claude Code plugin — 25 skills now

```bash
/plugin marketplace add cardene777/kiwa
/plugin install kiwa@kiwa-marketplace
/reload-plugins
```

All 25 skills land under the `kiwa:` namespace. Layer 1 `/kiwa:kiwa-design --layer {layer}` covers 9 layers; Layer 2 generators (`/kiwa:kiwa-forge` / `/kiwa-hardhat` / `/kiwa-vitest` / `/kiwa-api` / `/kiwa-play` / `/kiwa-orm` / etc.) emit code; Layer 3 `/kiwa:kiwa-review` audits the spec + test pair.

## v0.5 → v1.2 delta

| Axis | v0.5 | v1.2 | delta |
|---|---|---|---|
| npm packages | 11 | 20 | +9 |
| Claude Code skills | 15 | 25 | +10 |
| Supported runtimes | Node | Node / Bun / Deno / Edge | +3 |
| ORM matrix | (n/a) | 9 combos | new |
| Full PoC examples | 1 | 6 | +5 frameworks |

## v1.3 — scope under discussion

Three candidate axes:

- **A** — ORM matrix completion (Prisma + MySQL testcontainers / Kysely Migrator)
- **B** — New layers (auth test adapter / job queue test adapter / cache layer adapter)
- **D** — Existing framework deepening (Next.js RSC / Server Actions, SvelteKit hooks, Astro view transitions)

Drop your priorities in the [Discussions board](https://github.com/cardene777/kiwa/discussions) and I'll pick the highest-impact axis for v1.3.

## Try it

```bash
# Claude Code plugin (recommended)
/plugin marketplace add cardene777/kiwa
/plugin install kiwa@kiwa-marketplace

# Or fixture only — install just what you need
pnpm add -D @kiwa-test/dapp @kiwa-test/orm @kiwa-test/sveltekit

# Or Python pytest adapter
pip install kiwa-test-py
```

Repo ... https://github.com/cardene777/kiwa

v0.5 said "stop rewriting the same test viewpoint per runner." v1.2 extends that across **dApp + 9 frameworks + 3 ORMs + 3 runtimes**. The toolchain is now close to "the hub of your app's test design", regardless of stack.

— [@cardene777](https://github.com/cardene777)
