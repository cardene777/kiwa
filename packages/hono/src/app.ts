// HonoJS app + route + middleware chain test helper for kiwa (Issue #815, v1.19-1c).
//
// Real Hono apps are `new Hono()` builders that wire route methods (`.get()`,
// `.post()`, ...) + middleware (`.use('/*', mw)`) into a fetch-shaped request /
// response contract. kiwa reproduces the observable contract without shipping
// the real Hono runtime — tests get:
//
//   - `createHonoApp()` — a Hono-shaped app builder with `.get()` / `.post()`
//     / `.put()` / `.delete()` / `.patch()` / `.use()` + `.request()` +
//     `.route()` for sub-app composition
//   - `invokeRoute({ app, method, path, body, headers })` — call `app.request`
//     and get a resolved `{ status, headers, body }` triple + a middleware
//     trace so tests can assert on the exact chain of `use()` calls executed
//   - `createContext({ req, env })` — a Hono `c` shape (`c.req`, `c.env`,
//     `c.status()`, `c.json()`, `c.text()`, `c.set()`, `c.get()`, `c.header()`)
//     without a real Hono runtime for isolated handler tests
//
// Out of scope on purpose:
//   - RegExp / param routing beyond `:param` + `*` wildcard (see the parser
//     below — full Hono `TrieRouter` is not reimplemented)
//   - streaming responses / SSE (responses are always fully buffered)
//   - real websocket / durable object bindings (see workers.ts for KV / D1 /
//     R2 / ExecutionContext mocks; websockets are out of scope for v0.1)

export const HONO_APP_SYMBOL = Symbol.for('kiwa.hono.app');
export const HONO_CONTEXT_SYMBOL = Symbol.for('kiwa.hono.context');
export const HONO_ROUTE_SYMBOL = Symbol.for('kiwa.hono.route');

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS' | 'HEAD';

/** Params captured from a `:name` segment. */
export interface RouteParams {
  readonly [key: string]: string | undefined;
}

/** Parsed query object from a URL search string. */
export interface QueryParams {
  readonly [key: string]: string | undefined;
}

/** Request contract exposed to handlers as `c.req`. */
export interface HonoRequest {
  readonly method: HttpMethod;
  readonly url: string;
  readonly path: string;
  readonly headers: Record<string, string>;
  readonly params: RouteParams;
  readonly query: QueryParams;
  json<T = unknown>(): Promise<T>;
  text(): Promise<string>;
  header(name: string): string | undefined;
  param(name: string): string | undefined;
  queryValue(name: string): string | undefined;
}

/** Buffered response captured by `c.json()` / `c.text()` / `c.header()`. */
export interface HonoResponseSpec {
  status: number;
  headers: Record<string, string>;
  body: unknown;
  bodyKind: 'json' | 'text' | 'empty';
}

/** Handler context — `c` in Hono. */
export interface HonoContext<TEnv = Record<string, unknown>, TVars = Record<string, unknown>> {
  readonly [HONO_CONTEXT_SYMBOL]: true;
  readonly req: HonoRequest;
  readonly env: TEnv;
  readonly executionCtx: ExecutionCtxLike | undefined;
  status(code: number): HonoContext<TEnv, TVars>;
  header(name: string, value: string): HonoContext<TEnv, TVars>;
  json<T>(body: T, status?: number): HonoResponseSpec;
  text(body: string, status?: number): HonoResponseSpec;
  set(key: string, value: unknown): void;
  get(key: string): unknown;
  readonly response: HonoResponseSpec;
}

