import { describe, expect, it } from 'vitest';
import {
  invokeRouteMiddleware,
  NUXT_MIDDLEWARE_REDIRECT_SYMBOL,
  NUXT_MIDDLEWARE_ABORT_SYMBOL,
} from '../src/invoke-route-middleware.js';

describe('invokeRouteMiddleware', () => {
  it('T-NRM-001: returns undefined for pass-through middleware', async () => {
    const result = await invokeRouteMiddleware({
      middleware: () => undefined,
      to: { path: '/profile' },
    });
    expect(result.result).toBeUndefined();
    expect(result.redirect).toBeNull();
    expect(result.abort).toBeNull();
    expect(result.error).toBeUndefined();
  });

  it('T-NRM-002: captures navigateTo as redirect signal', async () => {
    const result = await invokeRouteMiddleware({
      middleware: (_to, _from, { navigateTo }) => {
        navigateTo('/login');
      },
      to: { path: '/dashboard' },
    });
    expect(result.redirect?.to).toBe('/login');
    expect(result.redirect?.status).toBe(302);
    expect(result.redirect?.external).toBe(false);
    expect(result.redirect?.[NUXT_MIDDLEWARE_REDIRECT_SYMBOL]).toBe(true);
  });

  it('T-NRM-003: navigateTo options propagate (external + replace + redirectCode)', async () => {
    const result = await invokeRouteMiddleware({
      middleware: (_to, _from, { navigateTo }) => {
        navigateTo('https://example.com/sso', { external: true, replace: true, redirectCode: 301 });
      },
      to: { path: '/old' },
    });
    expect(result.redirect?.to).toBe('https://example.com/sso');
    expect(result.redirect?.external).toBe(true);
    expect(result.redirect?.replace).toBe(true);
    expect(result.redirect?.status).toBe(301);
  });

  it('T-NRM-004: captures abortNavigation as abort signal with default 404', async () => {
    const result = await invokeRouteMiddleware({
      middleware: (_to, _from, { abortNavigation }) => {
        abortNavigation('not allowed');
      },
      to: { path: '/admin' },
    });
    expect(result.abort?.message).toBe('not allowed');
    expect(result.abort?.statusCode).toBe(404);
    expect(result.abort?.[NUXT_MIDDLEWARE_ABORT_SYMBOL]).toBe(true);
  });

  it('T-NRM-005: abortNavigation custom statusCode propagates', async () => {
    const result = await invokeRouteMiddleware({
      middleware: (_to, _from, { abortNavigation }) => {
        abortNavigation('forbidden', 403);
      },
      to: { path: '/admin' },
    });
    expect(result.abort?.statusCode).toBe(403);
  });

  it('T-NRM-006: middleware can read to.params + to.query + to.meta', async () => {
    let id: string | undefined;
    let locale: string | string[] | undefined;
    let requiresAuth: unknown;
    const result = await invokeRouteMiddleware({
      middleware: (to) => {
        id = to.params.id;
        locale = to.query.locale;
        requiresAuth = to.meta.requiresAuth;
      },
      to: {
        path: '/items/42',
        params: { id: '42' },
        query: { locale: 'ja' },
        meta: { requiresAuth: true },
      },
    });
    expect(result.error).toBeUndefined();
    expect(id).toBe('42');
    expect(locale).toBe('ja');
    expect(requiresAuth).toBe(true);
  });

  it('T-NRM-007: from defaults to / when not provided', async () => {
    let fromPath = '';
    await invokeRouteMiddleware({
      middleware: (_to, from) => {
        fromPath = from.path;
      },
      to: { path: '/x' },
    });
    expect(fromPath).toBe('/');
  });

  it('T-NRM-008: fullPath built from path + query + hash', async () => {
    let fullPath = '';
    await invokeRouteMiddleware({
      middleware: (to) => {
        fullPath = to.fullPath;
      },
      to: { path: '/search', query: { q: 'kiwa' }, hash: '#results' },
    });
    expect(fullPath).toBe('/search?q=kiwa#results');
  });

  it('T-NRM-009: array query values serialized as repeated keys', async () => {
    let fullPath = '';
    await invokeRouteMiddleware({
      middleware: (to) => {
        fullPath = to.fullPath;
      },
      to: { path: '/items', query: { tag: ['a', 'b'] } },
    });
    expect(fullPath).toBe('/items?tag=a&tag=b');
  });

  it('T-NRM-010: non-signal throw surfaces in error', async () => {
    const result = await invokeRouteMiddleware({
      middleware: () => {
        throw new Error('boom');
      },
      to: { path: '/x' },
    });
    expect((result.error as Error).message).toBe('boom');
    expect(result.redirect).toBeNull();
    expect(result.abort).toBeNull();
  });

  it('T-NRM-011: returned string (Nuxt navigate short-form) captured as result', async () => {
    const result = await invokeRouteMiddleware({
      middleware: () => '/login',
      to: { path: '/dashboard' },
    });
    expect(result.result).toBe('/login');
    expect(result.redirect).toBeNull();
  });

  it('T-NRM-012: returned false (silent abort) captured as result', async () => {
    const result = await invokeRouteMiddleware({
      middleware: () => false,
      to: { path: '/x' },
    });
    expect(result.result).toBe(false);
  });

  it('T-NRM-013: async middleware awaited correctly', async () => {
    const result = await invokeRouteMiddleware({
      middleware: async (_to, _from, { navigateTo }) => {
        await Promise.resolve();
        navigateTo('/async-target');
      },
      to: { path: '/x' },
    });
    expect(result.redirect?.to).toBe('/async-target');
  });

  it('T-NRM-014: to.name + to.hash propagated', async () => {
    let name: string | undefined;
    let hash = '';
    await invokeRouteMiddleware({
      middleware: (to) => {
        name = to.name;
        hash = to.hash;
      },
      to: { path: '/profile', name: 'profile', hash: '#bio' },
    });
    expect(name).toBe('profile');
    expect(hash).toBe('#bio');
  });

  it('T-NRM-015: returning a redirect signal directly is also captured', async () => {
    const result = await invokeRouteMiddleware({
      middleware: (_to, _from, { navigateTo }) => {
        try {
          navigateTo('/foo');
        } catch (signal) {
          return signal as ReturnType<typeof navigateTo>;
        }
        return undefined;
      },
      to: { path: '/x' },
    });
    expect(result.redirect?.to).toBe('/foo');
  });
});
