---
title: "@kiwa-lab/cache memcached__stub-memcached の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/cache</code> <code v-pre>memcached&#95;&#95;stub-memcached</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/cache/src/memcached/stub-memcached.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>createStubMemcachedEnv</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/cache/src/memcached/stub-memcached.ts#L66) <code v-pre>packages/cache/src/memcached/stub-memcached.ts</code>

Build an in-process stub of Memcached covering the 8 core commands (get / set / delete / add / replace / increment / decrement / flush) + TTL + multi-server consistent hashing — deterministically, without spinning up a container.

```ts
export declare function createStubMemcachedEnv(opts: SetupMemcachedEnvOptions): MemcachedTestEnv<'mock'>;
```


