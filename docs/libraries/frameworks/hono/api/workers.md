---
title: "@kiwa-lab/hono workers の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/hono</code> <code v-pre>workers</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/hono/src/workers.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>createExecutionContext</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/hono/src/workers.ts#L334) <code v-pre>packages/hono/src/workers.ts</code>

Build a Workers-shaped `ExecutionContext`. `waitUntil` collects the promises so tests can await them all with `ctx.waitUntilAll()` before asserting on side-effects (KV writes, log flushes, etc).

```ts
export declare function createExecutionContext(): ExecutionContextMockLike;
```

#### <code v-pre>createWorkersEnv</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/hono/src/workers.ts#L380) <code v-pre>packages/hono/src/workers.ts</code>

Assemble a Workers-shaped `env` object. KV / D1 / R2 stubs get spread onto the env under their binding names + `vars` / `secrets` become plain string properties. Callers can pass the result directly to `HonoAppLike.request(url, init, env, ctx)` or attach it to `createContext({ env })`.

```ts
export declare function createWorkersEnv(spec?: WorkersEnvSpec): WorkersEnvLike;
```

#### <code v-pre>D1&#95;DATABASE&#95;SYMBOL</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/hono/src/workers.ts#L29) <code v-pre>packages/hono/src/workers.ts</code>

```ts
export declare const D1_DATABASE_SYMBOL: unique symbol;
```

#### <code v-pre>EXECUTION&#95;CTX&#95;SYMBOL</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/hono/src/workers.ts#L27) <code v-pre>packages/hono/src/workers.ts</code>

```ts
export declare const EXECUTION_CTX_SYMBOL: unique symbol;
```

#### <code v-pre>isD1DatabaseMock</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/hono/src/workers.ts#L420) <code v-pre>packages/hono/src/workers.ts</code>

Type guard: recognize a D1 database mock.

```ts
export declare function isD1DatabaseMock(value: unknown): value is D1DatabaseLike;
```

#### <code v-pre>isExecutionContextMock</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/hono/src/workers.ts#L402) <code v-pre>packages/hono/src/workers.ts</code>

Type guard: recognize an ExecutionContext mock.

```ts
export declare function isExecutionContextMock(value: unknown): value is ExecutionContextMockLike;
```

#### <code v-pre>isKVNamespaceMock</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/hono/src/workers.ts#L411) <code v-pre>packages/hono/src/workers.ts</code>

Type guard: recognize a KV namespace mock.

```ts
export declare function isKVNamespaceMock(value: unknown): value is KVNamespaceLike;
```

#### <code v-pre>isR2BucketMock</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/hono/src/workers.ts#L429) <code v-pre>packages/hono/src/workers.ts</code>

Type guard: recognize an R2 bucket mock.

```ts
export declare function isR2BucketMock(value: unknown): value is R2BucketLike;
```

#### <code v-pre>isWorkersEnv</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/hono/src/workers.ts#L393) <code v-pre>packages/hono/src/workers.ts</code>

Type guard: recognize a WorkersEnvLike.

```ts
export declare function isWorkersEnv(value: unknown): value is WorkersEnvLike;
```

#### <code v-pre>KV&#95;NAMESPACE&#95;SYMBOL</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/hono/src/workers.ts#L28) <code v-pre>packages/hono/src/workers.ts</code>

```ts
export declare const KV_NAMESPACE_SYMBOL: unique symbol;
```

#### <code v-pre>mockD1Database</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/hono/src/workers.ts#L174) <code v-pre>packages/hono/src/workers.ts</code>

Build an in-memory D1 database stub. Tests register canned responses per query text with `__setResponse` and inspect executed queries + bindings via `__log()`. Real D1 uses SQLite; the mock is intentionally query-string matched (no SQL parsing) so the behavior tests observe is deterministic.

```ts
export declare function mockD1Database(): D1DatabaseLike;
```

#### <code v-pre>mockKVNamespace</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/hono/src/workers.ts#L68) <code v-pre>packages/hono/src/workers.ts</code>

