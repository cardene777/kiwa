import {
  createHonoApp,
  type HonoAppLike,
  type HonoContext,
  type Handler,
  type HonoResponseSpec,
  type Middleware,
} from '@kiwa-lab/hono';

/**
 * The dogfood app — 5 routes wired into a `createHonoApp()` instance with a
 * 5-layer middleware chain applied globally on `/*`. Every route hits every
 * middleware in the same registered order (cors → auth → logger → rate-limit
 * → validator → handler), so the fidelity harness can prove the trace
 * shape end-to-end.
 *
 * Route surface.
 *
 * - `GET  /health`         — trivial 200 JSON, exercises the full chain
 * - `GET  /greet/:name`    — echo route with param + query fallback
 * - `POST /kv-counter`     — increments a KV counter under key `dogfood`
 * - `GET  /d1-list`        — runs a `SELECT` against the `notes` D1 table
 * - `POST /r2-upload`      — writes a body to the `assets` R2 bucket
 *
 * Every handler reads from `c.env` for its binding, mirroring how a real
 * Cloudflare Workers deployment gets `env.KV_NAMESPACE` / `env.DB` / etc.
 */

export const ROUTE_PATHS = {
  health: '/health',
  greet: '/greet/:name',
  kvCounter: '/kv-counter',
  d1List: '/d1-list',
  r2Upload: '/r2-upload',
} as const;

export const MIDDLEWARE_ORDER = [
  'cors',
  'auth',
  'logger',
  'rate-limit',
  'validator',
] as const;

export type MiddlewareName = (typeof MIDDLEWARE_ORDER)[number];

/** Env shape the app expects — matches wrangler `bindings` semantics. */
export interface DogfoodEnv {
  readonly KV_NAMESPACE: KvBinding;
  readonly DB: D1Binding;
  readonly ASSETS: R2Binding;
  readonly AUTH_TOKEN: string;
  readonly RATE_LIMIT: number;
  readonly [key: string]: unknown;
}

/**
 * KV binding contract — subset of the CF Workers `KVNamespace` interface the
 * routes touch (get / put). Kept intentionally narrow so tests can supply
 * either a real `mockKVNamespace()` from `@kiwa-lab/hono` or a hand-rolled
 * stub.
 */
export interface KvBinding {
  get(key: string): Promise<string | null>;
  put(key: string, value: string): Promise<void>;
}

/** D1 binding contract — a `prepare()` builder + async `all()` result. */
export interface D1Binding {
  prepare(sql: string): {
    all(): Promise<{ results: Array<Record<string, unknown>> }>;
    first<T = Record<string, unknown>>(): Promise<T | null>;
  };
}

/** R2 binding contract — put / get / list minimal shape. */
export interface R2Binding {
  put(key: string, body: string): Promise<{ etag: string }>;
  get(key: string): Promise<{ body: string } | null>;
  list(): Promise<{ objects: Array<{ key: string }> }>;
}

/** Trace of every middleware entered — populated per-request by the logger. */
export interface MiddlewareCallSite {
  readonly name: MiddlewareName;
  readonly at: number;
}

const MIDDLEWARE_CALL_LOG_KEY = 'middlewareCallLog';

/**
 * cors middleware — sets response headers required for browser preflight.
 * The chain runs cors first because every downstream response needs the
 * headers stamped on before the handler decides the status code.
 */
export const corsMiddleware: Middleware<DogfoodEnv> = async (c, next) => {
  recordMiddleware(c, 'cors');
  await next();
  c.response.headers['access-control-allow-origin'] = '*';
  c.response.headers['access-control-allow-methods'] = 'GET, POST, PUT, DELETE';
};

/**
 * auth middleware — checks the `authorization: Bearer <token>` header
 * against `env.AUTH_TOKEN`. Missing or mismatched → 401 short-circuit.
 * Successful auth still calls `next()` so the rest of the chain runs.
 */
export const authMiddleware: Middleware<DogfoodEnv> = async (c, next) => {
  recordMiddleware(c, 'auth');
  const header = c.req.header('authorization');
  const expected = c.env.AUTH_TOKEN ? `Bearer ${c.env.AUTH_TOKEN}` : null;
  if (expected && header !== expected) {
    c.status(401);
    c.response.body = { error: 'unauthorized' };
    c.response.bodyKind = 'json';
    return;
  }
  await next();
};

/**
 * logger middleware — appends a trace entry per request. Runs before the
 * handler so downstream middleware entries have a monotonic counter to
 * compare against.
 */
export const loggerMiddleware: Middleware<DogfoodEnv> = async (c, next) => {
  recordMiddleware(c, 'logger');
  c.set('startedAt', Date.now());
  await next();
};

/**
 * rate-limit middleware — bumps a counter keyed by client id. When the
 * counter exceeds `env.RATE_LIMIT`, the request short-circuits with 429.
 * The counter lives in a shared closure so successive requests in a test
 * accumulate correctly.
 */
