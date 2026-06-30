// setupRemixNestedRouteEnv — Remix v2 nested route + headers() + Set-Cookie merge test helper (Issue #561, v1.1).
//
// v1.0.x の invokeLoader / invokeAction は 1 route の単発 invoke だけを cover し、
// Remix の特徴である「parent route の loader → child route の loader への data 連鎖」
// 「parent / child の `headers()` export merge」「Set-Cookie の親子横断 preservation」
// 「defer() による streaming」 を unit test する経路がなかった。
//
// setupRemixNestedRouteEnv は 1 度 env を build して以下を deterministic に再現する。
//
//   1. parent → child の loader chain (parent loader 結果を child loader の context
//      経由で受け渡し、 同 request で順次 invoke)
//   2. parent / child の `headers()` export を Remix 公式 router (server-runtime
//      headers.js の getDocumentHeaders 経路) と同じ accumulation logic で merge
//      し、 結果の Headers (loaderHeaders / parentHeaders を含む) を assertion 可能
//   3. Set-Cookie の prependCookies 互換 merge (子が同 cookie を持つ場合は子優先、
//      持たない場合は親 cookie を child Headers に append)
//   4. defer() return 時の resolved / pending key を 1 step で resolve、 streaming
//      timing を deterministic に追跡 (defer の中身は real `Promise` を await)

import { invokeLoader, type LoaderFunction, type InvokeRouteResult } from './invoke-route.js';

export interface RemixNestedRouteHeadersArgs {
  readonly loaderHeaders: Headers;
  readonly parentHeaders: Headers;
  readonly actionHeaders: Headers;
  readonly errorHeaders?: Headers | undefined;
}

export type RemixNestedRouteHeadersFunction =
  | ((args: RemixNestedRouteHeadersArgs) => HeadersInit)
  | HeadersInit;

export interface RemixNestedRouteDefinition<TResult = unknown> {
  readonly id: string;
  readonly loader?: LoaderFunction<TResult>;
  readonly headers?: RemixNestedRouteHeadersFunction;
}

export interface SetupRemixNestedRouteEnvOptions {
  readonly parentRoute: RemixNestedRouteDefinition;
  readonly childRoute: RemixNestedRouteDefinition;
  readonly url: string;
  readonly params?: Record<string, string>;
  readonly context?: Record<string, unknown>;
  readonly headers?: Record<string, string>;
  readonly cookies?: Record<string, string>;
  readonly method?: string;
}

export interface RunLoaderChainResult {
  readonly parent: InvokeRouteResult;
  readonly child: InvokeRouteResult;
  readonly parentLoaderHeaders: Headers;
  readonly childLoaderHeaders: Headers;
  readonly mergedHeaders: Headers;
  readonly cookies: Map<string, string>;
}

export interface RemixNestedRouteEnv {
  readonly cookies: Map<string, string>;
  /** parent → child loader chain を 1 request で順次 invoke、 child は parent の result を context.parentData として受け取る */
  runLoaderChain(): Promise<RunLoaderChainResult>;
  /** cookies / locals を初期 snapshot に戻す (同 env を別 test で再利用するため) */
  reset(): void;
}

function isHeadersFn(
  value: RemixNestedRouteHeadersFunction | undefined,
): value is (args: RemixNestedRouteHeadersArgs) => HeadersInit {
  return typeof value === 'function';
}

function extractResponseHeaders(result: InvokeRouteResult): Headers {
  if (result.response instanceof Response) {
    return new Headers(result.response.headers);
  }
  return new Headers();
}

/**
 * Remix 公式 server-runtime `prependCookies` 互換 — `source` Headers の
 * `Set-Cookie` を `target` Headers に append、 同一 cookie 文字列が既存なら skip する。
 * (`@remix-run/server-runtime/dist/esm/headers.js` の prependCookies と同 logic)
 */
function prependSetCookies(source: Headers, target: Headers): void {
  const sourceSetCookies = source.getSetCookie?.() ?? [];
  if (sourceSetCookies.length === 0) return;
  const existing = new Set(target.getSetCookie?.() ?? []);
  for (const cookie of sourceSetCookies) {
    if (!existing.has(cookie)) {
      target.append('Set-Cookie', cookie);
    }
  }
}

/**
 * 1 route 分の Headers を Remix 公式 `getDocumentHeaders` の reduce step と
 * 同じ logic で build する (kiwa は action 連鎖 を out of scope とし、
 * actionHeaders は常に空、 errorHeaders は別 Issue で取り扱う前提)。
 *   - `headers` 未 export ... parent Headers を base、 loader Set-Cookie を prepend
 *   - `headers` export (function or object) ... call 結果を base、 loader / parent の
 *     Set-Cookie を順次 prepend
 */
