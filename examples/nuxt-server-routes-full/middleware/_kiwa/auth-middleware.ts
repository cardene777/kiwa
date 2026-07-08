// auth-middleware.ts — kiwa-test/nuxt の invokeRouteMiddleware が direct invoke する pure middleware。
//
// 役割 ... to.meta.requiresAuth が true の route で、 to.meta.userSession が存在しなければ
// /login へ redirect。 外部 SSO (to.query.external === 'true') の場合は 301 + external フラグ
// 付き redirect、 admin-only route (to.meta.adminOnly) で role 不一致なら 403 abort。

import type { SimulatedRouteLocation } from '@kiwa/nuxt';

export interface AuthMiddlewareSession {
  readonly userId?: string;
  readonly role?: 'admin' | 'user';
}

export interface AuthMiddlewareHelpers {
  navigateTo(target: string, options?: { external?: boolean; replace?: boolean; redirectCode?: number }): never;
  abortNavigation(message?: string, statusCode?: number): never;
}

export function authMiddleware(
  to: SimulatedRouteLocation,
  _from: SimulatedRouteLocation,
  helpers: AuthMiddlewareHelpers,
): void | string {
  const requiresAuth = to.meta.requiresAuth === true;
  if (!requiresAuth) return undefined;

  const session = to.meta.userSession as AuthMiddlewareSession | undefined;
  const isExternalSso = to.query.external === 'true';

  if (!session || !session.userId) {
    if (isExternalSso) {
      helpers.navigateTo('https://sso.example.com/login', {
        external: true,
        replace: true,
        redirectCode: 301,
      });
    }
    helpers.navigateTo('/login');
  }

  if (to.meta.adminOnly === true && session?.role !== 'admin') {
    helpers.abortNavigation(`admin role required for ${to.path}`, 403);
  }

  return undefined;
}