/** Shape of `ExecutionContext` from workers.ts (avoid circular import). */
export interface ExecutionCtxLike {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

/** Handler = `(c) => c.json(...) | Response spec | Promise<...>`. */
export type Handler<TEnv = Record<string, unknown>, TVars = Record<string, unknown>> = (
  c: HonoContext<TEnv, TVars>,
) => HonoResponseSpec | Promise<HonoResponseSpec> | void | Promise<void>;

/** Middleware = `(c, next) => await next()` shape. */
export type Middleware<TEnv = Record<string, unknown>, TVars = Record<string, unknown>> = (
  c: HonoContext<TEnv, TVars>,
  next: () => Promise<void>,
) => void | Promise<void>;

interface RouteEntry<TEnv, TVars> {
  readonly [HONO_ROUTE_SYMBOL]: true;
  readonly method: HttpMethod | 'ALL';
  readonly pattern: string;
  readonly matcher: RouteMatcher;
  readonly handler: Handler<TEnv, TVars>;
}

interface MiddlewareEntry<TEnv, TVars> {
  readonly pattern: string;
  readonly matcher: RouteMatcher;
  readonly middleware: Middleware<TEnv, TVars>;
}

/** Trace entry produced by `invokeRoute` for the middleware chain. */
export interface MiddlewareTraceEntry {
  readonly kind: 'middleware' | 'handler';
  readonly pattern: string;
  readonly method: HttpMethod | 'ALL';
  readonly enteredAt: number;
  readonly exitedAt: number | null;
}

export interface HonoAppLike<TEnv = Record<string, unknown>, TVars = Record<string, unknown>> {
  readonly [HONO_APP_SYMBOL]: true;
  get(path: string, handler: Handler<TEnv, TVars>): this;
  post(path: string, handler: Handler<TEnv, TVars>): this;
  put(path: string, handler: Handler<TEnv, TVars>): this;
  delete(path: string, handler: Handler<TEnv, TVars>): this;
  patch(path: string, handler: Handler<TEnv, TVars>): this;
  all(path: string, handler: Handler<TEnv, TVars>): this;
  use(pattern: string, middleware: Middleware<TEnv, TVars>): this;
  route(prefix: string, sub: HonoAppLike<TEnv, TVars>): this;
  request(
    input: string | RequestInit,
    init?: RequestInit,
    env?: TEnv,
    executionCtx?: ExecutionCtxLike,
  ): Promise<HonoResponseSpec>;
  readonly routes: ReadonlyArray<RouteEntry<TEnv, TVars>>;
  readonly middlewares: ReadonlyArray<MiddlewareEntry<TEnv, TVars>>;
}

interface RouteMatcher {
  readonly regex: RegExp;
  readonly paramNames: readonly string[];
}

/**
 * Compile a Hono-shaped pattern (`/users/:id`, `/blog/*`, `/*`) into a regex +
 * captured param name list. Kept intentionally small — real Hono uses a trie
 * for prefix sharing; the subset we support is enough to model 90%+ of test
 * targets without duplicating the runtime.
 */
export function compileRoute(pattern: string): RouteMatcher {
  const paramNames: string[] = [];
  const parts = pattern.split('/').filter((p) => p.length > 0);
  const regexParts = parts.map((part) => {
    if (part === '*') return '.*';
    if (part.startsWith(':')) {
      paramNames.push(part.slice(1));
      return '([^/]+)';
    }
    return escapeRegex(part);
  });
  const source = parts.length === 0 ? '^/?$' : `^/${regexParts.join('/')}/?$`;
  return { regex: new RegExp(source), paramNames };
}

function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Match a request `path` against a matcher and return `{params}` when it hits,
 * `null` when it doesn't. Callers use this for both route dispatch + middleware
 * scope checks (`app.use('/api/*', ...)`).
 */
export function matchRoute(matcher: RouteMatcher, path: string): RouteParams | null {
  const m = matcher.regex.exec(path);
  if (!m) return null;
  const params: Record<string, string> = {};
  for (let i = 0; i < matcher.paramNames.length; i += 1) {
    const name = matcher.paramNames[i];
    if (name === undefined) continue;
    const value = m[i + 1];
    if (value !== undefined) params[name] = decodeURIComponent(value);
  }
  return params;
}

function parseQuery(url: string): QueryParams {
  const qIndex = url.indexOf('?');
  if (qIndex === -1) return {};
  const raw = url.slice(qIndex + 1);
  const out: Record<string, string> = {};
  for (const pair of raw.split('&')) {
    if (pair.length === 0) continue;
    const eqIndex = pair.indexOf('=');
    if (eqIndex === -1) {
      out[decodeURIComponent(pair)] = '';
      continue;
    }
    const key = decodeURIComponent(pair.slice(0, eqIndex));
    const value = decodeURIComponent(pair.slice(eqIndex + 1));
    out[key] = value;
  }
  return out;
}

function parsePath(url: string): string {
  // Accept absolute (http://host/path) or path-only (/path[?q]) forms.
  let path = url;
  if (path.startsWith('http://') || path.startsWith('https://')) {
    const rest = path.replace(/^https?:\/\/[^/]+/, '');
    path = rest.length === 0 ? '/' : rest;
  }
  const qIndex = path.indexOf('?');
  if (qIndex >= 0) path = path.slice(0, qIndex);
  return path;
}

/**
 * Build a `HonoRequest` shape from the primitives `invokeRoute` receives.
 * Body handling is deferred (json() / text() re-parse the raw body on demand)
 * so tests can assert on the raw string when needed.
 */
export function buildRequest(input: {
  method: HttpMethod;
  url: string;
  headers?: Record<string, string>;
  body?: string;
  params?: RouteParams;
}): HonoRequest {
  const headers = normalizeHeaders(input.headers ?? {});
  const query = parseQuery(input.url);
  const path = parsePath(input.url);
  const params = input.params ?? {};
  const rawBody = input.body ?? '';
  return {
    method: input.method,
    url: input.url,
    path,
    headers,
    params,
    query,
    async json<T = unknown>(): Promise<T> {
      if (rawBody === '') return undefined as T;
      return JSON.parse(rawBody) as T;
    },
    async text(): Promise<string> {
      return rawBody;
    },
    header(name: string): string | undefined {
      return headers[name.toLowerCase()];
    },
    param(name: string): string | undefined {
      return params[name];
    },
    queryValue(name: string): string | undefined {
      return query[name];
    },
  };
}

function normalizeHeaders(input: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(input)) {
    out[key.toLowerCase()] = value;
  }
  return out;
}

