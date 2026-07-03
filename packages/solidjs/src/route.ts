// SolidStart route + Suspense boundary test helper for kiwa (Issue #813, v1.19-1a).
//
// SolidStart routes are `default function Page(props: RouteSectionProps)`
// components combined with optional `route.load({ params })` data preloaders.
// Runtime `<Suspense fallback={...}>` boundaries pause rendering when a
// resource returns pending. kiwa reproduces the observable contract without
// the file-system router:
//
//   - `invokeSolidRoute({ page, load, params, query })` — runs the optional
//     loader, awaits resolved data, invokes the page component, and captures
//     redirect / not-found signals that the page throws
//   - `renderWithSuspense({ component, fallback, waitFor })` — mounts a
//     component that reads a resource, first materializes the fallback tree,
//     then re-mounts the component once the pending promise resolves
//   - `errorBoundary(component, fallback)` — wraps a component so throws in
//     the body land in the fallback instead of bubbling
//
// Out of scope on purpose:
//   - real streaming SSR + client-side hydration (see `hydrate()` in render.ts
//     for the shallow contract)
//   - nested router transitions (routes are 1 level here)
//   - `<Show>` / `<For>` control flow beyond returning virtual nodes

import { renderSolid, type SolidChild, type SolidComponent, type RenderSolidResult } from './render.js';

export const SOLID_REDIRECT_SYMBOL = Symbol.for('kiwa.solidjs.route.redirect');
export const SOLID_NOT_FOUND_SYMBOL = Symbol.for('kiwa.solidjs.route.notFound');
export const SUSPENSE_BOUNDARY_SYMBOL = Symbol.for('kiwa.solidjs.suspense.boundary');
export const ERROR_BOUNDARY_SYMBOL = Symbol.for('kiwa.solidjs.error.boundary');

export interface SolidRouteRedirectSignal {
  readonly [SOLID_REDIRECT_SYMBOL]: true;
  readonly url: string;
  readonly status: number;
}

export interface SolidRouteNotFoundSignal {
  readonly [SOLID_NOT_FOUND_SYMBOL]: true;
}

export interface SuspenseBoundarySignal<T> {
  readonly [SUSPENSE_BOUNDARY_SYMBOL]: true;
  readonly fallback: SolidChild;
  readonly resolved: SolidChild | null;
  readonly waitedFor: Promise<T>;
  readonly timedOut: boolean;
}

export interface ErrorBoundarySignal {
  readonly [ERROR_BOUNDARY_SYMBOL]: true;
  readonly caught: unknown;
  readonly fallback: SolidChild;
}

export interface RouteParams {
  readonly [key: string]: string | undefined;
}

export interface RouteQuery {
  readonly [key: string]: string | undefined;
}

export interface RouteSectionProps<TData = unknown> {
  readonly params: RouteParams;
  readonly query: RouteQuery;
  readonly data: TData | undefined;
}

export type RouteLoader<TData> = (ctx: { params: RouteParams; query: RouteQuery }) => Promise<TData> | TData;

export interface InvokeSolidRouteOptions<TData> {
  readonly page: SolidComponent<RouteSectionProps<TData>>;
  readonly load?: RouteLoader<TData>;
  readonly params?: RouteParams;
  readonly query?: RouteQuery;
}

export interface InvokeSolidRouteResult<TData> {
  readonly tree: SolidChild | null;
  readonly data: TData | undefined;
  readonly redirect: SolidRouteRedirectSignal | null;
  readonly notFound: SolidRouteNotFoundSignal | null;
  readonly error: unknown;
}

function isRedirect(value: unknown): value is SolidRouteRedirectSignal {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as { [SOLID_REDIRECT_SYMBOL]?: true })[SOLID_REDIRECT_SYMBOL] === true
  );
}

function isNotFound(value: unknown): value is SolidRouteNotFoundSignal {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as { [SOLID_NOT_FOUND_SYMBOL]?: true })[SOLID_NOT_FOUND_SYMBOL] === true
  );
}

/** Throw this from a route loader / page body to signal a redirect. */
export function redirect(url: string, status = 302): SolidRouteRedirectSignal {
  return { [SOLID_REDIRECT_SYMBOL]: true, url, status };
}

/** Throw this from a route loader / page body to signal a 404. */
export function notFound(): SolidRouteNotFoundSignal {
  return { [SOLID_NOT_FOUND_SYMBOL]: true };
}

/**
 * Run a SolidStart-shaped route: awaits the loader (if any), invokes the
 * page component with `{ params, query, data }`, and captures redirect /
 * not-found signals that either the loader or the page body throws.
 */
