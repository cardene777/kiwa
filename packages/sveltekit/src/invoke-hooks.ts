// SvelteKit hooks.server.ts test helper for kiwa (Issue #526).
//
// hooks.server.ts exports up to three handlers:
//   - handle: ({ event, resolve }) => Response  // request middleware
//   - handleFetch: ({ event, request, fetch }) => Response  // server-side fetch
//   - handleError: ({ error, event, status, message }) => { message } | void  // logging
//
// kiwa simulates the RequestEvent surface (subset) so handlers can be tested
// without a SvelteKit dev server.

export interface SimulatedHookRequestEvent<TLocals extends Record<string, unknown> = Record<string, unknown>> {
  readonly request: Request;
  readonly url: URL;
  readonly params: Readonly<Record<string, string>>;
  readonly cookies: {
    get(name: string): string | undefined;
    set(name: string, value: string): void;
    delete(name: string): void;
  };
  readonly locals: TLocals;
  readonly route: { readonly id: string | null };
  readonly platform: Record<string, unknown> | undefined;
}

export type HandleArgs<TLocals extends Record<string, unknown> = Record<string, unknown>> = {
  readonly event: SimulatedHookRequestEvent<TLocals>;
  resolve(event: SimulatedHookRequestEvent<TLocals>): Promise<Response> | Response;
};

export type HandleFunction<TLocals extends Record<string, unknown> = Record<string, unknown>> = (
  args: HandleArgs<TLocals>,
) => Promise<Response> | Response;

export type HandleFetchArgs<TLocals extends Record<string, unknown> = Record<string, unknown>> = {
  readonly event: SimulatedHookRequestEvent<TLocals>;
  readonly request: Request;
  fetch(req: Request): Promise<Response>;
};

export type HandleFetchFunction<TLocals extends Record<string, unknown> = Record<string, unknown>> = (
  args: HandleFetchArgs<TLocals>,
) => Promise<Response> | Response;

export type HandleErrorArgs<TLocals extends Record<string, unknown> = Record<string, unknown>> = {
  readonly error: unknown;
  readonly event: SimulatedHookRequestEvent<TLocals>;
  readonly status: number;
  readonly message: string;
};

export type HandleErrorFunction<TLocals extends Record<string, unknown> = Record<string, unknown>> = (
  args: HandleErrorArgs<TLocals>,
) => Promise<{ message: string } | void> | { message: string } | void;

export interface InvokeHandleOptions<TLocals extends Record<string, unknown>> {
  readonly handle: HandleFunction<TLocals>;
  readonly url: string;
  readonly method?: string;
  readonly headers?: Record<string, string>;
  readonly cookies?: Record<string, string>;
  readonly params?: Record<string, string>;
  readonly locals?: TLocals;
  readonly routeId?: string;
  readonly platform?: Record<string, unknown>;
  /**
   * What `resolve(event)` should return when the handler delegates to the
   * downstream layer. Default = `new Response('ok', { status: 200 })`.
   */
  readonly resolveResponse?: Response | ((event: SimulatedHookRequestEvent<TLocals>) => Response | Promise<Response>);
}

export interface InvokeHandleResult<TLocals extends Record<string, unknown>> {
  readonly response: Response;
  readonly resolveCalled: boolean;
  readonly localsAtResolve: TLocals | null;
  readonly error: unknown;
  readonly env: {
    readonly cookies: Map<string, string>;
  };
}

function buildEvent<TLocals extends Record<string, unknown>>(opts: {
  readonly url: string;
  readonly method?: string;
  readonly headers?: Record<string, string>;
  readonly cookies?: Record<string, string>;
  readonly params?: Record<string, string>;
  readonly locals?: TLocals;
  readonly routeId?: string;
  readonly platform?: Record<string, unknown>;
}): { event: SimulatedHookRequestEvent<TLocals>; cookieStore: Map<string, string> } {
  const cookieStore = new Map<string, string>(Object.entries(opts.cookies ?? {}));
  const event: SimulatedHookRequestEvent<TLocals> = {
    request: new Request(opts.url, {
      method: opts.method ?? 'GET',
      headers: new Headers(opts.headers ?? {}),
    }),
    url: new URL(opts.url),
    params: { ...(opts.params ?? {}) },
    cookies: {
      get: (name) => cookieStore.get(name),
      set: (name, value) => {
        cookieStore.set(name, value);
      },
      delete: (name) => {
        cookieStore.delete(name);
      },
    },
    locals: (opts.locals ?? ({} as TLocals)),
    route: { id: opts.routeId ?? null },
    platform: opts.platform,
  };
  return { event, cookieStore };
}

