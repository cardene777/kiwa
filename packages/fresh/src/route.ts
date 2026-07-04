// Deno Fresh route Handler + defineRoute test helpers for kiwa (Issue #814, v1.19-1b).
//
// Deno Fresh routes come in two forms:
//   - `defineRoute<T>(fn)` where `fn(req, ctx)` returns a JSX-shaped page tree
//     (server-side render only, no Islands until they're mounted separately)
//   - `Handlers<T>` where each HTTP method (`GET` / `POST` / `PUT` / `PATCH` /
//     `DELETE`) is a fn returning either a `Response` directly, or `ctx.render(data)`
//     which hands the data to the page component
//
// kiwa reproduces the observable contract without spinning up the Deno runtime
// or the file-system router:
//
//   - `invokeFreshHandler({ handlers, req, params, state })` — dispatches the
//     request by method, awaits ctx.render / direct-Response paths, and returns
//     a normalized `{ response, renderData, page }` result so tests can assert
//     on both the HTTP boundary and the render payload
//   - `defineRoute(fn)` — a thin wrapper matching Fresh's shape so route
//     component files can be authored the same way in tests
//   - `invokeDefineRoute({ route, req, params, state, data })` — runs a
//     defineRoute-wrapped page with a synthesized `PageProps` and captures
//     redirect / not-found signals thrown from the body
//
// Out of scope on purpose:
//   - real Deno runtime + file-system router
//   - middleware chain (`_middleware.ts`) traversal
//   - _app.tsx / _layout.tsx nesting

export const FRESH_REDIRECT_SYMBOL = Symbol.for('kiwa.fresh.route.redirect');
export const FRESH_NOT_FOUND_SYMBOL = Symbol.for('kiwa.fresh.route.notFound');
export const FRESH_ROUTE_SYMBOL = Symbol.for('kiwa.fresh.route.defineRoute');

export interface FreshRedirectSignal {
  readonly [FRESH_REDIRECT_SYMBOL]: true;
  readonly location: string;
  readonly status: number;
}

export interface FreshNotFoundSignal {
  readonly [FRESH_NOT_FOUND_SYMBOL]: true;
}

/** Throw this from a Fresh handler or a defineRoute page body to signal a redirect. */
export function redirect(location: string, status = 302): FreshRedirectSignal {
  return { [FRESH_REDIRECT_SYMBOL]: true, location, status };
}

/** Throw this from a Fresh handler or a defineRoute page body to signal a 404. */
export function notFound(): FreshNotFoundSignal {
  return { [FRESH_NOT_FOUND_SYMBOL]: true };
}

function isFreshRedirect(value: unknown): value is FreshRedirectSignal {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as { [FRESH_REDIRECT_SYMBOL]?: true })[FRESH_REDIRECT_SYMBOL] === true
  );
}

function isFreshNotFound(value: unknown): value is FreshNotFoundSignal {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as { [FRESH_NOT_FOUND_SYMBOL]?: true })[FRESH_NOT_FOUND_SYMBOL] === true
  );
}

/** Type guard: recognize a Fresh redirect signal (mirrors the internal check). */
export function isRedirectSignal(value: unknown): value is FreshRedirectSignal {
  return isFreshRedirect(value);
}

/** Type guard: recognize a Fresh not-found signal (mirrors the internal check). */
export function isNotFoundSignal(value: unknown): value is FreshNotFoundSignal {
  return isFreshNotFound(value);
}

export type FreshHttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';

export interface FreshRouteParams {
  readonly [key: string]: string | undefined;
}

/** JSX-shaped virtual node returned by a Fresh route or Island. */
export interface FreshVNode {
  readonly type: string;
  readonly props: Record<string, unknown>;
  readonly children: FreshChild[];
}

export type FreshChild = FreshVNode | string | number | boolean | null | undefined | FreshChild[];

/**
 * Lightweight JSX-shaped element factory. Tests write
 * `h('div', { class: 'x' }, 'hello')` and pass the result to a Fresh route or
 * Island.
 */
export function h(
  type: string,
  props: Record<string, unknown> | null,
  ...children: FreshChild[]
): FreshVNode {
  return {
    type,
    props: props ?? {},
    children,
  };
}

/** Type guard: recognize a Fresh virtual node (used by walkers + tests). */
export function isFreshVNode(value: unknown): value is FreshVNode {
  if (typeof value !== 'object' || value === null) return false;
  const rec = value as Record<string, unknown>;
  return typeof rec.type === 'string' && typeof rec.props === 'object' && Array.isArray(rec.children);
}

