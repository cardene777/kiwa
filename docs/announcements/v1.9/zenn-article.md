---
title: "kiwa v1.9 — provider 増強で auth / queue / cache に 6 新 provider を land、 prod cover 率 90% 到達"
emoji: "🌱"
type: "tech"
topics: ["testing", "oss", "clerk", "auth0", "sqs"]
published: false
---

# 概要

polyglot test toolchain `kiwa` の v1.9 milestone (6/6 Issue resolved) が land しました。

v1.8 で新 layer 3 種 (auth / job queue / cache) を **各 1 provider ずつ** land した (NextAuth v5 + Lucia v3 + Better Auth / BullMQ + Inngest / Redis) 後、 v1.9 は同じ 3 layer に **provider を追加** して SaaS prod 開発の実 stack に合わせられる形にしました。 具体的には Clerk / Auth0 / Cloudflare Queues / SQS / Memcached / KeyDB の 6 provider を追加し、 v1.9 完了時点で auth 5 provider + queue 4 provider + cache 3 provider をカバー。 prod cover 率 90% を狙う milestone です。

```bash
# 3 package version bump (v0.1 → v0.2)
pnpm add -D @kiwa/auth@0.2   # + Clerk + Auth0
pnpm add -D @kiwa/queue@0.2  # + Cloudflare Queues + SQS
pnpm add -D @kiwa/cache@0.2  # + Memcached + KeyDB
```

## v1.9 で追加した 6 provider

### 1. auth — Clerk + Auth0

```ts
import { setupClerkEnv, setupAuth0Env } from "@kiwa/auth";

// Clerk (SaaS 2026 dominant) — user + session + orgs mock
const clerk = await setupClerkEnv({
  users: [
    { id: "user_1", email: "alice@example.test", publicMetadata: { role: "admin" } },
  ],
  organizations: [
    { id: "org_1", members: [{ userId: "user_1", role: "admin" }] },
  ],
});
await clerk.signIn("user_1");
const { userId, orgId, orgRole } = await clerk.assertSignedIn();

// Auth0 (enterprise dominant) — tenant + rules + Management API mock
const auth0 = await setupAuth0Env({
  tenant: "example-corp",
  rules: [
    {
      id: "add-role",
      trigger: "post-login",
      handler: (user, ctx) => ({ ...ctx, role: "employee" }),
    },
  ],
});
await auth0.mgmt.users.create({ email: "bob@corp.example", connection: "email" });
const roles = await auth0.mgmt.users.assignRoles("bob@corp.example", ["admin"]);
```

- **Clerk** ... user + session + orgs mock、 `signIn` / `assertSignedIn` / `assertOrgRole` の helper、 `publicMetadata` / `privateMetadata` の区別を production 準拠に維持
- **Auth0** ... tenant + rules pipeline + Management API mock、 post-login rule 実行順序を production 準拠に再現、 `mgmt.users` / `mgmt.roles` / `mgmt.connections` の Management API surface

### 2. queue — Cloudflare Queues + AWS SQS

```ts
import { setupCloudflareQueuesEnv, setupSQSEnv } from "@kiwa/queue";

// Cloudflare Queues (edge queue) — miniflare (in-process) + wrangler (real)
const cfq = await setupCloudflareQueuesEnv();
cfq.registerConsumer({
  queue: "webhook-events",
  maxBatchSize: 10,
  maxRetries: 3,
  deadLetterQueue: "webhook-dlq",
  handler: async (batch) => {
    for (const msg of batch.messages) {
      try {
        await forwardToAuditSink(msg.body);
        msg.ack();
      } catch {
        msg.retry();
      }
    }
  },
});
await cfq.send("webhook-events", { userId: "u-1" });
await cfq.assertAcknowledged("webhook-events");

// AWS SQS (standard + FIFO) — stub (in-process) + localstack (real endpoint)
const sqs = await setupSQSEnv({
  queues: [
    {
      name: "orders",
      visibilityTimeoutSeconds: 30,
      redrivePolicy: { deadLetterTargetArn: "orders-dlq", maxReceiveCount: 3 },
    },
    { name: "orders-dlq" },
  ],
});
await sqs.send("orders", { orderId: "o-1", amount: 100 });
const [received] = await sqs.receive("orders");
received.delete();
await sqs.assertDeleted("orders", { receiveCount: 1 });
```

