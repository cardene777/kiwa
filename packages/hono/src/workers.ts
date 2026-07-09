// Cloudflare Workers env + ExecutionContext mock for kiwa (Issue #815, v1.19-1c).
//
// Real Hono apps deployed to Cloudflare Workers receive an `env` object
// populated by wrangler bindings (KV / D1 / R2 / Durable Object / Queue) and
// an `ExecutionContext` with `waitUntil` + `passThroughOnException`. kiwa
// gives tests a lightweight in-memory implementation of the surface Hono
// handlers actually observe:
//
//   - `createWorkersEnv({ kv, d1, r2 })` — an env object shaped like a
//     wrangler bindings dictionary with in-memory KV / D1 / R2 stubs
//   - `createExecutionContext()` — an ExecutionContext with `waitUntil` +
//     `passThroughOnException` that captures every scheduled promise so
//     tests can `await ctx.waitUntilAll()` before assertions
//   - `mockKVNamespace()` / `mockD1Database()` / `mockR2Bucket()` — standalone
//     stubs that can be combined with `createWorkersEnv` or dropped into any
//     `HonoContext.env` field
//
// Out of scope on purpose:
//   - real Durable Object binding lifecycle (implementations require the DO
//     runtime; use a fake `env.MY_DO` object in the test itself)
//   - real Queue producer + consumer messaging (see @kiwa-lab/queue instead)
//   - websockets / WebSocketPair / attached crypto keys (v0.1)

import type { ExecutionCtxLike } from './app.js';

export const WORKERS_ENV_SYMBOL = Symbol.for('kiwa.hono.workers.env');
export const EXECUTION_CTX_SYMBOL = Symbol.for('kiwa.hono.workers.executionCtx');
export const KV_NAMESPACE_SYMBOL = Symbol.for('kiwa.hono.workers.kv');
export const D1_DATABASE_SYMBOL = Symbol.for('kiwa.hono.workers.d1');
export const R2_BUCKET_SYMBOL = Symbol.for('kiwa.hono.workers.r2');

/** KV entry — value + optional metadata + expiration timestamp. */
export interface KVEntry<TMetadata = unknown> {
  readonly value: string;
  readonly metadata?: TMetadata;
  readonly expiresAt: number | null;
}

export interface KVListResult<TMetadata = unknown> {
  readonly keys: ReadonlyArray<{ readonly name: string; readonly metadata?: TMetadata; readonly expiration?: number }>;
  readonly list_complete: boolean;
  readonly cursor: string | null;
}

/** Options passed to `KVNamespace.put()`. */
export interface KVPutOptions<TMetadata = unknown> {
  readonly expirationTtl?: number;
  readonly expiration?: number;
  readonly metadata?: TMetadata;
}

export interface KVNamespaceLike<TMetadata = unknown> {
  readonly [KV_NAMESPACE_SYMBOL]: true;
  get(key: string): Promise<string | null>;
  getWithMetadata(key: string): Promise<{ value: string | null; metadata: TMetadata | null }>;
  put(key: string, value: string, options?: KVPutOptions<TMetadata>): Promise<void>;
  delete(key: string): Promise<void>;
  list(options?: { prefix?: string; limit?: number }): Promise<KVListResult<TMetadata>>;
  /** Test-only escape hatch — snapshot every key + entry synchronously. */
  __snapshot(): Record<string, KVEntry<TMetadata>>;
}

/**
 * Build an in-memory KV namespace stub with the Cloudflare Workers surface
 * (`get` / `put` / `delete` / `list` / `getWithMetadata`). Expiration is
 * evaluated against `Date.now()` on read, matching Workers behavior.
 */
