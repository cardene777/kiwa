import { describe, expect, it } from 'vitest';
import { createRequestClient } from '../src/request-client.js';

function buildFakeFetcher(handler: (url: string, init: RequestInit | undefined) => Response): typeof fetch {
  return (async (input: RequestInfo | URL, init?: RequestInit) => {
    return handler(typeof input === 'string' ? input : input.toString(), init);
  }) as unknown as typeof fetch;
}

describe('createRequestClient', () => {
  it('GET resolves baseUrl + path and exposes status/headers/json', async () => {
    const client = createRequestClient({
      baseUrl: 'http://x.test/',
      defaultHeaders: { 'x-default': 'd' },
      fetcher: buildFakeFetcher((url, init) => {
        expect(url).toBe('http://x.test/path');
        expect(init?.method).toBe('GET');
        expect((init?.headers as Record<string, string>)['x-default']).toBe('d');
        return new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        });
      }),
    });
    const res = await client.get('path');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('application/json');
    expect(res.json<{ ok: boolean }>().ok).toBe(true);
  });

  it('POST JSON-encodes object bodies and sets content-type', async () => {
    const client = createRequestClient({
      baseUrl: 'http://x.test',
      fetcher: buildFakeFetcher((url, init) => {
        expect(init?.body).toBe('{"a":1}');
        expect((init?.headers as Record<string, string>)['content-type']).toBe('application/json');
        return new Response('', { status: 201 });
      }),
    });
    const res = await client.post('/p', { a: 1 });
    expect(res.status).toBe(201);
  });

  it('POST passes string bodies untouched (no content-type override)', async () => {
    const client = createRequestClient({
      baseUrl: 'http://x.test',
      fetcher: buildFakeFetcher((_url, init) => {
        expect(init?.body).toBe('raw');
        const ct = (init?.headers as Record<string, string>)['content-type'];
        expect(ct).toBeUndefined();
        return new Response('ok');
      }),
    });
    await client.post('/p', 'raw');
  });

  it('PUT works', async () => {
    const client = createRequestClient({
      baseUrl: 'http://x.test',
      fetcher: buildFakeFetcher((_u, init) => {
        expect(init?.method).toBe('PUT');
        return new Response('');
      }),
    });
    await client.put('/p', { x: 1 });
  });

  it('PATCH works', async () => {
    const client = createRequestClient({
      baseUrl: 'http://x.test',
      fetcher: buildFakeFetcher((_u, init) => {
        expect(init?.method).toBe('PATCH');
        return new Response('');
      }),
    });
    await client.patch('/p', { x: 2 });
  });

  it('DELETE works without a body', async () => {
    const client = createRequestClient({
      baseUrl: 'http://x.test',
      fetcher: buildFakeFetcher((_u, init) => {
        expect(init?.method).toBe('DELETE');
        expect(init?.body).toBeUndefined();
        return new Response('');
      }),
    });
    await client.delete('/p');
  });

  it('absolute http URL is passed through as-is', async () => {
    const client = createRequestClient({
      baseUrl: 'http://ignored',
      fetcher: buildFakeFetcher((url) => {
        expect(url).toBe('http://other/abs');
        return new Response('');
      }),
    });
    await client.get('http://other/abs');
  });
});