- **Cloudflare Queues** ... miniflare (in-process、 deterministic) + wrangler (real `wrangler dev`) 2 backend、 consumer batch + ack/retry/DLQ + `maxBatchSize` chunking + `msg.retry()` / `batch.ackAll()` / `batch.retryAll()` の semantic 再現
- **AWS SQS** ... stub + localstack 2 backend、 standard + FIFO queue (`messageGroupId` + `messageDeduplicationId` dedup)、 batch send / delete (10 entries cap)、 visibility timeout + long polling (`waitTimeSeconds`) + DLQ redrive policy

### 3. cache — Memcached + KeyDB

```ts
import { setupMemcachedEnv, setupKeyDBEnv } from "@kiwa/cache";

// Memcached (legacy 定番) — 8 core commands + multi-server consistent hashing
const mc = await setupMemcachedEnv({ servers: ["stub-a", "stub-b", "stub-c"] });
await mc.set("session:1", "token", { ttlSeconds: 60 });
await mc.increment("counter", 5);   // 15
await mc.decrement("counter", 100); // 0 (Memcached clamps at 0)
const owner = mc.serverFor("session:1"); // deterministic

// KeyDB (Redis 互換高性能) — multi-master replication + cross-region Pub/Sub
const kdb = await setupKeyDBEnv({
  cluster: ["us-east", "us-west", "eu-central"],
});
// Write on us-east — synchronously replicates to every other master.
await kdb.set("k", "v", { master: "us-east" });
expect(await kdb.get("k", { master: "eu-central" })).toBe("v");

// Cross-region Pub/Sub — publish from us-west, receive anywhere.
const sub = await kdb.subscribe("cache-invalidate");
await kdb.publish("cache-invalidate", "session:1", { master: "us-west" });
const msg = await sub.next();
expect(msg.master).toBe("us-west");
```

- **Memcached** ... stub + testcontainers 2 backend、 8 core command (get / set / delete / add / replace / increment / decrement / flush) + multi-server consistent hashing (FNV-1a + 128 vnode / server)、 TTL introspection helper (`env.ttl` / `env.assertTTL` は Memcached ABI に無い非標準 convenience)
- **KeyDB** ... stub + testcontainers 2 backend、 Redis 互換 surface + KeyDB 固有 multi-master replication (`{ master }` option) + cross-region Pub/Sub + simulated replication lag (`stub.replicationLagMs`)

## Layer 1 spec + skill chain に `--provider` flag 追加

`/kiwa-design --layer {auth|job-queue|cache}` が `--provider` flag を honour。 Layer 2 skill (`/kiwa-auth` / `/kiwa-queue` / `/kiwa-cache`) も同じ。

```bash
# Layer 1 spec ...
/kiwa-design --layer auth --provider clerk --module user-signup
/kiwa-design --layer job-queue --provider sqs --module order-processing
/kiwa-design --layer cache --provider keydb --module multi-region

# Layer 2 test 生成 ...
/kiwa-auth --provider clerk --module user-signup
/kiwa-queue --provider sqs --module order-processing
/kiwa-cache --provider keydb --module multi-region
```

`/kiwa-review` も 3 layer 全てで provider dimension review 対応済。 test file を review する際に 「Clerk 側の signIn だけ mock されてる」 等の provider-specific な観点まで見る形になります。

## v1.8 → v1.9 progression

