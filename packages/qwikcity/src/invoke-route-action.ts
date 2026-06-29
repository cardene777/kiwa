// Qwik City routeAction$ test helper for kiwa (Issue #519).
//
// Qwik City routeAction$ usage: `export const useAction = routeAction$(
//   async (formValues, requestEvent) => { ... }
// )`. The handler receives parsed formValues + a RequestEvent (cookie / url /
// fail helper). kiwa exposes a simulated request event subset and captures
// the returned ActionResult shape (success | fail).

export const QWIK_FAIL_SYMBOL = Symbol.for('kiwa.qwik.fail');
export const QWIK_REDIRECT_SYMBOL = Symbol.for('kiwa.qwik.redirect');

export interface QwikFailSignal {
  readonly [QWIK_FAIL_SYMBOL]: true;
  readonly status: number;
  readonly data: unknown;
}

export interface QwikRedirectSignal {
  readonly [QWIK_REDIRECT_SYMBOL]: true;
  readonly status: number;
  readonly location: string;
}

export interface SimulatedActionEvent {
  readonly url: URL;
  readonly cookie: {
    get(name: string): { value: string } | null;
    set(name: string, value: string, options?: Record<string, unknown>): void;
    delete(name: string, options?: Record<string, unknown>): void;
  };
  readonly headers: ReadonlyMap<string, string>;
  fail<T>(status: number, data: T): QwikFailSignal;
  redirect(status: number, location: string): never;
}

export type RouteActionFunction<TFormValues extends Record<string, unknown> = Record<string, unknown>, TResult = unknown> = (
  formValues: TFormValues,
  event: SimulatedActionEvent,
) => Promise<TResult | QwikFailSignal> | TResult | QwikFailSignal;

export interface InvokeRouteActionOptions<TFormValues extends Record<string, unknown>, TResult> {
  readonly action: RouteActionFunction<TFormValues, TResult>;
  readonly formValues: TFormValues;
  readonly url?: string;
  readonly cookies?: Record<string, string>;
  readonly headers?: Record<string, string>;
}

export interface InvokeRouteActionResult<TResult> {
  readonly result: TResult | undefined;
  readonly fail: QwikFailSignal | null;
  readonly redirect: QwikRedirectSignal | null;
  readonly error: unknown;
  readonly env: {
    readonly cookies: Map<string, string>;
    readonly requestHeaders: Map<string, string>;
  };
}

function isFail(value: unknown): value is QwikFailSignal {
  return typeof value === 'object' && value !== null && (value as { [QWIK_FAIL_SYMBOL]?: true })[QWIK_FAIL_SYMBOL] === true;
}
function isRedirect(value: unknown): value is QwikRedirectSignal {
  return typeof value === 'object' && value !== null && (value as { [QWIK_REDIRECT_SYMBOL]?: true })[QWIK_REDIRECT_SYMBOL] === true;
}

export async function invokeRouteAction<TFormValues extends Record<string, unknown> = Record<string, unknown>, TResult = unknown>(
  opts: InvokeRouteActionOptions<TFormValues, TResult>,
): Promise<InvokeRouteActionResult<TResult>> {
  const cookieStore = new Map<string, string>(Object.entries(opts.cookies ?? {}));
  const requestHeaders = new Map<string, string>();
  for (const [name, value] of Object.entries(opts.headers ?? {})) {
    requestHeaders.set(name.toLowerCase(), value);
  }
  const event: SimulatedActionEvent = {
    url: new URL(opts.url ?? 'http://localhost:5173/'),
    cookie: {
      get: (name) => {
        const v = cookieStore.get(name);
        return typeof v === 'undefined' ? null : { value: v };
      },
      set: (name, value) => {
        cookieStore.set(name, value);
      },
      delete: (name) => {
        cookieStore.delete(name);
      },
    },
    headers: requestHeaders,
    fail<T>(status: number, data: T): QwikFailSignal {
      return { [QWIK_FAIL_SYMBOL]: true, status, data };
    },
    redirect(status: number, location: string): never {
      const signal: QwikRedirectSignal = { [QWIK_REDIRECT_SYMBOL]: true, status, location };
      throw signal;
    },
  };
  let result: TResult | undefined;
  let fail: QwikFailSignal | null = null;
  let redirect: QwikRedirectSignal | null = null;
  let error: unknown;
  try {
    const value = await opts.action(opts.formValues, event);
    if (isFail(value)) {
      fail = value;
    } else {
      result = value as TResult;
    }
  } catch (caught) {
    if (isRedirect(caught)) {
      redirect = caught;
    } else {
      error = caught;
    }
  }
  return {
    result,
    fail,
    redirect,
    error,
    env: { cookies: cookieStore, requestHeaders },
  };
}
