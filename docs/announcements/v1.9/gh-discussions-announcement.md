# 🌱 kiwa v1.9 — provider 増強 (auth + queue + cache に 6 新 provider land、 prod cover 率 90%)

The v1.9 milestone (**6/6 GitHub Issues resolved**) just landed. After v1.8 landed 3 new layers with 1 provider each (auth = NextAuth v5 + Lucia v3 + Better Auth、 queue = BullMQ + Inngest、 cache = Redis)、 v1.9 fills the **provider gap** for prod SaaS teams — Clerk / Auth0 / Cloudflare Queues / SQS / Memcached / KeyDB. Every kiwa Layer 1 spec + Layer 2 skill now honours a `--provider` flag.

## 1. `@kiwa-lab/auth` v0.2 — Clerk + Auth0 追加 (5 providers total)

```ts
import { setupClerkEnv, setupAuth0Env } from "@kiwa-lab/auth";

// Clerk (SaaS 2026 dominant) — user + session + orgs mock
const clerk = await setupClerkEnv({
  users: [{ id: "user_1", email: "alice@example.test", publicMetadata: { role: "admin" } }],
  organizations: [{ id: "org_1", members: [{ userId: "user_1", role: "admin" }] }],
});
await clerk.signIn("user_1");
const { userId, orgId, orgRole } = await clerk.assertSignedIn();

// Auth0 (enterprise dominant) — tenant + rules + Management API mock
const auth0 = await setupAuth0Env({
  tenant: "example-corp",
  rules: [
    { id: "add-role", trigger: "post-login", handler: (user, ctx) => ({ ...ctx, role: "employee" }) },
  ],
});
await auth0.mgmt.users.create({ email: "bob@corp.example", connection: "email" });
const roles = await auth0.mgmt.users.assignRoles("bob@corp.example", ["admin"]);
```

- **Clerk** — user + session + orgs mock, `signIn` / `signOut` / `assertSignedIn` / `assertOrgRole` helpers, `publicMetadata` / `privateMetadata` distinction preserved
- **Auth0** — tenant + rules + Management API mock, post-login rule pipeline reproduces the production execution order, `mgmt.users` / `mgmt.roles` / `mgmt.connections` API surface
- **`--provider` flag** — `/kiwa-auth --provider {nextauth|lucia|better-auth|clerk|auth0|all}` selects which providers the generated test file exercises

## 2. `@kiwa-lab/queue` v0.2 — Cloudflare Queues + SQS 追加 (4 providers total)

```ts
import { setupCloudflareQueuesEnv, setupSQSEnv } from "@kiwa-lab/queue";

// Cloudflare Queues (edge queue) — miniflare (in-process) + wrangler (real)
const cfq = await setupCloudflareQueuesEnv();
cfq.registerConsumer({
  queue: "webhook-events",
  maxRetries: 3,
  deadLetterQueue: "webhook-dlq",
  handler: async (batch) => {
    for (const msg of batch.messages) {
      try { await forwardToAudit(msg.body); msg.ack(); }
      catch { msg.retry(); }
    }
  },
});
await cfq.send("webhook-events", { userId: "u-1" });
await cfq.assertAcknowledged("webhook-events");

// AWS SQS (standard + FIFO) — stub (in-process) + localstack (real endpoint)
const sqs = await setupSQSEnv({
  queues: [
    { name: "orders", visibilityTimeoutSeconds: 30,
      redrivePolicy: { deadLetterTargetArn: "orders-dlq", maxReceiveCount: 3 } },
    { name: "orders-dlq" },
  ],
});
await sqs.send("orders", { orderId: "o-1", amount: 100 });
const [received] = await sqs.receive("orders");
received.delete();
await sqs.assertDeleted("orders", { receiveCount: 1 });
```

- **Cloudflare Queues** — miniflare backend (in-process, deterministic) + wrangler backend (real `wrangler dev` process), consumer batch delivery + ack/retry/DLQ + `maxBatchSize` chunking + `msg.retry()` / `batch.ackAll()` / `batch.retryAll()` semantics
- **AWS SQS** — stub backend + localstack backend, standard + FIFO queue (`messageGroupId` + `messageDeduplicationId` dedup), batch send / delete (10 entries cap), visibility timeout + long polling + DLQ redrive policy
- **`--provider` flag** — `/kiwa-queue --provider {bullmq|inngest|cloudflare|sqs|all}` selects backend

## 3. `@kiwa-lab/cache` v0.2 — Memcached + KeyDB 追加 (3 providers total)

