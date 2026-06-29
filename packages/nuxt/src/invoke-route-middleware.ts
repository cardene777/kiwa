// Nuxt 3 route middleware (`middleware/*.ts`) test helper for kiwa (Issue #523).
//
// Server-side route middleware in Nuxt 3 is `defineNuxtRouteMiddleware((to, from) => ...)`
// where the function inspects the navigation target and can:
//   - return nothing  → continue navigation
//   - call `abortNavigation(message?)` → throw a branded abort signal
//   - call `navigateTo(path, options?)` → throw a branded redirect signal
// kiwa simulates the to / from RouteLocation surface so middleware can be
// invoked without a running Nuxt server.

export const NUXT_MIDDLEWARE_REDIRECT_SYMBOL = Symbol.for('kiwa.nuxt.middleware.redirect');
export const NUXT_MIDDLEWARE_ABORT_SYMBOL = Symbol.for('kiwa.nuxt.middleware.abort');

export interface NuxtMiddlewareRedirectSignal {
  readonly [NUXT_MIDDLEWARE_REDIRECT_SYMBOL]: true;
  readonly to: string;
  readonly external: boolean;
  readonly replace: boolean;
  readonly status: number;
}

export interface NuxtMiddlewareAbortSignal {
  readonly [NUXT_MIDDLEWARE_ABORT_SYMBOL]: true;
  readonly message: string | undefined;
  readonly statusCode: number;
}

export interface SimulatedRouteLocation {
  readonly fullPath: string;
  readonly path: string;
  readonly name: string | undefined;
  readonly params: Readonly<Record<string, string>>;
  readonly query: Readonly<Record<string, string | string[]>>;
  readonly hash: string;
  readonly meta: Readonly<Record<string, unknown>>;
}

export interface MiddlewareNavigateOptions {
  readonly external?: boolean;
  readonly replace?: boolean;
  readonly redirectCode?: number;
}

export type RouteMiddlewareFunction = (
  to: SimulatedRouteLocation,
  from: SimulatedRouteLocation,
  helpers: {
    navigateTo(target: string, options?: MiddlewareNavigateOptions): never;
    abortNavigation(message?: string, statusCode?: number): never;
  },
) => Promise<void | false | string | NuxtMiddlewareRedirectSignal> | void | false | string | NuxtMiddlewareRedirectSignal;

export interface RouteLocationInput {
  readonly path: string;
  readonly name?: string;
  readonly params?: Record<string, string>;
  readonly query?: Record<string, string | string[]>;
  readonly hash?: string;
  readonly meta?: Record<string, unknown>;
}

export interface InvokeRouteMiddlewareOptions {
  readonly middleware: RouteMiddlewareFunction;
  readonly to: RouteLocationInput;
  readonly from?: RouteLocationInput;
}

export interface InvokeRouteMiddlewareResult {
  readonly result: void | false | string | NuxtMiddlewareRedirectSignal;
  readonly redirect: NuxtMiddlewareRedirectSignal | null;
  readonly abort: NuxtMiddlewareAbortSignal | null;
  readonly error: unknown;
}

function buildRouteLocation(input: RouteLocationInput | undefined, fallback: RouteLocationInput): SimulatedRouteLocation {
  const source = input ?? fallback;
  const query = source.query ?? {};
  const queryString = Object.entries(query)
    .flatMap(([key, value]) =>
      Array.isArray(value) ? value.map((v) => `${encodeURIComponent(key)}=${encodeURIComponent(v)}`) : [`${encodeURIComponent(key)}=${encodeURIComponent(value)}`],
    )
    .join('&');
  const hashPart = source.hash ?? '';
  const fullPath = `${source.path}${queryString.length > 0 ? `?${queryString}` : ''}${hashPart}`;
  return {
    fullPath,
    path: source.path,
    name: source.name,
    params: { ...(source.params ?? {}) },
    query: { ...query },
    hash: hashPart,
    meta: { ...(source.meta ?? {}) },
  };
}

function isRedirectSignal(value: unknown): value is NuxtMiddlewareRedirectSignal {
  return typeof value === 'object' && value !== null && (value as { [NUXT_MIDDLEWARE_REDIRECT_SYMBOL]?: true })[NUXT_MIDDLEWARE_REDIRECT_SYMBOL] === true;
}

function isAbortSignal(value: unknown): value is NuxtMiddlewareAbortSignal {
  return typeof value === 'object' && value !== null && (value as { [NUXT_MIDDLEWARE_ABORT_SYMBOL]?: true })[NUXT_MIDDLEWARE_ABORT_SYMBOL] === true;
}

/**
 * Invoke a Nuxt 3 route middleware in isolation and capture its outcome.
 *
 * Return-value semantics mirror Nuxt:
 *   - `undefined` / `void` → continue navigation (no redirect, no abort)
 *   - `false`              → abort silently
 *   - `string`             → navigate to that path (synchronous return form)
 *   - thrown redirect/abort signal → captured into `redirect` / `abort`
 */
export async function invokeRouteMiddleware(
  opts: InvokeRouteMiddlewareOptions,
): Promise<InvokeRouteMiddlewareResult> {
  const to = buildRouteLocation(opts.to, opts.to);
  const from = buildRouteLocation(opts.from, { path: '/' });
  const helpers = {
    navigateTo(target: string, options: MiddlewareNavigateOptions = {}): never {
      const signal: NuxtMiddlewareRedirectSignal = {
        [NUXT_MIDDLEWARE_REDIRECT_SYMBOL]: true,
        to: target,
        external: options.external ?? false,
        replace: options.replace ?? false,
        status: options.redirectCode ?? 302,
      };
      throw signal;
    },
    abortNavigation(message?: string, statusCode = 404): never {
      const signal: NuxtMiddlewareAbortSignal = {
        [NUXT_MIDDLEWARE_ABORT_SYMBOL]: true,
        message,
        statusCode,
      };
      throw signal;
    },
  };
  let result: void | false | string | NuxtMiddlewareRedirectSignal = undefined;
  let redirect: NuxtMiddlewareRedirectSignal | null = null;
  let abort: NuxtMiddlewareAbortSignal | null = null;
  let error: unknown;
  try {
    const returned = await opts.middleware(to, from, helpers);
    result = returned;
    if (isRedirectSignal(returned)) redirect = returned;
  } catch (caught) {
    if (isRedirectSignal(caught)) redirect = caught;
    else if (isAbortSignal(caught)) abort = caught;
    else error = caught;
  }
  return { result, redirect, abort, error };
}
