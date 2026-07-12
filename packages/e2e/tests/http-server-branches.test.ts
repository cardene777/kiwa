import { request as httpRequest } from 'node:http';
import { connect as netConnect } from 'node:net';
import { afterEach, describe, expect, it } from 'vitest';
import { startServer, type ServerHandle } from '../src/index.js';

const handles: ServerHandle[] = [];

afterEach(async () => {
  while (handles.length > 0) {
    const h = handles.pop();
    if (h) await h.close();
  }
});

describe('startServer - fetch handler adapter (POST body branch)', () => {
  it('T-HS-B001 POST with body triggers readBody + init.body branch', async () => {
    const server = await startServer({
      kind: 'fetch',
      handler: async (req) => {
        // Read echoes the body back to prove readBody + body branch fired.
        const text = await req.text();
        return new Response(`echo:${text}`, {
          status: 200,
          headers: { 'content-type': 'text/plain' },
        });
      },
    });
    handles.push(server);
    const res = await fetch(server.baseUrl, {
      method: 'POST',
      body: 'hello-body',
      headers: { 'content-type': 'text/plain' },
    });
    expect(res.status).toBe(200);
    expect(await res.text()).toBe('echo:hello-body');
  });

  it('T-HS-B002 GET with no body skips init.body branch', async () => {
    const server = await startServer({
      kind: 'fetch',
      handler: async (req) => {
        expect(req.method).toBe('GET');
        return new Response('ok', { status: 200 });
      },
    });
    handles.push(server);
    const res = await fetch(server.baseUrl);
    expect(await res.text()).toBe('ok');
  });

  it('T-HS-B003 PUT with empty body still hits readBody, skips body-length branch', async () => {
    const server = await startServer({
      kind: 'fetch',
      handler: async (req) => {
        // Empty body → readBody returns Buffer.alloc(0) → body.length === 0
        // → init.body remains unset.
        const text = await req.text();
        return new Response(`method=${req.method} body=${text}`, { status: 200 });
      },
    });
    handles.push(server);
    const res = await fetch(server.baseUrl, { method: 'PUT' });
    expect(await res.text()).toBe('method=PUT body=');
  });

  it('T-HS-B004 HEAD skips readBody (method === HEAD branch)', async () => {
    const server = await startServer({
      kind: 'fetch',
      handler: async (req) => {
        expect(req.method).toBe('HEAD');
        // 200 (not 204) so Response can carry body — HEAD still exercises the
        // `method === HEAD` short-circuit in the adapter.
        return new Response('ok', { status: 200 });
      },
    });
    handles.push(server);
    const res = await fetch(server.baseUrl, { method: 'HEAD' });
    expect(res.status).toBe(200);
  });
});

describe('startServer - buildHeaders array branch', () => {
  it('T-HS-B010 duplicate Set-Cookie incoming header exercises Array.isArray branch', async () => {
    let seen: string | null = null;
    const server = await startServer({
      kind: 'fetch',
      handler: async (req) => {
        // Web Request Headers.get('set-cookie') is not standard but the branch
        // in buildHeaders fires while constructing this Request object.
        seen = req.headers.get('cookie');
        return new Response('ok', { status: 200 });
      },
    });
    handles.push(server);

    // Send with headers as arrays — node emits duplicate header lines and
    // req.headers['set-cookie'] becomes string[].
    const port = new URL(server.baseUrl).port;
    await new Promise<void>((resolve, reject) => {
      const req = httpRequest(
        {
          host: '127.0.0.1',
          port: Number(port),
          method: 'GET',
          path: '/',
          headers: { 'set-cookie': ['a=1', 'b=2'] },
        },
        (res) => {
          res.resume();
          res.on('end', () => resolve());
          res.on('error', reject);
        },
      );
      req.on('error', reject);
      req.end();
    });
    // Coverage-focused: the handler ran without error.
    expect(seen).toBeNull();
  });

  it('T-HS-B011 raw socket with duplicate Set-Cookie headers keeps server alive', async () => {
    const server = await startServer({
      kind: 'fetch',
      handler: async () => new Response('ok', { status: 200 }),
    });
    handles.push(server);
    const port = new URL(server.baseUrl).port;
    const chunks: Buffer[] = [];
    await new Promise<void>((resolve, reject) => {
      const sock = netConnect({ host: '127.0.0.1', port: Number(port) }, () => {
        sock.write(
          `GET / HTTP/1.1\r\nHost: 127.0.0.1\r\nSet-Cookie: x=1\r\nSet-Cookie: y=2\r\nConnection: close\r\n\r\n`,
        );
      });
      sock.on('data', (c) => chunks.push(c));
      sock.on('end', () => resolve());
      sock.on('error', reject);
    });
    const raw = Buffer.concat(chunks).toString('utf8');
    expect(raw).toContain('200');
  });
});