```ts
import { setupMemcachedEnv, setupKeyDBEnv } from "@kiwa-lab/cache";

// Memcached (legacy 定番) — 8 core commands + multi-server consistent hashing
const mc = await setupMemcachedEnv({ servers: ["stub-a", "stub-b", "stub-c"] });
await mc.set("session:1", "token", { ttlSeconds: 60 });
await mc.increment("counter", 5);
const owner = mc.serverFor("session:1");

// KeyDB (Redis 互換高性能) — multi-master replication + cross-region Pub/Sub
const kdb = await setupKeyDBEnv({ cluster: ["us-east", "us-west", "eu-central"] });
await kdb.set("k", "v", { master: "us-east" });
// Synchronous replication — every master sees the write.
expect(await kdb.get("k", { master: "eu-central" })).toBe("v");

// Cross-region Pub/Sub — publish from any master, subscribers on any master receive.
const sub = await kdb.subscribe("cache-invalidate");
await kdb.publish("cache-invalidate", "session:1", { master: "us-west" });
const msg = await sub.next();
msg.master; // "us-west"
```

- **Memcached** — stub + testcontainers, 8 core commands (get / set / delete / add / replace / increment / decrement / flush), multi-server consistent hashing (FNV-1a + 128 vnodes / server), TTL introspection helper (non-standard convenience)
- **KeyDB** — stub + testcontainers, Redis-compatible surface + KeyDB-specific multi-master replication (`{ master }` option on `set` / `publish`), simulated replication lag (`stub.replicationLagMs`) for cross-region timing tests
- **`--provider` flag** — `/kiwa-cache --provider {redis|memcached|keydb|all}` selects backend

## 4. Layer 1 spec + skill chain の provider dimension

`/kiwa-design` の 3 layer (auth / job-queue / cache) は provider dimension を明示的に許容する形に SSOT 更新済:

```bash
/kiwa-design --layer auth --provider clerk --module user-signup
/kiwa-design --layer job-queue --provider sqs --module order-processing
/kiwa-design --layer cache --provider keydb --module multi-region
```

Layer 2 skills も `--provider` flag を honour する:

```bash
/kiwa-auth --provider clerk --module user-signup
/kiwa-queue --provider sqs --module order-processing
/kiwa-cache --provider keydb --module multi-region
```

`/kiwa-review` covers all 6 new provider variants.

## 5. v1.8 → v1.9 progression

| Axis | v1.8 | v1.9 |
|---|---|---|
| Auth providers | 3 | **5** (+ Clerk + Auth0) |
| Queue providers | 2 | **4** (+ Cloudflare Queues + SQS) |
| Cache providers | 1 | **3** (+ Memcached + KeyDB) |
| npm package versions | v0.1 系 | **v0.2 系** (auth / queue / cache) |
| Claude Code skills | 30 | **30** (skill 数維持、 `--provider` flag 拡張のみ) |
| Plugin version | 1.8.0 | **1.9.0** |

## 6. Claude Code plugin — 30 skills

```bash
/plugin marketplace add cardene777/kiwa
/plugin install kiwa@kiwa-marketplace
/reload-plugins
```

## v1.10 — scope under discussion

Candidates:

- **A** — Rust contract layer (Foundry-rs / alloy.rs)
- **B** — Storybook integration (v2.0 pull-forward)
- **C** — Supabase Auth (SaaS + DB 一体型)
- **D** — RabbitMQ (self-host queue)
- **E** — Dragonfly (2025 新興 cache eco system 熟成待ち)
- **F** — Go Iris + Chi (web framework 縦深化続き)

Drop priorities on the [Discussions board](https://github.com/cardene777/kiwa/discussions).

## Try it

```bash
# Claude Code plugin (recommended)
/plugin marketplace add cardene777/kiwa
/plugin install kiwa@kiwa-marketplace

# Auth (5 providers)
pnpm add -D @kiwa-lab/auth

# Job queue (4 providers)
pnpm add -D @kiwa-lab/queue

# Cache (3 providers)
pnpm add -D @kiwa-lab/cache
```

Repo ... https://github.com/cardene777/kiwa

v1.8 landed 3 new layers with 1 provider each. v1.9 doubles that — **6 new providers across the same 3 layers** — so SaaS teams shipping to prod on Clerk / Auth0 / SQS / KeyDB no longer have to choose between kiwa's prod-shape coverage and their production stack.

— [@cardene777](https://github.com/cardene777)