export function mockKVNamespace<TMetadata = unknown>(): KVNamespaceLike<TMetadata> {
  const store = new Map<string, KVEntry<TMetadata>>();
  const isExpired = (entry: KVEntry<TMetadata>): boolean => {
    return entry.expiresAt !== null && Date.now() > entry.expiresAt;
  };
  const namespace: KVNamespaceLike<TMetadata> = {
    [KV_NAMESPACE_SYMBOL]: true,
    async get(key) {
      const entry = store.get(key);
      if (!entry) return null;
      if (isExpired(entry)) {
        store.delete(key);
        return null;
      }
      return entry.value;
    },
    async getWithMetadata(key) {
      const entry = store.get(key);
      if (!entry) return { value: null, metadata: null };
      if (isExpired(entry)) {
        store.delete(key);
        return { value: null, metadata: null };
      }
      return { value: entry.value, metadata: (entry.metadata ?? null) as TMetadata | null };
    },
    async put(key, value, options) {
      const now = Date.now();
      let expiresAt: number | null = null;
      if (options?.expirationTtl !== undefined) expiresAt = now + options.expirationTtl * 1000;
      else if (options?.expiration !== undefined) expiresAt = options.expiration * 1000;
      const entry: KVEntry<TMetadata> = {
        value,
        expiresAt,
        ...(options?.metadata !== undefined ? { metadata: options.metadata } : {}),
      };
      store.set(key, entry);
    },
    async delete(key) {
      store.delete(key);
    },
    async list(options = {}) {
      const prefix = options.prefix ?? '';
      const limit = options.limit ?? 1000;
      const matches: KVListResult<TMetadata>['keys'][number][] = [];
      for (const [name, entry] of store.entries()) {
        if (!name.startsWith(prefix)) continue;
        if (isExpired(entry)) {
          store.delete(name);
          continue;
        }
        matches.push({
          name,
          ...(entry.metadata !== undefined ? { metadata: entry.metadata } : {}),
          ...(entry.expiresAt !== null ? { expiration: Math.floor(entry.expiresAt / 1000) } : {}),
        });
        if (matches.length >= limit) break;
      }
      return { keys: matches, list_complete: matches.length < limit, cursor: null };
    },
    __snapshot() {
      const out: Record<string, KVEntry<TMetadata>> = {};
      for (const [k, v] of store.entries()) {
        if (isExpired(v)) {
          store.delete(k);
          continue;
        }
        out[k] = v;
      }
      return out;
    },
  };
  return namespace;
}

/** D1 result row — dictionary of column → value. */
export type D1Row = Record<string, unknown>;

export interface D1Result<T = D1Row> {
  readonly results: T[];
  readonly success: boolean;
  readonly meta: { readonly duration: number; readonly changes: number; readonly last_row_id: number };
}

export interface D1PreparedStatementLike {
  bind(...values: unknown[]): D1PreparedStatementLike;
  first<T = D1Row>(colName?: string): Promise<T | null>;
  all<T = D1Row>(): Promise<D1Result<T>>;
  run(): Promise<D1Result<D1Row>>;
}

export interface D1DatabaseLike {
  readonly [D1_DATABASE_SYMBOL]: true;
  prepare(query: string): D1PreparedStatementLike;
  batch(statements: ReadonlyArray<D1PreparedStatementLike>): Promise<D1Result[]>;
  exec(query: string): Promise<D1Result<D1Row>>;
  /** Test-only: register a canned response for `prepare(query).all()` / `.first()`. */
  __setResponse(query: string, rows: readonly D1Row[]): void;
  __log(): ReadonlyArray<{ query: string; bindings: unknown[] }>;
}

/**
 * Build an in-memory D1 database stub. Tests register canned responses per
 * query text with `__setResponse` and inspect executed queries + bindings via
 * `__log()`. Real D1 uses SQLite; the mock is intentionally query-string
 * matched (no SQL parsing) so the behavior tests observe is deterministic.
 */
