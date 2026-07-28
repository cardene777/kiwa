---
title: "@kiwa-lab/cache keydb__types の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/cache</code> <code v-pre>keydb&#95;&#95;types</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/cache/src/keydb/types.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)



### 型

#### <code v-pre>KeyDBAssertTTLExpected</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/cache/src/keydb/types.ts#L75) <code v-pre>packages/cache/src/keydb/types.ts</code>

Assertion contract for TTL / expiry checks.

```ts
export interface KeyDBAssertTTLExpected {
    seconds?: number | undefined;
    atLeast?: number | undefined;
    atMost?: number | undefined;
}
```

#### <code v-pre>KeyDBClient</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/cache/src/keydb/types.ts#L26) <code v-pre>packages/cache/src/keydb/types.ts</code>

Wire-shape client selector. KeyDB is Redis-compatible so both dominant Redis clients (`ioredis` + `redis` / node-redis v4) work with the same URL.

```ts
export type KeyDBClient = 'ioredis' | 'node-redis';
```

#### <code v-pre>KeyDBEntrySnapshot</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/cache/src/keydb/types.ts#L41) <code v-pre>packages/cache/src/keydb/types.ts</code>

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

#### <code v-pre>KeyDBMode</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/cache/src/keydb/types.ts#L12) <code v-pre>packages/cache/src/keydb/types.ts</code>

KeyDB backend selection. - `stub`: in-process, deterministic KeyDB protocol emulation (Redis-compatible API surface). No docker, no network. Suitable for unit tests that need to exercise the multi-master replication + Pub/Sub semantics without spinning up a container. - `testcontainers`: connect to a running KeyDB endpoint (Redis-compatible wire, so ioredis / redis clients work unchanged).

```ts
export type KeyDBMode = 'stub' | 'testcontainers';
```

#### <code v-pre>KeyDBPubSubMessage</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/cache/src/keydb/types.ts#L53) <code v-pre>packages/cache/src/keydb/types.ts</code>

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

#### <code v-pre>KeyDBSubscription</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/cache/src/keydb/types.ts#L67) <code v-pre>packages/cache/src/keydb/types.ts</code>

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

#### <code v-pre>KeyDBTestEnv</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/cache/src/keydb/types.ts#L124) <code v-pre>packages/cache/src/keydb/types.ts</code>

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

#### <code v-pre>SetupKeyDBEnvOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/cache/src/keydb/types.ts#L82) <code v-pre>packages/cache/src/keydb/types.ts</code>

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
