import { expect, test } from 'vitest';
import { invokeApiRoute, invokeServerFunction, json, redirect, redirectResponse } from '../src/index.js';

test('validates the Quickstart JSON and form request examples', async () => {
  const jsonRoute = await invokeApiRoute({
    handler: async ({ request, params, locals }) => {
      const body = await request.json() as { name: string };
      return json({ id: params.id, name: body.name, role: locals.role }, { status: 201 });
    },
    url: 'http://localhost/api/users/42', params: { id: '42' }, jsonBody: { name: 'Ada' }, locals: { role: 'admin' },
  });
  expect(jsonRoute.response.status).toBe(201);
  await expect(jsonRoute.response.json()).resolves.toEqual({ id: '42', name: 'Ada', role: 'admin' });
  const formRoute = await invokeApiRoute({
    handler: ({ request }) => new Response(request.method), url: 'http://localhost/api/users', formData: { name: 'Ada' },
  });
  await expect(formRoute.response.text()).resolves.toBe('POST');
});

test('validates the form redirect, JSON error, and server-function redirect how-to', async () => {
  const form = await invokeApiRoute({
    handler: async ({ request, locals }) => {
      const data = await request.formData();
      if (!locals.userId) return redirectResponse('/login', 303);
      expect(data.get('displayName')).toBe('Kiwa user');
      return redirectResponse('/settings/profile', 303);
    },
    url: 'http://localhost/settings/profile', formData: { displayName: 'Kiwa user' }, locals: { userId: 'user-42' },
  });
  expect(form.redirect).toEqual({ url: '/settings/profile', status: 303 });
  const invalid = await invokeApiRoute({
    handler: async ({ request }) => {
      const body = await request.json() as { email?: string };
      return body.email ? json({ email: body.email }, { status: 201 }) : json({ error: 'email is required' }, { status: 400 });
    },
    url: 'http://localhost/api/invitations', jsonBody: {},
  });
  expect(invalid.response.status).toBe(400);
  const server = await invokeServerFunction({
    fn: (sessionId: string | null) => { if (!sessionId) throw redirect('/login', 307); return { saved: true }; },
    args: [null] as const, cookies: { session: 'expired-session' },
  });
  expect(server.redirect).toMatchObject({ url: '/login', status: 307 });
  expect(server.env.requestCookies.get('session')).toBe('expired-session');
});
