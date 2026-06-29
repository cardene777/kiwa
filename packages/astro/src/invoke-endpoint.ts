// Astro Server Endpoints (`pages/api/*.ts`) test helper for kiwa (Issue #499).
//
// An Astro endpoint is `export function GET(context: APIContext): Response`
// (or POST / PUT / DELETE / PATCH / ALL). APIContext exposes request, params,
// cookies, locals, site, url, etc. The kiwa helper provides a simulated
// APIContext so the endpoint can be invoked without a running Astro server.
//
// Out of scope on purpose:
//   - SSR page (.astro) rendering — use Astro Container API directly
//   - Astro Islands (partial hydration) — covered by client-side framework adapters
//   - rewrite() / redirect() Astro internal navigation — captured as plain Response

export interface SimulatedAPIContext<TParams extends Record<string, string | undefined> = Record<string, string | undefined>> {
  readonly request: Request;
  readonly params: TParams;
  readonly cookies: {
    get(name: string): { value: string } | undefined;
    set(name: string, value: string, options?: Record<string, unknown>): void;
    delete(name: string, options?: Record<string, unknown>): void;
    has(name: string): boolean;
  };
  readonly url: URL;
  readonly site: URL | undefined;
  readonly locals: Record<string, unknown>;
  redirect(path: string, status?: number): Response;
}

export type APIRoute<TParams extends Record<string, string | undefined> = Record<string, string | undefined>> = (
  context: SimulatedAPIContext<TParams>,
) => Promise<Response> | Response;

export interface InvokeEndpointOptions<TParams extends Record<string, string | undefined> = Record<string, string | undefined>> {
  readonly endpoint: APIRoute<TParams>;
  readonly url: string;
  readonly method?: string;
  readonly params?: TParams;
  readonly headers?: Record<string, string>;
  readonly cookies?: Record<string, string>;
  readonly formData?: Record<string, string>;
  readonly jsonBody?: unknown;
  readonly locals?: Record<string, unknown>;
  readonly site?: string;
}

export interface InvokeEndpointResult {
  readonly response: Response;
  readonly redirect: { url: string; status: number } | null;
}

function buildRequest(opts: { url: string; method?: string; headers?: Record<string, string>; formData?: Record<string, string>; jsonBody?: unknown }): Request {
  const headers = new Headers();
  for (const [name, value] of Object.entries(opts.headers ?? {})) {
    headers.set(name, value);
  }
  let body: BodyInit | null = null;
  if (typeof opts.formData !== 'undefined') {
    const fd = new FormData();
    for (const [name, value] of Object.entries(opts.formData)) {
      fd.set(name, value);
    }
    body = fd;
  } else if (typeof opts.jsonBody !== 'undefined') {
    body = JSON.stringify(opts.jsonBody);
    if (!headers.has('content-type')) headers.set('content-type', 'application/json');
  }
  const method = opts.method ?? (body === null ? 'GET' : 'POST');
  return new Request(opts.url, body === null ? { method, headers } : { method, headers, body });
}

function buildCookieJar(initial: Record<string, string>): SimulatedAPIContext['cookies'] {
  const store = new Map<string, string>(Object.entries(initial));
  return {
    get(name) {
      const value = store.get(name);
      return typeof value === 'undefined' ? undefined : { value };
    },
    set(name, value) {
      store.set(name, value);
    },
    delete(name) {
      store.delete(name);
    },
    has(name) {
      return store.has(name);
    },
  };
}

export async function invokeEndpoint<TParams extends Record<string, string | undefined> = Record<string, string | undefined>>(
  opts: InvokeEndpointOptions<TParams>,
): Promise<InvokeEndpointResult> {
  const reqOpts: { readonly url: string; readonly method?: string; readonly headers?: Record<string, string>; readonly formData?: Record<string, string>; readonly jsonBody?: unknown } = {
    url: opts.url,
    ...(typeof opts.method !== 'undefined' ? { method: opts.method } : {}),
    ...(typeof opts.headers !== 'undefined' ? { headers: opts.headers } : {}),
    ...(typeof opts.formData !== 'undefined' ? { formData: opts.formData } : {}),
    ...(typeof opts.jsonBody !== 'undefined' ? { jsonBody: opts.jsonBody } : {}),
  };
  const request = buildRequest(reqOpts);
  const context: SimulatedAPIContext<TParams> = {
    request,
    params: (opts.params ?? ({} as TParams)),
    cookies: buildCookieJar(opts.cookies ?? {}),
    url: new URL(opts.url),
    site: typeof opts.site !== 'undefined' ? new URL(opts.site) : undefined,
    locals: opts.locals ?? {},
    redirect(path, status = 302) {
      return new Response(null, { status, headers: { location: path } });
    },
  };
  const response = await opts.endpoint(context);
  let redirect: { url: string; status: number } | null = null;
  if (response.status >= 300 && response.status < 400) {
    redirect = {
      url: response.headers.get('location') ?? '',
      status: response.status,
    };
  }
  return { response, redirect };
}
