import { describe, expect, it } from 'vitest';
import { createRequestClient } from '../../src/index.js';

/**
 * api integration domain test — createRequestClient real workflow を assert する。
 * fetcher を stub して HTTP method mapping と URL 生成を verify する。
 */
describe('api integration — createRequestClient workflow', () => {
  function makeFetcher(status: number, body: unknown) {
    return async (_url: RequestInfo | URL, _init?: RequestInit) => ({
      status,
      headers: new Headers({ 'content-type': 'application/json' }),
      text: async () => JSON.stringify(body),
    }) as unknown as Response;
  }

  it('T-INT-D-001 GET request で response 取得', async () => {
    const client = createRequestClient({
      baseUrl: 'https://api.example.com',
      fetcher: makeFetcher(200, { ok: true }),
    });
    const res = await client.get('/users/1');
    expect(res.status).toBe(200);
    expect(res.json<{ ok: boolean }>().ok).toBe(true);
  });

  it('T-INT-D-002 POST request で body 送信', async () => {
    let capturedInit: RequestInit | undefined;
    const client = createRequestClient({
      baseUrl: 'https://api.example.com',
      fetcher: (async (_url, init) => {
        capturedInit = init;
        return {
          status: 201,
          headers: new Headers(),
          text: async () => '{}',
        } as unknown as Response;
      }) as typeof fetch,
    });
    await client.post('/users', { name: 'kiwa' });
    expect(capturedInit?.method).toBe('POST');
    expect(capturedInit?.body).toBeDefined();
  });

  it('T-INT-D-003 PUT + PATCH + DELETE で HTTP method mapping', async () => {
    const methods: string[] = [];
    const client = createRequestClient({
      baseUrl: 'https://api.example.com',
      fetcher: (async (_url, init) => {
        methods.push(init?.method ?? '');
        return {
          status: 200,
          headers: new Headers(),
          text: async () => '{}',
        } as unknown as Response;
      }) as typeof fetch,
    });
    await client.put('/x', {});
    await client.patch('/x', {});
    await client.delete('/x');
    expect(methods).toEqual(['PUT', 'PATCH', 'DELETE']);
  });

  it('T-INT-D-004 defaultHeaders で共通 header 付与', async () => {
    let capturedHeaders: HeadersInit | undefined;
    const client = createRequestClient({
      baseUrl: 'https://api.example.com',
      defaultHeaders: { 'x-api-key': 'secret' },
      fetcher: (async (_url, init) => {
        capturedHeaders = init?.headers;
        return {
          status: 200,
          headers: new Headers(),
          text: async () => '{}',
        } as unknown as Response;
      }) as typeof fetch,
    });
    await client.get('/x');
    const h = capturedHeaders as Record<string, string>;
    expect(h['x-api-key']).toBe('secret');
  });

  it('T-INT-D-005 baseUrl + path 結合', async () => {
    const urls: string[] = [];
    const client = createRequestClient({
      baseUrl: 'https://api.example.com',
      fetcher: (async (url) => {
        urls.push(String(url));
        return {
          status: 200,
          headers: new Headers(),
          text: async () => '{}',
        } as unknown as Response;
      }) as typeof fetch,
    });
    await client.get('/users/1');
    expect(urls[0]).toBe('https://api.example.com/users/1');
  });
});
