import { describe, expect, it } from 'vitest';
import {
  invokeHandle,
  invokeHandleFetch,
  invokeHandleError,
  type HandleFunction,
  type HandleFetchFunction,
  type HandleErrorFunction,
} from '../src/invoke-hooks.js';

describe('invokeHandle', () => {
  it('T-SKH-001 正常系: handle calls resolve() and returns its Response', async () => {
    const handle: HandleFunction = async ({ event, resolve }) => resolve(event);
    const { response, resolveCalled, error } = await invokeHandle({
      handle,
      url: 'http://localhost:5173/foo',
    });
    expect(error).toBeUndefined();
    expect(resolveCalled).toBe(true);
    expect(response.status).toBe(200);
    expect(await response.text()).toBe('ok');
  });

  it('T-SKH-002 handle bypasses resolve: short-circuit with custom Response', async () => {
    const handle: HandleFunction = async () => new Response('blocked', { status: 403 });
    const { response, resolveCalled } = await invokeHandle({
      handle,
      url: 'http://localhost:5173/admin',
    });
    expect(resolveCalled).toBe(false);
    expect(response.status).toBe(403);
    expect(await response.text()).toBe('blocked');
  });

  it('T-SKH-003 handle writes to event.locals → captured at resolve time', async () => {
    const handle: HandleFunction<{ user?: { id: number } }> = async ({ event, resolve }) => {
      event.locals.user = { id: 42 };
      return resolve(event);
    };
    const { localsAtResolve, resolveCalled } = await invokeHandle<{ user?: { id: number } }>({
      handle,
      url: 'http://localhost:5173/',
    });
    expect(resolveCalled).toBe(true);
    expect(localsAtResolve?.user).toEqual({ id: 42 });
  });

  it('T-SKH-004 custom resolveResponse function: build per-event response', async () => {
    const handle: HandleFunction = async ({ event, resolve }) => resolve(event);
    const { response } = await invokeHandle({
      handle,
      url: 'http://localhost:5173/profile',
      resolveResponse: (event) => new Response(`url=${event.url.pathname}`, { status: 201 }),
    });
    expect(response.status).toBe(201);
    expect(await response.text()).toBe('url=/profile');
  });

  it('T-SKH-005 cookies seed accessible via event.cookies.get inside handle', async () => {
    let session: string | undefined;
    const handle: HandleFunction = async ({ event, resolve }) => {
      session = event.cookies.get('session');
      return resolve(event);
    };
    await invokeHandle({
      handle,
      url: 'http://localhost:5173/',
      cookies: { session: 'sid_42' },
    });
    expect(session).toBe('sid_42');
  });

  it('T-SKH-006 cookies write captured into env.cookies', async () => {
    const handle: HandleFunction = async ({ event, resolve }) => {
      event.cookies.set('telemetry', 'tid_1');
      event.cookies.delete('stale');
      return resolve(event);
    };
    const { env } = await invokeHandle({
      handle,
      url: 'http://localhost:5173/',
      cookies: { stale: 'old' },
    });
    expect(env.cookies.get('telemetry')).toBe('tid_1');
    expect(env.cookies.get('stale')).toBeUndefined();
  });

  it('T-SKH-007 異常系: handle throw → error captured + 500 default', async () => {
    const handle: HandleFunction = async () => {
      throw new Error('handle crash');
    };
    const { response, error } = await invokeHandle({
      handle,
      url: 'http://localhost:5173/',
    });
    expect((error as Error).message).toBe('handle crash');
    expect(response.status).toBe(500);
  });

  it('T-SKH-008 route.id, platform, params accessible inside handle', async () => {
    let routeId: string | null = 'unset';
    let plat: Record<string, unknown> | undefined;
    let params: Record<string, string> = {};
    const handle: HandleFunction = async ({ event, resolve }) => {
      routeId = event.route.id;
      plat = event.platform;
      params = { ...event.params };
      return resolve(event);
    };
    await invokeHandle({
      handle,
      url: 'http://localhost:5173/posts/kiwa',
      routeId: '/posts/[slug]',
      params: { slug: 'kiwa' },
      platform: { env: { DB: 'postgres' } },
    });
    expect(routeId).toBe('/posts/[slug]');
    expect(plat).toEqual({ env: { DB: 'postgres' } });
    expect(params).toEqual({ slug: 'kiwa' });
  });

  it('T-SKH-009 explicit Response object as resolveResponse', async () => {
    const handle: HandleFunction = async ({ event, resolve }) => resolve(event);
    const fixed = new Response('fixed', { status: 202 });
    const { response } = await invokeHandle({
      handle,
      url: 'http://localhost:5173/',
      resolveResponse: fixed,
    });
    expect(await response.text()).toBe('fixed');
    expect(response.status).toBe(202);
  });
});

