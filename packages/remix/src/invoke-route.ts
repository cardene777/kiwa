// Remix v2 / React Router v7 loader + action test helper (Issue #498).
//
// loader: ({ request, params, context }) => Response | data
// action: ({ request, params, context }) => Response | data
// The kiwa helper simulates the LoaderFunctionArgs / ActionFunctionArgs
// minimal surface and captures the Response shape (status / headers / body)
// for assertions without a running Remix dev server.

export const REMIX_REDIRECT_SYMBOL = Symbol.for('kiwa.remix.redirect');

export interface RemixRedirectSignal {
  readonly [REMIX_REDIRECT_SYMBOL]: true;
  readonly status: number;
  readonly location: string;
}

export interface SimulatedRouteArgs<TContext = Record<string, unknown>> {
  readonly request: Request;
  readonly params: Readonly<Record<string, string>>;
  readonly context: TContext;
}

export type LoaderFunction<TResult = unknown> = (args: SimulatedRouteArgs) => Promise<TResult> | TResult;
export type ActionFunction<TResult = unknown> = (args: SimulatedRouteArgs) => Promise<TResult> | TResult;

export interface InvokeLoaderOptions {
  readonly loader: LoaderFunction;
  readonly url: string;
  readonly params?: Record<string, string>;
  readonly context?: Record<string, unknown>;
  readonly headers?: Record<string, string>;
  readonly method?: string;
}

export interface InvokeActionOptions {
  readonly action: ActionFunction;
  readonly url: string;
  readonly params?: Record<string, string>;
  readonly context?: Record<string, unknown>;
  readonly headers?: Record<string, string>;
  readonly method?: string;
  readonly formData?: Record<string, string>;
  readonly jsonBody?: unknown;
}

export interface InvokeRouteResult {
  readonly result: unknown;
  readonly response: Response | null;
  readonly redirect: RemixRedirectSignal | null;
  readonly error: unknown;
}

function isRedirect(value: unknown): value is RemixRedirectSignal {
  return typeof value === 'object' && value !== null && (value as { [REMIX_REDIRECT_SYMBOL]?: true })[REMIX_REDIRECT_SYMBOL] === true;
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

async function normalizeResult(value: unknown): Promise<InvokeRouteResult> {
  if (value instanceof Response) {
    if (value.status >= 300 && value.status < 400) {
      const location = value.headers.get('location') ?? '';
      const redirect: RemixRedirectSignal = {
        [REMIX_REDIRECT_SYMBOL]: true,
        status: value.status,
        location,
      };
      return { result: undefined, response: value, redirect, error: undefined };
    }
    return { result: undefined, response: value, redirect: null, error: undefined };
  }
  return { result: value, response: null, redirect: null, error: undefined };
}

/**
 * Remix 公式 `callRouteLoader` 仕様 ... loader が `undefined` を return した場合は
 * `Error("You defined a loader for route ... but didn't return anything from your loader function.")` を throw する
 * (`packages/react-router/lib/server-runtime/data.ts` SSOT)。
 * kiwa env でも同じ semantics に揃えて、 loader 実装漏れ (`return` 文の書き忘れ)
 * を unit test 段階で fail 検出可能にする (MAJOR 3 fix)。
 *
 * 例外 ... `action` は undefined return を許容している (Remix v2 仕様)、 本 helper は `invokeLoader` のみで適用する。
 */
const LOADER_UNDEFINED_RETURN_MESSAGE =
  'You defined a loader but didn\'t return anything from your loader function. Please return a value or `null`.';

export async function invokeLoader(opts: InvokeLoaderOptions): Promise<InvokeRouteResult> {
  const reqOpts: { readonly url: string; readonly method?: string; readonly headers?: Record<string, string> } = {
    url: opts.url,
    ...(typeof opts.method !== 'undefined' ? { method: opts.method } : {}),
    ...(typeof opts.headers !== 'undefined' ? { headers: opts.headers } : {}),
  };
  const request = buildRequest(reqOpts);
  const args: SimulatedRouteArgs = {
    request,
    params: { ...(opts.params ?? {}) },
    context: opts.context ?? {},
  };
  try {
    const value = await opts.loader(args);
    if (typeof value === 'undefined') {
      // Remix 公式 callRouteLoader 互換 ... explicit undefined return は throw (MAJOR 3 fix)
      throw new Error(LOADER_UNDEFINED_RETURN_MESSAGE);
    }
    return await normalizeResult(value);
  } catch (caught) {
    if (isRedirect(caught)) {
      return { result: undefined, response: null, redirect: caught, error: undefined };
    }
    return { result: undefined, response: null, redirect: null, error: caught };
  }
}

export async function invokeAction(opts: InvokeActionOptions): Promise<InvokeRouteResult> {
  const request = buildRequest(opts);
  const args: SimulatedRouteArgs = {
    request,
    params: { ...(opts.params ?? {}) },
    context: opts.context ?? {},
  };
  try {
    const value = await opts.action(args);
    return await normalizeResult(value);
  } catch (caught) {
    if (isRedirect(caught)) {
      return { result: undefined, response: null, redirect: caught, error: undefined };
    }
    return { result: undefined, response: null, redirect: null, error: caught };
  }
}

export function redirect(location: string, status = 302): Response {
  return new Response(null, { status, headers: { location } });
}

export function json<T>(body: T, init?: ResponseInit): Response {
  const headers = new Headers(init?.headers);
  if (!headers.has('content-type')) headers.set('content-type', 'application/json');
  return new Response(JSON.stringify(body), { ...init, headers });
}
