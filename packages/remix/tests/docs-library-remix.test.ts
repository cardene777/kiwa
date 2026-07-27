import { expect, test } from 'vitest';
import { invokeLoader, invokeResourceRoute, json, setupRemixNestedRouteEnv } from '../src/index.js';

test('validates the Quickstart loader data result', async () => {
  const result = await invokeLoader({ loader: async () => ({ ok: true }), url: 'http://localhost/items' });
  expect(result).toMatchObject({ result: { ok: true }, response: null, redirect: null });
});

test('validates Resource Route dispatch, 405, and nested parent data', async () => {
  const posted = await invokeResourceRoute({
    route: { action: async ({ request }) => json({ name: (await request.formData()).get('name') }) },
    url: 'http://localhost/api/items', method: 'POST', formData: { name: 'kiwa' },
  });
  expect(posted.dispatch).toBe('action');
  await expect(posted.response?.json()).resolves.toEqual({ name: 'kiwa' });

  const rejected = await invokeResourceRoute({ route: { action: () => new Response('post-only') }, url: 'http://localhost/api/items', method: 'GET' });
  expect(rejected).toMatchObject({ dispatch: 'method-not-allowed', methodNotAllowed: { allow: ['POST', 'PUT', 'PATCH', 'DELETE'] } });
  expect(rejected.response?.status).toBe(405);

  let parentData: unknown;
  const env = setupRemixNestedRouteEnv({
    parentRoute: { id: 'routes/parent', loader: async () => ({ user: 'alice', role: 'admin' }) },
    childRoute: { id: 'routes/parent.child', loader: async ({ context }) => { parentData = (context as { parentData?: unknown }).parentData; return { childOk: true }; } },
    url: 'http://localhost/parent/child',
  });
  const result = await env.runLoaderChain();
  expect(result.parent.result).toEqual({ user: 'alice', role: 'admin' });
  expect(result.child.result).toEqual({ childOk: true });
  expect(parentData).toEqual({ user: 'alice', role: 'admin' });
});