/**
 * Build a `HonoContext` — the `c` object handlers receive. `set` / `get` write
 * to an internal Map; `json` / `text` capture the response into a spec the
 * caller can inspect after the chain resolves.
 */
export function createContext<TEnv = Record<string, unknown>, TVars = Record<string, unknown>>(opts: {
  req: HonoRequest;
  env?: TEnv;
  executionCtx?: ExecutionCtxLike;
}): HonoContext<TEnv, TVars> {
  const vars = new Map<string, unknown>();
  const response: HonoResponseSpec = {
    status: 200,
    headers: {},
    body: undefined,
    bodyKind: 'empty',
  };
  const c: HonoContext<TEnv, TVars> = {
    [HONO_CONTEXT_SYMBOL]: true,
    req: opts.req,
    env: opts.env ?? ({} as TEnv),
    executionCtx: opts.executionCtx,
    status(code: number) {
      response.status = code;
      return c;
    },
    header(name: string, value: string) {
      response.headers[name] = value;
      return c;
    },
    json<T>(body: T, status?: number): HonoResponseSpec {
      response.body = body;
      response.bodyKind = 'json';
      if (status !== undefined) response.status = status;
      if (response.headers['content-type'] === undefined) {
        response.headers['content-type'] = 'application/json';
      }
      return response;
    },
    text(body: string, status?: number): HonoResponseSpec {
      response.body = body;
      response.bodyKind = 'text';
      if (status !== undefined) response.status = status;
      if (response.headers['content-type'] === undefined) {
        response.headers['content-type'] = 'text/plain; charset=utf-8';
      }
      return response;
    },
    set(key: string, value: unknown): void {
      vars.set(String(key), value);
    },
    get(key: string): unknown {
      return vars.get(String(key));
    },
    get response(): HonoResponseSpec {
      return response;
    },
  };
  return c;
}

/**
 * Create a Hono-shaped app builder. Routes registered via `.get()` etc. get
 * matched by `compileRoute`; middleware registered via `.use()` runs in
 * registration order for every matching request.
 */
export function createHonoApp<
  TEnv = Record<string, unknown>,
  TVars = Record<string, unknown>,
