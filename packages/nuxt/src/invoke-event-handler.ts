// Nuxt 3 Server Routes (defineEventHandler) test helper for kiwa (Issue #496).
//
// A Nuxt server route is `defineEventHandler((event: H3Event) => ...)` where
// the event exposes a small surface (method / url / query / body / headers /
// cookies / setHeader / sendRedirect / setStatusCode). Real H3 + Nitro
// bootstrap is heavy and slow for unit tests; kiwa provides a simulated
// event so the handler can be invoked directly.
//
// Out of scope on purpose:
//   - Nitro plugin lifecycle
//   - Nuxt composables (useFetch / useState) — covered by `kiwa-ui` Vue mode
//   - middleware chain (Nuxt route middleware is server-side prepass, future Issue)

export const NUXT_REDIRECT_SYMBOL = Symbol.for('kiwa.nuxt.redirect');

export interface NuxtRedirectSignal {
  readonly [NUXT_REDIRECT_SYMBOL]: true;
  readonly url: string;
  readonly status: number;
}

export interface SimulatedH3Event {
  readonly method: string;
  readonly path: string;
  readonly url: string;
  readonly query: Readonly<Record<string, string | string[]>>;
  readonly body: unknown;
  readonly headers: ReadonlyMap<string, string>;
  readonly cookies: ReadonlyMap<string, string>;
  setHeader(name: string, value: string): void;
  setCookie(name: string, value: string): void;
  setStatusCode(code: number): void;
  sendRedirect(url: string, status?: number): never;
}

export interface EventHandlerEnv {
  readonly responseHeaders: Map<string, string>;
  readonly responseCookies: Map<string, string>;
  status: number;
}

export type EventHandlerFunction<TResult = unknown> = (event: SimulatedH3Event) => Promise<TResult> | TResult;

export interface InvokeEventHandlerOptions<TResult = unknown> {
  readonly handler: EventHandlerFunction<TResult>;
  readonly url: string;
  readonly method?: string;
  readonly body?: unknown;
  readonly headers?: Record<string, string>;
  readonly cookies?: Record<string, string>;
  readonly query?: Record<string, string | string[]>;
}

export interface InvokeEventHandlerResult<TResult = unknown> {
  readonly result: TResult | undefined;
  readonly redirect: NuxtRedirectSignal | null;
  readonly error: unknown;
  readonly env: EventHandlerEnv;
}

function buildQuery(url: URL, override: Record<string, string | string[]> | undefined): Record<string, string | string[]> {
  const query: Record<string, string | string[]> = {};
  url.searchParams.forEach((value, key) => {
    const existing = query[key];
    if (typeof existing === 'undefined') {
      query[key] = value;
      return;
    }
    query[key] = Array.isArray(existing) ? [...existing, value] : [existing, value];
  });
  if (override) {
    for (const [key, value] of Object.entries(override)) {
      query[key] = value;
    }
  }
  return query;
}

function isNuxtRedirect(value: unknown): value is NuxtRedirectSignal {
  return typeof value === 'object' && value !== null && (value as { [NUXT_REDIRECT_SYMBOL]?: true })[NUXT_REDIRECT_SYMBOL] === true;
}

/**
 * Invoke a Nuxt `defineEventHandler` callback in isolation and capture its
 * return value + redirect signal + response headers / cookies / status.
 */
export async function invokeEventHandler<TResult = unknown>(
  opts: InvokeEventHandlerOptions<TResult>,
): Promise<InvokeEventHandlerResult<TResult>> {
  const url = new URL(opts.url);
  const headers = new Map<string, string>();
  for (const [name, value] of Object.entries(opts.headers ?? {})) {
    headers.set(name.toLowerCase(), value);
  }
  const cookies = new Map<string, string>(Object.entries(opts.cookies ?? {}));
  const env: EventHandlerEnv = {
    responseHeaders: new Map<string, string>(),
    responseCookies: new Map<string, string>(),
    status: 200,
  };
  let result: TResult | undefined;
  let error: unknown;
  let redirect: NuxtRedirectSignal | null = null;
  const event: SimulatedH3Event = {
    method: opts.method ?? 'GET',
    path: url.pathname + url.search,
    url: opts.url,
    query: buildQuery(url, opts.query),
    body: opts.body,
    headers,
    cookies,
    setHeader(name, value) {
      env.responseHeaders.set(name.toLowerCase(), value);
    },
    setCookie(name, value) {
      env.responseCookies.set(name, value);
    },
    setStatusCode(code) {
      env.status = code;
    },
    sendRedirect(redirectUrl, status = 302) {
      const signal: NuxtRedirectSignal = {
        [NUXT_REDIRECT_SYMBOL]: true,
        url: redirectUrl,
        status,
      };
      throw signal;
    },
  };
  try {
    result = await opts.handler(event);
  } catch (caught) {
    if (isNuxtRedirect(caught)) {
      redirect = caught;
    } else {
      error = caught;
    }
  }
  return { result, redirect, error, env };
}
