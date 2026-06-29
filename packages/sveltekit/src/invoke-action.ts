// SvelteKit `+page.server.ts` actions test helper.
//
// actions: {
//   default: async ({ request, cookies, locals }) => ActionResult
//   namedAction: async ({ request, cookies, locals }) => ActionResult
// }
// The kiwa helper invokes the specific action callback with a simulated
// request (FormData-friendly) and captures fail / redirect signals.

import { SK_REDIRECT_SYMBOL, type SvelteKitRedirectSignal, redirect as _redirect } from './invoke-load.js';

export const SK_FAIL_SYMBOL = Symbol.for('kiwa.sveltekit.fail');

export interface SvelteKitFailSignal {
  readonly [SK_FAIL_SYMBOL]: true;
  readonly status: number;
  readonly data: unknown;
}

export interface SimulatedActionEvent {
  readonly request: Request;
  readonly cookies: {
    get(name: string): string | undefined;
    set(name: string, value: string, options?: Record<string, unknown>): void;
    delete(name: string): void;
  };
  readonly locals: Record<string, unknown>;
  readonly url: URL;
}

export type ActionFunction<TResult = unknown> = (event: SimulatedActionEvent) => Promise<TResult> | TResult;

export interface InvokeActionOptions<TResult = unknown> {
  readonly action: ActionFunction<TResult>;
  readonly url: string;
  readonly formData?: Record<string, string>;
  readonly cookies?: Record<string, string>;
  readonly locals?: Record<string, unknown>;
  readonly method?: string;
}

export interface InvokeActionResult<TResult = unknown> {
  readonly result: TResult | undefined;
  readonly fail: SvelteKitFailSignal | null;
  readonly redirect: SvelteKitRedirectSignal | null;
  readonly error: unknown;
  readonly env: {
    readonly cookies: Map<string, string>;
  };
}

function isRedirect(value: unknown): value is SvelteKitRedirectSignal {
  return typeof value === 'object' && value !== null && (value as { [SK_REDIRECT_SYMBOL]?: true })[SK_REDIRECT_SYMBOL] === true;
}
function isFailSignal(value: unknown): value is SvelteKitFailSignal {
  return typeof value === 'object' && value !== null && (value as { [SK_FAIL_SYMBOL]?: true })[SK_FAIL_SYMBOL] === true;
}

export async function invokeAction<TResult = unknown>(opts: InvokeActionOptions<TResult>): Promise<InvokeActionResult<TResult>> {
  const formData = new FormData();
  for (const [name, value] of Object.entries(opts.formData ?? {})) {
    formData.set(name, value);
  }
  const cookieStore = new Map<string, string>(Object.entries(opts.cookies ?? {}));
  const request = new Request(opts.url, {
    method: opts.method ?? 'POST',
    body: formData,
  });
  const event: SimulatedActionEvent = {
    request,
    url: new URL(opts.url),
    cookies: {
      get: (name) => cookieStore.get(name),
      set: (name, value) => {
        cookieStore.set(name, value);
      },
      delete: (name) => {
        cookieStore.delete(name);
      },
    },
    locals: opts.locals ?? {},
  };
  let result: TResult | undefined;
  let fail: SvelteKitFailSignal | null = null;
  let redirect: SvelteKitRedirectSignal | null = null;
  let error: unknown;
  try {
    const value = await opts.action(event);
    if (isFailSignal(value)) {
      fail = value;
    } else {
      result = value;
    }
  } catch (caught) {
    if (isRedirect(caught)) {
      redirect = caught;
    } else {
      error = caught;
    }
  }
  return { result, fail, redirect, error, env: { cookies: cookieStore } };
}

export function fail(status: number, data: unknown): SvelteKitFailSignal {
  return { [SK_FAIL_SYMBOL]: true, status, data };
}

export { _redirect as redirect };
