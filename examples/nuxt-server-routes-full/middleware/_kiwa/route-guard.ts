// route-guard.ts — kiwa の setupNuxtMiddlewareEnv が direct invoke する pure middleware chain。
//
// 役割 ... global 段で auth state を解決 + 期限切れなら refresh route へ送り、
// route-specific 段で admin only route の role chek を行う。
// useUserSession() composable は kiwa fixture の `user` 引数経由で
// to.meta.userSession に inject される。

import type { RouteMiddlewareFunction } from '@kiwa-test/nuxt';

interface SessionState {
  readonly state: 'authenticated' | 'expired' | 'anonymous';
  readonly userId?: string;
  readonly role?: string;
}

/** Global middleware — guarantee session is fresh + authenticated. */
export const globalAuthGuard: RouteMiddlewareFunction = (to, _from, { navigateTo }) => {
  const session = to.meta.userSession as SessionState | undefined;
  if (session?.state === 'expired') {
    navigateTo(`/auth/refresh?next=${encodeURIComponent(to.fullPath)}`);
    return;
  }
  if (session?.state !== 'authenticated') {
    navigateTo(`/login?next=${encodeURIComponent(to.fullPath)}`);
  }
};

/** Route-specific middleware — admin-only routes require role=admin. */
export const adminRouteGuard: RouteMiddlewareFunction = (to, _from, { abortNavigation }) => {
  const session = to.meta.userSession as SessionState | undefined;
  if (session?.role !== 'admin') {
    abortNavigation(`admin role required for ${to.path}`, 403);
  }
};
