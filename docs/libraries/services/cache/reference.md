# @kiwa-lab/cache リファレンス

## Redis environment

`setupCacheEnv` は Redis 用の `CacheTestEnv` を返します。`get`、`set`、`delete`、`expire`、`ttl`、`flushAll` で key を操作します。`set` の `ttlSeconds` は optional ですが、指定する場合は正の値が必要です。

`assertTTL` は `seconds`、`atLeast`、`atMost` で TTL を確認します。`publish` は subscriber count を返し、`subscribe` は `next()`、`received()`、`close()` を持つ subscription を返します。`assertPublished` は指定した timeout 内で string または `RegExp` に一致する message を待ちます。

## mode と依存

Redis の mode は `in-memory` と `testcontainers` です。in-memory path は Redis client を import しません。testcontainers path には実 Redis または external URL と、`ioredis` または node-redis が必要です。

Memcached と KeyDB の mode は `stub` と `testcontainers` です。Memcached の `ttlSeconds: 0` は expiry を付けません。`decrement` は 0 未満にならず、0 で clamp します。KeyDB の stub は replication lag を設定でき、write が他 master へ届くまでを検証できます。

## lifecycle

`stop()` は subscription、client、container を終了します。`flushAll()` は同一 environment の key だけを消します。複数 test が同じ environment を共有する場合、cleanup の順序と key namespace を明示しない限り、test ごとの environment を作成してください。

<!-- kiwa-public-api:start -->
## エラー診断

次の一覧は、公開 entry point から到達する実装が明示的に送出する Error と TypeError です。template literal の値は実行時の入力で置き換わります。

