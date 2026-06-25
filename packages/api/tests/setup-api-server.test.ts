import { http, HttpResponse } from 'msw';
import { afterEach, describe, expect, it } from 'vitest';
import { setupApiServer, type ApiHandlerSource, type ApiTestEnv } from '../src/index.js';

const envs: ApiTestEnv[] = [];

afterEach(async () => {
  while (envs.length > 0) {
    const env = envs.pop();
    if (env) await env.stop();
  }
});

interface Item {
  id: number;
  name: string;
}

function buildLiveApp(): ApiHandlerSource {
  const items: Item[] = [];
  let nextId = 1;
  return {
    kind: 'fetch',
    handler: async (req) => {
      const url = new URL(req.url);
      if (url.pathname === '/api/items' && req.method === 'GET') {
        return Response.json(items);
      }
      if (url.pathname === '/api/items' && req.method === 'POST') {
        const body = (await req.json()) as { name?: string };
        if (!body.name) {
          return new Response('name required', { status: 400 });
        }
        const created = { id: nextId++, name: body.name };
        items.push(created);
        return Response.json(created, { status: 201 });
      }
      return new Response('not found', { status: 404 });
    },
  };
}

describe('setupApiServer (mock mode)', () => {
  it('returns mocked responses via msw handlers', async () => {
    const env = await setupApiServer({
      mode: 'mock',
      mockHandlers: [
        http.get('http://kiwa.mock/api/items', () =>
          HttpResponse.json([{ id: 99, name: 'mocked' }]),
        ),
      ],
    });
    envs.push(env);
    const res = await env.request.get('/api/items');
    expect(res.status).toBe(200);
    expect(res.json<Item[]>()).toEqual([{ id: 99, name: 'mocked' }]);
  });

  it('exposes reset() to clear mocks between tests', async () => {
    const env = await setupApiServer({
      mode: 'mock',
      mockHandlers: [
        http.get('http://kiwa.mock/api/items', () =>
          HttpResponse.json([{ id: 1, name: 'a' }]),
        ),
      ],
    });
    envs.push(env);
    if (env.mode !== 'mock') throw new Error('expected mock');
    env.mocks.reset();
    const res = await env.request.get('/api/items');
    expect(res.status).toBe(200);
  });
});

describe('setupApiServer (live mode)', () => {
  it('spins up a live HTTP server and serves real requests', async () => {
    const env = await setupApiServer({ mode: 'live', app: buildLiveApp() });
    envs.push(env);
    const created = await env.request.post('/api/items', { name: 'a' });
    expect(created.status).toBe(201);
    const list = await env.request.get('/api/items');
    expect(list.json<Item[]>().length).toBe(1);
  });

  it('returns 400 when name is missing', async () => {
    const env = await setupApiServer({ mode: 'live', app: buildLiveApp() });
    envs.push(env);
    const res = await env.request.post('/api/items', {});
    expect(res.status).toBe(400);
  });
});

describe('setupApiServer (hybrid mode)', () => {
  it('runs live server while leaving msw available for selective overrides', async () => {
    const env = await setupApiServer({
      mode: 'hybrid',
      app: buildLiveApp(),
      mockHandlers: [],
    });
    envs.push(env);
    if (env.mode !== 'hybrid') throw new Error('expected hybrid');
    const created = await env.request.post('/api/items', { name: 'h' });
    expect(created.status).toBe(201);
    expect(typeof env.mocks.reset).toBe('function');
  });
});

describe('setupApiServer (errors)', () => {
  it('rejects mock mode without handlers', async () => {
    await expect(
      setupApiServer({ mode: 'mock' as const }),
    ).rejects.toThrow(/mockHandlers/);
  });

  it('rejects live mode without app', async () => {
    await expect(
      setupApiServer({ mode: 'live' as const }),
    ).rejects.toThrow(/app/);
  });

  it('rejects hybrid mode without app', async () => {
    await expect(
      setupApiServer({ mode: 'hybrid' as const, mockHandlers: [] }),
    ).rejects.toThrow(/app/);
  });

  it('rejects hybrid mode without mockHandlers', async () => {
    await expect(
      setupApiServer({ mode: 'hybrid' as const, app: buildLiveApp() }),
    ).rejects.toThrow(/mockHandlers/);
  });

  it('rejects unknown mode', async () => {
    await expect(
      setupApiServer({ mode: 'weird' as unknown as 'mock' }),
    ).rejects.toThrow(/unknown mode/);
  });
});
