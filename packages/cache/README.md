# @kiwa/cache

<p align="center">
  <img src="https://raw.githubusercontent.com/cardene777/kiwa/main/assets/kiwa-promo-en.gif" alt="kiwa 127s overview — generate full-spec tests across Web (Next.js) / Contract (Solidity) / dApp (Playwright) in 6 steps (this package covers the Cache surface)" width="640" />
  <br />
  <sub>Full <a href="https://github.com/cardene777/kiwa">kiwa</a> overview (127s) — this package covers the Cache surface. <a href="https://github.com/cardene777/kiwa/blob/main/assets/kiwa-promo-en.mp4">Full-quality MP4 (2.9 MB)</a>.</sub>
</p>

Cache test adapter for kiwa — Redis (testcontainers) live env + in-memory sandbox env + Memcached (stub + testcontainers) env + KeyDB (stub + testcontainers) env with TTL / Pub/Sub / expiry / consistent-hash / multi-master replication assertion helpers under three factories (`setupCacheEnv` for Redis, `setupMemcachedEnv` for Memcached, `setupKeyDBEnv` for KeyDB).

## Overview

`@kiwa/cache` is the Layer 2 adapter that turns a cache-shaped Layer 1 spec into a runnable Vitest suite. Three factories cover the dominant cache providers:

- **`setupCacheEnv`** — Redis (in-process + testcontainers), assertion surface for TTL / Pub/Sub / expiry.
- **`setupMemcachedEnv`** — Memcached (in-process stub + testcontainers), 8 core commands + TTL + multi-server consistent hashing.
- **`setupKeyDBEnv`** — KeyDB (in-process stub + testcontainers), Redis-compatible surface + multi-master replication + cross-region Pub/Sub.

All three factories share the same `TestEnvBase<TMode>` shape so switching lanes never rewrites the assertion surface. Redis backends are `'in-memory' | 'testcontainers'`; Memcached / KeyDB backends are `'stub' | 'testcontainers'`.

## Install

```bash
pnpm add -D @kiwa/cache @kiwa/core vitest
# testcontainers mode also needs:
pnpm add -D testcontainers ioredis           # or: pnpm add -D testcontainers redis
```

`ioredis`, `redis`, and `testcontainers` are optional peer dependencies — none of them is imported by the in-memory path, so the fast lane runs with zero infrastructure.

## Quick start — in-memory

```ts
import { setupCacheEnv } from "@kiwa/cache";

const env = await setupCacheEnv();          // defaults to mode: "in-memory"

await env.set("session:1", "user-1", { ttlSeconds: 60 });
await env.assertTTL("session:1", { atLeast: 59, atMost: 60 });

const sub = await env.subscribe("audit");
await env.publish("audit", "user-1 signed in");
const msg = await sub.next();
msg.message;         // "user-1 signed in"

await sub.close();
await env.stop();
```

## Quick start — testcontainers Redis

```ts
import { setupCacheEnv } from "@kiwa/cache";

const env = await setupCacheEnv({
  mode: "testcontainers",
  client: "ioredis",                        // or "node-redis"
  redis: { image: "redis:7-alpine" },
});

await env.set("counter", "1", { ttlSeconds: 30 });
await env.assertTTL("counter", { atLeast: 29, atMost: 30 });

await env.stop();                           // stops container + closes client
```

## API surface

| Helper | Purpose |
|---|---|
| `env.get(key)` | Read a key. Returns `null` when unset / expired. |
| `env.set(key, value, { ttlSeconds })` | Write a key with an optional TTL. Rejects on `ttlSeconds <= 0`. |
| `env.delete(key)` | Remove a key. Returns 0 or 1. |
| `env.expire(key, ttlSeconds)` | Attach or refresh a TTL. Returns `true` when the key existed. |
| `env.ttl(key)` | Read the TTL in seconds. `-1` = no expiry, `-2` = missing. |
| `env.assertTTL(key, { seconds | atLeast | atMost })` | Assert a TTL match (exact or bounded). |
| `env.publish(channel, message)` | Publish a payload. Returns delivered subscriber count. |
| `env.subscribe(channel)` | Returns a `CacheSubscription` with `next()`, `received()`, `close()`. |
| `env.assertPublished(channel, { match, timeoutMs })` | Await a matching message (string or RegExp) within `timeoutMs`. |
| `env.flushAll()` | Wipe every key in the env. |
| `env.stop()` | Tear down subscriptions + close container / client. |

## Design notes

- The in-memory backend keeps deterministic TTL enforcement via a `setInterval` sweep whose timer is `unref()`ed so Vitest exits cleanly.
- Pub/Sub subscribers hold their own history buffer; `next()` yields historical messages that arrived before the caller awaited, so publish-before-subscribe races don't drop the payload.
- Two environments created from the same test file are fully namespace-isolated — one env's `flushAll()` never touches another's keys, and one env's `publish` never delivers to another env's subscribers.
- `testcontainers` mode always requires a real Redis (image tag configurable) unless an external `redis.url` is supplied.

## Memcached env — `setupMemcachedEnv`

`setupMemcachedEnv` covers the Memcached slot. Producers exercise the 8 core commands (`get` / `set` / `delete` / `add` / `replace` / `increment` / `decrement` / `flush`) plus TTL introspection and multi-server consistent hashing — the surface consumers see when they wire `memjs` / `memcached` in prod.

