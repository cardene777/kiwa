# x.com draft — English thread (v1.9 provider expansion voice)

> Author ... [@cardene777](https://x.com/cardene777)
> Voice ... first-person / individual dev / "prod coverage 90%" maker tone
> 8 tweets total, numbered [1/8]

---

## [1/8]

kiwa v1.9 (6/6 resolved) just landed.

After v1.8 landed 3 new layers (auth / queue / cache) with 1 provider each, v1.9 doubles that: **+2 providers per layer = 6 new providers total**, taking prod coverage to ~90%.

https://github.com/cardene777/kiwa

#OSS #testing

---

## [2/8]

What v1.9 adds.

- auth providers 3 → 5 (+ Clerk + Auth0)
- queue providers 2 → 4 (+ Cloudflare Queues + SQS)
- cache providers 1 → 3 (+ Memcached + KeyDB)
- npm packages v0.1 → v0.2 (auth / queue / cache)
- skills stays at 30 (added `--provider` flag)
- plugin version 1.8.0 → 1.9.0

---

## [3/8]

@kiwa-test/auth v0.2 ...

- **Clerk** — user + session + orgs mock, `signIn` / `assertSignedIn` / `assertOrgRole` helpers, publicMetadata / privateMetadata distinction preserved
- **Auth0** — tenant + rules pipeline + Management API mock, post-login rules execute in the same order as prod

Two dominant 2026 providers now testable: SaaS-first Clerk + enterprise-first Auth0.

---

## [4/8]

@kiwa-test/queue v0.2 ...

- **Cloudflare Queues** — miniflare (in-process) + wrangler (real subprocess), consumer batch + ack/retry/DLQ + `maxBatchSize` chunking
- **AWS SQS** — stub + localstack, standard + FIFO (`messageGroupId` + dedup), batch (10 cap) + visibility timeout + long polling + DLQ redrive

Edge queue + AWS-classic queue both covered.

---

## [5/8]

@kiwa-test/cache v0.2 ...

- **Memcached** — stub + testcontainers, 8 core commands (get/set/delete/add/replace/incr/decr/flush), multi-server consistent hashing (FNV-1a + 128 vnodes)
- **KeyDB** — stub + testcontainers, Redis-compatible surface + KeyDB's active multi-master replication + cross-region Pub/Sub + optional simulated replication lag

Legacy Memcached + Redis-compatible high-perf KeyDB.

---

## [6/8]

Layer 1 spec + skill chain now honour a `--provider` flag.

```
/kiwa-design --layer auth --provider clerk
/kiwa-queue --provider sqs --module order-processing
/kiwa-cache --provider keydb --module multi-region
```

Provider-specific spec + test generation is a single-arg change.

---

## [7/8]

The "one provider per layer" gap is gone.

- Clerk SaaS teams — v1.8 needed hand-rolled mocks, v1.9 gets `setupClerkEnv`
- SQS-shaped prods — v1.8 skipped or hand-rolled, v1.9 gets `setupSQSEnv`
- KeyDB high-perf stacks — v1.8 fell back to Redis, v1.9 gets `setupKeyDBEnv` with multi-master

SaaS teams that want their prod stack to match their test toolchain — that's the v1.9 audience.

---

## [8/8]

v1.10 candidates (priority poll live on Discussions).

- Rust contract layer (Foundry-rs / alloy.rs)
- Supabase Auth (SaaS + DB combined)
- RabbitMQ (self-host queue)
- Storybook integration
- Dragonfly (2025 emerging cache — waiting for ecosystem)
- Go Iris + Chi

https://github.com/cardene777/kiwa/discussions

#OSS #Claude #testing