describe('invokeHandleFetch', () => {
  it('T-SKHF-001 正常系: handleFetch passes through to fake fetch', async () => {
    const handleFetch: HandleFetchFunction = async ({ request, fetch }) => fetch(request);
    const { response, downstreamCalled, downstreamRequest } = await invokeHandleFetch({
      handleFetch,
      eventUrl: 'http://localhost:5173/foo',
      fetchUrl: 'https://api.example.com/data',
    });
    expect(downstreamCalled).toBe(true);
    expect(downstreamRequest?.url).toBe('https://api.example.com/data');
    expect(await response.text()).toBe('downstream-ok');
  });

  it('T-SKHF-002 handleFetch rewrites the outgoing URL', async () => {
    const handleFetch: HandleFetchFunction = async ({ fetch }) =>
      fetch(new Request('https://internal.example.com/data'));
    const { downstreamRequest } = await invokeHandleFetch({
      handleFetch,
      eventUrl: 'http://localhost:5173/',
      fetchUrl: 'https://public.example.com/data',
    });
    expect(downstreamRequest?.url).toBe('https://internal.example.com/data');
  });

  it('T-SKHF-003 custom downstreamFetch: assert on body / status', async () => {
    const handleFetch: HandleFetchFunction = async ({ request, fetch }) => fetch(request);
    const { response } = await invokeHandleFetch({
      handleFetch,
      eventUrl: 'http://localhost:5173/',
      fetchUrl: 'https://api.example.com/users/1',
      downstreamFetch: async () =>
        new Response(JSON.stringify({ id: 1, name: 'Alice' }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
    });
    expect(await response.json()).toEqual({ id: 1, name: 'Alice' });
  });

  it('T-SKHF-004 異常系: handleFetch throw captured into result.error', async () => {
    const handleFetch: HandleFetchFunction = async () => {
      throw new Error('upstream down');
    };
    const { error, response } = await invokeHandleFetch({
      handleFetch,
      eventUrl: 'http://localhost:5173/',
      fetchUrl: 'https://api.example.com/x',
    });
    expect((error as Error).message).toBe('upstream down');
    expect(response.status).toBe(500);
  });
});

describe('invokeHandleError', () => {
  it('T-SKHE-001 正常系: handleError returns { message } shape', async () => {
    const handleError: HandleErrorFunction = ({ error, status }) => ({
      message: `${status}: ${(error as Error).message}`,
    });
    const { report } = await invokeHandleError({
      handleError,
      error: new Error('boom'),
      url: 'http://localhost:5173/',
      status: 500,
      message: 'Internal Server Error',
    });
    expect(report).toEqual({ message: '500: boom' });
  });

  it('T-SKHE-002 handleError can be a void-returning logger', async () => {
    let logged: { error: unknown; status: number } | null = null;
    const handleError: HandleErrorFunction = ({ error, status }) => {
      logged = { error, status };
    };
    const { report } = await invokeHandleError({
      handleError,
      error: new Error('logged'),
      url: 'http://localhost:5173/',
      status: 500,
      message: 'Internal Server Error',
    });
    expect(report).toBeUndefined();
    expect((logged as { error: unknown; status: number } | null)?.status).toBe(500);
  });

  it('T-SKHE-003 異常系: handleError throw captured into result.thrown', async () => {
    const handleError: HandleErrorFunction = () => {
      throw new Error('logger crashed');
    };
    const { thrown, report } = await invokeHandleError({
      handleError,
      error: new Error('original'),
      url: 'http://localhost:5173/',
      status: 500,
      message: 'Internal Server Error',
    });
    expect(report).toBeUndefined();
    expect((thrown as Error).message).toBe('logger crashed');
  });

  it('T-SKHE-004 handleError accesses event.url + locals', async () => {
    let captured: { path: string; locals: unknown } | null = null;
    const handleError: HandleErrorFunction<{ requestId?: string }> = ({ event }) => {
      captured = { path: event.url.pathname, locals: event.locals };
    };
    await invokeHandleError<{ requestId?: string }>({
      handleError,
      error: new Error('x'),
      url: 'http://localhost:5173/items/42',
      status: 500,
      message: 'Internal Server Error',
      locals: { requestId: 'req_99' },
    });
    expect(captured).not.toBeNull();
    expect((captured as { path: string; locals: { requestId?: string } } | null)?.path).toBe('/items/42');
    expect((captured as { path: string; locals: { requestId?: string } } | null)?.locals.requestId).toBe('req_99');
  });
});
