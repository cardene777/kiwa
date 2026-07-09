// kiwa unit test for middleware/_kiwa/route-guard.ts
// — exercises both globalAuthGuard + adminRouteGuard via setupNuxtMiddlewareEnv.
// AC #4 (PoC): admin + redirect middleware を新規追加 + test 網羅。

import { describe, expect, it } from 'vitest';
import { setupNuxtMiddlewareEnv } from '@kiwa-lab/nuxt';
import { globalAuthGuard, adminRouteGuard } from '../middleware/_kiwa/route-guard.js';

describe('route-guard chain via setupNuxtMiddlewareEnv', () => {
  it('T-RG-101: anonymous user redirected to /login with next param', async () => {
    const env = await setupNuxtMiddlewareEnv({
      middleware: globalAuthGuard,
      to: { path: '/dashboard' },
      user: { state: 'anonymous' },
    });
    expect(env.redirectedTo).toBe('/login?next=%2Fdashboard');
    expect(env.navigateToCalls).toHaveLength(1);
  });

  it('T-RG-102: expired session redirected to /auth/refresh with next param', async () => {
    const env = await setupNuxtMiddlewareEnv({
      middleware: globalAuthGuard,
      to: { path: '/dashboard' },
      user: { state: 'expired', userId: 'u-1' },
    });
    expect(env.redirectedTo).toBe('/auth/refresh?next=%2Fdashboard');
  });

  it('T-RG-103: authenticated user passes globalAuthGuard', async () => {
    const env = await setupNuxtMiddlewareEnv({
      middleware: globalAuthGuard,
      to: { path: '/dashboard' },
      user: { state: 'authenticated', userId: 'u-1', role: 'user' },
    });
    expect(env.redirectedTo).toBeNull();
    expect(env.aborted).toBe(false);
  });

  it('T-RG-104: global + admin chain — non-admin user gets 403 abort at admin gate', async () => {
    const env = await setupNuxtMiddlewareEnv({
      middleware: [globalAuthGuard, adminRouteGuard],
      to: { path: '/admin/dashboard' },
      user: { state: 'authenticated', userId: 'u-1', role: 'user' },
    });
    expect(env.aborted).toBe(true);
    expect(env.outcome.abort?.statusCode).toBe(403);
    expect(env.outcome.abort?.message).toBe('admin role required for /admin/dashboard');
    expect(env.outcome.executed).toEqual([0, 1]);
  });

  it('T-RG-105: global + admin chain — admin user passes through both', async () => {
    const env = await setupNuxtMiddlewareEnv({
      middleware: [globalAuthGuard, adminRouteGuard],
      to: { path: '/admin/dashboard' },
      user: { state: 'authenticated', userId: 'u-9', role: 'admin' },
    });
    expect(env.aborted).toBe(false);
    expect(env.redirectedTo).toBeNull();
    expect(env.outcome.executed).toEqual([0, 1]);
  });

  it('T-RG-106: global + admin chain — expired session halts at global, admin gate skipped', async () => {
    const env = await setupNuxtMiddlewareEnv({
      middleware: [globalAuthGuard, adminRouteGuard],
      to: { path: '/admin/dashboard' },
      user: { state: 'expired', userId: 'u-1' },
    });
    expect(env.redirectedTo).toBe('/auth/refresh?next=%2Fadmin%2Fdashboard');
    expect(env.outcome.executed).toEqual([0]);
    expect(env.outcome.skipped).toEqual([1]);
  });

  it('T-RG-107: anonymous user on admin route halts at global guard (login first)', async () => {
    const env = await setupNuxtMiddlewareEnv({
      middleware: [globalAuthGuard, adminRouteGuard],
      to: { path: '/admin/users' },
      user: { state: 'anonymous' },
    });
    expect(env.redirectedTo).toBe('/login?next=%2Fadmin%2Fusers');
    expect(env.outcome.skipped).toEqual([1]);
  });
});
