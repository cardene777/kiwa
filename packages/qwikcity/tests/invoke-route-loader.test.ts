import { describe, expect, it } from 'vitest';
import {
  invokeRouteLoader,
  type RouteLoaderFunction,
} from '../src/invoke-route-loader.js';
import { QWIK_REDIRECT_SYMBOL } from '../src/invoke-route-action.js';

describe('invokeRouteLoader', () => {
  it('T-QL-001 正常系: loader returns data', async () => {
    const loader: RouteLoaderFunction<{ id: string }, { id: string; name: string }> = async ({ params }) => ({
      id: params.id,
      name: 'kiwa',
    });
    const { data, redirect, error } = await invokeRouteLoader({
      loader,
      url: 'http://localhost:5173/users/42',
      params: { id: '42' },
    });
    expect(error).toBeUndefined();
    expect(redirect).toBeNull();
    expect(data).toEqual({ id: '42', name: 'kiwa' });
  });

  it('T-QL-002 query searchParams accessible', async () => {
    let q: string | null = null;
    const loader: RouteLoaderFunction = async ({ query }) => {
      q = query.get('q');
      return {};
    };
    await invokeRouteLoader({ loader, url: 'http://localhost:5173/search?q=qwik' });
    expect(q).toBe('qwik');
  });

  it('T-QL-003 cookie.get returns { value } shape', async () => {
    let session: { value: string } | null = null;
    const loader: RouteLoaderFunction = async ({ cookie }) => {
      session = cookie.get('session');
      return {};
    };
    await invokeRouteLoader({
      loader,
      url: 'http://localhost:5173/',
      cookies: { session: 'sid_42' },
    });
    expect(session).toEqual({ value: 'sid_42' });
  });

  it('T-QL-004 cookie.get returns null for missing', async () => {
    let missing: unknown;
    const loader: RouteLoaderFunction = async ({ cookie }) => {
      missing = cookie.get('nope');
      return {};
    };
    await invokeRouteLoader({ loader, url: 'http://localhost:5173/' });
    expect(missing).toBeNull();
  });

  it('T-QL-005 redirect throw via event.redirect → captured into result.redirect', async () => {
    const loader: RouteLoaderFunction = async ({ cookie, redirect }) => {
      if (!cookie.get('session')) redirect(303, '/login');
      return {};
    };
    const { redirect: r } = await invokeRouteLoader({
      loader,
      url: 'http://localhost:5173/dashboard',
    });
    expect(r?.[QWIK_REDIRECT_SYMBOL]).toBe(true);
    expect(r?.status).toBe(303);
    expect(r?.location).toBe('/login');
  });

  it('T-QL-006 platform passes through verbatim', async () => {
    let p: unknown;
    const loader: RouteLoaderFunction = async ({ platform }) => {
      p = platform;
      return {};
    };
    await invokeRouteLoader({
      loader,
      url: 'http://localhost:5173/',
      platform: { env: { DATABASE_URL: 'postgres://...' } },
    });
    expect(p).toEqual({ env: { DATABASE_URL: 'postgres://...' } });
  });

  it('T-QL-007 headers normalized to lowercase', async () => {
    let auth: string | undefined;
    const loader: RouteLoaderFunction = async ({ headers }) => {
      auth = headers.get('authorization');
      return {};
    };
    await invokeRouteLoader({
      loader,
      url: 'http://localhost:5173/',
      headers: { Authorization: 'Bearer tok' },
    });
    expect(auth).toBe('Bearer tok');
  });

  it('T-QL-008 異常系: non-redirect throw becomes raw error', async () => {
    const loader: RouteLoaderFunction = async () => {
      throw new Error('db down');
    };
    const { error } = await invokeRouteLoader({ loader, url: 'http://localhost:5173/' });
    expect((error as Error).message).toBe('db down');
  });
});
