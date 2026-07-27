import { expect, test } from 'vitest';
import { invokeEventHandler, invokeNitroPlugin, invokeRouteMiddleware } from '../src/index.js';

test('validates the Quickstart query and response header', async () => {
  const result = await invokeEventHandler({
    handler: (event) => { event.setHeader('Cache-Control', 'no-store'); return { query: event.query.q }; },
    url: 'http://localhost/api/search?q=kiwa',
  });
  expect(result.result).toEqual({ query: 'kiwa' });
  expect(result.env.responseHeaders.get('cache-control')).toBe('no-store');
});

test('validates the route, middleware, and Nitro hook how-to', async () => {
  const route = await invokeEventHandler({
    handler: (event) => { if (!event.cookies.get('session')) event.sendRedirect('/login', 302); return { ok: true }; },
    url: 'http://localhost/api/secure',
  });
  expect(route).toMatchObject({ result: undefined, redirect: { url: '/login', status: 302 } });
  expect(route.env.status).toBe(200);

  const middleware = await invokeRouteMiddleware({
    middleware: (_to, _from, { navigateTo }) => navigateTo('/login'), to: { path: '/dashboard' },
  });
  expect(middleware.redirect).toMatchObject({ to: '/login', status: 302, external: false });

  let calls = 0;
  const nitro = await invokeNitroPlugin({ plugin: (app) => app.hooks.hookOnce('close', () => { calls += 1; }) });
  await nitro.callHook('close', undefined);
  await nitro.callHook('close', undefined);
  expect(calls).toBe(1);
  expect(nitro.callHookErrors).toEqual([]);
});
