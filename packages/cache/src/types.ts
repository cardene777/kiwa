import type { TestEnvBase, TestMode } from '@kiwa-lab/core';

/**
 * Redis backend selection.
 * - `testcontainers`: start a real Redis in a testcontainers-managed Docker
 *   container. Deterministic + prod-shape parity. Requires Docker + the
 *   `testcontainers` + one of `ioredis` / `redis` peer dependencies.
 * - `in-memory`: run against an in-process Redis-compatible fake tied to the
 *   test process only. Fast (no container startup), fully offline, and
 *   sufficient for the majority of key/value + TTL + Pub/Sub semantics. Redis-
 *   side data structures (lists / sorted sets / streams) are out of v0.1 scope.
 */
export type CacheMode = 'testcontainers' | 'in-memory';

/**
 * Wire-shape client selector for `testcontainers` mode. Mirrors the two
 * dominant Redis client libraries so consumers can align the fixture with
 * whichever they already depend on in prod.
 * - `ioredis`: the callback / Promise-style Redis client (peer `ioredis@^5`).
 * - `node-redis`: the official Redis client (peer `redis@^4`, v4 unified API).
 */
export type CacheClient = 'ioredis' | 'node-redis';

/**
 * Snapshot of a captured Pub/Sub delivery. Emitted to subscribers of a
 * channel via {@link CacheTestEnv.subscribe}.
 *
 * Values are stored as raw strings — the fixture never JSON-parses on the
 * consumer's behalf so binary-shaped payloads survive the roundtrip.
 */
export interface PubSubMessage {
  channel: string;
  message: string;
  /** Delivery order within the env (monotonically increasing). */
  index: number;
}

/**
 * Return type of {@link CacheTestEnv.subscribe}. Behaves like an async iterable
 * of {@link PubSubMessage} while also exposing a `.close()` method for
 * deterministic cleanup inside `afterEach`.
 */
export interface CacheSubscription {
  /** Channel this subscription is listening on. */
  channel: string;
  /** Total messages captured so far — includes any that have been drained. */
  received: () => PubSubMessage[];
  /** Await the next incoming message (rejects on timeout). */
  next: (opts?: { timeoutMs?: number | undefined }) => Promise<PubSubMessage>;
  /** Tear down the underlying Redis subscription. */
  close: () => Promise<void>;
}

/** Assertion contract for TTL / expiry checks. */
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

/**
 * Common options for the `setupCacheEnv` factory. `mode` chooses the backend;
 * `redis` is a testcontainers-only override.
 */
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
  redis?:
    | {
        /** Docker image tag. Defaults to `redis:7-alpine`. */
        image?: string | undefined;
        /**
         * Optional externally-managed Redis connection URL. When supplied the
         * helper skips container creation entirely.
         */
        url?: string | undefined;
      }
    | undefined;
  /**
   * in-memory overrides. Ignored when `mode === 'testcontainers'`.
   */
  inMemory?:
    | {
        /**
         * How often the fake polls its expiry heap for TTL enforcement (ms).
         * Defaults to 5 which is fine for unit-shaped suites. Set lower for
         * tests that assert sub-10ms expiry latency.
         */
        expiryTickMs?: number | undefined;
      }
    | undefined;
}

/**
 * Return type of {@link setupCacheEnv}. Reads much like a tiny Redis facade —
 * consumers get / set / delete keys, then use the assertion helpers to observe
 * TTL and Pub/Sub outcomes without touching Redis client APIs directly.
 */
export interface CacheTestEnv<TMode extends TestMode = TestMode>
  extends TestEnvBase<TMode> {
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
  set: (
    key: string,
    value: string,
    opts?: { ttlSeconds?: number | undefined },
  ) => Promise<void>;

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
  assertPublished: (
    channel: string,
    expected: { match: string | RegExp; timeoutMs?: number | undefined },
  ) => Promise<PubSubMessage>;

  /** Wipe the store. Mirrors Redis' `FLUSHDB` — used mainly for test isolation. */
  flushAll: () => Promise<void>;
}