| 送出する message | 発生箇所 |
| --- | --- |
| <code v-pre>set: ttlSeconds must be positive</code> | [packages/cache/src/in-memory-cache.ts](https://github.com/cardene777/kiwa/blob/main/packages/cache/src/in-memory-cache.ts#L111) |
| <code v-pre>expire: ttlSeconds must be positive</code> | [packages/cache/src/in-memory-cache.ts](https://github.com/cardene777/kiwa/blob/main/packages/cache/src/in-memory-cache.ts#L127) |
| <code v-pre>subscribe: channel "$&#123;channel&#125;" is closed</code> | [packages/cache/src/in-memory-cache.ts](https://github.com/cardene777/kiwa/blob/main/packages/cache/src/in-memory-cache.ts#L172) |
| <code v-pre>assertPublished: no message on "$&#123;channel&#125;" matched $&#123;describeMatch(expected.match)&#125; within $&#123;timeoutMs&#125;ms</code> | [packages/cache/src/in-memory-cache.ts](https://github.com/cardene777/kiwa/blob/main/packages/cache/src/in-memory-cache.ts#L240) |
| <code v-pre>assertTTL: expected TTL=$&#123;expected.seconds&#125;s on "$&#123;key&#125;", observed $&#123;observed&#125;</code> | [packages/cache/src/in-memory-cache.ts](https://github.com/cardene777/kiwa/blob/main/packages/cache/src/in-memory-cache.ts#L301) |
| <code v-pre>assertTTL: expected TTL&gt;=$&#123;expected.atLeast&#125;s on "$&#123;key&#125;", observed $&#123;observed&#125;</code> | [packages/cache/src/in-memory-cache.ts](https://github.com/cardene777/kiwa/blob/main/packages/cache/src/in-memory-cache.ts#L308) |
| <code v-pre>assertTTL: expected TTL&lt;=$&#123;expected.atMost&#125;s on "$&#123;key&#125;", observed $&#123;observed&#125;</code> | [packages/cache/src/in-memory-cache.ts](https://github.com/cardene777/kiwa/blob/main/packages/cache/src/in-memory-cache.ts#L313) |
| <code v-pre>assertTTL: at least one of &#123; seconds, atLeast, atMost &#125; must be provided</code> | [packages/cache/src/in-memory-cache.ts](https://github.com/cardene777/kiwa/blob/main/packages/cache/src/in-memory-cache.ts#L322) |
| <code v-pre>setupCacheEnv: cannot $&#123;op&#125; after stop()</code> | [packages/cache/src/in-memory-cache.ts](https://github.com/cardene777/kiwa/blob/main/packages/cache/src/in-memory-cache.ts#L78) |
| <code v-pre>setupKeyDBEnv: unknown mode "$&#123;String(mode)&#125;" — expected "stub" or "testcontainers"</code> | [packages/cache/src/keydb/setup-keydb-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/cache/src/keydb/setup-keydb-env.ts#L23) |
| <code v-pre>set: ttlSeconds must be &gt; 0 (omit for no expiry)</code> | [packages/cache/src/keydb/stub-keydb.ts](https://github.com/cardene777/kiwa/blob/main/packages/cache/src/keydb/stub-keydb.ts#L148) |
| <code v-pre>expire: ttlSeconds must be &gt; 0</code> | [packages/cache/src/keydb/stub-keydb.ts](https://github.com/cardene777/kiwa/blob/main/packages/cache/src/keydb/stub-keydb.ts#L164) |
| <code v-pre>assertTTL: key "$&#123;key&#125;" expected TTL $&#123;expected.seconds&#125;s, observed $&#123;observed&#125;s</code> | [packages/cache/src/keydb/stub-keydb.ts](https://github.com/cardene777/kiwa/blob/main/packages/cache/src/keydb/stub-keydb.ts#L184) |
| <code v-pre>assertTTL: key "$&#123;key&#125;" expected TTL &gt;= $&#123;expected.atLeast&#125;s, observed $&#123;observed&#125;s</code> | [packages/cache/src/keydb/stub-keydb.ts](https://github.com/cardene777/kiwa/blob/main/packages/cache/src/keydb/stub-keydb.ts#L189) |
| <code v-pre>assertTTL: key "$&#123;key&#125;" expected TTL &lt;= $&#123;expected.atMost&#125;s, observed $&#123;observed&#125;s</code> | [packages/cache/src/keydb/stub-keydb.ts](https://github.com/cardene777/kiwa/blob/main/packages/cache/src/keydb/stub-keydb.ts#L194) |
| <code v-pre>assertPublished: no message on "$&#123;channel&#125;" matched $&#123;String(expected.match)&#125; within $&#123;timeoutMs&#125;ms</code> | [packages/cache/src/keydb/stub-keydb.ts](https://github.com/cardene777/kiwa/blob/main/packages/cache/src/keydb/stub-keydb.ts#L281) |
| <code v-pre>setupKeyDBEnv: cannot use env after stop()</code> | [packages/cache/src/keydb/stub-keydb.ts](https://github.com/cardene777/kiwa/blob/main/packages/cache/src/keydb/stub-keydb.ts#L45) |
| <code v-pre>KeyDBEnv: master "$&#123;preferred&#125;" is not part of the cluster (known: $&#123;JSON.stringify(cluster)&#125;)</code> | [packages/cache/src/keydb/stub-keydb.ts](https://github.com/cardene777/kiwa/blob/main/packages/cache/src/keydb/stub-keydb.ts#L51) |
| <code v-pre>KeyDBEnv: cluster has no masters — cannot resolve a target master</code> | [packages/cache/src/keydb/stub-keydb.ts](https://github.com/cardene777/kiwa/blob/main/packages/cache/src/keydb/stub-keydb.ts#L58) |
| <code v-pre>setupKeyDBEnv: mode="testcontainers" requires testcontainers.url (v0.2 scope). Provide the URL of a running KeyDB instance, or use mode="stub" for zero-infra tests.</code> | [packages/cache/src/keydb/testcontainers-keydb.ts](https://github.com/cardene777/kiwa/blob/main/packages/cache/src/keydb/testcontainers-keydb.ts#L20) |
| <code v-pre>setupKeyDBEnv: KeyDB URL "$&#123;url&#125;" — port "$&#123;portStr&#125;" is not a valid integer</code> | [packages/cache/src/keydb/testcontainers-keydb.ts](https://github.com/cardene777/kiwa/blob/main/packages/cache/src/keydb/testcontainers-keydb.ts#L83) |
| <code v-pre>setupMemcachedEnv: unknown mode "$&#123;String(mode)&#125;" — expected "stub" or "testcontainers"</code> | [packages/cache/src/memcached/setup-memcached-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/cache/src/memcached/setup-memcached-env.ts#L25) |
| <code v-pre>assertTTL: key "$&#123;key&#125;" expected TTL $&#123;expected.seconds&#125;s, observed $&#123;observed&#125;s</code> | [packages/cache/src/memcached/stub-memcached.ts](https://github.com/cardene777/kiwa/blob/main/packages/cache/src/memcached/stub-memcached.ts#L193) |
| <code v-pre>assertTTL: key "$&#123;key&#125;" expected TTL &gt;= $&#123;expected.atLeast&#125;s, observed $&#123;observed&#125;s</code> | [packages/cache/src/memcached/stub-memcached.ts](https://github.com/cardene777/kiwa/blob/main/packages/cache/src/memcached/stub-memcached.ts#L198) |
| <code v-pre>assertTTL: key "$&#123;key&#125;" expected TTL &lt;= $&#123;expected.atMost&#125;s, observed $&#123;observed&#125;s</code> | [packages/cache/src/memcached/stub-memcached.ts](https://github.com/cardene777/kiwa/blob/main/packages/cache/src/memcached/stub-memcached.ts#L203) |
| <code v-pre>MemcachedEnv: no servers configured — cannot resolve a server for the key</code> | [packages/cache/src/memcached/stub-memcached.ts](https://github.com/cardene777/kiwa/blob/main/packages/cache/src/memcached/stub-memcached.ts#L48) |
| <code v-pre>setupMemcachedEnv: cannot use env after stop()</code> | [packages/cache/src/memcached/stub-memcached.ts](https://github.com/cardene777/kiwa/blob/main/packages/cache/src/memcached/stub-memcached.ts#L77) |
| <code v-pre>set: ttlSeconds must be non-negative (0 = no expiry)</code> | [packages/cache/src/memcached/stub-memcached.ts](https://github.com/cardene777/kiwa/blob/main/packages/cache/src/memcached/stub-memcached.ts#L96) |
| <code v-pre>setupMemcachedEnv: mode="testcontainers" requires testcontainers.url (v0.2 scope). Provide the URL of a running Memcached instance, or use mode="stub" for zero-infra tests.</code> | [packages/cache/src/memcached/testcontainers-memcached.ts](https://github.com/cardene777/kiwa/blob/main/packages/cache/src/memcached/testcontainers-memcached.ts#L26) |
| <code v-pre>setupMemcachedEnv: Memcached URL "$&#123;url&#125;" — port "$&#123;portStr&#125;" is not a valid integer</code> | [packages/cache/src/memcached/testcontainers-memcached.ts](https://github.com/cardene777/kiwa/blob/main/packages/cache/src/memcached/testcontainers-memcached.ts#L97) |
| <code v-pre>setupCacheEnv: unknown mode "$&#123;String(mode)&#125;" — expected "in-memory" or "testcontainers"</code> | [packages/cache/src/setup-cache-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/cache/src/setup-cache-env.ts#L21) |
| <code v-pre>setupCacheEnv: unknown client "$&#123;String(client)&#125;" — expected "ioredis" or "node-redis"</code> | [packages/cache/src/setup-cache-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/cache/src/setup-cache-env.ts#L27) |
| <code v-pre>"@kiwa-lab/cache: testcontainers + client='ioredis' requires the 'ioredis' peer dependency. Install with &#96;pnpm add -D ioredis&#96;. Original error: " + (caught instanceof Error ? caught.message : String(caught))</code> | [packages/cache/src/testcontainers-cache.ts](https://github.com/cardene777/kiwa/blob/main/packages/cache/src/testcontainers-cache.ts#L130) |
| <code v-pre>"@kiwa-lab/cache: testcontainers + client='node-redis' requires the 'redis' peer dependency. Install with &#96;pnpm add -D redis&#96;. Original error: " + (caught instanceof Error ? caught.message : String(caught))</code> | [packages/cache/src/testcontainers-cache.ts](https://github.com/cardene777/kiwa/blob/main/packages/cache/src/testcontainers-cache.ts#L202) |
| <code v-pre>setupCacheEnv: cannot $&#123;op&#125; after stop()</code> | [packages/cache/src/testcontainers-cache.ts](https://github.com/cardene777/kiwa/blob/main/packages/cache/src/testcontainers-cache.ts#L309) |
| <code v-pre>set: ttlSeconds must be positive</code> | [packages/cache/src/testcontainers-cache.ts](https://github.com/cardene777/kiwa/blob/main/packages/cache/src/testcontainers-cache.ts#L326) |
| <code v-pre>expire: ttlSeconds must be positive</code> | [packages/cache/src/testcontainers-cache.ts](https://github.com/cardene777/kiwa/blob/main/packages/cache/src/testcontainers-cache.ts#L337) |
| <code v-pre>subscribe: channel "$&#123;channel&#125;" is closed</code> | [packages/cache/src/testcontainers-cache.ts](https://github.com/cardene777/kiwa/blob/main/packages/cache/src/testcontainers-cache.ts#L369) |
| <code v-pre>assertPublished: no message on "$&#123;channel&#125;" matched $&#123;describeMatch(expected.match)&#125; within $&#123;timeoutMs&#125;ms</code> | [packages/cache/src/testcontainers-cache.ts](https://github.com/cardene777/kiwa/blob/main/packages/cache/src/testcontainers-cache.ts#L418) |
| <code v-pre>assertTTL: expected TTL=$&#123;expected.seconds&#125;s on "$&#123;key&#125;", observed $&#123;observed&#125;</code> | [packages/cache/src/testcontainers-cache.ts](https://github.com/cardene777/kiwa/blob/main/packages/cache/src/testcontainers-cache.ts#L469) |
| <code v-pre>assertTTL: expected TTL&gt;=$&#123;expected.atLeast&#125;s on "$&#123;key&#125;", observed $&#123;observed&#125;</code> | [packages/cache/src/testcontainers-cache.ts](https://github.com/cardene777/kiwa/blob/main/packages/cache/src/testcontainers-cache.ts#L476) |
| <code v-pre>assertTTL: expected TTL&lt;=$&#123;expected.atMost&#125;s on "$&#123;key&#125;", observed $&#123;observed&#125;</code> | [packages/cache/src/testcontainers-cache.ts](https://github.com/cardene777/kiwa/blob/main/packages/cache/src/testcontainers-cache.ts#L481) |
| <code v-pre>assertTTL: at least one of &#123; seconds, atLeast, atMost &#125; must be provided</code> | [packages/cache/src/testcontainers-cache.ts](https://github.com/cardene777/kiwa/blob/main/packages/cache/src/testcontainers-cache.ts#L490) |
| <code v-pre>"@kiwa-lab/cache: testcontainers mode requires the 'testcontainers' peer dependency. Install with &#96;pnpm add -D testcontainers&#96;. Original error: " + (caught instanceof Error ? caught.message : String(caught))</code> | [packages/cache/src/testcontainers-cache.ts](https://github.com/cardene777/kiwa/blob/main/packages/cache/src/testcontainers-cache.ts#L89) |

## API 契約

[公開 entry point](https://github.com/cardene777/kiwa/blob/main/packages/cache/src/index.ts) から同期しています。宣言元ごとにページを分けています。

| 宣言元 | 値 | 型 |
| --- | --- | --- |
| [in-memory-cache.ts](./api/in-memory-cache) | 1 | 0 |
| [index.ts](./api/index) | 1 | 0 |
| [keydb/setup-keydb-env.ts](./api/keydb__setup-keydb-env) | 1 | 0 |
| [keydb/stub-keydb.ts](./api/keydb__stub-keydb) | 1 | 0 |
| [keydb/testcontainers-keydb.ts](./api/keydb__testcontainers-keydb) | 1 | 0 |
| [keydb/types.ts](./api/keydb__types) | 0 | 8 |
| [memcached/setup-memcached-env.ts](./api/memcached__setup-memcached-env) | 1 | 0 |
| [memcached/stub-memcached.ts](./api/memcached__stub-memcached) | 1 | 0 |
| [memcached/testcontainers-memcached.ts](./api/memcached__testcontainers-memcached) | 1 | 0 |
| [memcached/types.ts](./api/memcached__types) | 0 | 6 |
| [semantics/cache-lifecycle-orchestrator.ts](./api/semantics__cache-lifecycle-orchestrator) | 2 | 4 |
| [setup-cache-env.ts](./api/setup-cache-env) | 1 | 0 |
| [testcontainers-cache.ts](./api/testcontainers-cache) | 1 | 0 |
| [types.ts](./api/types) | 0 | 7 |

<!-- kiwa-public-api:end -->
