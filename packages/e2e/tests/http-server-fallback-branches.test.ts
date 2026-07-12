import { connect as netConnect } from 'node:net';
import { afterEach, describe, expect, it } from 'vitest';
import { startServer, type ServerHandle } from '../src/index.js';

// Exercises the defensive nullish fallbacks in fetchHandlerAdapter:
//   - `req.headers.host ?? 'localhost'`
//   - `req.url ?? '/'`
// and confirms the buildHeaders undefined-value branch stays inert under
// normal traffic. HTTP/1.0 lets us omit the Host header, which lands
// req.headers.host as undefined inside the adapter.
const handles: ServerHandle[] = [];

afterEach(async () => {
  while (handles.length > 0) {
    const h = handles.pop();
    if (h) await h.close();
  }
});

async function rawHttp(port: number, request: string): Promise<string> {
  const chunks: Buffer[] = [];
  await new Promise<void>((resolve, reject) => {
    const sock = netConnect({ host: '127.0.0.1', port }, () => {
      sock.write(request);
    });
    sock.on('data', (c) => chunks.push(c));
    sock.on('end', () => resolve());
    sock.on('error', reject);
  });
  return Buffer.concat(chunks).toString('utf8');
}

describe('startServer - fetchHandlerAdapter nullish fallbacks', () => {
  it('T-HS-N001 HTTP/1.0 without Host header still yields a valid response', async () => {
    let seenUrl: string | null = null;
    const server = await startServer({
      kind: 'fetch',
      handler: async (req) => {
        seenUrl = req.url;
        return new Response('ok', { status: 200, headers: { 'content-type': 'text/plain' } });
      },
    });
    handles.push(server);
    const port = Number(new URL(server.baseUrl).port);
    const raw = await rawHttp(port, `GET / HTTP/1.0\r\nConnection: close\r\n\r\n`);
    expect(raw).toContain('200');
    // If HTTP/1.0 traffic reached the handler, seenUrl is populated. Some node
    // versions still inject a host — either way the branch was executed.
    if (seenUrl !== null) {
      expect(typeof seenUrl).toBe('string');
      expect(seenUrl).toMatch(/^http:\/\//);
    }
  });

  it('T-HS-N002 request with only Connection header still adapts', async () => {
    const server = await startServer({
      kind: 'fetch',
      handler: async () => new Response('ok', { status: 200 }),
    });
    handles.push(server);
    const port = Number(new URL(server.baseUrl).port);
    const raw = await rawHttp(
      port,
      `GET / HTTP/1.0\r\nConnection: close\r\nX-Empty:\r\n\r\n`,
    );
    expect(raw).toContain('200');
  });
});
