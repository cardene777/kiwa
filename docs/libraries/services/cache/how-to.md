# @kiwa-lab/cache 使い方

provider の名前ではなく、application が依存する振る舞いから test を選びます。Redis は TTL と Pub Sub、Memcached は既存値だけの更新と counter、KeyDB は master 間の可視化を確認します。どの factory も既定では process 内の環境を作るため、最初の test に Docker は必要ありません。

次の file を `tests/cache-behavior.test.ts` として保存してください。各 case は自分で作った environment を必ず停止するので、同じ process 内の別の test を汚しません。

```ts
import { describe, expect, it } from "vitest";
import {
  setupCacheEnv,
  setupKeyDBEnv,
  setupMemcachedEnv,
} from "@kiwa-lab/cache";

describe("cache behavior", () => {
  it("delivers a Redis invalidation message and closes the subscriber", async () => {
    const redis = await setupCacheEnv();
    const subscription = await redis.subscribe("cache-invalidate");

    try {
      await redis.publish("cache-invalidate", "session:1");
      expect((await subscription.next()).message).toBe("session:1");
      await redis.assertPublished("cache-invalidate", { match: "session:1" });
    } finally {
      await subscription.close();
      await redis.stop();
    }
  });

  it("keeps a Memcached key on its hash-ring owner and updates an existing value", async () => {
    const memcached = await setupMemcachedEnv({ servers: ["a", "b", "c"] });

    try {
      const owner = memcached.serverFor("rate:alice");
      expect(await memcached.add("rate:alice", "1", { ttlSeconds: 60 })).toBe(true);
      expect(await memcached.replace("rate:alice", "2")).toBe(true);
      expect(await memcached.increment("rate:alice")).toBe(3);
      expect(memcached.serverFor("rate:alice")).toBe(owner);
    } finally {
      await memcached.stop();
    }
  });

  it("requires an explicit wait before another KeyDB master can read a lagged write", async () => {
    const keydb = await setupKeyDBEnv({
      cluster: ["m-a", "m-b"],
      stub: { replicationLagMs: 50 },
    });

    try {
      await keydb.set("profile:1", "ready", { master: "m-a" });
      expect(await keydb.get("profile:1", { master: "m-a" })).toBe("ready");
      expect(await keydb.get("profile:1", { master: "m-b" })).toBeNull();
      await new Promise((resolve) => setTimeout(resolve, 80));
      expect(await keydb.get("profile:1", { master: "m-b" })).toBe("ready");
    } finally {
      await keydb.stop();
    }
  });
});
```

実行対象はこの file だけです。

```bash
pnpm exec vitest run tests/cache-behavior.test.ts
```

Redis の message が届かないときは、subscribe と publish が同じ environment と同じ channel を使っていること、`next()` を待つ前に subscription を閉じていないことを確認してください。Memcached の `replace` が `false` なら対象 key は存在していません。KeyDB の二つ目の read がすぐ成功するなら、`replicationLagMs` を指定していないか、同じ master を読んでいます。

## 実接続を追加する

Redis で client wire と server の組み合わせを確認する scenario だけ `setupCacheEnv({ mode: "testcontainers", redis: { url } })` を使います。Memcached と KeyDB も同様に `mode: "testcontainers"` と外部 URL を指定します。Docker、image、対応する client peer dependency が必要です。

in-memory と stub が確認するのは application が行う key、TTL、message、replication lag の契約です。Redis Cluster の topology、network partition、eviction、KeyDB conflict resolution、実 Memcached node の障害は対象外です。実 server の configuration と監視を含む integration test を別途持ってください。