const rateLimitCounter = new Map<string, number>();
export function resetRateLimit(): void {
  rateLimitCounter.clear();
}
export const rateLimitMiddleware: Middleware<DogfoodEnv> = async (c, next) => {
  recordMiddleware(c, 'rate-limit');
  const clientId = c.req.header('x-client-id') ?? 'anonymous';
  const current = (rateLimitCounter.get(clientId) ?? 0) + 1;
  rateLimitCounter.set(clientId, current);
  if (current > c.env.RATE_LIMIT) {
    c.status(429);
    c.response.body = { error: 'rate-limited', clientId, current };
    c.response.bodyKind = 'json';
    return;
  }
  await next();
};

/**
 * validator middleware — validates POST bodies before the handler runs.
 * Only `/kv-counter` + `/r2-upload` receive a body; others are pass-through.
 * Invalid JSON → 400 short-circuit.
 */
export const validatorMiddleware: Middleware<DogfoodEnv> = async (c, next) => {
  recordMiddleware(c, 'validator');
  if (c.req.method === 'POST') {
    try {
      const body = await c.req.json<Record<string, unknown>>();
      c.set('body', body);
    } catch {
      c.status(400);
      c.response.body = { error: 'invalid-json' };
      c.response.bodyKind = 'json';
      return;
    }
  }
  await next();
};

function recordMiddleware(
  c: HonoContext<DogfoodEnv>,
  name: MiddlewareName,
): void {
  const existing = (c.get(MIDDLEWARE_CALL_LOG_KEY) as MiddlewareCallSite[] | undefined) ?? [];
  existing.push({ name, at: existing.length });
  c.set(MIDDLEWARE_CALL_LOG_KEY, existing);
}

/**
 * Extract the middleware call log for the current request. Returns `[]`
 * when the chain never ran (route missed, error before validator).
 */
export function readMiddlewareLog(c: HonoContext<DogfoodEnv>): readonly MiddlewareCallSite[] {
  return ((c.get(MIDDLEWARE_CALL_LOG_KEY) as MiddlewareCallSite[] | undefined) ?? []).slice();
}

/** GET /health handler — no bindings, just proves the chain runs. */
export const healthHandler: Handler<DogfoodEnv> = (c) => {
  return c.json({ ok: true, route: 'health' });
};

/** GET /greet/:name handler — param + query fallback + `hello` message. */
export const greetHandler: Handler<DogfoodEnv> = (c) => {
  const name = c.req.param('name') ?? c.req.queryValue('name') ?? 'world';
  return c.json({ ok: true, message: `hello ${name}` });
};

/** POST /kv-counter — increment KV counter under fixed key. */
export const kvCounterHandler: Handler<DogfoodEnv> = async (c) => {
  const current = Number((await c.env.KV_NAMESPACE.get('dogfood')) ?? '0');
  const next = current + 1;
  await c.env.KV_NAMESPACE.put('dogfood', String(next));
  return c.json({ ok: true, previous: current, next });
};

/** GET /d1-list — SELECT notes.title FROM notes. */
export const d1ListHandler: Handler<DogfoodEnv> = async (c) => {
  const stmt = c.env.DB.prepare('SELECT id, title FROM notes ORDER BY id ASC');
  const result = await stmt.all();
  return c.json({ ok: true, notes: result.results });
};

/** POST /r2-upload — write body.contents to r2 under body.key. */
export const r2UploadHandler: Handler<DogfoodEnv> = async (c) => {
  const body = c.get('body') as { key?: unknown; contents?: unknown } | undefined;
  if (!body || typeof body.key !== 'string' || typeof body.contents !== 'string') {
    c.status(422);
    return c.json({ ok: false, error: 'missing key or contents' });
  }
  const result = await c.env.ASSETS.put(body.key, body.contents);
  return c.json({ ok: true, key: body.key, etag: result.etag });
};

/** Build the dogfood app with all 5 middleware attached on `/*`. */
export function buildDogfoodApp(): HonoAppLike<DogfoodEnv> {
  const app = createHonoApp<DogfoodEnv>();
  app.use('/*', corsMiddleware);
  app.use('/*', authMiddleware);
  app.use('/*', loggerMiddleware);
  app.use('/*', rateLimitMiddleware);
  app.use('/*', validatorMiddleware);
  app.get(ROUTE_PATHS.health, healthHandler);
  app.get(ROUTE_PATHS.greet, greetHandler);
  app.post(ROUTE_PATHS.kvCounter, kvCounterHandler);
  app.get(ROUTE_PATHS.d1List, d1ListHandler);
  app.post(ROUTE_PATHS.r2Upload, r2UploadHandler);
  return app;
}

/** Placeholder response type used to type-tag the hc client for tests. */
export type DogfoodResponseSpec = HonoResponseSpec;
