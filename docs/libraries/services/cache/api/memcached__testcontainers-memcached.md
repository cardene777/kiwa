---
title: "@kiwa-lab/cache memcached__testcontainers-memcached の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/cache</code> <code v-pre>memcached&#95;&#95;testcontainers-memcached</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/cache/src/memcached/testcontainers-memcached.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>createTestcontainersMemcachedEnv</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/cache/src/memcached/testcontainers-memcached.ts#L21) <code v-pre>packages/cache/src/memcached/testcontainers-memcached.ts</code>

Build a testcontainers-backed Memcached env. When `opts.testcontainers?.url` is provided the helper connects directly to that URL and verifies responsiveness. Otherwise the helper would spawn a real container — kept behind an explicit `url` opt-in for the v0.2 scope so callers wanting fully-managed containers can layer their own testcontainers wrapper on top. The wire path shares the stub simulation for entry state (so assertion helpers stay deterministic) while surfacing the Memcached endpoint URL on the env for callers that want to point their own `memjs` / `memcached` client at it.

```ts
export declare function createTestcontainersMemcachedEnv(opts: SetupMemcachedEnvOptions): Promise<MemcachedTestEnv<'live'>>;
```