Build an in-memory KV namespace stub with the Cloudflare Workers surface (`get` / `put` / `delete` / `list` / `getWithMetadata`). Expiration is evaluated against `Date.now()` on read, matching Workers behavior.

```ts
export declare function mockKVNamespace<TMetadata = unknown>(): KVNamespaceLike<TMetadata>;
```

#### <code v-pre>mockR2Bucket</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/hono/src/workers.ts#L277) <code v-pre>packages/hono/src/workers.ts</code>

Build an in-memory R2 bucket stub. Values may be strings or ArrayBuffers; the mock does not parse content type or compute checksums — those are the caller's responsibility if a test asserts on them.

```ts
export declare function mockR2Bucket(): R2BucketLike;
```

#### <code v-pre>R2&#95;BUCKET&#95;SYMBOL</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/hono/src/workers.ts#L30) <code v-pre>packages/hono/src/workers.ts</code>

```ts
export declare const R2_BUCKET_SYMBOL: unique symbol;
```

#### <code v-pre>WORKERS&#95;ENV&#95;SYMBOL</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/hono/src/workers.ts#L26) <code v-pre>packages/hono/src/workers.ts</code>

```ts
export declare const WORKERS_ENV_SYMBOL: unique symbol;
```

### 型

#### <code v-pre>D1DatabaseLike</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/hono/src/workers.ts#L158) <code v-pre>packages/hono/src/workers.ts</code>

```ts
export interface D1DatabaseLike {
    readonly [D1_DATABASE_SYMBOL]: true;
    prepare(query: string): D1PreparedStatementLike;
    batch(statements: ReadonlyArray<D1PreparedStatementLike>): Promise<D1Result[]>;
    exec(query: string): Promise<D1Result<D1Row>>;
    /** Test-only: register a canned response for `prepare(query).all()` / `.first()`. */
    __setResponse(query: string, rows: readonly D1Row[]): void;
    __log(): ReadonlyArray<{
        query: string;
        bindings: unknown[];
    }>;
}
```

#### <code v-pre>D1PreparedStatementLike</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/hono/src/workers.ts#L151) <code v-pre>packages/hono/src/workers.ts</code>

```ts
export interface D1PreparedStatementLike {
    bind(...values: unknown[]): D1PreparedStatementLike;
    first<T = D1Row>(colName?: string): Promise<T | null>;
    all<T = D1Row>(): Promise<D1Result<T>>;
    run(): Promise<D1Result<D1Row>>;
}
```

#### <code v-pre>D1Result</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/hono/src/workers.ts#L145) <code v-pre>packages/hono/src/workers.ts</code>

```ts
export interface D1Result<T = D1Row> {
    readonly results: T[];
    readonly success: boolean;
    readonly meta: {
        readonly duration: number;
        readonly changes: number;
        readonly last_row_id: number;
    };
}
```

#### <code v-pre>D1Row</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/hono/src/workers.ts#L143) <code v-pre>packages/hono/src/workers.ts</code>

D1 result row — dictionary of column → value.

```ts
export type D1Row = Record<string, unknown>;
```

#### <code v-pre>ExecutionContextMockLike</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/hono/src/workers.ts#L319) <code v-pre>packages/hono/src/workers.ts</code>

```ts
export interface ExecutionContextMockLike extends ExecutionCtxLike {
    readonly [EXECUTION_CTX_SYMBOL]: true;
    /** Test hook — resolve every promise passed to `waitUntil`. */
    waitUntilAll(): Promise<void>;
    /** Was `passThroughOnException()` called at least once? */
    didPassThrough(): boolean;
    /** How many promises did `waitUntil()` receive? */
    pendingCount(): number;
}
```

#### <code v-pre>KVEntry</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/hono/src/workers.ts#L33) <code v-pre>packages/hono/src/workers.ts</code>

KV entry — value + optional metadata + expiration timestamp.

