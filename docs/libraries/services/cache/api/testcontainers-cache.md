---
title: "@kiwa-lab/cache testcontainers-cache の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/cache</code> <code v-pre>testcontainers-cache</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/cache/src/testcontainers-cache.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>createTestcontainersCacheEnv</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/cache/src/testcontainers-cache.ts#L270) <code v-pre>packages/cache/src/testcontainers-cache.ts</code>

Build a testcontainers-backed Redis cache environment. Requires Docker; the chosen real client (`ioredis` or `redis`) does the heavy lifting so semantic drift from prod is limited to whatever that client abstracts.

```ts
export declare function createTestcontainersCacheEnv(opts: SetupCacheEnvOptions): Promise<CacheTestEnv<'live'>>;
```