| Axis | v1.8 | v1.9 |
|---|---|---|
| auth provider | 3 | **5** (+ Clerk + Auth0) |
| queue provider | 2 | **4** (+ Cloudflare Queues + SQS) |
| cache provider | 1 | **3** (+ Memcached + KeyDB) |
| npm package version | v0.1 系 | **v0.2 系** (auth / queue / cache) |
| Claude Code skill | 30 | **30** (skill 数維持、 `--provider` flag 拡張のみ) |
| Plugin version | 1.8.0 | **1.9.0** |

## v1.9 の設計判断

### なぜ「provider 増強」 が v1.9 の主軸か

v1.8 で 3 layer land した直後、 実際に SaaS teams から拾った要望は「Clerk 使ってるんだけど setupClerkEnv 欲しい」 「SQS 使ってるので localstack 対応欲しい」 系がほとんどでした。 新 layer 追加より **既存 layer の provider 拡張** の方が prod 需要にダイレクトに刺さる状態。 v1.8 の 1 provider だけ land 直後は 「v1.8 使ってるけど mock 部分は自前」 という半端な状態のプロジェクトが多く、 v1.9 でその空白を潰しに行きました。

### なぜ Clerk / Auth0 (auth) を優先したか

2026 の SaaS 開発で 「session 管理を production 級 provider に置きたい」 需要は Clerk (SaaS-first) と Auth0 (enterprise) の 2 大 provider で 8 割方カバー可能。 Supabase Auth も候補でしたが 「SaaS + DB 一体型で別カテゴリ」 判断で v1.10 送り。

### なぜ Cloudflare Queues + SQS (queue) を優先したか

edge 化 (Cloudflare Workers / Vercel Edge) の SaaS が Cloudflare Queues を使うケースが 2026 に急増、 逆に「AWS 環境の SQS を production で使ってるが test は BullMQ で妥協」 という声も多く、 その 2 極を land しました。 RabbitMQ は self-host prod 需要が小さく v1.10 送り。

### なぜ Memcached + KeyDB (cache) を優先したか

Memcached は legacy 定番として「テストしたいが公式 stub が無い」 需要、 KeyDB は Redis 互換 high-perf として multi-master replication test の需要が育っていました。 Dragonfly (2025 新興) は eco system 未熟のため v1.11 以降送り。

## Claude Code plugin — 30 skills 維持

```bash
/plugin marketplace add cardene777/kiwa
/plugin install kiwa@kiwa-marketplace
/reload-plugins
```

v1.9 では skill 新規追加なし、 既存 `/kiwa-design` / `/kiwa-auth` / `/kiwa-queue` / `/kiwa-cache` / `/kiwa-review` の `--provider` flag 拡張のみです。 plugin.json version は 1.8.0 → 1.9.0 に bump 済。

## v1.10 の scope 検討中

Discussions 板で priority 投票中の候補。

- **A** — Rust contract layer (Foundry-rs / alloy.rs、 stable 化待ち)
- **B** — Storybook integration (v2.0 pull-forward)
- **C** — Supabase Auth (SaaS + DB 一体型、 v1.10 auth 拡張候補)
- **D** — RabbitMQ (self-host queue)
- **E** — Dragonfly (2025 新興 cache、 eco system 熟成待ち)
- **F** — Go Iris + Chi (web framework 縦深化続き)

https://github.com/cardene777/kiwa/discussions

## Try it

```bash
# Claude Code plugin (recommended)
/plugin marketplace add cardene777/kiwa
/plugin install kiwa@kiwa-marketplace

# Auth (5 providers)
pnpm add -D @kiwa/auth

# Job queue (4 providers)
pnpm add -D @kiwa/queue

# Cache (3 providers)
pnpm add -D @kiwa/cache
```

Repo ... https://github.com/cardene777/kiwa

v1.8 で 3 新 layer を land しました。 v1.9 は同じ 3 layer に **各 2 provider 追加** で prod cover 率 90% 到達、 SaaS teams が 「production stack と test toolchain を揃えたい」 と思ったときに kiwa を候補に入れられる状態を目指しました。

— [@cardene777](https://github.com/cardene777)
