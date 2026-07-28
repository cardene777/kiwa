---
title: "@kiwa-lab/cache memcached__types の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/cache</code> <code v-pre>memcached&#95;&#95;types</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/cache/src/memcached/types.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)



### 型

#### <code v-pre>MemcachedAssertTTLExpected</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/cache/src/memcached/types.ts#L93) <code v-pre>packages/cache/src/memcached/types.ts</code>

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

#### <code v-pre>MemcachedClient</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/cache/src/memcached/types.ts#L29) <code v-pre>packages/cache/src/memcached/types.ts</code>

Wire-shape client selector. Mirrors the two dominant Memcached client libraries so consumers can align the fixture with whichever they already depend on in prod. - `memjs`: the modern Node.js Memcached client (peer `memjs@^1`). - `memcached`: the classic Node.js Memcached client (peer `memcached@^2`).

```ts
export type MemcachedClient = 'memjs' | 'memcached';
```

#### <code v-pre>MemcachedEntrySnapshot</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/cache/src/memcached/types.ts#L44) <code v-pre>packages/cache/src/memcached/types.ts</code>

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

#### <code v-pre>MemcachedMode</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/cache/src/memcached/types.ts#L12) <code v-pre>packages/cache/src/memcached/types.ts</code>

Memcached backend selection. - `stub`: in-process, deterministic Memcached protocol emulation. No docker, no network. Suitable for unit tests that need to exercise the 8 core Memcached commands + TTL + multi-server consistent hashing without spinning up a container. - `testcontainers`: start a real Memcached in a testcontainers-managed Docker container. Deterministic + prod-shape parity. Requires Docker.

```ts
export type MemcachedMode = 'stub' | 'testcontainers';
```

#### <code v-pre>MemcachedTestEnv</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/cache/src/memcached/types.ts#L107) <code v-pre>packages/cache/src/memcached/types.ts</code>

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

#### <code v-pre>SetupMemcachedEnvOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/cache/src/memcached/types.ts#L54) <code v-pre>packages/cache/src/memcached/types.ts</code>

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
