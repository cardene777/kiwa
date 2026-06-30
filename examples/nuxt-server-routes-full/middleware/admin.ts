// Real Nuxt 3 route middleware — admin-only route guard.
// Thin wrapper around `_kiwa/route-guard.ts adminRouteGuard` so unit tests
// can exercise the pure middleware through @kiwa-test/nuxt setupNuxtMiddlewareEnv
// while the real path still flows through `defineNuxtRouteMiddleware`.

import { adminRouteGuard } from './_kiwa/route-guard.js';

export default defineNuxtRouteMiddleware((to, from) => {
  return adminRouteGuard(
    {
      fullPath: to.fullPath,
      path: to.path,
      name: typeof to.name === 'string' ? to.name : undefined,
      params: { ...(to.params as Record<string, string>) },
      query: { ...(to.query as Record<string, string | string[]>) },
      hash: to.hash ?? '',
      meta: { ...(to.meta as Record<string, unknown>) },
    },
    {
      fullPath: from.fullPath,
      path: from.path,
      name: typeof from.name === 'string' ? from.name : undefined,
      params: { ...(from.params as Record<string, string>) },
      query: { ...(from.query as Record<string, string | string[]>) },
      hash: from.hash ?? '',
      meta: { ...(from.meta as Record<string, unknown>) },
    },
    {
      navigateTo: (target, options = {}) => {
        throw navigateTo(target, options);
      },
      abortNavigation: (message, statusCode = 404) => {
        throw abortNavigation({ statusCode, statusMessage: message ?? 'navigation aborted' });
      },
    },
  );
});
