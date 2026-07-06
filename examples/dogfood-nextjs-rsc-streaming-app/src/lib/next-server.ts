/**
 * Tiny HTTP server that mounts the article / catalog / signaling handlers
 * directly. The Playwright e2e specs spawn this server so Chromium can drive
 * the full RSC streaming ceremony from a real browser origin, without
 * paying the Next.js dev-server startup cost.
 *
 * The server is deliberately minimal — routes are looked up by exact path,
 * bodies are JSON, and responses mirror the plain-object shape the mock and
 * real adapters produce so downstream fidelity assertions stay adapter-
 * agnostic.
 */

import { createServer, type Server } from 'node:http';
import { AddressInfo } from 'node:net';
import {
  handleArticleRequest,
  validateArticleRequest,
} from '../app/article/route.js';
import {
  handleCatalogRequest,
  validateCatalogRequest,
} from '../app/catalog/route.js';
import {
  handleSignalingRequest,
  validateSignalingRequest,
} from '../app/signaling/route.js';
import type { RscStreamingAdapter } from '../adapters/interface.js';

export interface StartNextServerOptions {
  adapter: RscStreamingAdapter;
  /** Explicit port; 0 (default) asks the kernel for an ephemeral port. */
  port?: number;
  /** Log body-parse or dispatch errors — off by default so specs stay quiet. */
  logErrors?: boolean;
}

export interface RunningNextServer {
  server: Server;
  baseUrl: string;
  close(): Promise<void>;
}

const ROUTE_MAP = {
  '/article': 'article',
  '/catalog': 'catalog',
  '/signaling': 'signaling',
} as const;

type RouteName = (typeof ROUTE_MAP)[keyof typeof ROUTE_MAP];

export async function startNextServer(
  opts: StartNextServerOptions,
): Promise<RunningNextServer> {
  const server = createServer(async (req, res) => {
    if (req.method !== 'POST') {
      res.statusCode = 405;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: false, errorKind: 'method_not_allowed' }));
      return;
    }
    const url = req.url ?? '';
    const route = matchRoute(url);
    if (!route) {
      res.statusCode = 404;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: false, errorKind: 'route_not_found' }));
      return;
    }

    let body: unknown;
    try {
      body = await readJson(req);
    } catch (err) {
      if (opts.logErrors) {
        // eslint-disable-next-line no-console
        console.error(`[next-server] body parse failed: ${(err as Error).message}`);
      }
      res.statusCode = 400;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: false, errorKind: 'body_parse_failed' }));
      return;
    }

    const response = await dispatch(route, body, opts.adapter);
    res.statusCode = response.ok ? 200 : 400;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify(response));
  });

  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(opts.port ?? 0, '127.0.0.1', () => resolve());
  });
  const address = server.address() as AddressInfo | null;
  if (!address) {
    server.close();
    throw new Error('startNextServer: address unavailable after listen()');
  }
  const baseUrl = `http://127.0.0.1:${address.port}`;
  return {
    server,
    baseUrl,
    async close() {
      await new Promise<void>((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()));
      });
    },
  };
}

function matchRoute(url: string): RouteName | null {
  const [path] = url.split('?', 1);
  const key = path as keyof typeof ROUTE_MAP;
  return ROUTE_MAP[key] ?? null;
}

async function readJson(req: {
  on(event: string, listener: (...args: unknown[]) => void): unknown;
}): Promise<unknown> {
  const chunks: Buffer[] = [];
  return await new Promise((resolve, reject) => {
    req.on('data', (chunk) => chunks.push(chunk as Buffer));
    req.on('end', () => {
      try {
        const raw = Buffer.concat(chunks).toString('utf8');
        if (!raw) {
          resolve({});
          return;
        }
        resolve(JSON.parse(raw));
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

async function dispatch(
  route: RouteName,
  body: unknown,
  adapter: RscStreamingAdapter,
): Promise<{ ok: boolean; errorKind?: string }> {
  if (route === 'article') {
    const parsed = validateArticleRequest(body);
    if (!parsed.ok) return { ok: false, errorKind: parsed.errorKind };
    return await handleArticleRequest(adapter, parsed.value);
  }
  if (route === 'catalog') {
    const parsed = validateCatalogRequest(body);
    if (!parsed.ok) return { ok: false, errorKind: parsed.errorKind };
    return await handleCatalogRequest(adapter, parsed.value);
  }
  const parsed = validateSignalingRequest(body);
  if (!parsed.ok) return { ok: false, errorKind: parsed.errorKind };
  return await handleSignalingRequest(adapter, parsed.value);
}