function buildRouteHeaders(
  def: RemixNestedRouteDefinition,
  loaderHeaders: Headers,
  parentHeaders: Headers,
): Headers {
  if (typeof def.headers === 'undefined') {
    const h = new Headers(parentHeaders);
    prependSetCookies(loaderHeaders, h);
    return h;
  }
  const computed = isHeadersFn(def.headers)
    ? def.headers({
        loaderHeaders,
        parentHeaders,
        actionHeaders: new Headers(),
        errorHeaders: undefined,
      })
    : def.headers;
  const h = new Headers(computed);
  prependSetCookies(loaderHeaders, h);
  prependSetCookies(parentHeaders, h);
  return h;
}

/**
 * Remix 公式 `getDocumentHeaders` 互換 — parent → child の matches を順次 reduce
 * して merged Headers を返す。 公式 reduce では root が `new Headers()` から始まり、
 * 1 match ごとに base / Set-Cookie merge を行う。 kiwa は parent / child の 2 match 固定
 * なので展開して書く。
 */
function mergeRouteHeaders(args: {
  parentDef: RemixNestedRouteDefinition;
  childDef: RemixNestedRouteDefinition;
  parentLoaderHeaders: Headers;
  childLoaderHeaders: Headers;
}): Headers {
  const parentHeadersForChild = buildRouteHeaders(
    args.parentDef,
    args.parentLoaderHeaders,
    new Headers(),
  );
  return buildRouteHeaders(args.childDef, args.childLoaderHeaders, parentHeadersForChild);
}

function parseSetCookieName(setCookieValue: string): { name: string; value: string } | null {
  const eq = setCookieValue.indexOf('=');
  if (eq === -1) return null;
  const name = setCookieValue.slice(0, eq).trim();
  const rest = setCookieValue.slice(eq + 1);
  const semi = rest.indexOf(';');
  const value = (semi === -1 ? rest : rest.slice(0, semi)).trim();
  return { name, value };
}

function updateCookieStoreFromSetCookies(store: Map<string, string>, headers: Headers): void {
  const setCookies = headers.getSetCookie?.() ?? [];
  for (const sc of setCookies) {
    const parsed = parseSetCookieName(sc);
    if (parsed === null) continue;
    store.set(parsed.name, parsed.value);
  }
}

function buildCookieHeader(store: Map<string, string>): string {
  return Array.from(store.entries())
    .map(([name, value]) => `${name}=${value}`)
    .join('; ');
}

/**
 * parent loader 結果を child の `context.parentData` に流すための deserialize 経路。
 *   - `result` (plain value) ... そのまま返す (json import 不要なテスト経路で最頻)
 *   - `response` (Response) ... JSON body を `.clone().json()` で deserialize、
 *     content-type が JSON 以外 / 解析失敗時は `undefined` を返す (caller は再 read 可能)
 *   - `redirect` / `error` ... 親が失敗しているので `undefined` (child は素通し走り、
 *     自身の loader logic で 401 等を返せる)
 */
async function derivedParentData(parentRes: InvokeRouteResult): Promise<unknown> {
  if (typeof parentRes.result !== 'undefined') return parentRes.result;
  if (parentRes.response instanceof Response) {
    const ct = parentRes.response.headers.get('content-type') ?? '';
    if (ct.includes('application/json')) {
      try {
        return await parentRes.response.clone().json();
      } catch {
        return undefined;
      }
    }
  }
  return undefined;
}

