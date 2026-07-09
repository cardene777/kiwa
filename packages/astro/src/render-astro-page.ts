// Astro `.astro` page SSR test helper for kiwa (Issue #523).
//
// Astro's official Container API (`experimental_AstroContainer`) is heavy and
// requires the `astro` runtime + adapter wiring. kiwa takes a lighter
// approach: treat the `.astro` page as an async function that receives a
// simulated context (params / props / request / locals / cookies) and
// returns either an HTML string, a Response, or a structured token tree the
// caller pre-shapes. The helper captures the rendered HTML, response status,
// and any thrown redirect / Astro.notFound() signal so callers can assert
// SSR behavior without booting Astro.
//
// Out of scope on purpose:
//   - Astro Islands hydration (client:* directives) → use `@kiwa-lab/ui` Vue/React/Svelte adapters
//   - View transitions / streaming SSR
//   - Astro Container API direct use (still recommended for HTML-perfect snapshot tests)

export const ASTRO_REDIRECT_SYMBOL = Symbol.for('kiwa.astro.page.redirect');
export const ASTRO_NOT_FOUND_SYMBOL = Symbol.for('kiwa.astro.page.notFound');
export const ASTRO_REWRITE_SYMBOL = Symbol.for('kiwa.astro.page.rewrite');

export interface AstroRedirectSignal {
  readonly [ASTRO_REDIRECT_SYMBOL]: true;
  readonly url: string;
  readonly status: number;
}

export interface AstroNotFoundSignal {
  readonly [ASTRO_NOT_FOUND_SYMBOL]: true;
  readonly response: Response | undefined;
}

export interface AstroRewriteSignal {
  readonly [ASTRO_REWRITE_SYMBOL]: true;
  readonly target: string | URL | Request;
}

export type AstroSignal = AstroRedirectSignal | AstroNotFoundSignal | AstroRewriteSignal;

export interface SimulatedAstroContext<
  TProps extends Record<string, unknown> = Record<string, unknown>,
  TParams extends Record<string, string | undefined> = Record<string, string | undefined>,
  TLocals extends Record<string, unknown> = Record<string, unknown>,
> {
  readonly request: Request;
  readonly url: URL;
  readonly params: TParams;
  readonly props: TProps;
  readonly site: URL | undefined;
  readonly generator: string;
  readonly locals: TLocals;
  readonly cookies: {
    get(name: string): { value: string } | undefined;
    set(name: string, value: string, options?: Record<string, unknown>): void;
    delete(name: string, options?: Record<string, unknown>): void;
    has(name: string): boolean;
  };
  redirect(path: string, status?: number): never;
  rewrite(target: string | URL | Request): never;
}

export type AstroPageComponent<
  TProps extends Record<string, unknown> = Record<string, unknown>,
  TParams extends Record<string, string | undefined> = Record<string, string | undefined>,
  TLocals extends Record<string, unknown> = Record<string, unknown>,
> = (
  context: SimulatedAstroContext<TProps, TParams, TLocals>,
) => Promise<string | Response> | string | Response;

export interface RenderAstroPageOptions<
  TProps extends Record<string, unknown> = Record<string, unknown>,
  TParams extends Record<string, string | undefined> = Record<string, string | undefined>,
  TLocals extends Record<string, unknown> = Record<string, unknown>,
> {
  readonly page: AstroPageComponent<TProps, TParams, TLocals>;
  readonly url: string;
  readonly method?: string;
  readonly headers?: Record<string, string>;
  readonly cookies?: Record<string, string>;
  readonly params?: TParams;
  readonly props?: TProps;
  readonly locals?: TLocals;
  readonly site?: string;
  readonly generator?: string;
}

export interface RenderAstroPageResult {
  readonly html: string;
  readonly response: Response;
  readonly redirect: AstroRedirectSignal | null;
  readonly notFound: AstroNotFoundSignal | null;
  readonly rewrite: AstroRewriteSignal | null;
  readonly error: unknown;
}

