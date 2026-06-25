import { createServer, type Server } from 'node:http';
import type { ApiHandlerSource, NodeRequestHandler } from './types.js';

async function readBody(req: import('node:http').IncomingMessage): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function resolveHandler(source: ApiHandlerSource | NodeRequestHandler): {
  kind: 'fetch' | 'node';
  handler: ApiHandlerSource['handler'] | NodeRequestHandler;
} {
  if (typeof source === 'function') {
    return { kind: 'node', handler: source };
  }
  return source;
}

function buildHeaders(headers: import('node:http').IncomingHttpHeaders): Headers {
  const h = new Headers();
  for (const [key, value] of Object.entries(headers)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      for (const v of value) h.append(key, v);
    } else {
      h.set(key, value);
    }
  }
  return h;
}

async function fetchHandlerAdapter(
  fetchHandler: (req: Request) => Promise<Response> | Response,
  req: import('node:http').IncomingMessage,
  res: import('node:http').ServerResponse,
): Promise<void> {
  const url = `http://${req.headers.host ?? 'localhost'}${req.url ?? '/'}`;
  const method = (req.method ?? 'GET').toUpperCase();
  const body =
    method === 'GET' || method === 'HEAD' ? undefined : await readBody(req);
  const headers = buildHeaders(req.headers);
  const init: RequestInit = { method, headers };
  if (body && body.length > 0) {
    init.body = body.toString('utf8');
  }
  const request = new Request(url, init);
  const response = await fetchHandler(request);
  res.statusCode = response.status;
  response.headers.forEach((value, key) => res.setHeader(key, value));
  const text = await response.text();
  res.end(text);
}

export interface LiveServerHandle {
  baseUrl: string;
  port: number;
  close: () => Promise<void>;
}

export async function startLiveServer(
  source: ApiHandlerSource | NodeRequestHandler,
): Promise<LiveServerHandle> {
  const resolved = resolveHandler(source);

  const server: Server = createServer((req, res) => {
    if (resolved.kind === 'node') {
      try {
        const maybe = (resolved.handler as NodeRequestHandler)(req, res);
        if (maybe && typeof (maybe as Promise<void>).then === 'function') {
          (maybe as Promise<void>).catch((error: Error) => {
            res.statusCode = 500;
            res.end(`internal error: ${error.message}`);
          });
        }
      } catch (error) {
        res.statusCode = 500;
        res.end(`internal error: ${(error as Error).message}`);
      }
      return;
    }
    fetchHandlerAdapter(
      resolved.handler as (req: Request) => Promise<Response> | Response,
      req,
      res,
    ).catch((error: Error) => {
      res.statusCode = 500;
      res.end(`internal error: ${error.message}`);
    });
  });

  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => resolve());
  });
  const address = server.address();
  const port =
    typeof address === 'object' && address && typeof address.port === 'number'
      ? address.port
      : 0;

  return {
    baseUrl: `http://127.0.0.1:${port}`,
    port,
    close: () =>
      new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      }),
  };
}
