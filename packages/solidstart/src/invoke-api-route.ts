// SolidStart API Routes (`routes/api/*.ts`) test helper for kiwa (Issue #518).
//
// An API Route exports `GET` / `POST` / `PUT` / `DELETE` / `PATCH` functions
// with signature `(event: APIEvent) => Response | Promise<Response>`.
// APIEvent exposes request, params, locals, fetch — kiwa provides the
// simulated subset for direct invocation.

export interface SimulatedAPIEvent<TParams extends Record<string, string | undefined> = Record<string, string | undefined>> {
  readonly request: Request;
  readonly params: TParams;
  readonly locals: Record<string, unknown>;
  readonly nativeEvent: Record<string, unknown>;
}

export type APIRouteHandler<TParams extends Record<string, string | undefined> = Record<string, string | undefined>> = (
  event: SimulatedAPIEvent<TParams>,
) => Promise<Response> | Response;

export interface InvokeApiRouteOptions<TParams extends Record<string, string | undefined> = Record<string, string | undefined>> {
  readonly handler: APIRouteHandler<TParams>;
  readonly url: string;
  readonly method?: string;
  readonly params?: TParams;
  readonly headers?: Record<string, string>;
  readonly formData?: Record<string, string>;
  readonly jsonBody?: unknown;
  readonly locals?: Record<string, unknown>;
}

export interface InvokeApiRouteResult {
  readonly response: Response;
  readonly redirect: { url: string; status: number } | null;
}

function buildRequest(opts: {
  readonly url: string;
  readonly method?: string;
  readonly headers?: Record<string, string>;
  readonly formData?: Record<string, string>;
  readonly jsonBody?: unknown;
}): Request {
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

export async function invokeApiRoute<TParams extends Record<string, string | undefined> = Record<string, string | undefined>>(
  opts: InvokeApiRouteOptions<TParams>,
): Promise<InvokeApiRouteResult> {
  const reqOpts: {
    readonly url: string;
    readonly method?: string;
    readonly headers?: Record<string, string>;
    readonly formData?: Record<string, string>;
    readonly jsonBody?: unknown;
  } = {
    url: opts.url,
    ...(typeof opts.method !== 'undefined' ? { method: opts.method } : {}),
    ...(typeof opts.headers !== 'undefined' ? { headers: opts.headers } : {}),
    ...(typeof opts.formData !== 'undefined' ? { formData: opts.formData } : {}),
    ...(typeof opts.jsonBody !== 'undefined' ? { jsonBody: opts.jsonBody } : {}),
  };
  const request = buildRequest(reqOpts);
  const event: SimulatedAPIEvent<TParams> = {
    request,
    params: opts.params ?? ({} as TParams),
    locals: opts.locals ?? {},
    nativeEvent: {},
  };
  const response = await opts.handler(event);
  let redirect: { url: string; status: number } | null = null;
  if (response.status >= 300 && response.status < 400) {
    redirect = {
      url: response.headers.get('location') ?? '',
      status: response.status,
    };
  }
  return { response, redirect };
}

export function json<T>(body: T, init?: ResponseInit): Response {
  const headers = new Headers(init?.headers);
  if (!headers.has('content-type')) headers.set('content-type', 'application/json');
  return new Response(JSON.stringify(body), { ...init, headers });
}

export function redirectResponse(location: string, status = 302): Response {
  return new Response(null, { status, headers: { location } });
}
