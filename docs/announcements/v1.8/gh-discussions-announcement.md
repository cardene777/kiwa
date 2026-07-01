# 🌱 kiwa v1.8 — auth + job queue + cache land (3 new layers for SaaS prod testing)

The v1.8 milestone (**6/6 GitHub Issues resolved**) just landed. After deepening polyglot to 6 web frameworks across v1.5-v1.7, v1.8 pivots to fill the **3 kiwa blank spots most SaaS teams hit in prod testing**: auth, job queue, cache.

## 1. `@kiwa-test/auth` v0.1 — 3 dominant 2026 providers

```ts
import { setupNextAuthEnv, setupLuciaEnv, setupBetterAuthEnv } from "@kiwa-test/auth";

// NextAuth v5 (Auth.js)
const env = setupNextAuthEnv({
  providers: [{ id: "google", type: "oauth" }],
  session: { strategy: "jwt" },
  database: "prisma",
});

// Lucia v3
const env = setupLuciaEnv({
  providers: [{ id: "password" }, { id: "google" }],
  database: "sqlite",
  sessionExpiration: 3600,
});

// Better Auth
const env = setupBetterAuthEnv({
  database: "prisma",
  plugins: ["emailAndPassword", "magicLink", "twoFactor", "passkey", "organizations"],
});
```

- **NextAuth v5 (Auth.js)** — session mock (jwt + database strategy), 3 providers (Google/GitHub/Email Magic Link), Prisma/Drizzle DB adapter compat (1:1 with Auth.js `Adapter` contract)
- **Lucia v3** — bare-metal session (`fresh` flag + rolling refresh half-lifetime), password auth (Argon2 envelope + node:crypto scrypt for speed), OAuth (Google/GitHub), SQLite / PostgreSQL adapters
- **Better Auth** — email/password + magic link (send + consume + expiry) + 2FA TOTP (RFC 6238, deterministic `generateTotpCode`), Prisma/Drizzle/Kysely, plugin system (`emailAndPassword` / `magicLink` / `twoFactor` / `organizations` / `passkey`)
- 92 helper tests + 24 PoC tests, all passing

## 2. `@kiwa-test/queue` v0.1 — BullMQ + Inngest

```ts
import { setupBullMQEnv, setupInngestEnv } from "@kiwa-test/queue";

// BullMQ (sandbox = in-process, testcontainers = real Redis)
const env = setupBullMQEnv({ mode: "sandbox", queueName: "email" });
await env.add("send-welcome", { userId: 1 });
await env.waitForJob("send-welcome");
env.assertProcessed("send-welcome");

// Inngest (stub = in-process, dev-server = real Inngest)
const env = setupInngestEnv({
  mode: "stub",
  functions: [{ id: "onboard-user", retries: 3 }],
});
await env.sendEvent("user.created", { userId: 1 });
env.assertFunctionRan("onboard-user");
env.assertStepRan("send-welcome-email");
```

- **BullMQ** — sandbox mode (in-process, offline, deterministic) + testcontainers mode (real BullMQ + ioredis + Docker Redis)
- **5 BullMQ helpers** — `waitForJob` / `assertProcessed` / `assertFailed` / `assertRetried` / `assertQueueDrained`
- **Inngest** — stub mode (deterministic) + dev-server mode (real subprocess + HTTP round-trip)
- **6 Inngest helpers** + retry / step function (step.run + step.sleep) / concurrency cap semantics reproduced deterministically
- 44 helper tests + 16 PoC tests, all passing

## 3. `@kiwa-test/cache` v0.1 — Redis

```ts
import { setupCacheEnv } from "@kiwa-test/cache";

const env = setupCacheEnv({ mode: "in-memory" });

await env.set("session:abc", { userId: 1 }, { ttl: 3600 });
env.assertTTL("session:abc", 3600);

await env.subscribe("cache-invalidate");
await env.publish("cache-invalidate", { key: "user:1" });
env.assertPublished("cache-invalidate", { key: "user:1" });
```

- **Redis** — in-memory (default, in-process fake) + testcontainers (real Redis + ioredis / node-redis client wrap)
- **8 helpers** — get / set / delete / expire / ttl / assertTTL / publish / subscribe / assertPublished / flushAll
- **Namespace isolation** prevents multi-env test case interference
- **Pub/Sub race bug fixed** — publish-before-subscribe race resolved via `cursor` field draining historical messages
- 32 helper tests + 8 PoC tests, all passing

## 4. Layer 1 spec + skill chain (3 new layers)

`/kiwa-design` gains 3 layers:

```bash
/kiwa-design --layer auth --module user-signup
/kiwa-design --layer job-queue --module email-worker
/kiwa-design --layer cache --module session-store
```

Layer 2 skills — 3 new:

```bash
/kiwa-auth --module user-signup     # 3 auth backends
/kiwa-queue --module email-worker   # 2 queue backends
/kiwa-cache --module session-store  # Redis 2 modes
```

`/kiwa-review` covers all 3 new layers.

## 5. v1.7 → v1.8 progression

| Axis | v1.7 | v1.8 |
|---|---|---|
| npm packages | 20 | **23** |
| Claude Code skills | 27 | **30** |
| Layer 1 spec layers | 19 | **22** |
| Auth providers | 0 | 3 |
| Queue providers | 0 | 2 |
| Cache providers | 0 | 1 |
| Plugin version | 1.7.0 | **1.8.0** |

## 6. Claude Code plugin — 30 skills

```bash
/plugin marketplace add cardene777/kiwa
/plugin install kiwa@kiwa-marketplace
/reload-plugins
```

## v1.9 — scope under discussion

Candidates:

- **A** — Rust contract layer (Foundry-rs / alloy.rs, now stable)
- **B** — Storybook integration (v2.0 pull-forward)
- **C** — Go Iris + Chi
- **D** — Extra auth providers (Clerk / Auth0 / Supabase Auth)
- **E** — Extra queue providers (Cloudflare Queues / SQS / RabbitMQ)
- **F** — Extra cache providers (Memcached / KeyDB / Dragonfly)

Drop priorities on the [Discussions board](https://github.com/cardene777/kiwa/discussions).

## Try it

```bash
# Claude Code plugin (recommended)
/plugin marketplace add cardene777/kiwa
/plugin install kiwa@kiwa-marketplace

# Auth
pnpm add -D @kiwa-test/auth

# Job queue
pnpm add -D @kiwa-test/queue

# Cache
pnpm add -D @kiwa-test/cache
```

Repo ... https://github.com/cardene777/kiwa

v1.5-v1.7 shipped polyglot across 6 web frameworks. v1.8 fills **the 3 SaaS blank spots** — auth, queue, cache — so kiwa can now handle the full prod-test surface most SaaS teams need.

— [@cardene777](https://github.com/cardene777)