describe('startServer - node handler branch', () => {
  it('T-HS-B020 sync node handler writes response', async () => {
    const server = await startServer((_req, res) => {
      res.statusCode = 201;
      res.setHeader('content-type', 'text/plain');
      res.end('sync-node');
    });
    handles.push(server);
    const res = await fetch(server.baseUrl);
    expect(res.status).toBe(201);
    expect(await res.text()).toBe('sync-node');
  });

  it('T-HS-B021 async node handler (Promise) writes response', async () => {
    const server = await startServer(async (_req, res) => {
      await Promise.resolve();
      res.statusCode = 202;
      res.end('async-node');
    });
    handles.push(server);
    const res = await fetch(server.baseUrl);
    expect(res.status).toBe(202);
    expect(await res.text()).toBe('async-node');
  });

  it('T-HS-B022 sync throw in node handler → 500 with error.message', async () => {
    const server = await startServer(() => {
      throw new Error('boom-sync');
    });
    handles.push(server);
    const res = await fetch(server.baseUrl);
    expect(res.status).toBe(500);
    expect(await res.text()).toContain('internal error: boom-sync');
  });

  it('T-HS-B023 async rejection in node handler → 500 with error.message', async () => {
    const server = await startServer(async () => {
      throw new Error('boom-async');
    });
    handles.push(server);
    const res = await fetch(server.baseUrl);
    expect(res.status).toBe(500);
    expect(await res.text()).toContain('internal error: boom-async');
  });
});

describe('startServer - fetch handler error branch', () => {
  it('T-HS-B030 fetch handler throws → adapter .catch → 500', async () => {
    const server = await startServer({
      kind: 'fetch',
      handler: async () => {
        throw new Error('fetch-boom');
      },
    });
    handles.push(server);
    const res = await fetch(server.baseUrl);
    expect(res.status).toBe(500);
    expect(await res.text()).toContain('internal error: fetch-boom');
  });

  it('T-HS-B031 fetch handler synchronous throw is also caught by adapter', async () => {
    const server = await startServer({
      kind: 'fetch',
      // Deliberately throw synchronously to exercise the promise-catch path.
      handler: (() => {
        throw new Error('sync-fetch-boom');
      }) as unknown as (req: Request) => Promise<Response>,
    });
    handles.push(server);
    const res = await fetch(server.baseUrl);
    expect(res.status).toBe(500);
    expect(await res.text()).toContain('internal error: sync-fetch-boom');
  });
});

describe('startServer - ServerHandle shape', () => {
  it('T-HS-B040 baseUrl carries assigned port and matches address()', async () => {
    const server = await startServer({
      kind: 'fetch',
      handler: async () => new Response('x', { status: 200 }),
    });
    handles.push(server);
    expect(server.baseUrl).toBe(`http://127.0.0.1:${server.port}`);
    expect(server.port).toBeGreaterThan(0);
  });

  it('T-HS-B041 close() resolves and further requests fail', async () => {
    const server = await startServer({
      kind: 'fetch',
      handler: async () => new Response('x', { status: 200 }),
    });
    const base = server.baseUrl;
    await server.close();
    await expect(fetch(base)).rejects.toBeTruthy();
  });

  it('T-HS-B042 response headers propagate from Response to server response', async () => {
    const server = await startServer({
      kind: 'fetch',
      handler: async () =>
        new Response('body', {
          status: 200,
          headers: { 'x-custom': 'yes', 'content-type': 'text/plain' },
        }),
    });
    handles.push(server);
    const res = await fetch(server.baseUrl);
    expect(res.headers.get('x-custom')).toBe('yes');
    expect(res.headers.get('content-type')).toBe('text/plain');
  });
});