>(): HonoAppLike<TEnv, TVars> {
  const routes: RouteEntry<TEnv, TVars>[] = [];
  const middlewares: MiddlewareEntry<TEnv, TVars>[] = [];

  const addRoute = (method: HttpMethod | 'ALL', path: string, handler: Handler<TEnv, TVars>): void => {
    routes.push({
      [HONO_ROUTE_SYMBOL]: true,
      method,
      pattern: path,
      matcher: compileRoute(path),
      handler,
    });
  };

  const app: HonoAppLike<TEnv, TVars> = {
    [HONO_APP_SYMBOL]: true,
    get(path, handler) {
      addRoute('GET', path, handler);
      return app;
    },
    post(path, handler) {
      addRoute('POST', path, handler);
      return app;
    },
    put(path, handler) {
      addRoute('PUT', path, handler);
      return app;
    },
    delete(path, handler) {
      addRoute('DELETE', path, handler);
      return app;
    },
    patch(path, handler) {
      addRoute('PATCH', path, handler);
      return app;
    },
    all(path, handler) {
      addRoute('ALL', path, handler);
      return app;
    },
    use(pattern, middleware) {
      middlewares.push({ pattern, matcher: compileRoute(pattern), middleware });
      return app;
    },
    route(prefix, sub) {
      for (const mw of sub.middlewares as ReadonlyArray<MiddlewareEntry<TEnv, TVars>>) {
        const combined = joinPatterns(prefix, mw.pattern);
        middlewares.push({ pattern: combined, matcher: compileRoute(combined), middleware: mw.middleware });
      }
      for (const rt of sub.routes as ReadonlyArray<RouteEntry<TEnv, TVars>>) {
        const combined = joinPatterns(prefix, rt.pattern);
        routes.push({
          [HONO_ROUTE_SYMBOL]: true,
          method: rt.method,
          pattern: combined,
          matcher: compileRoute(combined),
          handler: rt.handler,
        });
      }
      return app;
    },
    async request(input, init, env, executionCtx) {
      const { method, url, body, headers } = normalizeRequestArgs(input, init);
      const options: InvokeRouteOptions<TEnv, TVars> = {
        app,
        method,
        path: url,
        headers,
        ...(body !== undefined ? { body } : {}),
        ...(env !== undefined ? { env } : {}),
        ...(executionCtx !== undefined ? { executionCtx } : {}),
      };
      const result = await invokeRoute(options);
      return result.response;
    },
    get routes() {
      return routes;
    },
    get middlewares() {
      return middlewares;
    },
  };
  return app;
}

function joinPatterns(prefix: string, sub: string): string {
  const p = prefix.endsWith('/') ? prefix.slice(0, -1) : prefix;
  const s = sub.startsWith('/') ? sub : `/${sub}`;
  const joined = `${p}${s}`;
  return joined.length === 0 ? '/' : joined;
}

function normalizeRequestArgs(
  input: string | RequestInit,
  init: RequestInit | undefined,
): { method: HttpMethod; url: string; body: string | undefined; headers: Record<string, string> } {
  const opts = typeof input === 'string' ? init ?? {} : (input as RequestInit);
  const url = typeof input === 'string' ? input : '/';
  const method = ((opts.method ?? 'GET') as string).toUpperCase() as HttpMethod;
  const headers = normalizeInitHeaders(opts.headers);
  const body = opts.body === undefined || opts.body === null ? undefined : String(opts.body);
  return { method, url, body, headers };
}

function normalizeInitHeaders(input: HeadersInit | undefined): Record<string, string> {
  if (!input) return {};
  if (Array.isArray(input)) {
    const out: Record<string, string> = {};
    for (const [k, v] of input) out[String(k)] = String(v);
    return out;
  }
  if (typeof (input as { forEach?: unknown }).forEach === 'function') {
    const out: Record<string, string> = {};
    (input as { forEach: (cb: (v: string, k: string) => void) => void }).forEach((v, k) => {
      out[k] = v;
    });
    return out;
  }
  return { ...(input as Record<string, string>) };
}

export interface InvokeRouteOptions<TEnv, TVars> {
  readonly app: HonoAppLike<TEnv, TVars>;
  readonly method: HttpMethod;
  readonly path: string;
  readonly headers?: Record<string, string>;
  readonly body?: string;
  readonly env?: TEnv;
  readonly executionCtx?: ExecutionCtxLike;
}

export interface InvokeRouteResult {
  readonly matched: boolean;
  readonly response: HonoResponseSpec;
  readonly trace: MiddlewareTraceEntry[];
  readonly error: unknown;
}

