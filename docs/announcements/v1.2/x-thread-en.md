# x.com draft — English thread (v1.2 milestone voice)

> Posting from ... [@cardene777](https://x.com/cardene777)
> Voice ... first-person / solo dev / "v1.2 landed" maker tone
> Video ... `assets/kiwa-promo-en.mp4` (reused) attached to tweet 1
> Limit ... 280 chars per tweet
> Thread of 8 tweets, numbered [1/8]

---

## [1/8] (video attached)

kiwa v1.2 just landed (11/11 Issue resolved) — a polyglot test toolchain that solves the scattered test stack problem.

v1.2 adds 9 server-side framework adapters + 3 ORM query adapters, all driven from a single Layer 1 spec.

https://github.com/cardene777/kiwa

#OSS #testing

---

## [2/8]

What grew in v1.2:

- npm packages: 11 → 20 (+9)
- Claude Code skills: 15 → 25 (+10)
- runtimes: Node-only → Node / Bun / Deno / Edge
- ORM matrix: 0 → 9 combos (Drizzle / Prisma / Kysely × SQLite / Postgres / MySQL)

---

## [3/8]

9 server-side framework adapters now share one contract:

Next.js / Nuxt / SvelteKit / Remix / Astro / SolidStart / Qwik City / Cloudflare Workers + Vercel Edge / ORM (Drizzle + Prisma + Kysely).

All expose `setupXxxEnv()` + `mode` + `stop()`. Dynamic import + optional peer deps.

---

## [4/8]

`@kiwa/orm` v0.6.0 reaches a 9-combo acceptance matrix.

Run mock mode (no Docker) for speed, or live mode (testcontainers) for deterministic query tests against a real DB.

Same `env.db` + `env.connectionUri` + `env.stop()` shape across all 3 ORMs.

---

## [5/8]

GitHub #525 (5-framework full PoC) also shipped.

`examples/{nuxt|sveltekit|remix|astro|nextjs}-full/` — real dev server + kiwa helper unit tests + Playwright e2e, two-axis layout. Use as a retrofit reference.

---

## [6/8]

CI now runs across 3 runtimes:

- Node.js 20+
- Bun 1.3+ (`bunx --bun vitest run`)
- Deno 2.x (`deno run --allow-all npm:vitest run`)

All 19 packages pass on every runtime.

---

## [7/8]

Install the Claude Code plugin to generate every layer for non-dApp web apps too:

```
/plugin marketplace add cardene777/kiwa
/plugin install kiwa@kiwa-marketplace
```

25 skills land under the `kiwa:` namespace.

---

## [8/8]

v1.3 scope is being explored — candidates are ORM matrix completion (Prisma + MySQL / Kysely Migrator), new layers (auth / job queue / cache), or deeper framework support.

Drop feature requests on GitHub Discussions and let me know what to ship next.

https://github.com/cardene777/kiwa/discussions

#testing
