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
| 'set: ttlSeconds must be positive' | [packages/cache/src/in-memory-cache.ts](https://github.com/cardene777/kiwa/blob/main/packages/cache/src/in-memory-cache.ts#L111) |
| 'expire: ttlSeconds must be positive' | [packages/cache/src/in-memory-cache.ts](https://github.com/cardene777/kiwa/blob/main/packages/cache/src/in-memory-cache.ts#L127) |
| `subscribe: channel "${channel}" is closed` | [packages/cache/src/in-memory-cache.ts](https://github.com/cardene777/kiwa/blob/main/packages/cache/src/in-memory-cache.ts#L172) |
| `assertPublished: no message on "${channel}" matched ${describeMatch(expected.match)} within ${timeoutMs}ms` | [packages/cache/src/in-memory-cache.ts](https://github.com/cardene777/kiwa/blob/main/packages/cache/src/in-memory-cache.ts#L240) |
| `assertTTL: expected TTL=${expected.seconds}s on "${key}", observed ${observed}` | [packages/cache/src/in-memory-cache.ts](https://github.com/cardene777/kiwa/blob/main/packages/cache/src/in-memory-cache.ts#L301) |
| `assertTTL: expected TTL>=${expected.atLeast}s on "${key}", observed ${observed}` | [packages/cache/src/in-memory-cache.ts](https://github.com/cardene777/kiwa/blob/main/packages/cache/src/in-memory-cache.ts#L308) |
| `assertTTL: expected TTL<=${expected.atMost}s on "${key}", observed ${observed}` | [packages/cache/src/in-memory-cache.ts](https://github.com/cardene777/kiwa/blob/main/packages/cache/src/in-memory-cache.ts#L313) |
| 'assertTTL: at least one of { seconds, atLeast, atMost } must be provided' | [packages/cache/src/in-memory-cache.ts](https://github.com/cardene777/kiwa/blob/main/packages/cache/src/in-memory-cache.ts#L322) |
| `setupCacheEnv: cannot ${op} after stop()` | [packages/cache/src/in-memory-cache.ts](https://github.com/cardene777/kiwa/blob/main/packages/cache/src/in-memory-cache.ts#L78) |
| `setupKeyDBEnv: unknown mode "${String(mode)}" — expected "stub" or "testcontainers"` | [packages/cache/src/keydb/setup-keydb-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/cache/src/keydb/setup-keydb-env.ts#L23) |
| 'set: ttlSeconds must be > 0 (omit for no expiry)' | [packages/cache/src/keydb/stub-keydb.ts](https://github.com/cardene777/kiwa/blob/main/packages/cache/src/keydb/stub-keydb.ts#L148) |
| 'expire: ttlSeconds must be > 0' | [packages/cache/src/keydb/stub-keydb.ts](https://github.com/cardene777/kiwa/blob/main/packages/cache/src/keydb/stub-keydb.ts#L164) |
| `assertTTL: key "${key}" expected TTL ${expected.seconds}s, observed ${observed}s` | [packages/cache/src/keydb/stub-keydb.ts](https://github.com/cardene777/kiwa/blob/main/packages/cache/src/keydb/stub-keydb.ts#L184) |
| `assertTTL: key "${key}" expected TTL >= ${expected.atLeast}s, observed ${observed}s` | [packages/cache/src/keydb/stub-keydb.ts](https://github.com/cardene777/kiwa/blob/main/packages/cache/src/keydb/stub-keydb.ts#L189) |
| `assertTTL: key "${key}" expected TTL <= ${expected.atMost}s, observed ${observed}s` | [packages/cache/src/keydb/stub-keydb.ts](https://github.com/cardene777/kiwa/blob/main/packages/cache/src/keydb/stub-keydb.ts#L194) |
| `assertPublished: no message on "${channel}" matched ${String(expected.match)} within ${timeoutMs}ms` | [packages/cache/src/keydb/stub-keydb.ts](https://github.com/cardene777/kiwa/blob/main/packages/cache/src/keydb/stub-keydb.ts#L281) |
| 'setupKeyDBEnv: cannot use env after stop()' | [packages/cache/src/keydb/stub-keydb.ts](https://github.com/cardene777/kiwa/blob/main/packages/cache/src/keydb/stub-keydb.ts#L45) |
| `KeyDBEnv: master "${preferred}" is not part of the cluster (known: ${JSON.stringify(cluster)})` | [packages/cache/src/keydb/stub-keydb.ts](https://github.com/cardene777/kiwa/blob/main/packages/cache/src/keydb/stub-keydb.ts#L51) |
| 'KeyDBEnv: cluster has no masters — cannot resolve a target master' | [packages/cache/src/keydb/stub-keydb.ts](https://github.com/cardene777/kiwa/blob/main/packages/cache/src/keydb/stub-keydb.ts#L58) |
| 'setupKeyDBEnv: mode="testcontainers" requires testcontainers.url (v0.2 scope). Provide the URL of a running KeyDB instance, or use mode="stub" for zero-infra tests.' | [packages/cache/src/keydb/testcontainers-keydb.ts](https://github.com/cardene777/kiwa/blob/main/packages/cache/src/keydb/testcontainers-keydb.ts#L20) |
| `setupKeyDBEnv: KeyDB URL "${url}" — port "${portStr}" is not a valid integer` | [packages/cache/src/keydb/testcontainers-keydb.ts](https://github.com/cardene777/kiwa/blob/main/packages/cache/src/keydb/testcontainers-keydb.ts#L83) |
| `setupMemcachedEnv: unknown mode "${String(mode)}" — expected "stub" or "testcontainers"` | [packages/cache/src/memcached/setup-memcached-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/cache/src/memcached/setup-memcached-env.ts#L25) |
| `assertTTL: key "${key}" expected TTL ${expected.seconds}s, observed ${observed}s` | [packages/cache/src/memcached/stub-memcached.ts](https://github.com/cardene777/kiwa/blob/main/packages/cache/src/memcached/stub-memcached.ts#L193) |
| `assertTTL: key "${key}" expected TTL >= ${expected.atLeast}s, observed ${observed}s` | [packages/cache/src/memcached/stub-memcached.ts](https://github.com/cardene777/kiwa/blob/main/packages/cache/src/memcached/stub-memcached.ts#L198) |
| `assertTTL: key "${key}" expected TTL <= ${expected.atMost}s, observed ${observed}s` | [packages/cache/src/memcached/stub-memcached.ts](https://github.com/cardene777/kiwa/blob/main/packages/cache/src/memcached/stub-memcached.ts#L203) |
| 'MemcachedEnv: no servers configured — cannot resolve a server for the key' | [packages/cache/src/memcached/stub-memcached.ts](https://github.com/cardene777/kiwa/blob/main/packages/cache/src/memcached/stub-memcached.ts#L48) |
| 'setupMemcachedEnv: cannot use env after stop()' | [packages/cache/src/memcached/stub-memcached.ts](https://github.com/cardene777/kiwa/blob/main/packages/cache/src/memcached/stub-memcached.ts#L77) |
| 'set: ttlSeconds must be non-negative (0 = no expiry)' | [packages/cache/src/memcached/stub-memcached.ts](https://github.com/cardene777/kiwa/blob/main/packages/cache/src/memcached/stub-memcached.ts#L96) |
| 'setupMemcachedEnv: mode="testcontainers" requires testcontainers.url (v0.2 scope). Provide the URL of a running Memcached instance, or use mode="stub" for zero-infra tests.' | [packages/cache/src/memcached/testcontainers-memcached.ts](https://github.com/cardene777/kiwa/blob/main/packages/cache/src/memcached/testcontainers-memcached.ts#L26) |
| `setupMemcachedEnv: Memcached URL "${url}" — port "${portStr}" is not a valid integer` | [packages/cache/src/memcached/testcontainers-memcached.ts](https://github.com/cardene777/kiwa/blob/main/packages/cache/src/memcached/testcontainers-memcached.ts#L97) |
| `setupCacheEnv: unknown mode "${String(mode)}" — expected "in-memory" or "testcontainers"` | [packages/cache/src/setup-cache-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/cache/src/setup-cache-env.ts#L21) |
| `setupCacheEnv: unknown client "${String(client)}" — expected "ioredis" or "node-redis"` | [packages/cache/src/setup-cache-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/cache/src/setup-cache-env.ts#L27) |
| "@kiwa-lab/cache: testcontainers + client='ioredis' requires the 'ioredis' peer dependency. Install with `pnpm add -D ioredis`. Original error: " + (caught instanceof Error ? caught.message : String(caught)) | [packages/cache/src/testcontainers-cache.ts](https://github.com/cardene777/kiwa/blob/main/packages/cache/src/testcontainers-cache.ts#L130) |
| "@kiwa-lab/cache: testcontainers + client='node-redis' requires the 'redis' peer dependency. Install with `pnpm add -D redis`. Original error: " + (caught instanceof Error ? caught.message : String(caught)) | [packages/cache/src/testcontainers-cache.ts](https://github.com/cardene777/kiwa/blob/main/packages/cache/src/testcontainers-cache.ts#L202) |
| `setupCacheEnv: cannot ${op} after stop()` | [packages/cache/src/testcontainers-cache.ts](https://github.com/cardene777/kiwa/blob/main/packages/cache/src/testcontainers-cache.ts#L309) |
| 'set: ttlSeconds must be positive' | [packages/cache/src/testcontainers-cache.ts](https://github.com/cardene777/kiwa/blob/main/packages/cache/src/testcontainers-cache.ts#L326) |
| 'expire: ttlSeconds must be positive' | [packages/cache/src/testcontainers-cache.ts](https://github.com/cardene777/kiwa/blob/main/packages/cache/src/testcontainers-cache.ts#L337) |
| `subscribe: channel "${channel}" is closed` | [packages/cache/src/testcontainers-cache.ts](https://github.com/cardene777/kiwa/blob/main/packages/cache/src/testcontainers-cache.ts#L369) |
| `assertPublished: no message on "${channel}" matched ${describeMatch(expected.match)} within ${timeoutMs}ms` | [packages/cache/src/testcontainers-cache.ts](https://github.com/cardene777/kiwa/blob/main/packages/cache/src/testcontainers-cache.ts#L418) |
| `assertTTL: expected TTL=${expected.seconds}s on "${key}", observed ${observed}` | [packages/cache/src/testcontainers-cache.ts](https://github.com/cardene777/kiwa/blob/main/packages/cache/src/testcontainers-cache.ts#L469) |
| `assertTTL: expected TTL>=${expected.atLeast}s on "${key}", observed ${observed}` | [packages/cache/src/testcontainers-cache.ts](https://github.com/cardene777/kiwa/blob/main/packages/cache/src/testcontainers-cache.ts#L476) |
| `assertTTL: expected TTL<=${expected.atMost}s on "${key}", observed ${observed}` | [packages/cache/src/testcontainers-cache.ts](https://github.com/cardene777/kiwa/blob/main/packages/cache/src/testcontainers-cache.ts#L481) |
| 'assertTTL: at least one of { seconds, atLeast, atMost } must be provided' | [packages/cache/src/testcontainers-cache.ts](https://github.com/cardene777/kiwa/blob/main/packages/cache/src/testcontainers-cache.ts#L490) |
| "@kiwa-lab/cache: testcontainers mode requires the 'testcontainers' peer dependency. Install with `pnpm add -D testcontainers`. Original error: " + (caught instanceof Error ? caught.message : String(caught)) | [packages/cache/src/testcontainers-cache.ts](https://github.com/cardene777/kiwa/blob/main/packages/cache/src/testcontainers-cache.ts#L89) |

## API 契約

この section は [公開 entry point](https://github.com/cardene777/kiwa/blob/main/packages/cache/src/index.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

### 値

#### `createInMemoryCacheEnv`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/cache/src/in-memory-cache.ts#L34) `packages/cache/src/in-memory-cache.ts`

Build an in-memory (offline, in-process) Redis-shaped cache environment. Suitable for unit tests that need to exercise the get / set / delete / TTL / Pub/Sub loop without spinning up a Redis container.

```ts
export declare function createInMemoryCacheEnv(opts: SetupCacheEnvOptions): CacheTestEnv<'mock'>;
```

#### `createStubKeyDBEnv`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/cache/src/keydb/stub-keydb.ts#L29) `packages/cache/src/keydb/stub-keydb.ts`

Build an in-process stub of KeyDB covering the Redis-compatible surface (get / set / delete / TTL / Pub/Sub) plus KeyDB-specific multi-master replication — writes on one master replicate to every other master after an optional simulated lag.

```ts
export declare function createStubKeyDBEnv(opts: SetupKeyDBEnvOptions): KeyDBTestEnv<'mock'>;
```

#### `createStubMemcachedEnv`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/cache/src/memcached/stub-memcached.ts#L66) `packages/cache/src/memcached/stub-memcached.ts`

Build an in-process stub of Memcached covering the 8 core commands (get / set / delete / add / replace / increment / decrement / flush) + TTL + multi-server consistent hashing — deterministically, without spinning up a container.

```ts
export declare function createStubMemcachedEnv(opts: SetupMemcachedEnvOptions): MemcachedTestEnv<'mock'>;
```

#### `createTestcontainersCacheEnv`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/cache/src/testcontainers-cache.ts#L270) `packages/cache/src/testcontainers-cache.ts`

Build a testcontainers-backed Redis cache environment. Requires Docker; the chosen real client (`ioredis` or `redis`) does the heavy lifting so semantic drift from prod is limited to whatever that client abstracts.

```ts
export declare function createTestcontainersCacheEnv(opts: SetupCacheEnvOptions): Promise<CacheTestEnv<'live'>>;
```

#### `createTestcontainersKeyDBEnv`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/cache/src/keydb/testcontainers-keydb.ts#L15) `packages/cache/src/keydb/testcontainers-keydb.ts`

Build a testcontainers-backed KeyDB env. When `opts.testcontainers?.url` is provided the helper connects directly to that URL and verifies TCP responsiveness. Otherwise the helper would spawn a real KeyDB container — kept behind an explicit `url` opt-in for the v0.2 scope so callers wanting fully-managed containers can layer their own testcontainers wrapper. KeyDB is Redis-compatible on the wire so callers can point their own `ioredis` / `redis` client at `env.keydbUrl`; assertion helpers stay deterministic by reusing the stub's replication simulation.

```ts
export declare function createTestcontainersKeyDBEnv(opts: SetupKeyDBEnvOptions): Promise<KeyDBTestEnv<'live'>>;
```

#### `createTestcontainersMemcachedEnv`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/cache/src/memcached/testcontainers-memcached.ts#L21) `packages/cache/src/memcached/testcontainers-memcached.ts`

Build a testcontainers-backed Memcached env. When `opts.testcontainers?.url` is provided the helper connects directly to that URL and verifies responsiveness. Otherwise the helper would spawn a real container — kept behind an explicit `url` opt-in for the v0.2 scope so callers wanting fully-managed containers can layer their own testcontainers wrapper on top. The wire path shares the stub simulation for entry state (so assertion helpers stay deterministic) while surfacing the Memcached endpoint URL on the env for callers that want to point their own `memjs` / `memcached` client at it.

```ts
export declare function createTestcontainersMemcachedEnv(opts: SetupMemcachedEnvOptions): Promise<MemcachedTestEnv<'live'>>;
```

#### `dispatchCacheEvent`

公開 entry point から解決しています。

`dispatchEvent` を `dispatchCacheEvent` として公開しています。

```ts
export {
  startCache,
  dispatchEvent as dispatchCacheEvent,
  summarizeCache,
} from './cache-lifecycle-orchestrator.js';
```

#### `setupCacheEnv`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/cache/src/setup-cache-env.ts#L16) `packages/cache/src/setup-cache-env.ts`

Factory for Redis cache test environments. `mode: 'in-memory'` (default) returns a fast, in-process Redis-shaped fake — no Docker, no peer dependencies required beyond the fixture package itself. Use it for the fast unit-test lane. `mode: 'testcontainers'` boots a real Redis under testcontainers and wires up either `ioredis` or `redis` (node-redis v4) as the client. Use it for the integration lane that needs prod-shape parity.

```ts
export declare function setupCacheEnv(opts?: SetupCacheEnvOptions): Promise<CacheTestEnv>;
```

#### `setupKeyDBEnv`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/cache/src/keydb/setup-keydb-env.ts#L18) `packages/cache/src/keydb/setup-keydb-env.ts`

Factory for KeyDB test environments. `mode: 'stub'` (default) returns a fast, in-process fake — no docker, no network. Deterministic enough to exercise Redis-compatible GET / SET / DELETE / TTL / Pub/Sub plus KeyDB-specific multi-master replication semantics. `mode: 'testcontainers'` connects to a running KeyDB endpoint (URL provided via `testcontainers.url`) and verifies TCP responsiveness. The env still drives entry state in-process (v0.2 scope) so assertions stay deterministic across backends.

```ts
export declare function setupKeyDBEnv(opts?: SetupKeyDBEnvOptions): Promise<KeyDBTestEnv>;
```

#### `setupMemcachedEnv`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/cache/src/memcached/setup-memcached-env.ts#L20) `packages/cache/src/memcached/setup-memcached-env.ts`

Factory for Memcached test environments. `mode: 'stub'` (default) returns a fast, in-process fake — no docker, no network. Deterministic enough to exercise the 8 core Memcached commands (get / set / delete / add / replace / increment / decrement / flush) plus TTL and multi-server consistent hashing. `mode: 'testcontainers'` connects to a running Memcached endpoint (URL provided via `testcontainers.url`) and verifies TCP responsiveness before returning the env. The env still drives entry state in-process (v0.2 scope) so assertions stay deterministic across backends; callers that want to exercise the real wire can point their own `memjs` / `memcached` client at the exposed `env.memcachedUrl`.

```ts
export declare function setupMemcachedEnv(opts?: SetupMemcachedEnvOptions): Promise<MemcachedTestEnv>;
```

#### `startCache`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/cache/src/semantics/cache-lifecycle-orchestrator.ts#L35) `packages/cache/src/semantics/cache-lifecycle-orchestrator.ts`

```ts
export declare function startCache(input: {
    timestamp: string;
}): CacheSession;
```

#### `summarizeCache`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/cache/src/semantics/cache-lifecycle-orchestrator.ts#L146) `packages/cache/src/semantics/cache-lifecycle-orchestrator.ts`

```ts
export declare function summarizeCache(session: CacheSession): CacheSummary;
```

### 型

#### `AssertTTLExpected`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/cache/src/types.ts#L73) `packages/cache/src/types.ts`

Assertion contract for TTL / expiry checks.

```ts
export interface AssertTTLExpected {
    /** Exact TTL in seconds. `-1` = key with no expire. `-2` = key missing. */
    seconds?: number | undefined;
    /**
     * Bounded TTL check. Both endpoints inclusive. Useful when the exact TTL is
     * subject to drift between the SET call and the server reading it back.
     */
    atLeast?: number | undefined;
    atMost?: number | undefined;
}
```

#### `CacheClient`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/cache/src/types.ts#L31) `packages/cache/src/types.ts`

Wire-shape client selector for `testcontainers` mode. Mirrors the two dominant Redis client libraries so consumers can align the fixture with whichever they already depend on in prod. - `ioredis`: the callback / Promise-style Redis client (peer `ioredis@^5`). - `node-redis`: the official Redis client (peer `redis@^4`, v4 unified API).

```ts
export type CacheClient = 'ioredis' | 'node-redis';
```

#### `CacheEvent`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/cache/src/semantics/cache-lifecycle-orchestrator.ts#L14) `packages/cache/src/semantics/cache-lifecycle-orchestrator.ts`

```ts
export type CacheEvent = 'write-committed' | 'read-hit' | 'read-miss' | 'ttl-warning' | 'ttl-expired' | 'invalidate-requested' | 'evict-requested' | 'timeout';
```

#### `CacheMode`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/cache/src/types.ts#L13) `packages/cache/src/types.ts`

Redis backend selection. - `testcontainers`: start a real Redis in a testcontainers-managed Docker container. Deterministic + prod-shape parity. Requires Docker + the `testcontainers` + one of `ioredis` / `redis` peer dependencies. - `in-memory`: run against an in-process Redis-compatible fake tied to the test process only. Fast (no container startup), fully offline, and sufficient for the majority of key/value + TTL + Pub/Sub semantics. Redis- side data structures (lists / sorted sets / streams) are out of v0.1 scope.

```ts
export type CacheMode = 'testcontainers' | 'in-memory';
```

#### `CacheSession`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/cache/src/semantics/cache-lifecycle-orchestrator.ts#L24) `packages/cache/src/semantics/cache-lifecycle-orchestrator.ts`

```ts
export interface CacheSession {
    state: CacheState;
    writesCommitted: number;
    readHits: number;
    readMisses: number;
    ttlWarnings: number;
    evictions: number;
    lastEventAt: string;
    events: string[];
}
```

#### `CacheState`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/cache/src/semantics/cache-lifecycle-orchestrator.ts#L7) `packages/cache/src/semantics/cache-lifecycle-orchestrator.ts`

v0.6 cache-lifecycle-orchestrator = 3 provider (Redis + Memcached + KeyDB) の 継続合成 layer。 depth-5 pattern 11 例目 candidate、 backend systems layer 第 3 例、 systematic pattern 53 度目。

```ts
export type CacheState = 'filling' | 'hot' | 'expiring' | 'stale' | 'evicted';
```

#### `CacheSubscription`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/cache/src/types.ts#L61) `packages/cache/src/types.ts`

Return type of {@link CacheTestEnv.subscribe}. Behaves like an async iterable of {@link PubSubMessage} while also exposing a `.close()` method for deterministic cleanup inside `afterEach`.

```ts
export interface CacheSubscription {
    /** Channel this subscription is listening on. */
    channel: string;
    /** Total messages captured so far — includes any that have been drained. */
    received: () => PubSubMessage[];
    /** Await the next incoming message (rejects on timeout). */
    next: (opts?: {
        timeoutMs?: number | undefined;
    }) => Promise<PubSubMessage>;
    /** Tear down the underlying Redis subscription. */
    close: () => Promise<void>;
}
```

#### `CacheSummary`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/cache/src/semantics/cache-lifecycle-orchestrator.ts#L133) `packages/cache/src/semantics/cache-lifecycle-orchestrator.ts`

```ts
export interface CacheSummary {
    currentState: CacheState;
    totalEvents: number;
    validEvents: number;
    invalidEvents: number;
    terminalEvents: number;
    writesCommitted: number;
    readHits: number;
    readMisses: number;
    ttlWarnings: number;
    evictions: number;
}
```

#### `CacheTestEnv`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/cache/src/types.ts#L134) `packages/cache/src/types.ts`

Return type of {@link setupCacheEnv }. Reads much like a tiny Redis facade — consumers get / set / delete keys, then use the assertion helpers to observe TTL and Pub/Sub outcomes without touching Redis client APIs directly.

```ts
export interface CacheTestEnv<TMode extends TestMode = TestMode> extends TestEnvBase<TMode> {
    /** Chosen backend — mirrors the `mode` parameter. */
    backend: CacheMode;
    /** Optional Redis connection URL — undefined in in-memory mode. */
    redisUrl: string | undefined;
    /** Client selector — informational, mirrors the `client` parameter. */
    client: CacheClient;
    /** Fetch a key's value, or `null` when the key is unset / expired. */
    get: (key: string) => Promise<string | null>;
    /**
     * Set a key. `ttlSeconds` mirrors Redis' `EX` option — omit for no expiry.
     * Rejects when `ttlSeconds` is <= 0.
     */
    set: (key: string, value: string, opts?: {
        ttlSeconds?: number | undefined;
    }) => Promise<void>;
    /** Delete a key. Returns the number of keys removed (0 or 1). */
    delete: (key: string) => Promise<number>;
    /**
     * Set a key's TTL out of band. Returns `true` if the key existed. Mirrors
     * Redis' `EXPIRE` command.
     */
    expire: (key: string, ttlSeconds: number) => Promise<boolean>;
    /**
     * Read the TTL (seconds) for a key. `-1` = no expiry set. `-2` = key
     * missing. Mirrors Redis' `TTL` command.
     */
    ttl: (key: string) => Promise<number>;
    /**
     * Assertion — the key exists with the expected TTL (exact or bounded).
     * Throws when the key is missing / the TTL falls outside the expectation.
     */
    assertTTL: (key: string, expected: AssertTTLExpected) => Promise<number>;
    /** Publish `message` on `channel`. Mirrors Redis' `PUBLISH` command. */
    publish: (channel: string, message: string) => Promise<number>;
    /**
     * Subscribe to `channel`. The returned {@link CacheSubscription} accumulates
     * every subsequent {@link publish} until `close()` is called.
     */
    subscribe: (channel: string) => Promise<CacheSubscription>;
    /**
     * Assertion — at least one message on `channel` matches `expected`. When
     * `expected.match` is a string it is compared literally; when it is a RegExp
     * it is `.test()`ed against the payload.
     */
    assertPublished: (channel: string, expected: {
        match: string | RegExp;
        timeoutMs?: number | undefined;
    }) => Promise<PubSubMessage>;
    /** Wipe the store. Mirrors Redis' `FLUSHDB` — used mainly for test isolation. */
    flushAll: () => Promise<void>;
}
```

#### `KeyDBAssertTTLExpected`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/cache/src/keydb/types.ts#L75) `packages/cache/src/keydb/types.ts`

Assertion contract for TTL / expiry checks.

```ts
export interface KeyDBAssertTTLExpected {
    seconds?: number | undefined;
    atLeast?: number | undefined;
    atMost?: number | undefined;
}
```

#### `KeyDBClient`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/cache/src/keydb/types.ts#L26) `packages/cache/src/keydb/types.ts`

Wire-shape client selector. KeyDB is Redis-compatible so both dominant Redis clients (`ioredis` + `redis` / node-redis v4) work with the same URL.

```ts
export type KeyDBClient = 'ioredis' | 'node-redis';
```

#### `KeyDBEntrySnapshot`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/cache/src/keydb/types.ts#L41) `packages/cache/src/keydb/types.ts`

Snapshot of a persisted KeyDB entry. Values are stored as raw strings — the fixture never JSON-parses on the consumer's behalf so binary-shaped payloads survive the roundtrip.

```ts
export interface KeyDBEntrySnapshot {
    key: string;
    value: string;
    /** Which master node accepted the write. */
    master: string;
    /** ISO ms — absolute expiry (0 = no expiry). */
    expiresAt: number;
}
```

#### `KeyDBMode`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/cache/src/keydb/types.ts#L12) `packages/cache/src/keydb/types.ts`

KeyDB backend selection. - `stub`: in-process, deterministic KeyDB protocol emulation (Redis-compatible API surface). No docker, no network. Suitable for unit tests that need to exercise the multi-master replication + Pub/Sub semantics without spinning up a container. - `testcontainers`: connect to a running KeyDB endpoint (Redis-compatible wire, so ioredis / redis clients work unchanged).

```ts
export type KeyDBMode = 'stub' | 'testcontainers';
```

#### `KeyDBPubSubMessage`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/cache/src/keydb/types.ts#L53) `packages/cache/src/keydb/types.ts`

Snapshot of a captured Pub/Sub delivery.

```ts
export interface KeyDBPubSubMessage {
    channel: string;
    message: string;
    /** Delivery order within the env (monotonically increasing). */
    index: number;
    /** Which master node originated the publish. */
    master: string;
}
```

#### `KeyDBSubscription`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/cache/src/keydb/types.ts#L67) `packages/cache/src/keydb/types.ts`

Return type of {@link KeyDBTestEnv.subscribe}. Behaves like an async iterable of {@link KeyDBPubSubMessage} while also exposing a `.close()` method for deterministic cleanup.

```ts
export interface KeyDBSubscription {
    channel: string;
    received: () => KeyDBPubSubMessage[];
    next: (opts?: {
        timeoutMs?: number | undefined;
    }) => Promise<KeyDBPubSubMessage>;
    close: () => Promise<void>;
}
```

#### `KeyDBTestEnv`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/cache/src/keydb/types.ts#L124) `packages/cache/src/keydb/types.ts`

Return type of {@link setupKeyDBEnv }. Reads much like a mini KeyDB facade — consumers get / set / delete keys, publish / subscribe, and use the assertion helpers to observe TTL / Pub/Sub outcomes without touching a real client.

```ts
export interface KeyDBTestEnv<TMode extends TestMode = TestMode> extends TestEnvBase<TMode> {
    /** Chosen backend — mirrors the `mode` parameter. */
    backend: KeyDBMode;
    /** Optional KeyDB URL — undefined in stub mode. */
    keydbUrl: string | undefined;
    /** Client selector — informational. */
    client: KeyDBClient;
    /** Cluster master node identities. */
    cluster: string[];
    /** GET — fetch a key's value, or `null` when the key is unset / expired. */
    get: (key: string, opts?: {
        master?: string | undefined;
    }) => Promise<string | null>;
    /**
     * SET — write a key. `ttlSeconds` mirrors Redis' `EX` option — omit for
     * no expiry. Rejects when `ttlSeconds` is <= 0. The optional `master`
     * option selects which master accepts the write; the write replicates to
     * every other master after `replicationLagMs`.
     */
    set: (key: string, value: string, opts?: {
        ttlSeconds?: number | undefined;
        master?: string | undefined;
    }) => Promise<void>;
    /** DELETE — remove a key. Returns the number of keys removed (0 or 1). */
    delete: (key: string) => Promise<number>;
    /** EXPIRE — set a key's TTL out of band. Returns `true` if the key existed. */
    expire: (key: string, ttlSeconds: number) => Promise<boolean>;
    /**
     * TTL — read the TTL (seconds) for a key. `-1` = no expiry set. `-2` = key
     * missing.
     */
    ttl: (key: string) => Promise<number>;
    /** Assertion — the key exists with the expected TTL (exact or bounded). */
    assertTTL: (key: string, expected: KeyDBAssertTTLExpected) => Promise<number>;
    /**
     * PUBLISH — deliver `message` on `channel` to every subscriber. Returns
     * the number of subscribers that received the message.
     */
    publish: (channel: string, message: string, opts?: {
        master?: string | undefined;
    }) => Promise<number>;
    /** SUBSCRIBE — capture every subsequent publish on `channel`. */
    subscribe: (channel: string) => Promise<KeyDBSubscription>;
    /** Assertion — at least one message on `channel` matches `expected`. */
    assertPublished: (channel: string, expected: {
        match: string | RegExp;
        timeoutMs?: number | undefined;
    }) => Promise<KeyDBPubSubMessage>;
    /** Wipe every key on every master. */
    flushAll: () => Promise<void>;
    /**
     * Introspection — return every entry across every master, tagged by the
     * owning master. Handy for tests that verify replication.
     */
    listEntries: () => KeyDBEntrySnapshot[];
}
```

#### `MemcachedAssertTTLExpected`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/cache/src/memcached/types.ts#L93) `packages/cache/src/memcached/types.ts`

Assertion contract for TTL / expiry checks.

```ts
export interface MemcachedAssertTTLExpected {
    /** Exact TTL in seconds. `-1` = key with no expire. `-2` = key missing. */
    seconds?: number | undefined;
    /** Bounded TTL check. Both endpoints inclusive. */
    atLeast?: number | undefined;
    atMost?: number | undefined;
}
```

#### `MemcachedClient`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/cache/src/memcached/types.ts#L29) `packages/cache/src/memcached/types.ts`

Wire-shape client selector. Mirrors the two dominant Memcached client libraries so consumers can align the fixture with whichever they already depend on in prod. - `memjs`: the modern Node.js Memcached client (peer `memjs@^1`). - `memcached`: the classic Node.js Memcached client (peer `memcached@^2`).

```ts
export type MemcachedClient = 'memjs' | 'memcached';
```

#### `MemcachedEntrySnapshot`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/cache/src/memcached/types.ts#L44) `packages/cache/src/memcached/types.ts`

Snapshot of a stored Memcached entry. Values are stored as raw strings — the fixture never JSON-parses on the consumer's behalf so binary-shaped payloads survive the roundtrip.

```ts
export interface MemcachedEntrySnapshot {
    key: string;
    value: string;
    /** Owning server identity — consistent hashing distributes keys across servers. */
    server: string;
    /** ISO ms — absolute expiry (0 = no expiry). */
    expiresAt: number;
}
```

#### `MemcachedMode`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/cache/src/memcached/types.ts#L12) `packages/cache/src/memcached/types.ts`

Memcached backend selection. - `stub`: in-process, deterministic Memcached protocol emulation. No docker, no network. Suitable for unit tests that need to exercise the 8 core Memcached commands + TTL + multi-server consistent hashing without spinning up a container. - `testcontainers`: start a real Memcached in a testcontainers-managed Docker container. Deterministic + prod-shape parity. Requires Docker.

```ts
export type MemcachedMode = 'stub' | 'testcontainers';
```

#### `MemcachedTestEnv`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/cache/src/memcached/types.ts#L107) `packages/cache/src/memcached/types.ts`

Return type of {@link setupMemcachedEnv }. Reads much like a tiny Memcached facade — consumers exercise the 8 core commands (get / set / delete / add / replace / increment / decrement / flush) + TTL + multi-server consistent hashing without touching a real client.

```ts
export interface MemcachedTestEnv<TMode extends TestMode = TestMode> extends TestEnvBase<TMode> {
    /** Chosen backend — mirrors the `mode` parameter. */
    backend: MemcachedMode;
    /** Optional Memcached connection URL — undefined in stub mode. */
    memcachedUrl: string | undefined;
    /** Client selector — informational, mirrors the `client` parameter. */
    client: MemcachedClient;
    /** Server identities the env is aware of. */
    servers: string[];
    /** GET — fetch a key's value, or `null` when the key is unset / expired. */
    get: (key: string) => Promise<string | null>;
    /**
     * SET — write a key unconditionally. `ttlSeconds` mirrors Memcached's
     * expiration field (0 = no expiry). Rejects when `ttlSeconds` is negative.
     */
    set: (key: string, value: string, opts?: {
        ttlSeconds?: number | undefined;
    }) => Promise<void>;
    /** DELETE — remove a key. Returns `true` if the key existed. */
    delete: (key: string) => Promise<boolean>;
    /**
     * ADD — write a key only if it does not exist. Returns `true` if the write
     * succeeded, `false` if the key was already present.
     */
    add: (key: string, value: string, opts?: {
        ttlSeconds?: number | undefined;
    }) => Promise<boolean>;
    /**
     * REPLACE — write a key only if it already exists. Returns `true` if the
     * write succeeded, `false` if the key was missing.
     */
    replace: (key: string, value: string, opts?: {
        ttlSeconds?: number | undefined;
    }) => Promise<boolean>;
    /**
     * INCR — atomically add `delta` to a numeric key. Returns the new value,
     * or `null` if the key does not exist / cannot be parsed as an integer.
     */
    increment: (key: string, delta?: number | undefined) => Promise<number | null>;
    /**
     * DECR — atomically subtract `delta` from a numeric key. Returns the new
     * value, or `null` if the key does not exist / cannot be parsed as an
     * integer. Memcached clamps the value at 0 (no negative results).
     */
    decrement: (key: string, delta?: number | undefined) => Promise<number | null>;
    /** FLUSH_ALL — wipe every key on every server. */
    flush: () => Promise<void>;
    /**
     * Read the TTL (seconds) for a key. `-1` = no expiry. `-2` = key missing.
     * Non-standard — real Memcached does not expose TTL introspection; the env
     * provides it for tests that need to observe expiry behaviour.
     */
    ttl: (key: string) => Promise<number>;
    /**
     * Assertion — the key exists with the expected TTL (exact or bounded).
     * Throws when the key is missing / the TTL falls outside the expectation.
     */
    assertTTL: (key: string, expected: MemcachedAssertTTLExpected) => Promise<number>;
    /**
     * Introspection — return which server owns a key according to the
     * consistent hash ring. Handy for tests that verify sharding.
     */
    serverFor: (key: string) => string;
    /** Introspection — return every entry across every server. */
    listEntries: () => MemcachedEntrySnapshot[];
}
```

#### `PubSubMessage`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/cache/src/types.ts#L49) `packages/cache/src/types.ts`

Snapshot of a captured Pub/Sub delivery. Emitted to subscribers of a channel via {@link CacheTestEnv.subscribe}. Values are stored as raw strings — the fixture never JSON-parses on the consumer's behalf so binary-shaped payloads survive the roundtrip.

```ts
export interface PubSubMessage {
    channel: string;
    message: string;
    /** Delivery order within the env (monotonically increasing). */
    index: number;
}
```

#### `SetupCacheEnvOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/cache/src/types.ts#L88) `packages/cache/src/types.ts`

Common options for the `setupCacheEnv` factory. `mode` chooses the backend; `redis` is a testcontainers-only override.

```ts
export interface SetupCacheEnvOptions {
    /**
     * Backend selector. Defaults to `'in-memory'` when omitted — the fast,
     * offline path suitable for unit tests. Use `'testcontainers'` for
     * integration-shaped suites that exercise the real Redis wire.
     */
    mode?: CacheMode | undefined;
    /**
     * Client wire-shape selector. Only meaningful in `testcontainers` mode; the
     * in-memory backend is client-agnostic. Defaults to `'ioredis'`.
     */
    client?: CacheClient | undefined;
    /**
     * testcontainers overrides. Ignored when `mode === 'in-memory'`.
     */
    redis?: {
        /** Docker image tag. Defaults to `redis:7-alpine`. */
        image?: string | undefined;
        /**
         * Optional externally-managed Redis connection URL. When supplied the
         * helper skips container creation entirely.
         */
        url?: string | undefined;
    } | undefined;
    /**
     * in-memory overrides. Ignored when `mode === 'testcontainers'`.
     */
    inMemory?: {
        /**
         * How often the fake polls its expiry heap for TTL enforcement (ms).
         * Defaults to 5 which is fine for unit-shaped suites. Set lower for
         * tests that assert sub-10ms expiry latency.
         */
        expiryTickMs?: number | undefined;
    } | undefined;
}
```

#### `SetupKeyDBEnvOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/cache/src/keydb/types.ts#L82) `packages/cache/src/keydb/types.ts`

Common options for the `setupKeyDBEnv` factory.

```ts
export interface SetupKeyDBEnvOptions {
    /** Backend selector. Defaults to `'stub'`. */
    mode?: KeyDBMode | undefined;
    /** Client wire-shape selector. Defaults to `'ioredis'`. */
    client?: KeyDBClient | undefined;
    /**
     * Cluster master node identities. Multi-master replication distributes
     * writes across all masters — every master sees every write in eventual
     * consistency order. Defaults to a single `stub-master-0` node.
     */
    cluster?: string[] | undefined;
    /** testcontainers overrides. Ignored when `mode === 'stub'`. */
    testcontainers?: {
        /** Docker image tag. Defaults to `eqalpha/keydb:latest`. */
        image?: string | undefined;
        /** Optional externally-managed KeyDB URL. Skips container creation. */
        url?: string | undefined;
    } | undefined;
    /** stub overrides. Ignored when `mode === 'testcontainers'`. */
    stub?: {
        /** Poll interval for TTL enforcement (ms). Defaults to 5. */
        expiryTickMs?: number | undefined;
        /**
         * Simulated replication lag between master nodes (ms). Writes on
         * master A become visible to master B after this delay. Defaults to
         * 0 (synchronous — matches KeyDB's active-replication guarantee for
         * consistent tests).
         */
        replicationLagMs?: number | undefined;
    } | undefined;
}
```

#### `SetupMemcachedEnvOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/cache/src/memcached/types.ts#L54) `packages/cache/src/memcached/types.ts`

Common options for the `setupMemcachedEnv` factory.

```ts
export interface SetupMemcachedEnvOptions {
    /** Backend selector. Defaults to `'stub'`. */
    mode?: MemcachedMode | undefined;
    /**
     * Client wire-shape selector. Only meaningful in `testcontainers` mode; the
     * stub backend is client-agnostic. Defaults to `'memjs'`.
     */
    client?: MemcachedClient | undefined;
    /**
     * Server identities the env exposes. The stub backend uses these purely as
     * hash-ring keys; multi-server tests can exercise consistent hashing without
     * spinning multiple containers. Defaults to a single `stub-0` server.
     */
    servers?: string[] | undefined;
    /** testcontainers overrides. Ignored when `mode === 'stub'`. */
    testcontainers?: {
        /** Docker image tag. Defaults to `bitnami/memcached:1.6`. */
        image?: string | undefined;
        /**
         * Optional externally-managed Memcached connection URL. When supplied
         * the helper skips container creation entirely.
         */
        url?: string | undefined;
    } | undefined;
    /** stub overrides. Ignored when `mode === 'testcontainers'`. */
    stub?: {
        /**
         * How often the fake polls its expiry heap for TTL enforcement (ms).
         * Defaults to 5 which is fine for unit-shaped suites.
         */
        expiryTickMs?: number | undefined;
    } | undefined;
}
```
<!-- kiwa-public-api:end -->