/**
 * Recursively serialize a Fresh virtual tree into an HTML string. Boolean
 * attributes render as bare keys, `null` / `undefined` / `false` skip, and
 * children are stringified without any XSS escaping — tests assert on shape,
 * not on production output. Void elements (matching the HTML5 spec list)
 * render as self-closing (`<br />` / `<meta ... />` / etc.) rather than
 * `<br></br>` so `head.ts` can emit spec-shaped `<meta>` / `<link>` tags.
 */
export function stringify(node: FreshChild): string {
  if (node === null || node === undefined || node === false || node === true) return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(stringify).join('');
  const attrs = renderAttrs(node.props);
  if (VOID_ELEMENTS.has(node.type)) return `<${node.type}${attrs} />`;
  const inner = node.children.map(stringify).join('');
  return `<${node.type}${attrs}>${inner}</${node.type}>`;
}

// HTML5 void elements — elements that must self-close and cannot have children.
const VOID_ELEMENTS = new Set([
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'source',
  'track',
  'wbr',
]);

function renderAttrs(props: Record<string, unknown>): string {
  const parts: string[] = [];
  for (const [key, value] of Object.entries(props)) {
    if (key === 'children') continue;
    if (value === null || value === undefined || value === false) continue;
    if (value === true) {
      parts.push(` ${key}`);
      continue;
    }
    parts.push(` ${key}="${String(value)}"`);
  }
  return parts.join('');
}

/**
 * Depth-first traversal of a Fresh virtual tree. Collects every node whose
 * `type` matches the predicate; strings / numbers / nulls are skipped.
 */
export function findNodes(tree: FreshChild, predicate: (n: FreshVNode) => boolean): FreshVNode[] {
  const out: FreshVNode[] = [];
  const visit = (node: FreshChild): void => {
    if (Array.isArray(node)) {
      for (const child of node) visit(child);
      return;
    }
    if (!isFreshVNode(node)) return;
    if (predicate(node)) out.push(node);
    for (const child of node.children) visit(child);
  };
  visit(tree);
  return out;
}

/**
 * `PageProps<T>` mirrors Fresh's page component props. `data` is what the
 * handler passed to `ctx.render(data)`, and `params` / `url` / `route` /
 * `state` come from the router.
 */
export interface FreshPageProps<TData = unknown, TState = Record<string, unknown>> {
  readonly url: URL;
  readonly route: string;
  readonly params: FreshRouteParams;
  readonly state: TState;
  readonly data: TData | undefined;
}

/**
 * `HandlerContext<S>` shrinks Fresh's `ctx` to what tests observe: `render`
 * to hand data to the page component, `renderNotFound` / `redirect` for
 * direct 404 / 302 responses, and `next()` returning a 404 shape used by
 * fall-through handlers. `state` is a mutable per-request bag matching
 * Fresh's middleware→handler contract.
 */
export interface FreshHandlerContext<TState = Record<string, unknown>> {
  readonly params: FreshRouteParams;
  readonly url: URL;
  readonly route: string;
  readonly state: TState;
  readonly render: <TData>(data?: TData, init?: ResponseInit) => Response;
  readonly renderNotFound: () => Response;
  readonly redirect: (location: string, status?: number) => Response;
  readonly next: () => Promise<Response>;
}

export type FreshHandler<TData = unknown, TState = Record<string, unknown>> = (
  req: Request,
  ctx: FreshHandlerContext<TState>,
) => Response | Promise<Response> | TData | Promise<TData>;

/**
 * `Handlers<T, S>` — Fresh's `export const handler` shape. Each optional
 * method key maps to a handler for that HTTP method; missing methods
 * fall through to a `405 Method Not Allowed` response.
 */
export type FreshHandlers<TData = unknown, TState = Record<string, unknown>> = Partial<
  Record<FreshHttpMethod, FreshHandler<TData, TState>>
>;

export interface InvokeFreshHandlerOptions<TData, TState> {
  readonly handlers: FreshHandlers<TData, TState> | FreshHandler<TData, TState>;
  readonly req: Request;
  readonly params?: FreshRouteParams;
  readonly state?: TState;
  readonly route?: string;
  /**
   * Optional page component invoked when the handler calls `ctx.render(data)`.
   * Tests that only care about the HTTP response can omit this.
   */
  readonly page?: (props: FreshPageProps<TData, TState>) => FreshChild;
}

export interface InvokeFreshHandlerResult<TData> {
  readonly response: Response;
  readonly renderData: TData | undefined;
  readonly page: FreshChild | null;
  readonly redirect: FreshRedirectSignal | null;
  readonly notFound: FreshNotFoundSignal | null;
  readonly error: unknown;
}

interface RenderCapture<TData> {
  data: TData | undefined;
  init: ResponseInit | undefined;
  called: boolean;
}