```ts
export interface KVEntry<TMetadata = unknown> {
    readonly value: string;
    readonly metadata?: TMetadata;
    readonly expiresAt: number | null;
}
```

#### <code v-pre>KVListResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/hono/src/workers.ts#L39) <code v-pre>packages/hono/src/workers.ts</code>

```ts
export interface KVListResult<TMetadata = unknown> {
    readonly keys: ReadonlyArray<{
        readonly name: string;
        readonly metadata?: TMetadata;
        readonly expiration?: number;
    }>;
    readonly list_complete: boolean;
    readonly cursor: string | null;
}
```

#### <code v-pre>KVNamespaceLike</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/hono/src/workers.ts#L52) <code v-pre>packages/hono/src/workers.ts</code>

```ts
export interface KVNamespaceLike<TMetadata = unknown> {
    readonly [KV_NAMESPACE_SYMBOL]: true;
    get(key: string): Promise<string | null>;
    getWithMetadata(key: string): Promise<{
        value: string | null;
        metadata: TMetadata | null;
    }>;
    put(key: string, value: string, options?: KVPutOptions<TMetadata>): Promise<void>;
    delete(key: string): Promise<void>;
    list(options?: {
        prefix?: string;
        limit?: number;
    }): Promise<KVListResult<TMetadata>>;
    /** Test-only escape hatch — snapshot every key + entry synchronously. */
    __snapshot(): Record<string, KVEntry<TMetadata>>;
}
```

#### <code v-pre>KVPutOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/hono/src/workers.ts#L46) <code v-pre>packages/hono/src/workers.ts</code>

Options passed to `KVNamespace.put()`.

```ts
export interface KVPutOptions<TMetadata = unknown> {
    readonly expirationTtl?: number;
    readonly expiration?: number;
    readonly metadata?: TMetadata;
}
```

#### <code v-pre>R2BucketLike</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/hono/src/workers.ts#L259) <code v-pre>packages/hono/src/workers.ts</code>

```ts
export interface R2BucketLike {
    readonly [R2_BUCKET_SYMBOL]: true;
    get(key: string): Promise<R2Object | null>;
    put(key: string, value: string | ArrayBuffer, options?: {
        httpMetadata?: R2Object['httpMetadata'];
        customMetadata?: R2Object['customMetadata'];
    }): Promise<R2Object>;
    delete(key: string): Promise<void>;
    list(options?: {
        prefix?: string;
        limit?: number;
    }): Promise<R2ListResult>;
    __snapshot(): Record<string, R2Object>;
}
```

#### <code v-pre>R2ListResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/hono/src/workers.ts#L253) <code v-pre>packages/hono/src/workers.ts</code>

```ts
export interface R2ListResult {
    readonly objects: ReadonlyArray<R2Object>;
    readonly truncated: boolean;
    readonly cursor: string | null;
}
```

#### <code v-pre>R2Object</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/hono/src/workers.ts#L244) <code v-pre>packages/hono/src/workers.ts</code>

```ts
export interface R2Object {
    readonly key: string;
    readonly value: string | ArrayBuffer;
    readonly httpMetadata?: {
        readonly contentType?: string;
    };
    readonly customMetadata?: Record<string, string>;
    readonly size: number;
    readonly uploaded: Date;
}
```

#### <code v-pre>WorkersEnvLike</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/hono/src/workers.ts#L370) <code v-pre>packages/hono/src/workers.ts</code>

```ts
export interface WorkersEnvLike extends Record<string, unknown> {
    readonly [WORKERS_ENV_SYMBOL]: true;
}
```

#### <code v-pre>WorkersEnvSpec</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/hono/src/workers.ts#L362) <code v-pre>packages/hono/src/workers.ts</code>

```ts
export interface WorkersEnvSpec {
    readonly kv?: Record<string, KVNamespaceLike>;
    readonly d1?: Record<string, D1DatabaseLike>;
    readonly r2?: Record<string, R2BucketLike>;
    readonly vars?: Record<string, string>;
    readonly secrets?: Record<string, string>;
}
```
