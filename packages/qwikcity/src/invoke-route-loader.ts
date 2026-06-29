// Qwik City routeLoader$ test helper for kiwa (Issue #519).
//
// routeLoader$: `export const useUser = routeLoader$(async (requestEvent) => {
//   return await fetchUser(requestEvent.params.id);
// })`. The loader receives a RequestEvent with url, params, cookie, query,
// platform. kiwa simulates a minimal subset and captures the loader return.

import {
  QWIK_REDIRECT_SYMBOL,
  type QwikRedirectSignal,
} from './invoke-route-action.js';

export interface SimulatedLoaderEvent<TParams extends Record<string, string> = Record<string, string>> {
  readonly url: URL;
  readonly params: TParams;
  readonly query: URLSearchParams;
  readonly cookie: {
    get(name: string): { value: string } | null;
  };
  readonly headers: ReadonlyMap<string, string>;
  readonly platform: Record<string, unknown>;
  redirect(status: number, location: string): never;
}

export type RouteLoaderFunction<TParams extends Record<string, string> = Record<string, string>, TResult = unknown> = (
  event: SimulatedLoaderEvent<TParams>,
) => Promise<TResult> | TResult;

export interface InvokeRouteLoaderOptions<TParams extends Record<string, string>, TResult> {
  readonly loader: RouteLoaderFunction<TParams, TResult>;
  readonly url: string;
  readonly params?: TParams;
  readonly cookies?: Record<string, string>;
  readonly headers?: Record<string, string>;
  readonly platform?: Record<string, unknown>;
}

export interface InvokeRouteLoaderResult<TResult> {
  readonly data: TResult | undefined;
  readonly redirect: QwikRedirectSignal | null;
  readonly error: unknown;
}

function isRedirect(value: unknown): value is QwikRedirectSignal {
  return typeof value === 'object' && value !== null && (value as { [QWIK_REDIRECT_SYMBOL]?: true })[QWIK_REDIRECT_SYMBOL] === true;
}

export async function invokeRouteLoader<TParams extends Record<string, string> = Record<string, string>, TResult = unknown>(
  opts: InvokeRouteLoaderOptions<TParams, TResult>,
): Promise<InvokeRouteLoaderResult<TResult>> {
  const url = new URL(opts.url);
  const cookieStore = new Map<string, string>(Object.entries(opts.cookies ?? {}));
  const requestHeaders = new Map<string, string>();
  for (const [name, value] of Object.entries(opts.headers ?? {})) {
    requestHeaders.set(name.toLowerCase(), value);
  }
  const event: SimulatedLoaderEvent<TParams> = {
    url,
    params: opts.params ?? ({} as TParams),
    query: url.searchParams,
    cookie: {
      get: (name) => {
        const v = cookieStore.get(name);
        return typeof v === 'undefined' ? null : { value: v };
      },
    },
    headers: requestHeaders,
    platform: opts.platform ?? {},
    redirect(status: number, location: string): never {
      const signal: QwikRedirectSignal = { [QWIK_REDIRECT_SYMBOL]: true, status, location };
      throw signal;
    },
  };
  let data: TResult | undefined;
  let redirect: QwikRedirectSignal | null = null;
  let error: unknown;
  try {
    data = await opts.loader(event);
  } catch (caught) {
    if (isRedirect(caught)) {
      redirect = caught;
    } else {
      error = caught;
    }
  }
  return { data, redirect, error };
}
