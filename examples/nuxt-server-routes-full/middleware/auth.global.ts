// Real Nuxt 3 global middleware — thin wrapper around `_kiwa/auth-middleware.ts`.
// The pure middleware is unit-testable via @kiwa-test/nuxt's invokeRouteMiddleware
// helper while the production code path still flows through `defineNuxtRouteMiddleware`.

import { authMiddleware } from './_kiwa/auth-middleware.js';

export default defineNuxtRouteMiddleware((to, from) => {
  return authMiddleware(
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
