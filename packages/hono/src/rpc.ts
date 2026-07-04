// HonoJS hc RPC type-safe client test helper for kiwa (Issue #815, v1.19-1c).
//
// Real Hono exposes an `hc<AppType>(baseUrl)` client that walks the app's
// route tree at the type level so `client.users[':id'].$get({ param })` is
// type-safe. kiwa's mock version accepts the same call pattern and dispatches
// against the in-memory `HonoAppLike` we build in app.ts — tests get end-to-end
// request / response typing without a real fetch layer.
//
// The client shape is intentionally proxy-based: dotted route paths compile to
// string segments at read time and the `$get` / `$post` / `$put` / `$delete` /
// `$patch` terminals resolve to bound request fns. Tests can then assert on
// both the runtime response body + the inferred TypeScript type of that body.
//
// Out of scope on purpose:
//   - real cross-process fetch (see workers.ts for the Response shape returned
//     to callers who want a full `Response` object with `.json()`)
//   - streaming / EventSource clients — responses are always fully buffered
//   - path helpers that go beyond `:param` + `*` wildcard (matches app.ts)

import {
  createHonoApp,
  invokeRoute,
  type ExecutionCtxLike,
  type HonoAppLike,
  type HonoResponseSpec,
  type HttpMethod,
  type MiddlewareTraceEntry,
  type QueryParams,
  type RouteParams,
} from './app.js';

export const HC_CLIENT_SYMBOL = Symbol.for('kiwa.hono.rpc.client');
export const HC_REQUEST_SYMBOL = Symbol.for('kiwa.hono.rpc.request');

/** Options passed at every `$get` / `$post` / ... call. */
export interface HcRequestOptions<TEnv = Record<string, unknown>> {
  readonly param?: RouteParams;
  readonly query?: QueryParams;
  readonly json?: unknown;
  readonly text?: string;
  readonly headers?: Record<string, string>;
  readonly env?: TEnv;
  readonly executionCtx?: ExecutionCtxLike;
}

/**
 * Response returned to hc callers. Mirrors the parts of the Fetch `Response`
 * shape tests need (`ok` / `status` / `json()` / `text()` / `headers`), plus a
 * `trace` array for asserting on the middleware chain a route went through.
 */
export interface HcResponse<T = unknown> {
  readonly [HC_REQUEST_SYMBOL]: true;
  readonly ok: boolean;
  readonly status: number;
  readonly headers: Record<string, string>;
  readonly trace: ReadonlyArray<MiddlewareTraceEntry>;
  readonly matched: boolean;
  readonly error: unknown;
  json(): Promise<T>;
  text(): Promise<string>;
}

const HTTP_METHODS: readonly HttpMethod[] = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];

/**
 * Build a hc-shaped RPC client for an app. Property access walks a route
 * string (bracketed segments = `:name` params), terminals `$get` / `$post` /
 * ... fire a request through `invokeRoute` and wrap the resulting response
 * spec into an `HcResponse` object.
 *
 * The client is intentionally schemaless at runtime — TS `AppType` inference
 * lives in the caller's app types; kiwa doesn't parse or enforce them. That
 * keeps the runtime tiny (a Proxy tree) and matches real Hono `hc` behavior.
 */
export function createRpcClient<TEnv = Record<string, unknown>>(
  app: HonoAppLike<TEnv>,
  opts: { baseUrl?: string } = {},
): HcClient {
  const baseUrl = opts.baseUrl ?? '';
  const buildPath = (segments: readonly string[], param: RouteParams | undefined): string => {
    const parts = segments.map((seg) => {
      if (seg.startsWith(':')) {
        const key = seg.slice(1);
        const value = param?.[key];
        if (value === undefined) throw new Error(`missing param "${key}" for path segment "${seg}"`);
        return encodeURIComponent(value);
      }
      return seg;
    });
    return `/${parts.join('/')}`;
  };

  const walk = (segments: string[]): unknown => {
    return new Proxy(function noop() {}, {
      get(_target, prop) {
        if (typeof prop === 'symbol') {
          if (prop === HC_CLIENT_SYMBOL) return true;
          return undefined;
        }
        if (prop === 'then') return undefined;
        if (typeof prop === 'string' && prop.startsWith('$')) {
          const rawMethod = prop.slice(1).toUpperCase();
          if (!isHttpMethod(rawMethod)) return undefined;
          const method = rawMethod;
          return async (options: HcRequestOptions<TEnv> = {}): Promise<HcResponse> => {
            const path = buildPath(segments, options.param);
            const query = options.query
              ? '?' +
                Object.entries(options.query)
                  .filter(([, v]) => v !== undefined)
                  .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
                  .join('&')
              : '';
            const url = `${baseUrl}${path}${query}`;
            const headers = { ...(options.headers ?? {}) };
            let body: string | undefined;
            if (options.json !== undefined) {
              body = JSON.stringify(options.json);
              headers['content-type'] = 'application/json';
            } else if (options.text !== undefined) {
              body = options.text;
              headers['content-type'] = 'text/plain; charset=utf-8';
            }
            const result = await invokeRoute<TEnv, Record<string, unknown>>({
              app,
              method,
              path: url,
              headers,
              ...(body !== undefined ? { body } : {}),
              ...(options.env !== undefined ? { env: options.env } : {}),
              ...(options.executionCtx !== undefined ? { executionCtx: options.executionCtx } : {}),
            });
            return wrapResponse(result.response, result.trace, result.matched, result.error);
          };
        }
        return walk([...segments, String(prop)]);
      },
    });
  };

  const root = walk([]);
  return root as HcClient;
}

function isHttpMethod(value: string): value is HttpMethod {
  return (HTTP_METHODS as readonly string[]).includes(value);
}

function wrapResponse(
  spec: HonoResponseSpec,
  trace: ReadonlyArray<MiddlewareTraceEntry>,
  matched: boolean,
  error: unknown,
): HcResponse {
  return {
    [HC_REQUEST_SYMBOL]: true,
    ok: spec.status >= 200 && spec.status < 300,
    status: spec.status,
    headers: { ...spec.headers },
    trace,
    matched,
    error,
    async json() {
      if (spec.bodyKind === 'json') return spec.body;
      if (spec.bodyKind === 'text' && typeof spec.body === 'string') {
        return JSON.parse(spec.body);
      }
      return undefined;
    },
    async text() {
      if (spec.bodyKind === 'text' && typeof spec.body === 'string') return spec.body;
      if (spec.bodyKind === 'json') return JSON.stringify(spec.body);
      return '';
    },
  };
}

/**
 * Runtime shape of a hc client — an untyped Proxy for JS callers. TS callers
 * typically re-cast the return value into their app-specific typed client
 * (`const client = createRpcClient<AppType>(app) as ClientType`).
 */
export type HcClient = unknown;

export interface DefineRpcAppOptions<TEnv = Record<string, unknown>> {
  readonly configure: (app: HonoAppLike<TEnv>) => void;
}

/**
 * Convenience: build an app + client pair in one call. Useful for tests that
 * want to declare the app + immediately drive it through the client without
 * a separate `createHonoApp()` line.
 */
export function defineRpcApp<TEnv = Record<string, unknown>>(
  opts: DefineRpcAppOptions<TEnv>,
): { app: HonoAppLike<TEnv>; client: HcClient } {
  const app = createHonoApp<TEnv>();
  opts.configure(app);
  const client = createRpcClient(app);
  return { app, client };
}

/** Type guard: recognize an HcResponse. */
export function isHcResponse(value: unknown): value is HcResponse {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as { [HC_REQUEST_SYMBOL]?: true })[HC_REQUEST_SYMBOL] === true
  );
}