export function mockD1Database(): D1DatabaseLike {
  const responses = new Map<string, readonly D1Row[]>();
  const log: { query: string; bindings: unknown[] }[] = [];

  const prepareStmt = (query: string, bindings: unknown[] = []): D1PreparedStatementLike => {
    const stmt: D1PreparedStatementLike = {
      bind(...values) {
        return prepareStmt(query, [...bindings, ...values]);
      },
      async first<T = D1Row>(colName?: string) {
        log.push({ query, bindings });
        const rows = responses.get(query) ?? [];
        const row = rows[0];
        if (!row) return null;
        if (colName !== undefined) return (row[colName] ?? null) as T;
        return row as T;
      },
      async all<T = D1Row>() {
        log.push({ query, bindings });
        const rows = responses.get(query) ?? [];
        return {
          results: rows as T[],
          success: true,
          meta: { duration: 0, changes: 0, last_row_id: 0 },
        };
      },
      async run() {
        log.push({ query, bindings });
        return {
          results: [] as D1Row[],
          success: true,
          meta: { duration: 0, changes: 1, last_row_id: 1 },
        };
      },
    };
    return stmt;
  };

  return {
    [D1_DATABASE_SYMBOL]: true,
    prepare(query) {
      return prepareStmt(query, []);
    },
    async batch(statements) {
      const out: D1Result[] = [];
      for (const stmt of statements) {
        // Best-effort: run each statement (drives `run()`) and collect the meta.
        // Real D1 supports transactional batches; the mock treats each as independent.
        out.push(await stmt.run());
      }
      return out;
    },
    async exec(query) {
      log.push({ query, bindings: [] });
      const rows = responses.get(query) ?? [];
      return {
        results: rows as D1Row[],
        success: true,
        meta: { duration: 0, changes: 0, last_row_id: 0 },
      };
    },
    __setResponse(query, rows) {
      responses.set(query, rows);
    },
    __log() {
      return log;
    },
  };
}

export interface R2Object {
  readonly key: string;
  readonly value: string | ArrayBuffer;
  readonly httpMetadata?: { readonly contentType?: string };
  readonly customMetadata?: Record<string, string>;
  readonly size: number;
  readonly uploaded: Date;
}

export interface R2ListResult {
  readonly objects: ReadonlyArray<R2Object>;
  readonly truncated: boolean;
  readonly cursor: string | null;
}

export interface R2BucketLike {
  readonly [R2_BUCKET_SYMBOL]: true;
  get(key: string): Promise<R2Object | null>;
  put(
    key: string,
    value: string | ArrayBuffer,
    options?: { httpMetadata?: R2Object['httpMetadata']; customMetadata?: R2Object['customMetadata'] },
  ): Promise<R2Object>;
  delete(key: string): Promise<void>;
  list(options?: { prefix?: string; limit?: number }): Promise<R2ListResult>;
  __snapshot(): Record<string, R2Object>;
}

/**
 * Build an in-memory R2 bucket stub. Values may be strings or ArrayBuffers; the
 * mock does not parse content type or compute checksums — those are the caller's
 * responsibility if a test asserts on them.
 */
export function mockR2Bucket(): R2BucketLike {
  const store = new Map<string, R2Object>();
  return {
    [R2_BUCKET_SYMBOL]: true,
    async get(key) {
      return store.get(key) ?? null;
    },
    async put(key, value, options = {}) {
      const size = typeof value === 'string' ? value.length : value.byteLength;
      const object: R2Object = {
        key,
        value,
        size,
        uploaded: new Date(),
        ...(options.httpMetadata !== undefined ? { httpMetadata: options.httpMetadata } : {}),
        ...(options.customMetadata !== undefined ? { customMetadata: options.customMetadata } : {}),
      };
      store.set(key, object);
      return object;
    },
    async delete(key) {
      store.delete(key);
    },
    async list(options = {}) {
      const prefix = options.prefix ?? '';
      const limit = options.limit ?? 1000;
      const objects: R2Object[] = [];
      for (const [name, obj] of store.entries()) {
        if (!name.startsWith(prefix)) continue;
        objects.push(obj);
        if (objects.length >= limit) break;
      }
      return { objects, truncated: objects.length >= limit, cursor: null };
    },
    __snapshot() {
      const out: Record<string, R2Object> = {};
      for (const [k, v] of store.entries()) out[k] = v;
      return out;
    },
  };
}

