# @kiwa-test/cache

<p align="center">
  <img src="https://raw.githubusercontent.com/cardene777/kiwa/main/assets/kiwa-promo-en.gif" alt="kiwa 127s overview — generate full-spec tests across Web (Next.js) / Contract (Solidity) / dApp (Playwright) in 6 steps (this package covers the Cache surface)" width="640" />
  <br />
  <sub>Full <a href="https://github.com/cardene777/kiwa">kiwa</a> overview (127s) — this package covers the Cache surface. <a href="https://github.com/cardene777/kiwa/blob/main/assets/kiwa-promo-en.mp4">Full-quality MP4 (2.9 MB)</a>.</sub>
</p>

Cache test adapter for kiwa — Redis (testcontainers) live env + in-memory sandbox env under a single `setupCacheEnv` API, with TTL / Pub/Sub / expiry assertion helpers.

## Overview

`@kiwa-test/cache` is the Layer 2 adapter that turns a cache-shaped Layer 1 spec into a runnable Vitest suite. One factory (`setupCacheEnv`) exposes two backends:

- **`mode: 'in-memory'`** (default) — in-process Redis-shaped fake. Deterministic, offline, zero peer dependencies.
- **`mode: 'testcontainers'`** — real Redis under Docker via `testcontainers`, wired to either `ioredis` (default) or `redis` (node-redis v4).

Backend selection is a one-argument change and the assertion surface is identical across both.

## Install

```bash
pnpm add -D @kiwa-test/cache @kiwa-test/core vitest
# testcontainers mode also needs:
pnpm add -D testcontainers ioredis           # or: pnpm add -D testcontainers redis
```

`ioredis`, `redis`, and `testcontainers` are optional peer dependencies — none of them is imported by the in-memory path, so the fast lane runs with zero infrastructure.

## Quick start — in-memory

```ts
import { setupCacheEnv } from "@kiwa-test/cache";

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
import { setupCacheEnv } from "@kiwa-test/cache";

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

## Coverage snapshot (v0.1.0)

The in-memory backend is covered by 32 unit tests + 8 signup-flow PoC tests inside `examples/cache-redis-poc/`. TTL semantics use a 1-second real timer to prove eventual expiry.