/**
 * Invoke a single request against an app: build request, walk registered
 * middleware chain, dispatch to the first matching route handler, capture
 * trace + response + error. Returns a `matched: false` result when nothing
 * matches (so callers can assert the 404 fallback path).
 */
export async function invokeRoute<TEnv, TVars>(
  opts: InvokeRouteOptions<TEnv, TVars>,
): Promise<InvokeRouteResult> {
  const requestPath = parsePath(opts.path);
  const matchedRoute = findRoute(opts.app, opts.method, requestPath);
  const trace: MiddlewareTraceEntry[] = [];
  let error: unknown;

  const req = buildRequest({
    method: opts.method,
    url: opts.path,
    ...(opts.headers !== undefined ? { headers: opts.headers } : {}),
    ...(opts.body !== undefined ? { body: opts.body } : {}),
    params: matchedRoute?.params ?? {},
  });
  const c = createContext<TEnv, TVars>({
    req,
    ...(opts.env !== undefined ? { env: opts.env } : {}),
    ...(opts.executionCtx !== undefined ? { executionCtx: opts.executionCtx } : {}),
  });

  if (!matchedRoute) {
    // No handler → 404 spec, no middleware runs (matches Hono default).
    return {
      matched: false,
      response: { status: 404, headers: {}, body: undefined, bodyKind: 'empty' },
      trace: [],
      error: null,
    };
  }

  const scoped = opts.app.middlewares.filter((mw) => matchRoute(mw.matcher, requestPath) !== null);
  const handlerEntry: MiddlewareTraceEntry = {
    kind: 'handler',
    pattern: matchedRoute.entry.pattern,
    method: matchedRoute.entry.method,
    enteredAt: 0,
    exitedAt: null,
  };

  let index = 0;
  let counter = 0;
  const runNext = async (): Promise<void> => {
    const currentIndex = index;
    index += 1;
    if (currentIndex < scoped.length) {
      const mw = scoped[currentIndex];
      if (mw === undefined) return;
      const entered = counter;
      counter += 1;
      const traceEntry: MiddlewareTraceEntry = {
        kind: 'middleware',
        pattern: mw.pattern,
        method: 'ALL',
        enteredAt: entered,
        exitedAt: null,
      };
      trace.push(traceEntry);
      try {
        await mw.middleware(c, runNext);
      } finally {
        (traceEntry as { exitedAt: number | null }).exitedAt = counter;
        counter += 1;
      }
      return;
    }
    const enteredHandler = counter;
    counter += 1;
    (handlerEntry as { enteredAt: number }).enteredAt = enteredHandler;
    trace.push(handlerEntry);
    try {
      const returned = await matchedRoute.entry.handler(c);
      if (returned && typeof returned === 'object' && 'status' in returned) {
        // Handler returned a response spec directly — merge into c.response.
        c.response.status = returned.status;
        c.response.body = returned.body;
        c.response.bodyKind = returned.bodyKind;
        Object.assign(c.response.headers, returned.headers);
      }
    } finally {
      (handlerEntry as { exitedAt: number | null }).exitedAt = counter;
      counter += 1;
    }
  };

  try {
    await runNext();
  } catch (caught) {
    error = caught;
  }

  return {
    matched: true,
    response: c.response,
    trace,
    error,
  };
}

function findRoute<TEnv, TVars>(
  app: HonoAppLike<TEnv, TVars>,
  method: HttpMethod,
  path: string,
): { entry: RouteEntry<TEnv, TVars>; params: RouteParams } | null {
  for (const route of app.routes) {
    if (route.method !== 'ALL' && route.method !== method) continue;
    const params = matchRoute(route.matcher, path);
    if (params !== null) return { entry: route, params };
  }
  return null;
}

/** Type guard: recognize a HonoAppLike. */
export function isHonoApp(value: unknown): value is HonoAppLike {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as { [HONO_APP_SYMBOL]?: true })[HONO_APP_SYMBOL] === true
  );
}

/** Type guard: recognize a HonoContext. */
export function isHonoContext(value: unknown): value is HonoContext {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as { [HONO_CONTEXT_SYMBOL]?: true })[HONO_CONTEXT_SYMBOL] === true
  );
}
