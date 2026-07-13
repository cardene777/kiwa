import { describe, expect, it } from 'vitest';
import { startLiveServer } from '../src/live-server.js';

describe('startLiveServer defensive branches', () => {
  it('handles fetch-style handler that returns Response', async () => {
    const handle = await startLiveServer({
      kind: 'fetch',
      handler: async (_req) => new Response('ok', { status: 200 }),
    });
    const res = await fetch(handle.baseUrl);
    expect(res.status).toBe(200);
    expect(await res.text()).toBe('ok');
    await handle.close();
  });

  it('handles node-style handler', async () => {
    const handle = await startLiveServer({
      kind: 'node',
      handler: (_req, res) => {
        res.statusCode = 200;
        res.end('node-ok');
      },
    });
    const res = await fetch(handle.baseUrl);
    expect(res.status).toBe(200);
    expect(await res.text()).toBe('node-ok');
    await handle.close();
  });

  it('node handler that throws returns 500', async () => {
    const handle = await startLiveServer({
      kind: 'node',
      handler: () => {
        throw new Error('boom');
      },
    });
    const res = await fetch(handle.baseUrl);
    expect(res.status).toBe(500);
    await handle.close();
  });

  it('node handler with async rejection returns 500', async () => {
    const handle = await startLiveServer({
      kind: 'node',
      handler: async () => {
        throw new Error('async-boom');
      },
    });
    const res = await fetch(handle.baseUrl);
    expect(res.status).toBe(500);
    await handle.close();
  });

  it('handles POST with body via fetch handler', async () => {
    const handle = await startLiveServer({
      kind: 'fetch',
      handler: async (req) => {
        const body = await req.text();
        return new Response(`got: ${body}`, { status: 200 });
      },
    });
    const res = await fetch(handle.baseUrl, {
      method: 'POST',
      body: 'hello',
      headers: { 'content-type': 'text/plain' },
    });
    expect(await res.text()).toBe('got: hello');
    await handle.close();
  });

  it('handles GET without body', async () => {
    const handle = await startLiveServer({
      kind: 'fetch',
      handler: async (req) => new Response(`method: ${req.method}`, { status: 200 }),
    });
    const res = await fetch(handle.baseUrl);
    expect(await res.text()).toBe('method: GET');
    await handle.close();
  });

  it('handle.close resolves cleanly', async () => {
    const handle = await startLiveServer({
      kind: 'fetch',
      handler: async () => new Response('x'),
    });
    await expect(handle.close()).resolves.toBeUndefined();
  });
});
