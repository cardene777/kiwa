---
title: "kiwa v1.8 — auth + job queue + cache の新 layer 3 種で SaaS prod test をカバーした"
emoji: "🌱"
type: "tech"
topics: ["testing", "oss", "auth", "queue", "cache"]
published: false
---

# 概要

polyglot test toolchain `kiwa` の v1.8 milestone (6/6 Issue resolved) が land しました。

v1.5-v1.7 で polyglot Web layer を 6 web framework まで縦深化した後、 v1.8 は方向転換して **kiwa 空白領域の新 layer 3 種 (auth / job queue / cache)** を land しました。 SaaS prod 開発で「test しづらい」 と言われがちな 3 分野を kiwa 標準経路で扱えるようにするのが v1.8 の狙いです。

```bash
# 3 新 package v0.1
pnpm add -D @kiwa-test/auth   # NextAuth v5 + Lucia v3 + Better Auth
pnpm add -D @kiwa-test/queue  # BullMQ + Inngest
pnpm add -D @kiwa-test/cache  # Redis
```

## v1.8 で land した 3 分野

### 1. auth (`@kiwa-test/auth` v0.1)

```ts
import { setupNextAuthEnv, setupLuciaEnv, setupBetterAuthEnv } from "@kiwa-test/auth";

// NextAuth v5 (Auth.js)
const env = setupNextAuthEnv({
  providers: [{ id: "google", type: "oauth" }],
  session: { strategy: "jwt" },
  database: "prisma",
});
const session = await env.signIn("google", { email: "alice@example.com" });

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

- **NextAuth v5 (Auth.js)** ... session mock (jwt + database strategy)、 Google/GitHub/Email 3 provider mock、 Prisma/Drizzle adapter 互換
- **Lucia v3** ... bare-metal session (`fresh` flag + rolling refresh)、 password (Argon2 envelope) + OAuth、 SQLite/PG adapter
- **Better Auth** ... email/password + magic link + 2FA TOTP + passkey + organizations、 Prisma/Drizzle/Kysely
- Auth.js `Adapter` 契約と 1:1 一致、 drop-in 保証

### 2. job queue (`@kiwa-test/queue` v0.1)

```ts
import { setupBullMQEnv, setupInngestEnv } from "@kiwa-test/queue";

// BullMQ (sandbox = in-process、 testcontainers = real Redis)
const env = setupBullMQEnv({ mode: "sandbox", queueName: "email" });
await env.add("send-welcome", { userId: 1 });
await env.waitForJob("send-welcome");
env.assertProcessed("send-welcome");

// Inngest (stub = in-process、 dev-server = real Inngest dev)
const env = setupInngestEnv({
  mode: "stub",
  functions: [{ id: "onboard-user", retries: 3 }],
});
await env.sendEvent("user.created", { userId: 1 });
env.assertFunctionRan("onboard-user");
env.assertStepRan("send-welcome-email");
```

- **BullMQ** ... sandbox mode (in-process, deterministic) + testcontainers mode (real BullMQ + ioredis + Docker Redis)、 5 assertion helper (waitForJob / assertProcessed / assertFailed / assertRetried / assertQueueDrained)
- **Inngest** ... stub mode (deterministic) + dev-server mode (real subprocess + HTTP round-trip)、 6 assertion helper + retry / step function (step.run + step.sleep) / concurrency cap の 3 semantics 再現

### 3. cache (`@kiwa-test/cache` v0.1)

```ts
import { setupCacheEnv } from "@kiwa-test/cache";

// in-memory (default) / testcontainers (real Redis + ioredis / node-redis)
const env = setupCacheEnv({ mode: "in-memory" });

await env.set("session:abc", { userId: 1 }, { ttl: 3600 });
env.assertTTL("session:abc", 3600);

// Pub/Sub
await env.subscribe("cache-invalidate");
await env.publish("cache-invalidate", { key: "user:1" });
env.assertPublished("cache-invalidate", { key: "user:1" });
```

- **Redis** ... in-memory (default、 in-process fake) + testcontainers (real Redis + ioredis / node-redis client wrap)
- **8 helper** ... get / set / delete / expire / ttl / assertTTL / publish / subscribe / assertPublished / flushAll
- **namespace isolation** ... multi-env test case で干渉なし
- **Pub/Sub race bug fix** ... publish-before-subscribe race を `cursor` field で解消 (test 実行順序 non-deterministic 対策)

## Layer 1 spec + skill chain

`/kiwa-design` に 3 layer 追加。

```bash
/kiwa-design --layer auth --module user-signup
/kiwa-design --layer job-queue --module email-worker
/kiwa-design --layer cache --module session-store
```

Layer 2 skill 3 種 新規。

```bash
/kiwa-auth --module user-signup     # NextAuth / Lucia / Better Auth 3 backend
/kiwa-queue --module email-worker   # BullMQ / Inngest 2 backend
/kiwa-cache --module session-store  # Redis 2 backend
```

`/kiwa-review` も 3 layer 対応、 spec vs test 整合 review を統一経路で扱えます。

## 統計

| 軸 | v1.7 | v1.8 |
|---|---|---|
| npm package | 20 | **23** (+3: auth / queue / cache) |
| Claude Code skill | 27 | **30** (+3: kiwa-auth / kiwa-queue / kiwa-cache) |
| Layer 1 spec layer | 19 | **22** (+3: auth / job-queue / cache) |
| auth provider | 0 | 3 (NextAuth v5 + Lucia v3 + Better Auth) |
| queue provider | 0 | 2 (BullMQ + Inngest) |
| cache provider | 0 | 1 (Redis) |
| plugin version | 1.7.0 | **1.8.0** |

## 対応 provider (2026 dominant)

**auth** ... NextAuth v5 (Auth.js) は Next.js の de facto standard、 Lucia v3 は bare-metal 系で対抗、 Better Auth は 2025 後半急伸で「今」 land する意義高い。

**queue** ... BullMQ は Redis-backed で Node ecosystem dominant、 Inngest は SaaS 型 event-driven で 2026 growth 中。 2 大分岐カバー。

**cache** ... Redis 単体で主要シナリオ 90% カバー可能 (Pub/Sub / TTL / namespace / cluster mode)。

## v1.9 候補

- Rust contract layer (Foundry-rs / alloy.rs v1.0 安定済)
- Storybook integration (v2.0 繰上げ)
- Go Iris + Chi (Chi は net/http 互換で mock_server 使用可)
- 追加 auth provider (Clerk / Auth0 / Supabase Auth)
- 追加 queue provider (Cloudflare Queues / SQS / RabbitMQ)
- 追加 cache provider (Memcached / KeyDB / Dragonfly)

要望は [GitHub Discussions](https://github.com/cardene777/kiwa/discussions) で集めます。

## 試す

```bash
# Claude Code plugin (推奨)
/plugin marketplace add cardene777/kiwa
/plugin install kiwa@kiwa-marketplace

# auth
pnpm add -D @kiwa-test/auth

# job queue
pnpm add -D @kiwa-test/queue

# cache
pnpm add -D @kiwa-test/cache
```

repo ... https://github.com/cardene777/kiwa

v1.5-v1.7 で「polyglot Web layer 6 web framework 完成」、 v1.8 で **「SaaS prod 実 test 需要 3 分野 land」** まで到達。 「auth test 面倒」「queue test 難しい」「cache Pub/Sub どう検証?」 の 3 大空白を kiwa 標準経路で埋めました。