export async function invokeHandle<TLocals extends Record<string, unknown> = Record<string, unknown>>(
  opts: InvokeHandleOptions<TLocals>,
): Promise<InvokeHandleResult<TLocals>> {
  const { event, cookieStore } = buildEvent(opts);
  let resolveCalled = false;
  let localsAtResolve: TLocals | null = null;
  const resolveImpl = async (innerEvent: SimulatedHookRequestEvent<TLocals>): Promise<Response> => {
    resolveCalled = true;
    localsAtResolve = { ...innerEvent.locals };
    const r = opts.resolveResponse;
    if (typeof r === 'function') return r(innerEvent);
    if (r instanceof Response) return r;
    return new Response('ok', { status: 200 });
  };
  let response: Response;
  let error: unknown;
  try {
    response = await opts.handle({ event, resolve: resolveImpl });
  } catch (caught) {
    response = new Response(null, { status: 500 });
    error = caught;
  }
  return {
    response,
    resolveCalled,
    localsAtResolve,
    error,
    env: { cookies: cookieStore },
  };
}

export interface InvokeHandleFetchOptions<TLocals extends Record<string, unknown>> {
  readonly handleFetch: HandleFetchFunction<TLocals>;
  readonly eventUrl: string;
  readonly fetchUrl: string;
  readonly method?: string;
  readonly headers?: Record<string, string>;
  readonly cookies?: Record<string, string>;
  readonly locals?: TLocals;
  /**
   * Fake fetch that handleFetch delegates to via `fetch(req)`. Default returns
   * an empty 200 Response.
   */
  readonly downstreamFetch?: (req: Request) => Promise<Response>;
}

export interface InvokeHandleFetchResult {
  readonly response: Response;
  readonly downstreamCalled: boolean;
  readonly downstreamRequest: Request | null;
  readonly error: unknown;
}

export async function invokeHandleFetch<TLocals extends Record<string, unknown> = Record<string, unknown>>(
  opts: InvokeHandleFetchOptions<TLocals>,
): Promise<InvokeHandleFetchResult> {
  const { event } = buildEvent<TLocals>({
    url: opts.eventUrl,
    ...(typeof opts.method !== 'undefined' ? { method: opts.method } : {}),
    ...(typeof opts.headers !== 'undefined' ? { headers: opts.headers } : {}),
    ...(typeof opts.cookies !== 'undefined' ? { cookies: opts.cookies } : {}),
    ...(typeof opts.locals !== 'undefined' ? { locals: opts.locals } : {}),
  });
  let downstreamCalled = false;
  let downstreamRequest: Request | null = null;
  const fakeFetch = async (req: Request): Promise<Response> => {
    downstreamCalled = true;
    downstreamRequest = req;
    if (typeof opts.downstreamFetch !== 'undefined') return opts.downstreamFetch(req);
    return new Response('downstream-ok', { status: 200 });
  };
  let response: Response;
  let error: unknown;
  try {
    response = await opts.handleFetch({
      event,
      request: new Request(opts.fetchUrl),
      fetch: fakeFetch,
    });
  } catch (caught) {
    response = new Response(null, { status: 500 });
    error = caught;
  }
  return { response, downstreamCalled, downstreamRequest, error };
}

export interface InvokeHandleErrorOptions<TLocals extends Record<string, unknown>> {
  readonly handleError: HandleErrorFunction<TLocals>;
  readonly error: unknown;
  readonly url: string;
  readonly status: number;
  readonly message: string;
  readonly headers?: Record<string, string>;
  readonly cookies?: Record<string, string>;
  readonly locals?: TLocals;
}

export interface InvokeHandleErrorResult {
  readonly report: { message: string } | void;
  readonly thrown: unknown;
}

export async function invokeHandleError<TLocals extends Record<string, unknown> = Record<string, unknown>>(
  opts: InvokeHandleErrorOptions<TLocals>,
): Promise<InvokeHandleErrorResult> {
  const { event } = buildEvent<TLocals>({
    url: opts.url,
    ...(typeof opts.headers !== 'undefined' ? { headers: opts.headers } : {}),
    ...(typeof opts.cookies !== 'undefined' ? { cookies: opts.cookies } : {}),
    ...(typeof opts.locals !== 'undefined' ? { locals: opts.locals } : {}),
  });
  let report: { message: string } | void = undefined;
  let thrown: unknown;
  try {
    report = await opts.handleError({
      error: opts.error,
      event,
      status: opts.status,
      message: opts.message,
    });
  } catch (caught) {
    thrown = caught;
  }
  return { report, thrown };
}