function isRedirect(value: unknown): value is AstroRedirectSignal {
  return typeof value === 'object' && value !== null && (value as { [ASTRO_REDIRECT_SYMBOL]?: true })[ASTRO_REDIRECT_SYMBOL] === true;
}
function isNotFound(value: unknown): value is AstroNotFoundSignal {
  return typeof value === 'object' && value !== null && (value as { [ASTRO_NOT_FOUND_SYMBOL]?: true })[ASTRO_NOT_FOUND_SYMBOL] === true;
}
function isRewrite(value: unknown): value is AstroRewriteSignal {
  return typeof value === 'object' && value !== null && (value as { [ASTRO_REWRITE_SYMBOL]?: true })[ASTRO_REWRITE_SYMBOL] === true;
}

function buildCookieJar(initial: Record<string, string>): SimulatedAstroContext['cookies'] {
  const store = new Map<string, string>(Object.entries(initial));
  return {
    get(name) {
      const value = store.get(name);
      return typeof value === 'undefined' ? undefined : { value };
    },
    set(name, value) {
      store.set(name, value);
    },
    delete(name) {
      store.delete(name);
    },
    has(name) {
      return store.has(name);
    },
  };
}

/**
 * Render a `.astro` page in isolation and capture HTML / Response / redirect /
 * notFound / rewrite signals. The page receives a synthetic AstroContext with
 * the same shape as the real `Astro` global.
 */
export async function renderAstroPage<
  TProps extends Record<string, unknown> = Record<string, unknown>,
  TParams extends Record<string, string | undefined> = Record<string, string | undefined>,
  TLocals extends Record<string, unknown> = Record<string, unknown>,
>(
  opts: RenderAstroPageOptions<TProps, TParams, TLocals>,
): Promise<RenderAstroPageResult> {
  const headers = new Headers();
  for (const [name, value] of Object.entries(opts.headers ?? {})) headers.set(name, value);
  const request = new Request(opts.url, { method: opts.method ?? 'GET', headers });
  const context: SimulatedAstroContext<TProps, TParams, TLocals> = {
    request,
    url: new URL(opts.url),
    params: (opts.params ?? ({} as TParams)),
    props: (opts.props ?? ({} as TProps)),
    site: typeof opts.site !== 'undefined' ? new URL(opts.site) : undefined,
    generator: opts.generator ?? 'Astro v4 (kiwa simulated)',
    locals: (opts.locals ?? ({} as TLocals)),
    cookies: buildCookieJar(opts.cookies ?? {}),
    redirect(path, status = 302): never {
      const signal: AstroRedirectSignal = { [ASTRO_REDIRECT_SYMBOL]: true, url: path, status };
      throw signal;
    },
    rewrite(target): never {
      const signal: AstroRewriteSignal = { [ASTRO_REWRITE_SYMBOL]: true, target };
      throw signal;
    },
  };
  let html = '';
  let response: Response = new Response(null, { status: 200 });
  let redirect: AstroRedirectSignal | null = null;
  let notFound: AstroNotFoundSignal | null = null;
  let rewrite: AstroRewriteSignal | null = null;
  let error: unknown;
  try {
    const output = await opts.page(context);
    if (output instanceof Response) {
      response = output;
      html = await output.clone().text();
    } else {
      html = output;
      response = new Response(html, {
        status: 200,
        headers: { 'content-type': 'text/html; charset=utf-8' },
      });
    }
  } catch (caught) {
    if (isRedirect(caught)) {
      redirect = caught;
      response = new Response(null, { status: caught.status, headers: { location: caught.url } });
    } else if (isNotFound(caught)) {
      notFound = caught;
      response = caught.response ?? new Response(null, { status: 404 });
    } else if (isRewrite(caught)) {
      rewrite = caught;
      response = new Response(null, { status: 200 });
    } else {
      error = caught;
      response = new Response(null, { status: 500 });
    }
  }
  return { html, response, redirect, notFound, rewrite, error };
}

/**
 * Construct a notFound signal the same way `Astro.notFound(response?)` does
 * in production. Pages can `throw Astro.notFound()` to short-circuit; in
 * kiwa tests the page can `throw kiwaAstroNotFound()` to be captured.
 */
export function kiwaAstroNotFound(response?: Response): AstroNotFoundSignal {
  return { [ASTRO_NOT_FOUND_SYMBOL]: true, response };
}
