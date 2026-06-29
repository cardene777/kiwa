// Qwik City Endpoint test helper for kiwa (Issue #519).
//
// Endpoint: `export const onGet: RequestHandler = async ({ json, redirect, request, params }) => { ... }`.
// The handler receives a RequestEventCommon with json() / redirect() helpers
// + the request / params. kiwa captures the resolved response shape (kind /
// body / status / headers / redirect).

export const QWIK_ENDPOINT_REDIRECT_SYMBOL = Symbol.for('kiwa.qwik.endpoint.redirect');

export interface QwikEndpointRedirectSignal {
  readonly [QWIK_ENDPOINT_REDIRECT_SYMBOL]: true;
  readonly status: number;
  readonly location: string;
}

export interface EndpointResponse<T = unknown> {
  readonly kind: 'json' | 'text' | 'noop';
  readonly status: number;
  readonly body?: T;
  readonly headers: Map<string, string>;
}

export interface SimulatedRequestEvent<TParams extends Record<string, string> = Record<string, string>> {
  readonly request: Request;
  readonly params: TParams;
  readonly url: URL;
  readonly headers: ReadonlyMap<string, string>;
  json<T>(status: number, body: T): void;
  text(status: number, body: string): void;
  redirect(status: number, location: string): never;
  status(code: number): void;
  setHeader(name: string, value: string): void;
}

export type EndpointHandler<TParams extends Record<string, string> = Record<string, string>> = (
  event: SimulatedRequestEvent<TParams>,
) => Promise<void> | void;

export interface InvokeEndpointOptions<TParams extends Record<string, string> = Record<string, string>> {
  readonly handler: EndpointHandler<TParams>;
  readonly url: string;
  readonly method?: string;
  readonly params?: TParams;
  readonly headers?: Record<string, string>;
  readonly formData?: Record<string, string>;
  readonly jsonBody?: unknown;
}

export interface InvokeEndpointResult {
  readonly response: EndpointResponse;
  readonly redirect: QwikEndpointRedirectSignal | null;
  readonly error: unknown;
}

function isRedirect(value: unknown): value is QwikEndpointRedirectSignal {
  return typeof value === 'object' && value !== null && (value as { [QWIK_ENDPOINT_REDIRECT_SYMBOL]?: true })[QWIK_ENDPOINT_REDIRECT_SYMBOL] === true;
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

export async function invokeEndpoint<TParams extends Record<string, string> = Record<string, string>>(
  opts: InvokeEndpointOptions<TParams>,
): Promise<InvokeEndpointResult> {
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
  const requestHeaders = new Map<string, string>();
  request.headers.forEach((value, name) => requestHeaders.set(name.toLowerCase(), value));
  const responseHeaders = new Map<string, string>();
  let kind: EndpointResponse['kind'] = 'noop';
  let status = 200;
  let body: unknown;
  let redirect: QwikEndpointRedirectSignal | null = null;
  let error: unknown;
  const event: SimulatedRequestEvent<TParams> = {
    request,
    params: opts.params ?? ({} as TParams),
    url: new URL(opts.url),
    headers: requestHeaders,
    json<T>(statusCode: number, payload: T): void {
      kind = 'json';
      status = statusCode;
      body = payload;
    },
    text(statusCode: number, payload: string): void {
      kind = 'text';
      status = statusCode;
      body = payload;
    },
    redirect(statusCode: number, location: string): never {
      const signal: QwikEndpointRedirectSignal = {
        [QWIK_ENDPOINT_REDIRECT_SYMBOL]: true,
        status: statusCode,
        location,
      };
      throw signal;
    },
    status(code: number): void {
      status = code;
    },
    setHeader(name: string, value: string): void {
      responseHeaders.set(name.toLowerCase(), value);
    },
  };
  try {
    await opts.handler(event);
  } catch (caught) {
    if (isRedirect(caught)) {
      redirect = caught;
    } else {
      error = caught;
    }
  }
  const response: EndpointResponse =
    typeof body === 'undefined'
      ? { kind, status, headers: responseHeaders }
      : { kind, status, body, headers: responseHeaders };
  return { response, redirect, error };
}
