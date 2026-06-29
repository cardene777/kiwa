// SvelteKit `+page.server.ts` / `+layout.server.ts` load function test helper.
//
// load: async ({ params, url, cookies, fetch, depends, locals }) => data
// The kiwa helper provides a small simulated env so the callback can be
// awaited directly. Real SvelteKit ServerLoadEvent has many fields; we
// expose the subset most tests actually use.

export const SK_REDIRECT_SYMBOL = Symbol.for('kiwa.sveltekit.redirect');
export const SK_ERROR_SYMBOL = Symbol.for('kiwa.sveltekit.error');

export interface SvelteKitRedirectSignal {
  readonly [SK_REDIRECT_SYMBOL]: true;
  readonly status: number;
  readonly location: string;
}

export interface SvelteKitErrorSignal {
  readonly [SK_ERROR_SYMBOL]: true;
  readonly status: number;
  readonly body: { readonly message: string } | string;
}

export interface SimulatedLoadEvent {
  readonly url: URL;
  readonly params: Readonly<Record<string, string>>;
  readonly cookies: {
    get(name: string): string | undefined;
    set(name: string, value: string, options?: Record<string, unknown>): void;
    delete(name: string): void;
    getAll(): Array<[string, string]>;
  };
  readonly fetch: typeof globalThis.fetch;
  readonly locals: Record<string, unknown>;
  setHeaders(headers: Record<string, string>): void;
}

export type LoadFunction<TResult = unknown> = (event: SimulatedLoadEvent) => Promise<TResult> | TResult;

export interface InvokeLoadOptions<TResult = unknown> {
  readonly load: LoadFunction<TResult>;
  readonly url: string;
  readonly params?: Record<string, string>;
  readonly cookies?: Record<string, string>;
  readonly locals?: Record<string, unknown>;
  readonly fetch?: typeof globalThis.fetch;
}

export interface InvokeLoadResult<TResult = unknown> {
  readonly data: TResult | undefined;
  readonly redirect: SvelteKitRedirectSignal | null;
  readonly error: SvelteKitErrorSignal | unknown;
  readonly env: {
    readonly responseHeaders: Map<string, string>;
    readonly cookies: Map<string, string>;
  };
}

function isRedirect(value: unknown): value is SvelteKitRedirectSignal {
  return typeof value === 'object' && value !== null && (value as { [SK_REDIRECT_SYMBOL]?: true })[SK_REDIRECT_SYMBOL] === true;
}
function isErrorSignal(value: unknown): value is SvelteKitErrorSignal {
  return typeof value === 'object' && value !== null && (value as { [SK_ERROR_SYMBOL]?: true })[SK_ERROR_SYMBOL] === true;
}

export async function invokeLoad<TResult = unknown>(opts: InvokeLoadOptions<TResult>): Promise<InvokeLoadResult<TResult>> {
  const cookieStore = new Map<string, string>(Object.entries(opts.cookies ?? {}));
  const responseHeaders = new Map<string, string>();
  const event: SimulatedLoadEvent = {
    url: new URL(opts.url),
    params: { ...(opts.params ?? {}) },
    cookies: {
      get: (name) => cookieStore.get(name),
      set: (name, value) => {
        cookieStore.set(name, value);
      },
      delete: (name) => {
        cookieStore.delete(name);
      },
      getAll: () => Array.from(cookieStore.entries()),
    },
    fetch: opts.fetch ?? (globalThis.fetch as typeof globalThis.fetch),
    locals: opts.locals ?? {},
    setHeaders: (headers) => {
      for (const [name, value] of Object.entries(headers)) {
        responseHeaders.set(name.toLowerCase(), value);
      }
    },
  };
  let data: TResult | undefined;
  let redirect: SvelteKitRedirectSignal | null = null;
  let error: SvelteKitErrorSignal | unknown;
  try {
    data = await opts.load(event);
  } catch (caught) {
    if (isRedirect(caught)) {
      redirect = caught;
    } else {
      error = caught;
    }
  }
  return {
    data,
    redirect,
    error: isErrorSignal(error) ? error : error,
    env: {
      responseHeaders,
      cookies: cookieStore,
    },
  };
}

export function redirect(status: number, location: string): SvelteKitRedirectSignal {
  return { [SK_REDIRECT_SYMBOL]: true, status, location };
}

export function error(status: number, message: string): SvelteKitErrorSignal {
  return { [SK_ERROR_SYMBOL]: true, status, body: { message } };
}
