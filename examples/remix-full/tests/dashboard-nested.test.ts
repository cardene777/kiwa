// dashboard-nested.test.ts — PoC for Issue #561 (v1.3-4)。
//
// 実 Remix dev server を起動せずに、 nested route layout (/dashboard) + child
// (/dashboard/profile) の loader chain + headers() merge + Set-Cookie persistence
// + defer() streaming を deterministic に test する。 kiwa setupRemixNestedRouteEnv
// が `runLoaderChain` で parent → child の loader を順次 invoke し、 cookies は
// store に persist、 headers は Remix 公式 prependCookies 互換 logic で merge する。

import { describe, expect, it } from 'vitest';
import { setupRemixNestedRouteEnv, resolveDeferred, isDeferred } from '@kiwa-test/remix';
import {
  dashboardLayoutLoader,
  dashboardLayoutHeaders,
} from '../app/lib/_kiwa/dashboard-layout-loader.js';
import {
  dashboardProfileLoader,
  dashboardProfileHeaders,
} from '../app/lib/_kiwa/dashboard-profile-loader.js';

const parentDef = {
  id: 'routes/dashboard',
  loader: dashboardLayoutLoader,
  headers: dashboardLayoutHeaders,
} as const;

const childDef = {
  id: 'routes/dashboard.profile',
  loader: dashboardProfileLoader,
  headers: dashboardProfileHeaders,
} as const;

describe('PoC #561: /dashboard nested → /dashboard/profile', () => {
  it('T-NR-PoC-001: admin session で parent → child loader chain が連鎖、 defer の badges まで resolve', async () => {
    const env = setupRemixNestedRouteEnv({
      parentRoute: parentDef,
      childRoute: childDef,
      url: 'http://localhost/dashboard/profile',
      cookies: { session: 'admin' },
      headers: { 'x-test-now': '2026-06-30T12:00:00Z' },
    });
    const r = await env.runLoaderChain();
    // parent loader = json(...) → result undefined / response 200
    expect(r.parent.response?.status).toBe(200);
    const parentBody = (await r.parent.response?.json()) as { user: { id: string; role: string } };
    expect(parentBody.user.role).toBe('admin');
    // child loader = defer({ username, unread, badges })
    expect(isDeferred(r.child.result)).toBe(true);
    const resolved = await resolveDeferred(r.child.result as ReturnType<typeof import('@kiwa-test/remix').defer>);
    expect(resolved.resolved.username).toBe('u1');
    expect(resolved.resolved.unread).toBe(7);
    expect(resolved.resolved.badges).toEqual(['core-contributor', 'beta-tester']);
  });

  it('T-NR-PoC-002: session 不在 → parent loader が 401 を返し、 child の parentData は明示形で受け取れない', async () => {
    const env = setupRemixNestedRouteEnv({
      parentRoute: parentDef,
      childRoute: childDef,
      url: 'http://localhost/dashboard/profile',
      cookies: {},
    });
    const r = await env.runLoaderChain();
    expect(r.parent.response?.status).toBe(401);
    // parent が Response を返したので parentData は undefined → child は parent layout 不在 401 を返す
    // (defer ではなく Response)
    const childResponse = r.child.response;
    expect(childResponse?.status).toBe(401);
  });

  it('T-NR-PoC-003: parent の Set-Cookie (lastVisit) が child loader の Cookie header に乗る', async () => {
    let observedChildCookie: string | null = null;
    const env = setupRemixNestedRouteEnv({
      parentRoute: parentDef,
      childRoute: {
        id: 'routes/dashboard.profile-probe',
        loader: async ({ request, context }) => {
          observedChildCookie = request.headers.get('cookie');
          // parentData の有無で 200/401 を分岐させ既存 loader の挙動と同じに
          const parent = (context as { parentData?: unknown }).parentData;
          return parent ? { ok: true } : new Response('', { status: 401 });
        },
      },
      url: 'http://localhost/dashboard/profile-probe',
      cookies: { session: 'admin' },
      headers: { 'x-test-now': '2026-06-30T12:00:00Z' },
    });
    await env.runLoaderChain();
    expect(observedChildCookie).toContain('session=admin');
    expect(observedChildCookie).toContain('lastVisit=');
  });

  it('T-NR-PoC-004: mergedHeaders は parent cache-control + child x-profile-version を両方持つ + last-visit Set-Cookie 含む', async () => {
    const env = setupRemixNestedRouteEnv({
      parentRoute: parentDef,
      childRoute: childDef,
      url: 'http://localhost/dashboard/profile',
      cookies: { session: 'admin' },
      headers: { 'x-test-now': '2026-06-30T12:00:00Z' },
    });
    const r = await env.runLoaderChain();
    expect(r.mergedHeaders.get('cache-control')).toBe('private, max-age=30');
    expect(r.mergedHeaders.get('x-profile-version')).toBe('v1');
    const set = r.mergedHeaders.getSetCookie();
    expect(set.some((c) => c.startsWith('lastVisit='))).toBe(true);
  });

  it('T-NR-PoC-005: 同 env で 2 回 runLoaderChain → 2 回目も last-visit cookie が persist', async () => {
    const env = setupRemixNestedRouteEnv({
      parentRoute: parentDef,
      childRoute: childDef,
      url: 'http://localhost/dashboard/profile',
      cookies: { session: 'admin' },
      headers: { 'x-test-now': '2026-06-30T12:00:00Z' },
    });
    await env.runLoaderChain();
    const first = env.cookies.get('lastVisit');
    expect(first).toBeDefined();
    await env.runLoaderChain();
    const second = env.cookies.get('lastVisit');
    expect(second).toBeDefined();
    // x-test-now 固定なので value は同じ
    expect(second).toBe(first);
    // env.reset() で初期 snapshot に戻る (lastVisit は消える、 session は保持)
    env.reset();
    expect(env.cookies.get('lastVisit')).toBeUndefined();
    expect(env.cookies.get('session')).toBe('admin');
  });
});