export interface ExecutionContextMockLike extends ExecutionCtxLike {
  readonly [EXECUTION_CTX_SYMBOL]: true;
  /** Test hook — resolve every promise passed to `waitUntil`. */
  waitUntilAll(): Promise<void>;
  /** Was `passThroughOnException()` called at least once? */
  didPassThrough(): boolean;
  /** How many promises did `waitUntil()` receive? */
  pendingCount(): number;
}

/**
 * Build a Workers-shaped `ExecutionContext`. `waitUntil` collects the promises
 * so tests can await them all with `ctx.waitUntilAll()` before asserting on
 * side-effects (KV writes, log flushes, etc).
 */
export function createExecutionContext(): ExecutionContextMockLike {
  const pending: Promise<unknown>[] = [];
  let passedThrough = false;
  return {
    [EXECUTION_CTX_SYMBOL]: true,
    waitUntil(promise) {
      pending.push(Promise.resolve(promise));
    },
    passThroughOnException() {
      passedThrough = true;
    },
    async waitUntilAll() {
      // Iterate — new `waitUntil()` calls added inside a resolving promise are
      // still awaited (matches real Workers behavior of flushing until quiet).
      while (pending.length > 0) {
        const snapshot = pending.splice(0);
        await Promise.all(snapshot);
      }
    },
    didPassThrough() {
      return passedThrough;
    },
    pendingCount() {
      return pending.length;
    },
  };
}

export interface WorkersEnvSpec {
  readonly kv?: Record<string, KVNamespaceLike>;
  readonly d1?: Record<string, D1DatabaseLike>;
  readonly r2?: Record<string, R2BucketLike>;
  readonly vars?: Record<string, string>;
  readonly secrets?: Record<string, string>;
}

export interface WorkersEnvLike extends Record<string, unknown> {
  readonly [WORKERS_ENV_SYMBOL]: true;
}

/**
 * Assemble a Workers-shaped `env` object. KV / D1 / R2 stubs get spread onto
 * the env under their binding names + `vars` / `secrets` become plain string
 * properties. Callers can pass the result directly to `HonoAppLike.request(url,
 * init, env, ctx)` or attach it to `createContext({ env })`.
 */
export function createWorkersEnv(spec: WorkersEnvSpec = {}): WorkersEnvLike {
  const env: Record<string, unknown> = {
    [WORKERS_ENV_SYMBOL]: true,
  };
  if (spec.kv) Object.assign(env, spec.kv);
  if (spec.d1) Object.assign(env, spec.d1);
  if (spec.r2) Object.assign(env, spec.r2);
  if (spec.vars) Object.assign(env, spec.vars);
  if (spec.secrets) Object.assign(env, spec.secrets);
  return env as WorkersEnvLike;
}

/** Type guard: recognize a WorkersEnvLike. */
export function isWorkersEnv(value: unknown): value is WorkersEnvLike {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as { [WORKERS_ENV_SYMBOL]?: true })[WORKERS_ENV_SYMBOL] === true
  );
}

/** Type guard: recognize an ExecutionContext mock. */
export function isExecutionContextMock(value: unknown): value is ExecutionContextMockLike {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as { [EXECUTION_CTX_SYMBOL]?: true })[EXECUTION_CTX_SYMBOL] === true
  );
}

/** Type guard: recognize a KV namespace mock. */
export function isKVNamespaceMock(value: unknown): value is KVNamespaceLike {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as { [KV_NAMESPACE_SYMBOL]?: true })[KV_NAMESPACE_SYMBOL] === true
  );
}

/** Type guard: recognize a D1 database mock. */
export function isD1DatabaseMock(value: unknown): value is D1DatabaseLike {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as { [D1_DATABASE_SYMBOL]?: true })[D1_DATABASE_SYMBOL] === true
  );
}

/** Type guard: recognize an R2 bucket mock. */
export function isR2BucketMock(value: unknown): value is R2BucketLike {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as { [R2_BUCKET_SYMBOL]?: true })[R2_BUCKET_SYMBOL] === true
  );
}
