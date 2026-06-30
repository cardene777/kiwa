// setupSvelteKitHooksEnv — unified env builder for SvelteKit hooks (Issue #559, v1.1).
//
// 既存 invokeHandle / invokeHandleFetch / invokeHandleError は単発 invoke で
// event が毎回 build されるが、 同 request の流れの中で複数 hook (handle →
// handleFetch → handleError) を順に呼びたい / event.locals / cookies を hook 間で
// 共有したいユースケースが v1.1 で要求された (Issue #559)。
//
// setupSvelteKitHooksEnv は 1 度 env を build して 4 hook 種を `runHandle` /
// `runHandleFetch` / `runHandleError` で繰返し invoke する。 cookies / locals は
// 同 env 内で persist し、 `reset()` で初期状態に戻す。
//
// `sequence(...handles)` は SvelteKit 公式 `sequence()` 相当の handle chain
// composer。 後続 handle を resolve として渡し、 outer handle が `resolve(event)`
// を await することで通常の chain が成立する。

import type {
  HandleFunction,
  HandleFetchFunction,
  HandleErrorFunction,
  SimulatedHookRequestEvent,
} from './invoke-hooks.js';

export interface SetupSvelteKitHooksEnvOptions<TLocals extends Record<string, unknown>> {
  readonly url: string;
  readonly method?: string;
  readonly headers?: Record<string, string>;
  readonly cookies?: Record<string, string>;
  readonly params?: Record<string, string>;
  readonly locals?: TLocals;
  readonly routeId?: string;
  readonly platform?: Record<string, unknown>;
}

export interface RunHandleResult<TLocals extends Record<string, unknown>> {
  readonly response: Response;
  readonly resolveCalled: boolean;
  readonly localsAtResolve: TLocals | null;
  readonly error: unknown;
}

export interface RunHandleFetchOptions {
  readonly fetchUrl: string;
  readonly fetchMethod?: string;
  readonly fetchHeaders?: Record<string, string>;
  readonly downstreamFetch?: (req: Request) => Promise<Response>;
}

export interface RunHandleFetchResult {
  readonly response: Response;
  readonly downstreamCalled: boolean;
  readonly downstreamRequest: Request | null;
  readonly error: unknown;
}

export interface RunHandleErrorOptions {
  readonly error: unknown;
  readonly status: number;
  readonly message: string;
}

export interface RunHandleErrorResult {
  readonly report: { message: string } | void;
  readonly thrown: unknown;
}

export interface SvelteKitHooksEnv<TLocals extends Record<string, unknown>> {
  readonly cookies: Map<string, string>;
  readonly locals: TLocals;
  /** 現在の state で SimulatedHookRequestEvent を build (cookies / locals は共有参照) */
  buildEvent(): SimulatedHookRequestEvent<TLocals>;
  runHandle(handle: HandleFunction<TLocals>, resolveResponse?: Response | ((event: SimulatedHookRequestEvent<TLocals>) => Response | Promise<Response>)): Promise<RunHandleResult<TLocals>>;
  runHandleFetch(handleFetch: HandleFetchFunction<TLocals>, options: RunHandleFetchOptions): Promise<RunHandleFetchResult>;
  runHandleError(handleError: HandleErrorFunction<TLocals>, options: RunHandleErrorOptions): Promise<RunHandleErrorResult>;
  /** cookies / locals を初期 snapshot に戻す (同 env を別 test で再利用するため) */
  reset(): void;
}

function cloneRecord<T extends Record<string, unknown>>(src: T | undefined): T {
  if (typeof src === 'undefined') return {} as T;
  return { ...src };
}

