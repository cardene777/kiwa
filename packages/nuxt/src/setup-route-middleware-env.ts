// High-level test env helper for Nuxt 3 route middleware (Issue #562).
//
// `setupNuxtMiddlewareEnv` wraps `invokeRouteMiddleware` to provide:
//   - spy capture for `navigateTo()` and `abortNavigation()` invocations
//   - auth guard fixture via `user` param (injected into `to.meta.userSession`)
//   - chain runner for global + route-specific middleware sequences
//   - explicit assertions (`redirectedTo`, `aborted`) without checking signal symbols
//
// The lower-level `invokeRouteMiddleware` (PR #543) remains the building block —
// this helper is the ergonomic surface most tests will use.

import {
  invokeRouteMiddleware,
  type InvokeRouteMiddlewareResult,
  type MiddlewareNavigateOptions,
  type NuxtMiddlewareAbortSignal,
  type NuxtMiddlewareRedirectSignal,
  type RouteLocationInput,
  type RouteMiddlewareFunction,
} from './invoke-route-middleware.js';

/**
 * User session fixture injected into `to.meta.userSession` so middleware that
 * reads `useUserSession()` (or any equivalent composable mirrored into `meta`)
 * can branch on auth state without a real Nuxt app.
 *
 * `state: 'expired'` is a sentinel value the middleware can opt-into; it does
 * not carry meaning at the helper level beyond being placed in meta verbatim.
 */
export type NuxtMiddlewareUserFixture =
  | { readonly state: 'authenticated'; readonly userId: string; readonly role?: string; readonly extra?: Readonly<Record<string, unknown>> }
  | { readonly state: 'expired'; readonly userId?: string; readonly role?: string; readonly extra?: Readonly<Record<string, unknown>> }
  | { readonly state: 'anonymous' };

/**
 * Single recorded `navigateTo()` call captured by the spy.
 */
export interface NuxtMiddlewareNavigateCall {
  readonly target: string;
  readonly options: MiddlewareNavigateOptions;
}

/**
 * Single recorded `abortNavigation()` call captured by the spy.
 */
export interface NuxtMiddlewareAbortCall {
  readonly message: string | undefined;
  readonly statusCode: number;
}

export interface SetupNuxtMiddlewareEnvOptions {
  /**
   * One middleware function or an ordered chain. Chain order follows Nuxt:
   * global middleware first, route-specific middleware after, executed in
   * array order. Execution stops at the first redirect / abort / non-signal
   * throw — later entries are reported in `result.skipped`.
   */
  readonly middleware: RouteMiddlewareFunction | readonly RouteMiddlewareFunction[];
  readonly to: RouteLocationInput;
  readonly from?: RouteLocationInput;
  /**
   * Optional user session fixture. When provided, it is merged into
   * `to.meta.userSession` so existing middleware (which reads meta) keeps
   * working unchanged. Anonymous → no key written (meta absent).
   */
  readonly user?: NuxtMiddlewareUserFixture;
}

export interface SetupNuxtMiddlewareEnvResult {
  /**
   * Aggregated outcome:
   *   - `redirect` / `abort` / `error` mirror the *first* halting signal in the chain.
   *   - `result` mirrors the return value of the last executed middleware.
   *   - `executed` lists the indices of middlewares that ran (in order).
   *   - `skipped` lists the indices that never ran because the chain halted.
   */
  readonly outcome: InvokeRouteMiddlewareResult & {
    readonly executed: readonly number[];
    readonly skipped: readonly number[];
  };
  /**
   * Spy capture for all `navigateTo()` invocations across the chain. A redirect
   * throw still produces exactly one entry — duplicates would only appear if a
   * middleware swallows the signal and calls again (uncommon).
   */
  readonly navigateToCalls: readonly NuxtMiddlewareNavigateCall[];
  /**
   * Spy capture for all `abortNavigation()` invocations across the chain.
   */
  readonly abortNavigationCalls: readonly NuxtMiddlewareAbortCall[];
  /**
   * Convenience assertion — the redirect target if one was captured, else null.
   */
  readonly redirectedTo: string | null;
  /**
   * Convenience assertion — true when an abort signal was captured.
   */
  readonly aborted: boolean;
}

function normalizeMiddlewares(input: SetupNuxtMiddlewareEnvOptions['middleware']): readonly RouteMiddlewareFunction[] {
  if (Array.isArray(input)) return input;
  return [input as RouteMiddlewareFunction];
}

function withInjectedUser(to: RouteLocationInput, user: NuxtMiddlewareUserFixture | undefined): RouteLocationInput {
  if (!user || user.state === 'anonymous') return to;
  const meta = { ...(to.meta ?? {}), userSession: user };
  return { ...to, meta };
}

/**
 * Wrap a middleware (or chain) in a captured execution environment.
 *
 * Returns spy buffers + aggregated outcome. The helper never re-throws —
 * captured signals are surfaced through `outcome.redirect` / `outcome.abort`
 * and the spy buffers.
 */
export async function setupNuxtMiddlewareEnv(
  opts: SetupNuxtMiddlewareEnvOptions,
): Promise<SetupNuxtMiddlewareEnvResult> {
  const chain = normalizeMiddlewares(opts.middleware);
  const toWithUser = withInjectedUser(opts.to, opts.user);

  const navigateToCalls: NuxtMiddlewareNavigateCall[] = [];
  const abortNavigationCalls: NuxtMiddlewareAbortCall[] = [];
  const executed: number[] = [];
  const skipped: number[] = [];

  let lastResult: InvokeRouteMiddlewareResult | null = null;
  let halted = false;
  let firstRedirect: NuxtMiddlewareRedirectSignal | null = null;
  let firstAbort: NuxtMiddlewareAbortSignal | null = null;
  let firstError: unknown = undefined;

  for (let i = 0; i < chain.length; i += 1) {
    if (halted) {
      skipped.push(i);
      continue;
    }
    const original = chain[i] as RouteMiddlewareFunction;
    const wrapped: RouteMiddlewareFunction = (to, from, helpers) => {
      const spiedHelpers = {
        navigateTo(target: string, options: MiddlewareNavigateOptions = {}) {
          navigateToCalls.push({ target, options: { ...options } });
          return helpers.navigateTo(target, options);
        },
        abortNavigation(message?: string, statusCode = 404) {
          abortNavigationCalls.push({ message, statusCode });
          return helpers.abortNavigation(message, statusCode);
        },
      };
      return original(to, from, spiedHelpers);
    };
    const stepResult = await invokeRouteMiddleware({
      middleware: wrapped,
      to: toWithUser,
      ...(opts.from !== undefined ? { from: opts.from } : {}),
    });
    executed.push(i);
    lastResult = stepResult;
    if (stepResult.redirect) {
      firstRedirect = firstRedirect ?? stepResult.redirect;
      halted = true;
    }
    if (stepResult.abort) {
      firstAbort = firstAbort ?? stepResult.abort;
      halted = true;
    }
    if (stepResult.error !== undefined) {
      firstError = firstError === undefined ? stepResult.error : firstError;
      halted = true;
    }
    if (stepResult.result === false) {
      halted = true;
    }
  }

  const aggregated: InvokeRouteMiddlewareResult = {
    result: lastResult?.result,
    redirect: firstRedirect,
    abort: firstAbort,
    error: firstError,
  };

  return {
    outcome: { ...aggregated, executed, skipped },
    navigateToCalls,
    abortNavigationCalls,
    redirectedTo: firstRedirect?.to ?? null,
    aborted: firstAbort !== null,
  };
}
