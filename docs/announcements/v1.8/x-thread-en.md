# x.com draft — English thread (v1.8 new layers voice)

> Posting from ... [@cardene777](https://x.com/cardene777)
> Voice ... first-person / solo dev / "SaaS prod needs" maker tone
> Limit ... 280 chars / tweet, thread of 8

---

## [1/8]

kiwa v1.8 just landed (6/6 Issue resolved). After deepening polyglot to 6 web frameworks in v1.5-v1.7, v1.8 pivots to **3 new layers for SaaS prod testing** — auth, job queue, cache.

https://github.com/cardene777/kiwa

#OSS #testing

---

## [2/8]

What grew in v1.8:

- npm packages: 20 → 23 (+ auth / queue / cache)
- Claude Code skills: 27 → 30 (+ kiwa-auth / kiwa-queue / kiwa-cache)
- Layer 1 spec layers: 19 → 22 (+ 3)
- Auth providers: 0 → 3 (NextAuth v5 + Lucia v3 + Better Auth)
- Queue providers: 0 → 2 (BullMQ + Inngest)
- Cache providers: 0 → 1 (Redis)

---

## [3/8]

`@kiwa-lab/auth` v0.1:

- **NextAuth v5 (Auth.js)** — session mock (jwt/db) + 3 providers (Google/GitHub/Email) + Prisma/Drizzle
- **Lucia v3** — bare-metal session (fresh + rolling refresh) + password (Argon2) + SQLite/PG
- **Better Auth** — email/password + magic link + 2FA TOTP + passkey + organizations

All 3 dominant 2026 providers covered.

---

## [4/8]

`@kiwa-lab/queue` v0.1:

- **BullMQ** — sandbox (in-process) + testcontainers (real Redis) modes
- **Inngest** — stub (deterministic) + dev-server (real HTTP) modes
- Retry / step function / concurrency cap semantics reproduced

---

## [5/8]

`@kiwa-lab/cache` v0.1:

- **Redis** — in-memory (default) + testcontainers (real + ioredis/node-redis) modes
- 8 helpers — get/set/delete/TTL/expire/Pub/Sub/publish/subscribe
- Namespace isolation prevents multi-env test case interference

Pub/Sub race bug fixed via `cursor` field.

---

## [6/8]

Example — Better Auth 2FA test:

```ts
const env = setupBetterAuthEnv({
  plugins: ["emailAndPassword", "twoFactor"],
});
await env.signUp({ email, password });
await env.enableTwoFactor(userId);
const code = env.generateTotpCode(userId);
await env.verifyTwoFactor(userId, code);
```

TOTP verified deterministically.

---

## [7/8]

Example — Inngest step function retry:

```ts
const env = setupInngestEnv({
  mode: "stub",
  functions: [{ id: "onboard", retries: 3 }],
});
await env.sendEvent("user.created", { userId: 1 });
await env.waitForRun("onboard");
env.assertRetried("onboard", 2);
env.assertStepRan("send-welcome");
```

---

## [8/8]

v1.9 candidates: Rust contract layer (alloy.rs stable) / Storybook / Go Iris+Chi / more auth (Clerk/Auth0) / more queue (SQS/RabbitMQ) / more cache (Memcached).

Drop requests on Discussions:

https://github.com/cardene777/kiwa/discussions

#testing #nextjs #saas
