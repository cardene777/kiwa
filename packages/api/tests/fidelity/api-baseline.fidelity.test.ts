import { describe, expect, it } from 'vitest';
import { createRequestClient } from '../../src/index.js';

function makeFetcher(status = 200, body: unknown = { ok: true }) {
  return (async () => ({
    status,
    headers: new Headers({ 'content-type': 'application/json' }),
    text: async () => JSON.stringify(body),
  })) as unknown as typeof fetch;
}

describe('api fidelity — createRequestClient contract', () => {
  it('T-FID-D-001 baseUrl trailing slash 正規化', async () => {
    const urls: string[] = [];
    const client = createRequestClient({
      baseUrl: 'https://api.example.com/',
      fetcher: (async (url) => {
        urls.push(String(url));
        return { status: 200, headers: new Headers(), text: async () => '{}' } as unknown as Response;
      }) as typeof fetch,
    });
    await client.get('/x');
    expect(urls[0]).toBe('https://api.example.com/x');
  });

  it('T-FID-D-002 path 先頭 slash 補完', async () => {
    const urls: string[] = [];
    const client = createRequestClient({
      baseUrl: 'https://api.example.com',
      fetcher: (async (url) => {
        urls.push(String(url));
        return { status: 200, headers: new Headers(), text: async () => '{}' } as unknown as Response;
      }) as typeof fetch,
    });
    await client.get('users');
    expect(urls[0]).toBe('https://api.example.com/users');
  });

  it('T-FID-D-003 absolute URL passthrough', async () => {
    const urls: string[] = [];
    const client = createRequestClient({
      baseUrl: 'https://api.example.com',
      fetcher: (async (url) => {
        urls.push(String(url));
        return { status: 200, headers: new Headers(), text: async () => '{}' } as unknown as Response;
      }) as typeof fetch,
    });
    await client.get('https://other.com/x');
    expect(urls[0]).toBe('https://other.com/x');
  });

  it('T-FID-D-004 json() で response parse', async () => {
    const client = createRequestClient({
      baseUrl: 'https://x.com',
      fetcher: makeFetcher(200, { data: 42 }),
    });
    const res = await client.get('/x');
    const parsed = res.json<{ data: number }>();
    expect(parsed.data).toBe(42);
  });

  it('T-FID-D-005 status code passthrough', async () => {
    const client = createRequestClient({
      baseUrl: 'https://x.com',
      fetcher: makeFetcher(404, { error: 'not found' }),
    });
    const res = await client.get('/missing');
    expect(res.status).toBe(404);
  });
});