export function setupSvelteKitHooksEnv<TLocals extends Record<string, unknown> = Record<string, unknown>>(
  options: SetupSvelteKitHooksEnvOptions<TLocals>,
): SvelteKitHooksEnv<TLocals> {
  const initialCookies = { ...(options.cookies ?? {}) };
  const initialLocalsSnapshot = cloneRecord<TLocals>(options.locals);

  let cookieStore = new Map<string, string>(Object.entries(initialCookies));
  let localsRef: TLocals = cloneRecord<TLocals>(options.locals);

  const buildEventInternal = (): SimulatedHookRequestEvent<TLocals> => {
    return {
      request: new Request(options.url, {
        method: options.method ?? 'GET',
        headers: new Headers(options.headers ?? {}),
      }),
      url: new URL(options.url),
      params: { ...(options.params ?? {}) },
      cookies: {
        get: (name) => cookieStore.get(name),
        set: (name, value) => {
          cookieStore.set(name, value);
        },
        delete: (name) => {
          cookieStore.delete(name);
        },
      },
      locals: localsRef,
      route: { id: options.routeId ?? null },
      platform: options.platform,
    };
  };

  return {
    get cookies() {
      return cookieStore;
    },
    get locals() {
      return localsRef;
    },
    buildEvent: buildEventInternal,
    async runHandle(handle, resolveResponse) {
      const event = buildEventInternal();
      let resolveCalled = false;
      let localsAtResolve: TLocals | null = null;
      const resolveImpl = async (innerEvent: SimulatedHookRequestEvent<TLocals>): Promise<Response> => {
        resolveCalled = true;
        localsAtResolve = { ...innerEvent.locals };
        if (typeof resolveResponse === 'function') return resolveResponse(innerEvent);
        if (resolveResponse instanceof Response) return resolveResponse;
        return new Response('ok', { status: 200 });
      };
      let response: Response;
      let error: unknown;
      try {
        response = await handle({ event, resolve: resolveImpl });
      } catch (caught) {
        response = new Response(null, { status: 500 });
        error = caught;
      }
      return { response, resolveCalled, localsAtResolve, error };
    },
    async runHandleFetch(handleFetch, opts) {
      const event = buildEventInternal();
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
        response = await handleFetch({
          event,
          request: new Request(opts.fetchUrl, {
            method: opts.fetchMethod ?? 'GET',
            headers: new Headers(opts.fetchHeaders ?? {}),
          }),
          fetch: fakeFetch,
        });
      } catch (caught) {
        response = new Response(null, { status: 500 });
        error = caught;
      }
      return { response, downstreamCalled, downstreamRequest, error };
    },
    async runHandleError(handleError, opts) {
      const event = buildEventInternal();
      let report: { message: string } | void = undefined;
      let thrown: unknown;
      try {
        report = await handleError({
          error: opts.error,
          event,
          status: opts.status,
          message: opts.message,
        });
      } catch (caught) {
        thrown = caught;
      }
      return { report, thrown };
    },
    reset() {
      cookieStore = new Map<string, string>(Object.entries(initialCookies));
      localsRef = { ...initialLocalsSnapshot };
    },
  };
}

/**
 * sequence — SvelteKit 公式 `sequence(...handlers)` 相当の handle chain composer。
 *   sequence(h1, h2) は h1 の resolve として h2 を渡し、 h2 の resolve として
 *   最終の resolve を渡す。 結果として h1-before → h2-before → resolve →
 *   h2-after → h1-after の順で実行される。
 * 引数なし時は no-op (resolve(event) を直接呼ぶ)。
 */
export function sequence<TLocals extends Record<string, unknown> = Record<string, unknown>>(
  ...handles: HandleFunction<TLocals>[]
): HandleFunction<TLocals> {
  if (handles.length === 0) {
    return async ({ event, resolve }) => resolve(event);
  }
  return async ({ event, resolve }) => {
    const compose = (index: number): (e: SimulatedHookRequestEvent<TLocals>) => Promise<Response> => {
      if (index >= handles.length) {
        return async (e) => resolve(e);
      }
      const current = handles[index]!;
      return async (e) => current({ event: e, resolve: compose(index + 1) });
    };
    return compose(0)(event);
  };
}
