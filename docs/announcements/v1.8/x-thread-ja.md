# x.com 投稿用下書き — 日本語 thread (v1.8 新 layer voice)

> 投稿先 ... [@cardene777](https://x.com/cardene777)
> Voice ... 本人名義 / 個人 dev 視点 / 「SaaS prod 需要」 maker トーン
> 全 8 ツイート、 番号 [1/8] 付き

---

## [1/8]

polyglot test toolchain 「kiwa」 v1.8 (6/6 resolved) が land しました。

v1.5-v1.7 で polyglot Web を 6 web framework まで縦深化した後、 v1.8 は **SaaS prod 需要 3 分野 (auth / queue / cache)** を land。

https://github.com/cardene777/kiwa

#OSS #testing

---

## [2/8]

v1.8 で増えたもの。

- npm package ... 20 → 23 (+ auth / queue / cache)
- Claude Code skill ... 27 → 30 (+ kiwa-auth / kiwa-queue / kiwa-cache)
- Layer 1 spec layer ... 19 → 22 (+ 3)
- auth provider ... 0 → 3 (NextAuth v5 + Lucia v3 + Better Auth)
- queue provider ... 0 → 2 (BullMQ + Inngest)
- cache provider ... 0 → 1 (Redis)

---

## [3/8]

@kiwa-test/auth v0.1 ...

- **NextAuth v5 (Auth.js)** ... session mock (jwt/database) + 3 provider (Google/GitHub/Email) + Prisma/Drizzle
- **Lucia v3** ... bare-metal session (fresh flag + rolling refresh) + password (Argon2) + SQLite/PG
- **Better Auth** ... email/password + magic link + 2FA TOTP + passkey + organizations

2026 dominant 3 provider 全対応。

---

## [4/8]

@kiwa-test/queue v0.1 ...

- **BullMQ** ... sandbox (in-process) + testcontainers (real Redis) 2 mode
- **Inngest** ... stub (deterministic) + dev-server (real HTTP) 2 mode
- retry / step function / concurrency cap の 3 semantics 再現

---

## [5/8]

@kiwa-test/cache v0.1 ...

- **Redis** ... in-memory (default) + testcontainers (real + ioredis/node-redis) 2 mode
- 8 helper ... get/set/delete/TTL/expire/Pub/Sub/publish/subscribe
- namespace isolation で multi-env test case 干渉なし

Pub/Sub race bug も cursor field で解消済。

---

## [6/8]

例 ... Better Auth 2FA test

```ts
const env = setupBetterAuthEnv({
  plugins: ["emailAndPassword", "twoFactor"],
});
await env.signUp({ email, password });
await env.enableTwoFactor(userId);
const code = env.generateTotpCode(userId);
await env.verifyTwoFactor(userId, code);
```

TOTP を deterministic に検証できる。

---

## [7/8]

例 ... Inngest step function retry

```ts
const env = setupInngestEnv({
  mode: "stub",
  functions: [{ id: "onboard", retries: 3 }],
});
await env.sendEvent("user.created", { userId: 1 });
await env.waitForRun("onboard");
env.assertRetried("onboard", 2);  // 2 回 retry したことを検証
env.assertStepRan("send-welcome");
```

---

## [8/8]

v1.9 候補 = Rust contract layer (alloy.rs 解禁済) / Storybook / Go Iris + Chi / 追加 auth (Clerk/Auth0) / 追加 queue (SQS/RabbitMQ) / 追加 cache (Memcached)。

要望は Discussions で。

https://github.com/cardene777/kiwa/discussions

#testing #nextjs #saas
