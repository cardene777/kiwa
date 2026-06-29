// Next.js middleware.ts invocation helper for kiwa tests (Issue #495).
//
// Middleware in App Router is `(req: NextRequest) => NextResponse | Response | void`.
// It can set response headers / cookies, throw redirect via NextResponse.redirect(),
// rewrite via NextResponse.rewrite(), short-circuit with NextResponse.json(), or
// pass through with NextResponse.next(). kiwa wraps the call so unit tests can
// assert on the captured action + outgoing headers/cookies without a running
// Next.js server.
//
// Out of scope on purpose:
//   - matcher config evaluation (the test already knows which middleware to call)
//   - revalidate / cache header semantics
//   - Edge runtime polyfill (use Node test environment + the helper's simulated request)

export const MIDDLEWARE_ACTION_SYMBOL = Symbol.for('kiwa.next.middleware.action');

export type MiddlewareActionKind = 'next' | 'redirect' | 'rewrite' | 'json' | 'noop';

export interface MiddlewareAction {
  readonly [MIDDLEWARE_ACTION_SYMBOL]: true;
  readonly kind: MiddlewareActionKind;
  readonly url?: string;
  readonly body?: unknown;
  readonly status?: number;
}

export interface MiddlewareRequest {
  readonly url: string;
  readonly method: string;
  readonly headers: ReadonlyMap<string, string>;
  readonly cookies: ReadonlyMap<string, string>;
  readonly nextUrl: {
    readonly pathname: string;
    readonly search: string;
    readonly searchParams: URLSearchParams;
  };
  readonly geo: {
    readonly country?: string;
    readonly region?: string;
    readonly city?: string;
  };
}

export interface MiddlewareEnv {
  readonly responseHeaders: Map<string, string>;
  readonly responseCookies: Map<string, string>;
  readonly action: MiddlewareAction;
}

export type MiddlewareFunction = (
  req: MiddlewareRequest,
  env: { setHeader: (name: string, value: string) => void; setCookie: (name: string, value: string) => void },
) => MiddlewareAction | Promise<MiddlewareAction>;

export interface InvokeMiddlewareOptions {
  readonly middleware: MiddlewareFunction;
  readonly url: string;
  readonly method?: string;
  readonly headers?: Record<string, string>;
  readonly cookies?: Record<string, string>;
  readonly geo?: {
    readonly country?: string;
    readonly region?: string;
    readonly city?: string;
  };
}

export interface InvokeMiddlewareResult {
  readonly env: MiddlewareEnv;
  readonly error: unknown;
}

function buildRequest(opts: InvokeMiddlewareOptions): MiddlewareRequest {
  const url = new URL(opts.url);
  const headers = new Map<string, string>();
  for (const [name, value] of Object.entries(opts.headers ?? {})) {
    headers.set(name.toLowerCase(), value);
  }
  const cookies = new Map<string, string>(Object.entries(opts.cookies ?? {}));
  return {
    url: opts.url,
    method: opts.method ?? 'GET',
    headers,
    cookies,
    nextUrl: {
      pathname: url.pathname,
      search: url.search,
      searchParams: url.searchParams,
    },
    geo: opts.geo ?? {},
  };
}

/**
 * Helpers your `middleware.ts` returns instead of constructing NextResponse
 * directly. Keep the production code shape close by re-exporting these from
 * a shared module; the helper expects the returned value to be a
 * MiddlewareAction shaped object.
 */
export const middlewareActions = {
  next(): MiddlewareAction {
    return { [MIDDLEWARE_ACTION_SYMBOL]: true, kind: 'next' };
  },
  redirect(url: string, status = 307): MiddlewareAction {
    return { [MIDDLEWARE_ACTION_SYMBOL]: true, kind: 'redirect', url, status };
  },
  rewrite(url: string): MiddlewareAction {
    return { [MIDDLEWARE_ACTION_SYMBOL]: true, kind: 'rewrite', url };
  },
  json(body: unknown, status = 200): MiddlewareAction {
    return { [MIDDLEWARE_ACTION_SYMBOL]: true, kind: 'json', body, status };
  },
};

/**
 * Invoke a middleware function in isolation and capture its outgoing
 * response shape + headers + cookies. Mirrors the kiwa style of
 * invokeServerAction: no globals, no real Next.js runtime.
 */
export async function invokeMiddleware(opts: InvokeMiddlewareOptions): Promise<InvokeMiddlewareResult> {
  const req = buildRequest(opts);
  const responseHeaders = new Map<string, string>();
  const responseCookies = new Map<string, string>();
  const seam = {
    setHeader(name: string, value: string) {
      responseHeaders.set(name.toLowerCase(), value);
    },
    setCookie(name: string, value: string) {
      responseCookies.set(name, value);
    },
  };
  let action: MiddlewareAction = middlewareActions.next();
  let error: unknown;
  try {
    const result = await opts.middleware(req, seam);
    action = result;
  } catch (caught) {
    error = caught;
    action = { [MIDDLEWARE_ACTION_SYMBOL]: true, kind: 'noop' };
  }
  return {
    env: {
      responseHeaders,
      responseCookies,
      action,
    },
    error,
  };
}
