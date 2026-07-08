import {
  createExecutionContext,
  createWorkersEnv,
  mockD1Database,
  mockKVNamespace,
  mockR2Bucket,
  type D1DatabaseLike,
  type ExecutionContextMockLike,
  type KVNamespaceLike,
  type R2BucketLike,
  type WorkersEnvLike,
} from '@kiwa/hono';
import type { DogfoodEnv, KvBinding, R2Binding, D1Binding } from '../routes/app.js';

/**
 * Build a Workers env populated with in-memory KV / D1 / R2 stubs plus the
 * dogfood-specific vars (`AUTH_TOKEN`, `RATE_LIMIT`). The returned tuple
 * exposes the bindings so tests can seed them directly (`kv.put(...)`,
 * `d1.exec(...)`) before dispatching a request.
 *
 * The exec context is returned so tests can call `waitUntilAll()` before
 * asserting on the side-effects the handlers scheduled (KV writes queued
 * through `ctx.waitUntil(...)` etc).
 */
export interface DogfoodBindings {
  readonly env: DogfoodEnv & WorkersEnvLike;
  readonly kv: KVNamespaceLike;
  readonly d1: D1DatabaseLike;
  readonly r2: R2BucketLike;
  readonly ctx: ExecutionContextMockLike;
}

export interface DogfoodBindingsOptions {
  readonly authToken?: string;
  readonly rateLimit?: number;
}

/**
 * Assemble the dogfood env. The default `authToken` is set to a non-empty
 * value so tests exercise the "authorised" branch by default. Pass an
 * empty string to disable auth checks (mirrors a public endpoint).
 */
export function createDogfoodBindings(
  opts: DogfoodBindingsOptions = {},
): DogfoodBindings {
  const kv = mockKVNamespace();
  const d1 = mockD1Database();
  const r2 = mockR2Bucket();
  const ctx = createExecutionContext();

  // Adapt kiwa's raw stubs to the narrow route-side contracts. Both stubs
  // fulfil the CF binding shape but adding a per-route facade keeps the
  // dogfood-facing surface tiny and testable.
  const kvBinding: KvBinding = {
    get: (key) => kv.get(key),
    put: (key, value) => kv.put(key, value),
  };
  const d1Binding: D1Binding = {
    prepare(sql: string) {
      const prepared = d1.prepare(sql);
      return {
        all: () => prepared.all() as Promise<{ results: Array<Record<string, unknown>> }>,
        first: <T = Record<string, unknown>>() =>
          prepared.first() as Promise<T | null>,
      };
    },
  };
  const r2Binding: R2Binding = {
    async put(key, body) {
      // kiwa's R2 mock returns an R2Object with key + size + uploaded but
      // no etag. Real CF R2 stamps an etag on the response — the dogfood
      // synthesises one from the key + size so tests can assert on stable
      // string content rather than a live CF response.
      const object = await r2.put(key, body);
      const etag = `"${object.key}-${object.size}"`;
      return { etag };
    },
    async get(key) {
      const obj = await r2.get(key);
      if (!obj) return null;
      // R2Object.value is `string | ArrayBuffer`. The dogfood only writes
      // strings so we assert the string branch here — a real handler that
      // wanted binary bodies would branch on the value type.
      const body = typeof obj.value === 'string' ? obj.value : '';
      return { body };
    },
    async list() {
      const listing = await r2.list();
      return { objects: listing.objects.map((o) => ({ key: o.key })) };
    },
  };

  const env = createWorkersEnv({
    vars: {
      AUTH_TOKEN: opts.authToken ?? 'kiwa-dogfood-token',
      RATE_LIMIT: String(opts.rateLimit ?? 100),
    },
  }) as WorkersEnvLike & Record<string, unknown>;
  env.KV_NAMESPACE = kvBinding;
  env.DB = d1Binding;
  env.ASSETS = r2Binding;
  env.RATE_LIMIT = opts.rateLimit ?? 100;

  return {
    env: env as DogfoodEnv & WorkersEnvLike,
    kv,
    d1,
    r2,
    ctx,
  };
}