/**
 * Dispatch a Fresh handler for the given `req.method`. If the handler
 * returns a `Response` directly, that's the result. If the handler calls
 * `ctx.render(data)`, we capture `data`, optionally invoke `page(props)` to
 * materialize the tree, and synthesize a 200 HTML response. If the handler
 * calls `ctx.renderNotFound()` / `ctx.redirect(...)`, the corresponding
 * signal fields on the result are populated.
 */
export async function invokeFreshHandler<TData = unknown, TState = Record<string, unknown>>(
  opts: InvokeFreshHandlerOptions<TData, TState>,
): Promise<InvokeFreshHandlerResult<TData>> {
  const method = opts.req.method.toUpperCase() as FreshHttpMethod;
  const handler = pickHandler(opts.handlers, method);
  if (!handler) {
    // No handler for this method — Fresh returns 405 with an Allow header.
    const allow = allowedMethods(opts.handlers).join(', ');
    const init: ResponseInit = { status: 405 };
    if (allow) init.headers = { allow };
    return {
      response: new Response(null, init),
      renderData: undefined,
      page: null,
      redirect: null,
      notFound: null,
      error: undefined,
    };
  }
  const params = opts.params ?? {};
  const state = opts.state ?? ({} as TState);
  const url = new URL(opts.req.url);
  const route = opts.route ?? url.pathname;
  const renderCapture: RenderCapture<TData> = { data: undefined, init: undefined, called: false };
  let redirectSignal: FreshRedirectSignal | null = null;
  let notFoundSignal: FreshNotFoundSignal | null = null;
  let error: unknown;
  let response: Response | null = null;
  let page: FreshChild | null = null;

  const ctx: FreshHandlerContext<TState> = {
    params,
    url,
    route,
    state,
    render: (<T>(data?: T, init?: ResponseInit): Response => {
      renderCapture.called = true;
      renderCapture.data = data as unknown as TData | undefined;
      renderCapture.init = init;
      return new Response('__kiwa_fresh_render__', { status: 200, ...init });
    }) as FreshHandlerContext<TState>['render'],
    renderNotFound: (): Response => {
      notFoundSignal = notFound();
      return new Response('Not Found', { status: 404 });
    },
    redirect: (location: string, status = 302): Response => {
      redirectSignal = redirect(location, status);
      return new Response(null, { status, headers: { location } });
    },
    next: async (): Promise<Response> => new Response('Not Found', { status: 404 }),
  };

  try {
    const returned = await handler(opts.req, ctx);
    if (returned instanceof Response) {
      // A ctx.render() call returns a sentinel Response — swap it out later
      // for the page component's stringified HTML rather than exposing the
      // sentinel body to callers.
      if (renderCapture.called && (await returned.clone().text()) === '__kiwa_fresh_render__') {
        renderCapture.init = { status: returned.status, headers: cloneHeaders(returned.headers) };
      } else {
        response = returned;
      }
    } else if (returned !== undefined) {
      // Non-Response return means the handler produced page data directly
      // (a shape defineRoute users lean on). Treat it like a captured render.
      renderCapture.called = true;
      renderCapture.data = returned as TData;
    }
  } catch (caught) {
    if (isFreshRedirect(caught)) redirectSignal = caught;
    else if (isFreshNotFound(caught)) notFoundSignal = caught;
    else error = caught;
  }

  if (redirectSignal) {
    return {
      response:
        response ??
        new Response(null, {
          status: redirectSignal.status,
          headers: { location: redirectSignal.location },
        }),
      renderData: renderCapture.data,
      page: null,
      redirect: redirectSignal,
      notFound: null,
      error: undefined,
    };
  }
  if (notFoundSignal) {
    return {
      response: response ?? new Response('Not Found', { status: 404 }),
      renderData: renderCapture.data,
      page: null,
      redirect: null,
      notFound: notFoundSignal,
      error: undefined,
    };
  }
  if (error !== undefined) {
    return {
      response: response ?? new Response('Internal Server Error', { status: 500 }),
      renderData: renderCapture.data,
      page: null,
      redirect: null,
      notFound: null,
      error,
    };
  }

  if (renderCapture.called && opts.page) {
    page = opts.page({ url, route, params, state, data: renderCapture.data });
  }

  if (response) {
    return {
      response,
      renderData: renderCapture.data,
      page,
      redirect: null,
      notFound: null,
      error: undefined,
    };
  }

  const status = renderCapture.init?.status ?? 200;
  const capturedHeaders = renderCapture.init?.headers ?? {};
  return {
    response: new Response(page ? stringify(page) : '', {
      status,
      headers: { 'content-type': 'text/html; charset=utf-8', ...(capturedHeaders as Record<string, string>) },
    }),
    renderData: renderCapture.data,
    page,
    redirect: null,
    notFound: null,
    error: undefined,
  };
}

