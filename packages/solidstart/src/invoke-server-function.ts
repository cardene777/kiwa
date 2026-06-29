// SolidStart Server Functions test helper for kiwa (Issue #518).
//
// A SolidStart server function is `async function (...args) { 'use server' ... }`
// where the runtime serializes args / return value and routes the call through
// a Vinxi server endpoint. kiwa invokes the function directly, capturing thrown
// redirect / error signals (matching the @solidjs/router `redirect()` shape).

export const SOLIDSTART_REDIRECT_SYMBOL = Symbol.for('kiwa.solidstart.redirect');

export interface SolidStartRedirectSignal {
  readonly [SOLIDSTART_REDIRECT_SYMBOL]: true;
  readonly url: string;
  readonly status: number;
}

export type ServerFunctionFunction<TArgs extends readonly unknown[] = readonly unknown[], TResult = unknown> = (
  ...args: TArgs
) => Promise<TResult> | TResult;

export interface InvokeServerFunctionOptions<TArgs extends readonly unknown[], TResult> {
  readonly fn: ServerFunctionFunction<TArgs, TResult>;
  readonly args?: TArgs;
  readonly headers?: Record<string, string>;
  readonly cookies?: Record<string, string>;
}

export interface InvokeServerFunctionResult<TResult> {
  readonly result: TResult | undefined;
  readonly redirect: SolidStartRedirectSignal | null;
  readonly error: unknown;
  readonly env: {
    readonly requestHeaders: Map<string, string>;
    readonly requestCookies: Map<string, string>;
  };
}

function isRedirect(value: unknown): value is SolidStartRedirectSignal {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as { [SOLIDSTART_REDIRECT_SYMBOL]?: true })[SOLIDSTART_REDIRECT_SYMBOL] === true
  );
}

/**
 * Invoke a SolidStart server function in isolation and capture its return
 * value + redirect signal. Headers / cookies are exposed for assertion but
 * the function itself receives them via the args contract (kiwa stays
 * minimal: pass any context the function needs through `args`).
 */
export async function invokeServerFunction<TArgs extends readonly unknown[] = readonly unknown[], TResult = unknown>(
  opts: InvokeServerFunctionOptions<TArgs, TResult>,
): Promise<InvokeServerFunctionResult<TResult>> {
  const requestHeaders = new Map<string, string>();
  for (const [name, value] of Object.entries(opts.headers ?? {})) {
    requestHeaders.set(name.toLowerCase(), value);
  }
  const requestCookies = new Map<string, string>(Object.entries(opts.cookies ?? {}));
  const args = (opts.args ?? ([] as unknown as TArgs));
  let result: TResult | undefined;
  let redirect: SolidStartRedirectSignal | null = null;
  let error: unknown;
  try {
    result = await opts.fn(...args);
  } catch (caught) {
    if (isRedirect(caught)) {
      redirect = caught;
    } else {
      error = caught;
    }
  }
  return {
    result,
    redirect,
    error,
    env: { requestHeaders, requestCookies },
  };
}

export function redirect(url: string, status = 302): SolidStartRedirectSignal {
  return { [SOLIDSTART_REDIRECT_SYMBOL]: true, url, status };
}
