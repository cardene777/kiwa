// Edge runtime fetch handler test helper for kiwa (Issue #522).
//
// Cloudflare Workers / Vercel Edge / generic ESM-style handlers expose a
// `fetch(request, env, ctx)` entry point. kiwa provides a simulated env
// (binding bag: KV namespaces, R2 buckets, D1 databases, vars) + an
// ExecutionContext stub that captures `waitUntil` / `passThroughOnException`
// calls so tests can assert on background promises without real Workers
// scheduler.

import type { KVNamespace } from './kv-mock.js';

export interface SimulatedExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
  readonly waitedPromises: Promise<unknown>[];
  passThroughCalled: boolean;
}

export interface EdgeEnvBindings {
  readonly [bindingName: string]: KVNamespace | Record<string, unknown> | string | undefined;
}

export type EdgeFetchHandler<TEnv extends EdgeEnvBindings = EdgeEnvBindings> = (
  request: Request,
  env: TEnv,
  ctx: SimulatedExecutionContext,
) => Promise<Response> | Response;

export interface InvokeEdgeHandlerOptions<TEnv extends EdgeEnvBindings = EdgeEnvBindings> {
  readonly handler: EdgeFetchHandler<TEnv>;
  readonly url: string;
  readonly method?: string;
  readonly headers?: Record<string, string>;
  readonly formData?: Record<string, string>;
  readonly jsonBody?: unknown;
  readonly env: TEnv;
}

export interface InvokeEdgeHandlerResult {
  readonly response: Response;
  readonly redirect: { url: string; status: number } | null;
  readonly ctx: SimulatedExecutionContext;
  readonly error: unknown;
}

function buildRequest(opts: {
  readonly url: string;
  readonly method?: string;
  readonly headers?: Record<string, string>;
  readonly formData?: Record<string, string>;
  readonly jsonBody?: unknown;
}): Request {
  const headers = new Headers();
  for (const [name, value] of Object.entries(opts.headers ?? {})) {
    headers.set(name, value);
  }
  let body: BodyInit | null = null;
  if (typeof opts.formData !== 'undefined') {
    const fd = new FormData();
    for (const [name, value] of Object.entries(opts.formData)) {
      fd.set(name, value);
    }
    body = fd;
  } else if (typeof opts.jsonBody !== 'undefined') {
    body = JSON.stringify(opts.jsonBody);
    if (!headers.has('content-type')) headers.set('content-type', 'application/json');
  }
  const method = opts.method ?? (body === null ? 'GET' : 'POST');
  return new Request(opts.url, body === null ? { method, headers } : { method, headers, body });
}

function createCtx(): SimulatedExecutionContext {
  const waitedPromises: Promise<unknown>[] = [];
  const ctx: SimulatedExecutionContext = {
    waitedPromises,
    passThroughCalled: false,
    waitUntil(promise) {
      waitedPromises.push(promise);
    },
    passThroughOnException() {
      ctx.passThroughCalled = true;
    },
  };
  return ctx;
}

/**
 * Invoke an edge runtime fetch handler in isolation and capture the returned
 * Response + ExecutionContext side effects. The caller supplies `env` so KV /
 * R2 / vars stay explicit in each test (no global state).
 */
export async function invokeEdgeHandler<TEnv extends EdgeEnvBindings = EdgeEnvBindings>(
  opts: InvokeEdgeHandlerOptions<TEnv>,
): Promise<InvokeEdgeHandlerResult> {
  const reqOpts: {
    readonly url: string;
    readonly method?: string;
    readonly headers?: Record<string, string>;
    readonly formData?: Record<string, string>;
    readonly jsonBody?: unknown;
  } = {
    url: opts.url,
    ...(typeof opts.method !== 'undefined' ? { method: opts.method } : {}),
    ...(typeof opts.headers !== 'undefined' ? { headers: opts.headers } : {}),
    ...(typeof opts.formData !== 'undefined' ? { formData: opts.formData } : {}),
    ...(typeof opts.jsonBody !== 'undefined' ? { jsonBody: opts.jsonBody } : {}),
  };
  const request = buildRequest(reqOpts);
  const ctx = createCtx();
  let response: Response;
  let redirect: { url: string; status: number } | null = null;
  let error: unknown;
  try {
    response = await opts.handler(request, opts.env, ctx);
    if (response.status >= 300 && response.status < 400) {
      redirect = {
        url: response.headers.get('location') ?? '',
        status: response.status,
      };
    }
  } catch (caught) {
    response = new Response(null, { status: 500 });
    error = caught;
  }
  return { response, redirect, ctx, error };
}
