---
title: "@kiwa-lab/cache memcached__setup-memcached-env の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/cache</code> <code v-pre>memcached&#95;&#95;setup-memcached-env</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/cache/src/memcached/setup-memcached-env.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>setupMemcachedEnv</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/cache/src/memcached/setup-memcached-env.ts#L20) <code v-pre>packages/cache/src/memcached/setup-memcached-env.ts</code>

Factory for Memcached test environments. `mode: 'stub'` (default) returns a fast, in-process fake — no docker, no network. Deterministic enough to exercise the 8 core Memcached commands (get / set / delete / add / replace / increment / decrement / flush) plus TTL and multi-server consistent hashing. `mode: 'testcontainers'` connects to a running Memcached endpoint (URL provided via `testcontainers.url`) and verifies TCP responsiveness before returning the env. The env still drives entry state in-process (v0.2 scope) so assertions stay deterministic across backends; callers that want to exercise the real wire can point their own `memjs` / `memcached` client at the exposed `env.memcachedUrl`.

```ts
export declare function setupMemcachedEnv(opts?: SetupMemcachedEnvOptions): Promise<MemcachedTestEnv>;
```


