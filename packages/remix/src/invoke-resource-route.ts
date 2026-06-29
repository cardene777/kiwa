// Remix v2 / React Router v7 Resource Routes test helper for kiwa (Issue #523).
//
// A Resource Route is a route module that exports `loader` and/or `action`
// but no default React component. Loaders / actions return arbitrary
// Response (JSON, text/csv, octet-stream, redirect) instead of UI data, and
// HTTP method dispatch decides which export runs:
//   - GET / HEAD              → loader
//   - POST / PUT / PATCH / DELETE → action
//
// kiwa wraps the dispatch + invokes the right export with a synthetic
// Request / params / context and returns the full `InvokeRouteResult`
// (response normalization + redirect signal already covered by the shared
// `invoke-route.ts` internals).

import {
  invokeLoader,
  invokeAction,
  REMIX_REDIRECT_SYMBOL,
  type LoaderFunction,
  type ActionFunction,
  type InvokeRouteResult,
  type RemixRedirectSignal,
} from './invoke-route.js';

export const RESOURCE_ROUTE_METHOD_NOT_ALLOWED_SYMBOL = Symbol.for('kiwa.remix.resource.methodNotAllowed');

export interface ResourceRouteMethodNotAllowedSignal {
  readonly [RESOURCE_ROUTE_METHOD_NOT_ALLOWED_SYMBOL]: true;
  readonly method: string;
  readonly allow: ReadonlyArray<'GET' | 'HEAD' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'>;
}

export interface ResourceRouteModule {
  readonly loader?: LoaderFunction;
  readonly action?: ActionFunction;
}

export interface InvokeResourceRouteOptions {
  readonly route: ResourceRouteModule;
  readonly url: string;
  readonly method: string;
  readonly params?: Record<string, string>;
  readonly context?: Record<string, unknown>;
  readonly headers?: Record<string, string>;
  readonly formData?: Record<string, string>;
  readonly jsonBody?: unknown;
}

export interface InvokeResourceRouteResult extends InvokeRouteResult {
  readonly dispatch: 'loader' | 'action' | 'method-not-allowed';
  readonly methodNotAllowed: ResourceRouteMethodNotAllowedSignal | null;
}

const LOADER_METHODS = new Set(['GET', 'HEAD']);
const ACTION_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

function buildAllowList(route: ResourceRouteModule): ReadonlyArray<'GET' | 'HEAD' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'> {
  const allow: Array<'GET' | 'HEAD' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'> = [];
  if (typeof route.loader === 'function') {
    allow.push('GET', 'HEAD');
  }
  if (typeof route.action === 'function') {
    allow.push('POST', 'PUT', 'PATCH', 'DELETE');
  }
  return allow;
}

/**
 * Resource Route dispatcher — picks `loader` for GET/HEAD and `action` for
 * POST/PUT/PATCH/DELETE. Method is required (no implicit default) because
 * Resource Routes intentionally rely on HTTP semantics to choose behavior.
 * Methods not implemented by the route module return a 405 Response and a
 * branded `methodNotAllowed` signal so tests can assert dispatch behavior
 * without conflating it with the route's own 4xx responses.
 */
export async function invokeResourceRoute(
  opts: InvokeResourceRouteOptions,
): Promise<InvokeResourceRouteResult> {
  const method = opts.method.toUpperCase();
  const allow = buildAllowList(opts.route);
  if (LOADER_METHODS.has(method) && typeof opts.route.loader === 'function') {
    const inner: { readonly url: string; readonly method?: string; readonly params?: Record<string, string>; readonly context?: Record<string, unknown>; readonly headers?: Record<string, string>; readonly loader: LoaderFunction } = {
      loader: opts.route.loader,
      url: opts.url,
      method,
      ...(typeof opts.params !== 'undefined' ? { params: opts.params } : {}),
      ...(typeof opts.context !== 'undefined' ? { context: opts.context } : {}),
      ...(typeof opts.headers !== 'undefined' ? { headers: opts.headers } : {}),
    };
    const r = await invokeLoader(inner);
    return { ...r, dispatch: 'loader', methodNotAllowed: null };
  }
  if (ACTION_METHODS.has(method) && typeof opts.route.action === 'function') {
    const inner: { readonly url: string; readonly method?: string; readonly params?: Record<string, string>; readonly context?: Record<string, unknown>; readonly headers?: Record<string, string>; readonly formData?: Record<string, string>; readonly jsonBody?: unknown; readonly action: ActionFunction } = {
      action: opts.route.action,
      url: opts.url,
      method,
      ...(typeof opts.params !== 'undefined' ? { params: opts.params } : {}),
      ...(typeof opts.context !== 'undefined' ? { context: opts.context } : {}),
      ...(typeof opts.headers !== 'undefined' ? { headers: opts.headers } : {}),
      ...(typeof opts.formData !== 'undefined' ? { formData: opts.formData } : {}),
      ...(typeof opts.jsonBody !== 'undefined' ? { jsonBody: opts.jsonBody } : {}),
    };
    const r = await invokeAction(inner);
    return { ...r, dispatch: 'action', methodNotAllowed: null };
  }
  const signal: ResourceRouteMethodNotAllowedSignal = {
    [RESOURCE_ROUTE_METHOD_NOT_ALLOWED_SYMBOL]: true,
    method,
    allow,
  };
  const response = new Response(null, {
    status: 405,
    headers: allow.length > 0 ? { allow: allow.join(', ') } : {},
  });
  return {
    result: undefined,
    response,
    redirect: null,
    error: undefined,
    dispatch: 'method-not-allowed',
    methodNotAllowed: signal,
  };
}

export { REMIX_REDIRECT_SYMBOL, type RemixRedirectSignal };
