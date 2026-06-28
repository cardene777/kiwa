// Next.js Server Action invocation helper for kiwa tests.
//
// Wraps an `'use server'` async function and captures Next.js side-effects
// (redirect / revalidatePath / cookies set) without requiring a real Next.js
// runtime. The test calls `invokeServerAction({ action, formData, ... })`
// and asserts on the returned `ServerActionResult` instead of relying on
// integration-level behavior.
//
// Out of scope on purpose:
//   - real `next/server` middleware semantics (use #495 helper instead)
//   - RSC payload format (use #494 helper instead)
//   - rendering a page after the action (use Playwright + `/kiwa-e2e` for that)

export const REDIRECT_SYMBOL = Symbol.for('kiwa.next.redirect');

export interface RedirectSignal {
  readonly [REDIRECT_SYMBOL]: true;
  readonly url: string;
  readonly type: 'replace' | 'push';
}

export interface CookieJar {
  get(name: string): string | undefined;
  set(name: string, value: string, options?: Record<string, unknown>): void;
  delete(name: string): void;
  entries(): Array<[string, string]>;
}

export interface ServerActionEnv {
  readonly cookies: CookieJar;
  readonly headers: Map<string, string>;
  readonly revalidated: { paths: string[]; tags: string[] };
  readonly redirect: RedirectSignal | null;
}

// We deliberately accept `any[]` here so callers can pass typed actions like
// `(fd: FormData) => Promise<T>` or `(prev: State, fd: FormData) => Promise<T>`
// without contortions. The runtime always invokes `action(formData, ...args)`.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ServerActionFunction<TResult> = (...args: any[]) => Promise<TResult> | TResult;

export interface ServerActionInvocation<TResult> {
  /** The `'use server'` async function under test. */
  readonly action: ServerActionFunction<TResult>;
  /** Optional FormData first argument (default empty). */
  readonly formData?: FormData;
  /** Extra positional args appended after FormData (e.g. previous state for useFormState). */
  readonly args?: unknown[];
  /** Initial cookie jar entries (name → value). */
  readonly cookies?: Record<string, string>;
  /** Initial request headers (case-insensitive). */
  readonly headers?: Record<string, string>;
}

export interface ServerActionResult<TResult> {
  /** Resolved return value (or `undefined` if the action threw a redirect signal). */
  readonly result: TResult | undefined;
  /** Error thrown by the action (excluding redirect signals which are normalized). */
  readonly error: unknown;
  /** Side-effects captured during the invocation. */
  readonly env: ServerActionEnv;
}

function createCookieJar(initial: Record<string, string>): CookieJar {
  const store = new Map<string, string>(Object.entries(initial));
  return {
    get(name) {
      return store.get(name);
    },
    set(name, value) {
      store.set(name, value);
    },
    delete(name) {
      store.delete(name);
    },
    entries() {
      return Array.from(store.entries());
    },
  };
}

function isRedirectSignal(value: unknown): value is RedirectSignal {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as { [REDIRECT_SYMBOL]?: true })[REDIRECT_SYMBOL] === true
  );
}

/**
 * Invoke a Next.js Server Action in isolation and capture its side-effects.
 *
 * The action is called as `await action(formData, ...args)`. The kiwa helper
 * does NOT monkey-patch global `next/navigation` / `next/headers` / `next/cache`
 * imports. Instead the action under test should accept its dependencies via
 * an injectable seam (a parameter or a module-level setter) so tests stay
 * deterministic. See `examples/nextjs-server-actions-poc/` for the pattern.
 */
export async function invokeServerAction<TResult>(
  opts: ServerActionInvocation<TResult>,
): Promise<ServerActionResult<TResult>> {
  const headers = new Map<string, string>();
  for (const [name, value] of Object.entries(opts.headers ?? {})) {
    headers.set(name.toLowerCase(), value);
  }
  const env: ServerActionEnv = {
    cookies: createCookieJar(opts.cookies ?? {}),
    headers,
    revalidated: { paths: [], tags: [] },
    redirect: null,
  };
  const callArgs: unknown[] = [opts.formData ?? new FormData(), ...(opts.args ?? [])];
  let result: TResult | undefined;
  let error: unknown;
  try {
    result = await opts.action(...callArgs);
  } catch (caught) {
    if (isRedirectSignal(caught)) {
      (env as { redirect: RedirectSignal | null }).redirect = caught;
    } else {
      error = caught;
    }
  }
  return { result, error, env };
}
