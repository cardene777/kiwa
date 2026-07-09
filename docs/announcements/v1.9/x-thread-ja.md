# x.com 投稿用下書き — 日本語 thread (v1.9 provider 増強 voice)

> 投稿先 ... [@cardene777](https://x.com/cardene777)
> Voice ... 本人名義 / 個人 dev 視点 / 「prod cover 率 90%」 maker トーン
> 全 8 ツイート、 番号 [1/8] 付き

---

## [1/8]

polyglot test toolchain 「kiwa」 v1.9 (6/6 resolved) が land しました。

v1.8 で 3 新 layer (auth / queue / cache) 1 provider ずつ land した後、 v1.9 は **各 layer に 2 provider 追加 (合計 +6)** で prod cover 率 90% 到達。

https://github.com/cardene777/kiwa

#OSS #testing

---

## [2/8]

v1.9 で増えた provider。

- auth 3 → 5 (+ Clerk + Auth0)
- queue 2 → 4 (+ Cloudflare Queues + SQS)
- cache 1 → 3 (+ Memcached + KeyDB)
- npm package version ... v0.1 → v0.2 (auth / queue / cache)
- skill 数 ... 30 維持 (`--provider` flag 拡張のみ)
- plugin version ... 1.8.0 → 1.9.0

---

## [3/8]

@kiwa-lab/auth v0.2 ...

- **Clerk** ... user + session + orgs mock、 `signIn` / `assertSignedIn` / `assertOrgRole`、 publicMetadata / privateMetadata 区別維持
- **Auth0** ... tenant + rules pipeline + Management API mock、 post-login rule 実行順序を production 準拠に再現

Clerk (SaaS 2026 dominant) + Auth0 (enterprise dominant) 2 大 provider が試せる。

---

## [4/8]

@kiwa-lab/queue v0.2 ...

- **Cloudflare Queues** ... miniflare (in-process) + wrangler (real subprocess)、 consumer batch + ack/retry/DLQ + `maxBatchSize` chunking
- **AWS SQS** ... stub + localstack、 standard + FIFO queue (`messageGroupId` + dedup)、 batch (10 entries cap) + visibility timeout + long polling + DLQ redrive

edge queue と AWS 定番 queue 両方対応。

---

## [5/8]

@kiwa-lab/cache v0.2 ...

- **Memcached** ... stub + testcontainers、 8 core command (get/set/delete/add/replace/incr/decr/flush) + multi-server consistent hashing (FNV-1a + 128 vnode)
- **KeyDB** ... stub + testcontainers、 Redis 互換 + multi-master replication (`{ master }` option) + cross-region Pub/Sub + replicationLag 模擬

legacy Memcached + Redis 互換高性能 KeyDB。

---

## [6/8]

Layer 1 spec + skill chain に `--provider` flag 追加。

```
/kiwa-design --layer auth --provider clerk
/kiwa-queue --provider sqs --module order-processing
/kiwa-cache --provider keydb --module multi-region
```

provider ごとの spec 生成 + test 生成が 1 引数で切替可。

---

## [7/8]

「1 provider だけ land」 の空白が消えた。

- Clerk 使う SaaS ... v1.8 時点は自前 mock、 v1.9 で `setupClerkEnv`
- SQS 使う prod ... v1.8 時点は諦めるか自前、 v1.9 で `setupSQSEnv`
- KeyDB 使う high-perf ... v1.8 時点は Redis で妥協、 v1.9 で `setupKeyDBEnv`

SaaS の 「production stack と test toolchain を揃えたい」 需要をカバー。

---

## [8/8]

v1.10 候補 (Discussions 板で priority 投票中)。

- Rust contract layer (Foundry-rs / alloy.rs)
- Supabase Auth (SaaS + DB 一体型)
- RabbitMQ (self-host queue)
- Storybook integration
- Dragonfly (2025 新興)
- Go Iris + Chi

https://github.com/cardene777/kiwa/discussions

#OSS #Claude #testing
