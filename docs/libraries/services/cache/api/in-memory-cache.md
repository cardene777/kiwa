---
title: "@kiwa-lab/cache in-memory-cache の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/cache</code> <code v-pre>in-memory-cache</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/cache/src/in-memory-cache.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>createInMemoryCacheEnv</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/cache/src/in-memory-cache.ts#L34) <code v-pre>packages/cache/src/in-memory-cache.ts</code>

Build an in-memory (offline, in-process) Redis-shaped cache environment. Suitable for unit tests that need to exercise the get / set / delete / TTL / Pub/Sub loop without spinning up a Redis container.

```ts
export declare function createInMemoryCacheEnv(opts: SetupCacheEnvOptions): CacheTestEnv<'mock'>;
```


