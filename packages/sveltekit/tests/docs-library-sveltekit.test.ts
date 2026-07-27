import { expect, test } from 'vitest';
import {
  fail,
  invokeAction,
  invokeHandle,
  invokeHandleFetch,
  invokeLoad,
} from '../src/index.js';

test('keeps the documented server-side flows runnable', async () => {
  const load = await invokeLoad({
    load: async ({ params, setHeaders, cookies }) => {
      setHeaders({ 'cache-control': 'no-store' });
      cookies.set('seen', 'true');
      return { id: params.id };
    },
    url: 'http://localhost/items/42',
    params: { id: '42' },
  });
  expect(load.data).toEqual({ id: '42' });
  expect(load.env.cookies.get('seen')).toBe('true');

  const action = await invokeAction({
    action: async ({ request }) => {
      const form = await request.formData();
      return typeof form.get('email') === 'string' ? { ok: true } : fail(400, { error: 'email required' });
    },
    url: 'http://localhost/signup',
  });
  expect(action.fail).toMatchObject({ status: 400, data: { error: 'email required' } });

  const handle = await invokeHandle<{ user?: { id: number } }>({
    handle: async ({ event, resolve }) => {
      event.locals.user = { id: 42 };
      event.cookies.set('telemetry', 'tid_1');
      return resolve(event);
    },
    url: 'http://localhost/dashboard',
  });
  expect(handle.localsAtResolve?.user).toEqual({ id: 42 });

  const handleFetch = await invokeHandleFetch({
    handleFetch: ({ fetch }) => fetch(new Request('https://internal.example.test/users/42')),
    eventUrl: 'http://localhost/dashboard',
    fetchUrl: 'https://api.example.test/users/42',
  });
  expect(handleFetch.downstreamRequest?.url).toBe('https://internal.example.test/users/42');
});
