---
name: kiwa-cache
description: |
  /kiwa-design (Layer 1) が出力した `tests/spec/integration/test-spec-{module}.cache.md` を入力に、 `@kiwa/cache` を使う `test/*.cache.test.ts` を Write して `vitest` で動作確認する Layer 2 cache test skill。
  11 観点 (正常系 / 異常系 / 境界値 / 状態遷移 / 権限 / 入力バリデーション / 冪等性 / 並行処理 / 性能 / セキュリティ / 回帰) を 3 provider (`setupCacheEnv` Redis / `setupMemcachedEnv` Memcached / `setupKeyDBEnv` KeyDB) × 2 backend (stub/in-memory + testcontainers) + client 選択 (ioredis / node-redis / memjs / memcached) に変換し、 get / set / delete / TTL / expiry / Pub/Sub / consistent-hash / multi-master の sub-feature を 1 spec で cover する。
user_invocable: true
context: conversation
agent: general-purpose
allowed-tools: Bash, Read, Glob, Grep, Write, Edit
---

# /kiwa-cache — Layer 2 cache test skill

`/kiwa-design` (Layer 1) の `--layer cache` 出力を `test/*.cache.test.ts` に変換し、 `vitest` で動作確認する。 Redis (in-memory fake + testcontainers real) を統一 surface で cover する Layer 2 skill。

`@kiwa/cache` v0.1 (v1.8-6、 Issue #642) の `setupCacheEnv` factory を Layer 1 spec の観点別 TC 表から自動的に選択し、 in-memory / testcontainers 2 backend + ioredis / node-redis 2 client を TC ごとに割当てる。

## 前提

- `@kiwa/cache` v0.1.0+ が devDependency に入っている (`pnpm add -D @kiwa/cache`)
- testcontainers mode 使用時は `testcontainers` + `ioredis` (default) または `redis` (node-redis) が peer dependency として入っている
- Layer 1 spec (`tests/spec/integration/test-spec-{module}.cache.md`) が存在

## ユーザーのリクエスト

$ARGUMENTS

## オプション

- `--module {name}` — Layer 1 spec の module 名 (`tests/spec/integration/test-spec-{name}.cache.md` を Read)
- `--spec-path {path}` — Layer 1 spec の path を明示 (`--module` の代替)
- `--provider {redis|memcached|keydb}` — cache provider 選択 (default `redis` = v1.8-6 setupCacheEnv、 v1.9-5 で `memcached`、 v1.9-6 で `keydb` 追加)
- `--mode {in-memory|stub|testcontainers|auto}` — backend 選択 (default `auto` = 高速 backend (Redis=in-memory、 Memcached/KeyDB=stub) を優先し、 spec が testcontainers を要求する TC のみ切替)
- `--client {ioredis|node-redis|memjs|memcached}` — testcontainers mode 時の client 選択 (default provider 依存 — redis/keydb=`ioredis`、 memcached=`memjs`)
- `--output {path}` — test file 出力先 (default `tests/{module}.cache.test.ts`)
- `--lang {ja|en|<ISO 639-1>}` — report 生成言語
- `--no-run` — `vitest` 実行を skip (Write のみ)
- `--no-review` — Step 4 の kiwa-review 自動呼出 (test-review) を skip

## 実行フロー

### Step 0: 文書生成言語 (skill 起動時 1 回)

AskUserQuestion で言語確認、 `--lang` 指定時 skip。

### Step 1: Layer 1 spec 読込 + provider / backend / client 判定

`tests/spec/integration/test-spec-{module}.cache.md` を Read、 各 TC の 「対象 provider」 (v1.9-6 追加) + 「対象 mode」 + 「対象 client」 column から `redis` vs `memcached` vs `keydb`、 fast backend (Redis=in-memory、 Memcached/KeyDB=stub) vs testcontainers、 client 選択を判定。

### Step 2: test code 生成 (provider 別 factory)

TC 表を describe / it に落とす。 provider ごとに使う factory が違う。

- **`--provider redis`** ... `setupCacheEnv` を呼び、 `env.set` / `env.get` / `env.assertTTL` / `env.subscribe` / `env.publish` / `env.assertPublished` を観点別に組合わせる (v1.8-6)。
- **`--provider memcached`** ... `setupMemcachedEnv` を呼び、 8 core command (get / set / delete / add / replace / increment / decrement / flush) + `env.assertTTL` + `env.serverFor` (consistent hashing) を組合わせる (v1.9-5)。
- **`--provider keydb`** ... `setupKeyDBEnv` を呼び、 Redis 互換 surface + multi-master (`{ master }` option) + Pub/Sub cross-region を組合わせる (v1.9-6)。

生成テンプレ (mode = in-memory、 TTL 検証 TC):

```ts
import { setupCacheEnv } from "@kiwa/cache";
import { afterEach, describe, expect, it } from "vitest";

const envs: Array<{ stop(): Promise<void> }> = [];
afterEach(async () => {
  while (envs.length > 0) await envs.pop()!.stop();
});

describe("{module} — cache TTL", () => {
  it("T-CACHE-001 attaches a 60s TTL to a session key", async () => {
    const env = await setupCacheEnv();
    envs.push(env);
    await env.set("session:1", "user-1", { ttlSeconds: 60 });
    await env.assertTTL("session:1", { atLeast: 59, atMost: 60 });
  });
});
```

生成テンプレ (mode = in-memory、 Pub/Sub 検証 TC):

```ts
describe("{module} — cache pub/sub", () => {
  it("T-CACHE-002 delivers an invalidation event to a subscriber", async () => {
    const env = await setupCacheEnv();
    envs.push(env);
    const sub = await env.subscribe("session.invalidated");
    await env.publish("session.invalidated", '{"sessionId":"sess-1"}');
    const msg = await sub.next();
    expect(msg.message).toContain("sess-1");
    await sub.close();
  });
});
```

### Step 3: vitest 実行

`pnpm vitest run {output_path}` で走らせる。 testcontainers mode は Docker 起動時間を含めた 60s timeout を採用する。

### Step 4: /kiwa-review test-review 自動呼出

`--no-review` 未指定なら `/kiwa-review --mode test-review --layer cache --module {module}` を chain 呼出。

## 完了条件

- test file が `{output}` に Write されている
- `vitest run` が exit 0
- kiwa-review test-review report が生成されている (`--no-review` 未指定時)

## 他 kiwa skill との chain 連携

- 上流 ... `/kiwa-design --layer cache` (Layer 1 spec 生成)
- 下流 ... `/kiwa-review --mode test-review --layer cache` (test 品質 review)
- 統合 ... `/kiwa-test --target cache` で Layer 1 → Layer 2 → review を 1 コマンド chain

## 関連

- `@kiwa/cache` v0.1 (v1.8-6、 Issue #642) SSOT
- `packages/cache/README.md` — API リファレンス
- `examples/cache-redis-poc/` — 実 test 例 (signup session 8 test)
