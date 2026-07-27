import { expect, test } from 'vitest';
import { invokeEndpoint, invokeRouteAction, invokeRouteLoader } from '../src/index.js';

test('validates the Quickstart action failure and cookie success paths', async () => {
  const failed = await invokeRouteAction<{ email?: string }, { ok: boolean }>({
    action: ({ email }, event) => typeof email !== 'string' || email === ''
      ? event.fail(400, { field: 'email', message: 'required' })
      : { ok: true },
    formValues: {},
  });
  expect(failed).toMatchObject({ result: undefined, fail: { status: 400, data: { field: 'email' } }, redirect: null, error: undefined });
  const succeeded = await invokeRouteAction<{ email?: string }, { ok: boolean }>({
    action: ({ email }, event) => { event.cookie.set('last-email', String(email)); return { ok: true }; },
    formValues: { email: 'sora@example.com' },
  });
  expect(succeeded.result).toEqual({ ok: true });
  expect(succeeded.env.cookies.get('last-email')).toBe('sora@example.com');
});

test('validates the loader redirect and endpoint response how-to', async () => {
  const loader = await invokeRouteLoader({
    loader: (event) => { if (event.cookie.get('session') === null) event.redirect(302, '/login'); return { page: event.query.get('page') }; },
    url: 'http://localhost/profile?page=2', platform: { region: 'local' },
  });
  expect(loader).toMatchObject({ data: undefined, redirect: { status: 302, location: '/login' }, error: undefined });
  const endpoint = await invokeEndpoint({
    handler: (event) => { event.setHeader('cache-control', 'no-store'); event.json(201, { id: event.params.id }); },
    url: 'http://localhost/api/users/42', params: { id: '42' }, jsonBody: { name: 'Ada' },
  });
  expect(endpoint.response).toMatchObject({ kind: 'json', status: 201, body: { id: '42' } });
  expect(endpoint.response.headers.get('cache-control')).toBe('no-store');
});