function cloneHeaders(headers: Headers): Record<string, string> {
  const out: Record<string, string> = {};
  headers.forEach((value, key) => {
    out[key] = value;
  });
  return out;
}

function pickHandler<TData, TState>(
  handlers: FreshHandlers<TData, TState> | FreshHandler<TData, TState>,
  method: FreshHttpMethod,
): FreshHandler<TData, TState> | undefined {
  if (typeof handlers === 'function') return handlers;
  const direct = handlers[method];
  if (direct) return direct;
  // Fresh convention: a plain `handler` (no method key) matches every method.
  return undefined;
}

function allowedMethods<TData, TState>(
  handlers: FreshHandlers<TData, TState> | FreshHandler<TData, TState>,
): FreshHttpMethod[] {
  if (typeof handlers === 'function') return ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];
  return (Object.keys(handlers) as FreshHttpMethod[]).filter((key) => typeof handlers[key] === 'function');
}

/**
 * `defineRoute<T>(fn)` mirrors Fresh's route wrapper. The returned brand lets
 * `invokeDefineRoute` recognize the value; the handler itself just proxies to
 * `fn(req, ctx)`.
 */
export type DefineRouteFn<TData, TState> = (
  req: Request,
  ctx: FreshHandlerContext<TState>,
) => FreshChild | Promise<FreshChild>;

export interface DefinedRoute<TData, TState> {
  readonly [FRESH_ROUTE_SYMBOL]: true;
  readonly fn: DefineRouteFn<TData, TState>;
}

/** Wrap a page fn so it registers as a Fresh-defined route (brand + passthrough). */
export function defineRoute<TData = unknown, TState = Record<string, unknown>>(
  fn: DefineRouteFn<TData, TState>,
): DefinedRoute<TData, TState> {
  return { [FRESH_ROUTE_SYMBOL]: true, fn };
}

/** Type guard: recognize a `defineRoute()`-wrapped page. */
export function isDefinedRoute<TData, TState>(value: unknown): value is DefinedRoute<TData, TState> {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as { [FRESH_ROUTE_SYMBOL]?: true })[FRESH_ROUTE_SYMBOL] === true
  );
}

export interface InvokeDefineRouteOptions<TData, TState> {
  readonly route: DefinedRoute<TData, TState> | DefineRouteFn<TData, TState>;
  readonly req: Request;
  readonly params?: FreshRouteParams;
  readonly state?: TState;
  readonly path?: string;
}

export interface InvokeDefineRouteResult {
  readonly tree: FreshChild | null;
  readonly redirect: FreshRedirectSignal | null;
  readonly notFound: FreshNotFoundSignal | null;
  readonly error: unknown;
  readonly html: string;
}

/**
 * Run a `defineRoute`-wrapped page. Synthesizes a minimal `ctx` (params /
 * url / state / render is a no-op returning 200) and captures redirect /
 * not-found signals the body throws.
 */
export async function invokeDefineRoute<TData = unknown, TState = Record<string, unknown>>(
  opts: InvokeDefineRouteOptions<TData, TState>,
): Promise<InvokeDefineRouteResult> {
  const fn: DefineRouteFn<TData, TState> = isDefinedRoute<TData, TState>(opts.route)
    ? opts.route.fn
    : (opts.route as DefineRouteFn<TData, TState>);
  const params = opts.params ?? {};
  const state = opts.state ?? ({} as TState);
  const url = new URL(opts.req.url);
  const route = opts.path ?? url.pathname;
  let redirectSignal: FreshRedirectSignal | null = null;
  let notFoundSignal: FreshNotFoundSignal | null = null;
  let error: unknown;
  let tree: FreshChild | null = null;
  const ctx: FreshHandlerContext<TState> = {
    params,
    url,
    route,
    state,
    render: (): Response => new Response('__kiwa_fresh_render__', { status: 200 }),
    renderNotFound: (): Response => {
      notFoundSignal = notFound();
      return new Response('Not Found', { status: 404 });
    },
    redirect: (location: string, status = 302): Response => {
      redirectSignal = redirect(location, status);
      return new Response(null, { status, headers: { location } });
    },
    next: async (): Promise<Response> => new Response('Not Found', { status: 404 }),
  };
  try {
    tree = await fn(opts.req, ctx);
  } catch (caught) {
    if (isFreshRedirect(caught)) redirectSignal = caught;
    else if (isFreshNotFound(caught)) notFoundSignal = caught;
    else error = caught;
  }
  return {
    tree: redirectSignal || notFoundSignal || error !== undefined ? null : tree,
    redirect: redirectSignal,
    notFound: notFoundSignal,
    error,
    html: tree && !redirectSignal && !notFoundSignal && error === undefined ? stringify(tree) : '',
  };
}
