---
title: "@kiwa-lab/cache setup-cache-env の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/cache</code> <code v-pre>setup-cache-env</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/cache/src/setup-cache-env.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>setupCacheEnv</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/cache/src/setup-cache-env.ts#L16) <code v-pre>packages/cache/src/setup-cache-env.ts</code>

Factory for Redis cache test environments. `mode: 'in-memory'` (default) returns a fast, in-process Redis-shaped fake — no Docker, no peer dependencies required beyond the fixture package itself. Use it for the fast unit-test lane. `mode: 'testcontainers'` boots a real Redis under testcontainers and wires up either `ioredis` or `redis` (node-redis v4) as the client. Use it for the integration lane that needs prod-shape parity.

```ts
export declare function setupCacheEnv(opts?: SetupCacheEnvOptions): Promise<CacheTestEnv>;
```


