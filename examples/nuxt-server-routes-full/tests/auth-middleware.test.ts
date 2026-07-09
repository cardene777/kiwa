// kiwa unit test for middleware/_kiwa/auth-middleware.ts
// — invokes the pure middleware through @kiwa-lab/nuxt's invokeRouteMiddleware.
// navigateTo / abortNavigation の throw を branded signal として全捕捉、 実 Nuxt router 不要。

import { describe, expect, it } from 'vitest';
import {
  invokeRouteMiddleware,
  NUXT_MIDDLEWARE_REDIRECT_SYMBOL,
  NUXT_MIDDLEWARE_ABORT_SYMBOL,
} from '@kiwa-lab/nuxt';
import { authMiddleware } from '../middleware/_kiwa/auth-middleware.js';

describe('authMiddleware via @kiwa-lab/nuxt invokeRouteMiddleware', () => {
  it('T-NF-101: requiresAuth=false の route は素通り (redirect / abort なし)', async () => {
    const result = await invokeRouteMiddleware({
      middleware: authMiddleware,
      to: { path: '/public', meta: { requiresAuth: false } },
    });
    expect(result.redirect).toBeNull();
    expect(result.abort).toBeNull();
    expect(result.error).toBeUndefined();
  });

  it('T-NF-102: requiresAuth=true + session なしは /login へ redirect', async () => {
    const result = await invokeRouteMiddleware({
      middleware: authMiddleware,
      to: { path: '/dashboard', meta: { requiresAuth: true } },
    });
    expect(result.redirect?.to).toBe('/login');
    expect(result.redirect?.status).toBe(302);
    expect(result.redirect?.external).toBe(false);
    expect(result.redirect?.[NUXT_MIDDLEWARE_REDIRECT_SYMBOL]).toBe(true);
  });

  it('T-NF-103: requiresAuth=true + session ありは素通り', async () => {
    const result = await invokeRouteMiddleware({
      middleware: authMiddleware,
      to: {
        path: '/dashboard',
        meta: {
          requiresAuth: true,
          userSession: { userId: 'u-1', role: 'user' },
        },
      },
    });
    expect(result.redirect).toBeNull();
    expect(result.abort).toBeNull();
  });

  it('T-NF-104: external=true + session なしは SSO へ external 301 redirect', async () => {
    const result = await invokeRouteMiddleware({
      middleware: authMiddleware,
      to: {
        path: '/dashboard',
        query: { external: 'true' },
        meta: { requiresAuth: true },
      },
    });
    expect(result.redirect?.to).toBe('https://sso.example.com/login');
    expect(result.redirect?.external).toBe(true);
    expect(result.redirect?.replace).toBe(true);
    expect(result.redirect?.status).toBe(301);
  });

  it('T-NF-105: adminOnly=true + user role は 403 abort', async () => {
    const result = await invokeRouteMiddleware({
      middleware: authMiddleware,
      to: {
        path: '/admin',
        meta: {
          requiresAuth: true,
          adminOnly: true,
          userSession: { userId: 'u-1', role: 'user' },
        },
      },
    });
    expect(result.abort?.statusCode).toBe(403);
    expect(result.abort?.message).toBe('admin role required for /admin');
    expect(result.abort?.[NUXT_MIDDLEWARE_ABORT_SYMBOL]).toBe(true);
  });

  it('T-NF-106: adminOnly=true + admin role は素通り', async () => {
    const result = await invokeRouteMiddleware({
      middleware: authMiddleware,
      to: {
        path: '/admin',
        meta: {
          requiresAuth: true,
          adminOnly: true,
          userSession: { userId: 'u-9', role: 'admin' },
        },
      },
    });
    expect(result.abort).toBeNull();
    expect(result.redirect).toBeNull();
  });
});
