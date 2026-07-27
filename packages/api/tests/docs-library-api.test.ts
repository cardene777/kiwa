import { afterEach, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupApiServer, type ApiTestEnv } from '../src/index.js';

const envs: ApiTestEnv[] = [];

afterEach(async () => {
  while (envs.length > 0) {
    const env = envs.pop();
    if (env) await env.stop();
  }
});

it('documents live create, list, and validation error responses', async () => {
  const items: Array<{ id: number; name: string }> = [];
  const env = await setupApiServer({
    mode: 'live',
    app: {
      kind: 'fetch',
      handler: async request => {
        const url = new URL(request.url);
        if (url.pathname === '/api/items' && request.method === 'POST') {
          const body = (await request.json()) as { name?: string };
          if (!body.name) return new Response('name required', { status: 400 });
          const item = { id: items.length + 1, name: body.name };
          items.push(item);
          return Response.json(item, { status: 201 });
        }
        if (url.pathname === '/api/items' && request.method === 'GET') return Response.json(items);
        return new Response('not found', { status: 404 });
      },
    },
  });
  envs.push(env);
  expect((await env.request.post('/api/items', { name: 'kiwa' })).json()).toEqual({ id: 1, name: 'kiwa' });
  expect((await env.request.get('/api/items')).json()).toEqual([{ id: 1, name: 'kiwa' }]);
  const invalid = await env.request.post('/api/items', {});
  expect(invalid).toMatchObject({ status: 400, bodyText: 'name required' });
});

it('documents mock and hybrid modes plus a Node header override', async () => {
  const mock = await setupApiServer({
    mode: 'mock',
    mockHandlers: [
      http.get('http://kiwa.mock/api/items', () => HttpResponse.json([{ id: 99, name: 'mocked' }])),
    ],
  });
  envs.push(mock);
  expect((await mock.request.get('/api/items')).json()).toEqual([{ id: 99, name: 'mocked' }]);

  const hybrid = await setupApiServer({
    mode: 'hybrid',
    app: { kind: 'fetch', handler: async () => {
      const upstream = await fetch('https://profiles.example/me');
      return Response.json({ source: 'local handler', profile: await upstream.json() });
    } },
    mockHandlers: [http.get('https://profiles.example/me', () => HttpResponse.json({ id: 'u-1' }))],
  });
  envs.push(hybrid);
  expect((await hybrid.request.get('/profile')).json()).toEqual({ source: 'local handler', profile: { id: 'u-1' } });

  const node = await setupApiServer({
    mode: 'live', defaultHeaders: { authorization: 'Bearer test', 'x-tenant': 'first' },
    app: (req, res) => {
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ authorization: req.headers.authorization, tenant: req.headers['x-tenant'] }));
    },
  });
  envs.push(node);
  expect((await node.request.get('/health', { headers: { 'x-tenant': 'second' } })).json()).toEqual({
    authorization: 'Bearer test', tenant: 'second',
  });
});