### Quick start — stub

```ts
import { setupMemcachedEnv } from "@kiwa/cache";

const env = await setupMemcachedEnv({           // defaults to mode: "stub"
  servers: ["stub-a", "stub-b", "stub-c"],
});

await env.set("session:1", "token", { ttlSeconds: 60 });
await env.assertTTL("session:1", { atLeast: 59, atMost: 60 });

// consistent hashing — same key always lands on the same server
const owner = env.serverFor("session:1");

// atomic counters — Memcached clamps decr at 0
await env.set("counter", "10");
await env.increment("counter", 5);              // returns 15
await env.decrement("counter", 100);            // returns 0 (clamp)

await env.stop();
```

### Quick start — testcontainers

```ts
import { setupMemcachedEnv } from "@kiwa/cache";

const env = await setupMemcachedEnv({
  mode: "testcontainers",
  testcontainers: { url: process.env.MEMCACHED_URL },
  servers: ["node-a", "node-b"],
});

await env.set("k", "v", { ttlSeconds: 30 });
await env.assertTTL("k", { atLeast: 29, atMost: 30 });

await env.stop();
```

### API surface (Memcached)

| Helper | Purpose |
|---|---|
| `env.get(key)` | Read a key. Returns `null` when unset / expired. |
| `env.set(key, value, { ttlSeconds })` | Write unconditionally. `ttlSeconds=0` = no expiry. |
| `env.delete(key)` | Remove a key. Returns `true` if the key existed. |
| `env.add(key, value, { ttlSeconds })` | Write only if the key is missing. |
| `env.replace(key, value, { ttlSeconds })` | Write only if the key already exists. |
| `env.increment(key, delta?)` | Atomically add delta. Returns new value or `null`. |
| `env.decrement(key, delta?)` | Atomically subtract delta. Clamps at 0. |
| `env.flush()` | Wipe every key across every server. |
| `env.ttl(key)` | Read the TTL. `-1` = no expiry, `-2` = missing. |
| `env.assertTTL(key, { seconds \| atLeast \| atMost })` | Assert a TTL match. |
| `env.serverFor(key)` | Return which server owns the key on the hash ring. |
| `env.listEntries()` | Introspection — every entry across every server. |

### Reference — the Memcached PoC

Live under [`examples/cache-memcached-poc/`](../../examples/cache-memcached-poc/) — 8 tests that thread a session-cache pipeline through `setupMemcachedEnv` (register / duplicate register / pageview counter / rotate / logout / expiry / consistent-hash distribution / flush).

```bash
pnpm -F examples-cache-memcached-poc test
```

## KeyDB env — `setupKeyDBEnv`

`setupKeyDBEnv` covers the KeyDB slot. KeyDB is Redis-compatible on the wire (ioredis / redis clients work unchanged) so the assertion surface mirrors `setupCacheEnv`, plus KeyDB-specific multi-master replication (`{ master }` option on `set` / `publish`) and cross-region Pub/Sub.

### Quick start — stub

```ts
import { setupKeyDBEnv } from "@kiwa/cache";

const env = await setupKeyDBEnv({                // defaults to mode: "stub"
  cluster: ["us-east", "us-west", "eu-central"],
});

// Write on us-east — replicates synchronously to every other master.
await env.set("session:1", "user-1", { ttlSeconds: 60, master: "us-east" });
expect(await env.get("session:1", { master: "eu-central" })).toBe("user-1");

// Cross-region Pub/Sub — publish from us-west, receive on us-east subscriber.
const sub = await env.subscribe("cache-invalidate");
await env.publish("cache-invalidate", "session:1", { master: "us-west" });
const msg = await sub.next();
msg.master;   // "us-west"
msg.message;  // "session:1"

await sub.close();
await env.stop();
```

### Quick start — replication lag

```ts
const env = await setupKeyDBEnv({
  cluster: ["us-east", "us-west"],
  stub: { replicationLagMs: 50 },  // Simulate 50ms cross-region lag.
});

await env.set("k", "v", { master: "us-east" });
expect(await env.get("k", { master: "us-east" })).toBe("v");
expect(await env.get("k", { master: "us-west" })).toBeNull();  // lagging
await new Promise((r) => setTimeout(r, 80));
expect(await env.get("k", { master: "us-west" })).toBe("v");   // caught up
```

### Reference — the KeyDB PoC

Live under [`examples/cache-keydb-poc/`](../../examples/cache-keydb-poc/) — 8 tests that thread a multi-region rate-limit cache through `setupKeyDBEnv` (bump / replication / broadcastInvalidate / TTL / lag / concurrent bumps / cross-region Pub/Sub / regex assertPublished).

```bash
pnpm -F examples-cache-keydb-poc test
```

## Coverage snapshot (v0.2.0)

- Redis backend: 32 unit tests + 8 signup-flow PoC tests (`examples/cache-redis-poc/`).
- Memcached backend: 34 unit tests + 8 session-cache PoC tests (`examples/cache-memcached-poc/`).
- KeyDB backend: 30 unit tests + 8 multi-region PoC tests (`examples/cache-keydb-poc/`).