export function setupRemixNestedRouteEnv(
  options: SetupRemixNestedRouteEnvOptions,
): RemixNestedRouteEnv {
  const initialCookies = { ...(options.cookies ?? {}) };

  let cookieStore = new Map<string, string>(Object.entries(initialCookies));

  const runChain = async (): Promise<RunLoaderChainResult> => {
    const baseHeaders: Record<string, string> = { ...(options.headers ?? {}) };
    if (cookieStore.size > 0 && typeof baseHeaders.cookie === 'undefined') {
      baseHeaders.cookie = buildCookieHeader(cookieStore);
    }

    // parent loader
    const parentRes: InvokeRouteResult = typeof options.parentRoute.loader === 'function'
      ? await invokeLoader({
          loader: options.parentRoute.loader,
          url: options.url,
          ...(typeof options.params !== 'undefined' ? { params: options.params } : {}),
          ...(typeof options.context !== 'undefined' ? { context: options.context } : {}),
          ...(Object.keys(baseHeaders).length > 0 ? { headers: baseHeaders } : {}),
          ...(typeof options.method !== 'undefined' ? { method: options.method } : {}),
        })
      : { result: undefined, response: null, redirect: null, error: undefined };

    const parentLoaderHeaders = extractResponseHeaders(parentRes);
    // parent の Set-Cookie を cookieStore に反映 → child request の Cookie header に乗せる
    updateCookieStoreFromSetCookies(cookieStore, parentLoaderHeaders);

    // child loader は parent result を context.parentData として受け取る。
    // Remix 公式は loader の Response を deserialize して `useMatches()[i].data` に
    // 載せるので、 kiwa は parent が Response を返した時に JSON body を deserialize
    // して parentData として渡す。 plain value / redirect / error 時は素通し。
    const parentDataForChild = await derivedParentData(parentRes);
    const childContext: Record<string, unknown> = {
      ...(options.context ?? {}),
      parentData: parentDataForChild,
    };
    const childHeaders: Record<string, string> = { ...(options.headers ?? {}) };
    if (cookieStore.size > 0) {
      childHeaders.cookie = buildCookieHeader(cookieStore);
    }

    const childRes: InvokeRouteResult = typeof options.childRoute.loader === 'function'
      ? await invokeLoader({
          loader: options.childRoute.loader,
          url: options.url,
          ...(typeof options.params !== 'undefined' ? { params: options.params } : {}),
          context: childContext,
          ...(Object.keys(childHeaders).length > 0 ? { headers: childHeaders } : {}),
          ...(typeof options.method !== 'undefined' ? { method: options.method } : {}),
        })
      : { result: undefined, response: null, redirect: null, error: undefined };

    const childLoaderHeaders = extractResponseHeaders(childRes);
    // child の Set-Cookie も cookieStore に反映 (後続 chain 起動で persist)
    updateCookieStoreFromSetCookies(cookieStore, childLoaderHeaders);

    const mergedHeaders = mergeRouteHeaders({
      parentDef: options.parentRoute,
      childDef: options.childRoute,
      parentLoaderHeaders,
      childLoaderHeaders,
    });

    return {
      parent: parentRes,
      child: childRes,
      parentLoaderHeaders,
      childLoaderHeaders,
      mergedHeaders,
      cookies: new Map(cookieStore),
    };
  };

  return {
    get cookies() {
      return cookieStore;
    },
    runLoaderChain: runChain,
    reset() {
      cookieStore = new Map<string, string>(Object.entries(initialCookies));
    },
  };
}

/**
 * defer() 互換 — `Record<string, T | Promise<T>>` を返す helper。 Remix 公式
 * `defer()` の TypedDeferredData と異なり、 kiwa は real Promise をそのまま保持し、
 * `resolveDeferred()` で deterministic に全 Promise を await する。
 */
export const DEFERRED_DATA_SYMBOL = Symbol.for('kiwa.remix.deferredData');

export interface DeferredData<TData extends Record<string, unknown>> {
  readonly [DEFERRED_DATA_SYMBOL]: true;
  readonly data: TData;
  readonly init?: ResponseInit;
}

export function defer<TData extends Record<string, unknown>>(
  data: TData,
  init?: ResponseInit,
): DeferredData<TData> {
  return typeof init === 'undefined'
    ? { [DEFERRED_DATA_SYMBOL]: true, data }
    : { [DEFERRED_DATA_SYMBOL]: true, data, init };
}

export function isDeferred(value: unknown): value is DeferredData<Record<string, unknown>> {
  return typeof value === 'object' && value !== null && (value as { [DEFERRED_DATA_SYMBOL]?: true })[DEFERRED_DATA_SYMBOL] === true;
}

export interface ResolveDeferredResult<TData extends Record<string, unknown>> {
  readonly resolved: { [K in keyof TData]: Awaited<TData[K]> };
  readonly pendingKeys: ReadonlyArray<keyof TData>;
  readonly errors: { readonly [K in keyof TData]?: unknown };
  readonly init?: ResponseInit;
}

/**
 * defer() の値を全て deterministic に await。 settled Promise (resolved / rejected)
 * を一括追跡、 errors map で個別 rejection を assertion 可能。 pendingKeys は
 * 起動時に既に Promise だった key (= 「streaming で resolve した」 key) を保持する。
 */
export async function resolveDeferred<TData extends Record<string, unknown>>(
  deferred: DeferredData<TData>,
): Promise<ResolveDeferredResult<TData>> {
  const entries = Object.entries(deferred.data) as Array<[keyof TData, unknown]>;
  const resolved = {} as { [K in keyof TData]: Awaited<TData[K]> };
  const errors = {} as { [K in keyof TData]?: unknown };
  const pendingKeys: Array<keyof TData> = [];
  for (const [key, value] of entries) {
    const isPromiseLike = typeof value === 'object' && value !== null && typeof (value as { then?: unknown }).then === 'function';
    if (isPromiseLike) {
      pendingKeys.push(key);
      try {
        resolved[key] = (await value) as Awaited<TData[typeof key]>;
      } catch (caught) {
        errors[key] = caught;
      }
    } else {
      resolved[key] = value as Awaited<TData[typeof key]>;
    }
  }
  return typeof deferred.init === 'undefined'
    ? { resolved, pendingKeys, errors }
    : { resolved, pendingKeys, errors, init: deferred.init };
}