export async function invokeSolidRoute<TData>(
  opts: InvokeSolidRouteOptions<TData>,
): Promise<InvokeSolidRouteResult<TData>> {
  const params = opts.params ?? {};
  const query = opts.query ?? {};
  let data: TData | undefined;
  let redirectSignal: SolidRouteRedirectSignal | null = null;
  let notFoundSignal: SolidRouteNotFoundSignal | null = null;
  let error: unknown;
  let tree: SolidChild | null = null;
  try {
    if (opts.load) {
      data = await opts.load({ params, query });
    }
    const rendered = renderSolid({
      component: opts.page,
      props: { params, query, data },
    });
    tree = rendered.tree;
    rendered.dispose();
  } catch (caught) {
    if (isRedirect(caught)) redirectSignal = caught;
    else if (isNotFound(caught)) notFoundSignal = caught;
    else error = caught;
  }
  return { tree, data, redirect: redirectSignal, notFound: notFoundSignal, error };
}

export interface RenderWithSuspenseOptions<T> {
  readonly component: SolidComponent<Record<string, unknown>>;
  readonly fallback: SolidComponent<Record<string, unknown>> | SolidChild;
  readonly waitFor: Promise<T>;
  /** ms before the boundary reports `timedOut: true`; default 5000. */
  readonly timeoutMs?: number;
}

/**
 * Model a `<Suspense fallback={...}>{component}</Suspense>` boundary. First
 * mounts the fallback (matching Solid's first-render behavior when a resource
 * is still pending), awaits `waitFor`, then remounts the real component and
 * records both trees in a boundary signal.
 */
export async function renderWithSuspense<T>(
  opts: RenderWithSuspenseOptions<T>,
): Promise<SuspenseBoundarySignal<T> & { component: RenderSolidResult; fallbackResult: RenderSolidResult }> {
  const timeoutMs = opts.timeoutMs ?? 5000;
  const fallbackTree =
    typeof opts.fallback === 'function'
      ? renderSolid({ component: opts.fallback as SolidComponent<Record<string, unknown>> })
      : renderSolid({ component: () => opts.fallback as SolidChild });
  let timedOut = false;
  const timeoutPromise = new Promise<'timeout'>((resolve) => {
    const t = setTimeout(() => {
      timedOut = true;
      resolve('timeout');
    }, timeoutMs);
    // Free the timer once waitFor settles (rejected or resolved) to avoid a
    // dangling handle keeping the process alive during tests.
    opts.waitFor.then(
      () => clearTimeout(t),
      () => clearTimeout(t),
    );
  });
  const race = await Promise.race([opts.waitFor.then((v) => ({ ok: true as const, v })), timeoutPromise]);
  let resolvedTree: SolidChild | null = null;
  let componentResult: RenderSolidResult = fallbackTree;
  if (race !== 'timeout') {
    componentResult = renderSolid({ component: opts.component });
    resolvedTree = componentResult.tree;
  }
  return {
    [SUSPENSE_BOUNDARY_SYMBOL]: true,
    fallback: fallbackTree.tree,
    resolved: resolvedTree,
    waitedFor: opts.waitFor,
    timedOut,
    component: componentResult,
    fallbackResult: fallbackTree,
  };
}

export interface ErrorBoundaryOptions {
  readonly component: SolidComponent<Record<string, unknown>>;
  readonly fallback: (error: unknown) => SolidChild;
}

/**
 * Wrap a component in a Solid-shaped `<ErrorBoundary fallback={err => ...}>`
 * so a throw in the body materializes the fallback tree instead of bubbling.
 */
export function errorBoundary(opts: ErrorBoundaryOptions): SolidChild | ErrorBoundarySignal {
  try {
    return renderSolid({ component: opts.component }).tree;
  } catch (caught) {
    return {
      [ERROR_BOUNDARY_SYMBOL]: true,
      caught,
      fallback: opts.fallback(caught),
    };
  }
}

/** Type guard: recognize a Suspense boundary signal. */
export function isSuspenseBoundary(value: unknown): value is SuspenseBoundarySignal<unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as { [SUSPENSE_BOUNDARY_SYMBOL]?: true })[SUSPENSE_BOUNDARY_SYMBOL] === true
  );
}

/** Type guard: recognize an ErrorBoundary signal. */
export function isErrorBoundary(value: unknown): value is ErrorBoundarySignal {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as { [ERROR_BOUNDARY_SYMBOL]?: true })[ERROR_BOUNDARY_SYMBOL] === true
  );
}
